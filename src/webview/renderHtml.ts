import type { DetectedDifference, SemanticComparisonResult } from 'semantic-delta-detector' with { 'resolution-mode': 'import' };
import { normalizeComparisonContext, type ComparisonContextPayload, type SupportedContextFields } from '../context/contextTypes';
import type { WebviewState } from './types';

export function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderBadge(label: string, value: string, tone: 'neutral' | 'petrol' | 'amber' | 'red'): string {
    return `<span class="badge badge-${tone}"><span class="badge-label">${escapeHtml(label)}:</span> <span class="badge-value">${escapeHtml(value)}</span></span>`;
}

function renderImpactBadge(impact: string): string {
    const tone = impact === 'high' ? 'red' : impact === 'medium' ? 'amber' : 'neutral';
    return `<span class="badge badge-${tone}">${escapeHtml(impact.toUpperCase())}</span>`;
}

function renderCategoryBadge(category: string): string {
    return `<span class="badge badge-category">${escapeHtml(category)}</span>`;
}

function renderSqlBlock(title: string, label: string, sql: string): string {
    return `
        <div class="sql-box">
            <div class="sql-header">
                <span class="sql-title">${escapeHtml(title)}</span>
                <span class="sql-label">${escapeHtml(label)}</span>
            </div>
            <pre class="sql-code"><code>${escapeHtml(sql)}</code></pre>
        </div>
    `;
}

function renderFindings(differences: DetectedDifference[]): string {
    if (differences.length === 0) {
        return `
            <div class="card card-no-findings">
                <div class="card-header-line">
                    <span class="badge badge-amber">NO MODELED DIFFERENCES DETECTED</span>
                </div>
                <p class="conservative-notice">
                    No modeled differences detected. This is not proof of semantic equivalence or a guarantee of safety. Continue normal review and testing.
                </p>
            </div>
        `;
    }

    const items = differences.map((diff, index) => `
        <div class="finding-card">
            <div class="finding-card-header">
                <span class="finding-index">Finding ${index + 1}</span>
                <div class="finding-badges">
                    ${renderCategoryBadge(diff.category)}
                    ${renderImpactBadge(diff.impact)}
                </div>
            </div>
            <div class="finding-description">${escapeHtml(diff.description)}</div>
        </div>
    `).join('\n');

    return `
        <div class="section">
            <h2 class="section-title">Findings (${differences.length})</h2>
            <div class="findings-list">
                ${items}
            </div>
        </div>
    `;
}

function renderLimitations(limitations?: string[]): string {
    if (!limitations || limitations.length === 0) {
        return `
            <div class="limitations-neutral">
                No parser limitations were reported. This does not establish complete SQL coverage.
            </div>
        `;
    }

    const items = limitations.map(lim => `<li>${escapeHtml(lim)}</li>`).join('\n');
    return `
        <div class="card card-limitation">
            <div class="limitation-header">
                <span class="badge badge-amber">ANALYSIS LIMITATIONS</span>
                <span class="limitation-title">Analysis is limited. Additional differences may be unreported.</span>
            </div>
            <ul class="limitation-list">
                ${items}
            </ul>
        </div>
    `;
}

function renderContextFields(fields?: SupportedContextFields): string {
    if (!fields) {
        return '<p class="meaning-text">No additional context supplied for this query.</p>';
    }

    const values: Array<[string, string | undefined]> = [
        ['Metric name', fields.metric_name],
        ['Description', fields.description],
        ['Team context', fields.team_context],
        ['Intended use', fields.intended_use],
    ];
    return `<dl class="context-fields">${values
        .filter(([, value]) => value !== undefined)
        .map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value ?? '')}</dd>`)
        .join('')}</dl>`;
}

function renderComparisonContext(context?: ComparisonContextPayload): string {
    const supplied = normalizeComparisonContext(context);
    return `
        <div class="section">
            <h2 class="section-title">Supplied Comparison Context</h2>
            <p class="context-note">${supplied
                ? 'These values were supplied for this comparison and were not independently verified.'
                : 'No additional business context was supplied (SQL only).'}</p>
            ${supplied ? `<div class="meaning-grid">
                <div class="meaning-box"><span class="meaning-label">Before</span>${renderContextFields(supplied.before)}</div>
                <div class="meaning-box"><span class="meaning-label">After</span>${renderContextFields(supplied.after)}</div>
            </div>` : ''}
        </div>
    `;
}

function renderSemanticResult(result: SemanticComparisonResult, beforeLabel: string, afterLabel: string, beforeSql: string, afterSql: string): string {
    const riskTone = result.risk_level === 'high' ? 'red' : result.risk_level === 'medium' ? 'amber' : 'petrol';
    const confTone = result.confidence_level === 'high' ? 'petrol' : 'amber';

    return `
        <div class="header-badges">
            ${renderBadge('Risk', result.risk_level.toUpperCase(), riskTone)}
            ${renderBadge('Confidence', result.confidence_level.toUpperCase(), confTone)}
            <span class="badge badge-neutral"><span class="badge-label">Similarity:</span> ${result.semantic_similarity_score}/100</span>
            ${result.evidence_sources && result.evidence_sources.length > 0 ? `<span class="badge badge-neutral"><span class="badge-label">Evidence sources:</span> ${escapeHtml(result.evidence_sources.join(', '))}</span>` : ''}
        </div>
        <p class="context-note">Similarity is a heuristic score, not confidence or proof of equivalence.</p>

        ${renderLimitations(result.parser_limitations)}

        ${result.verdict ? `<div class="section">
            <h2 class="section-title">Verdict</h2>
            <p class="section-body">${escapeHtml(result.verdict)}</p>
        </div>` : ''}

        ${renderFindings(result.detected_differences)}

        <div class="section">
            <h2 class="section-title">Explanation</h2>
            <p class="section-body">${escapeHtml(result.explanation)}</p>
        </div>

        <div class="section">
            <h2 class="section-title">Business Meaning</h2>
            <div class="meaning-grid">
                <div class="meaning-box">
                    <span class="meaning-label">Before (${escapeHtml(result.metric_name_a)}):</span>
                    <p class="meaning-text">${escapeHtml(result.likely_business_meaning_a)}</p>
                </div>
                <div class="meaning-box">
                    <span class="meaning-label">After (${escapeHtml(result.metric_name_b)}):</span>
                    <p class="meaning-text">${escapeHtml(result.likely_business_meaning_b)}</p>
                </div>
            </div>
        </div>

        ${result.impact ? `<div class="section">
            <h2 class="section-title">Business Impact</h2>
            <div class="card">
                <p><strong>Severity:</strong> ${escapeHtml(result.impact.severity)}</p>
                <p><strong>Decision risk:</strong> ${escapeHtml(result.impact.decisionRisk)}</p>
                <p><strong>Affected meaning:</strong> ${escapeHtml(result.impact.affectedMeaning)}</p>
                ${result.impact.evidence.length > 0 ? `<h3>Impact evidence</h3><ul>${result.impact.evidence
                    .map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
            </div>
        </div>` : ''}

        <div class="section">
            <h2 class="section-title">Recommendation</h2>
            <p class="section-body">${escapeHtml(result.recommendation)}</p>
            ${result.impact?.recommendedAction && result.impact.recommendedAction !== result.recommendation ? `
                <div class="action-box">
                    <span class="action-label">Impact Recommended Action:</span>
                    <p class="action-text">${escapeHtml(result.impact.recommendedAction)}</p>
                </div>
            ` : ''}
        </div>

        <div class="section">
            <h2 class="section-title">SQL Snapshots</h2>
            <div class="sql-grid">
                ${renderSqlBlock('Before SQL', beforeLabel, beforeSql)}
                ${renderSqlBlock('After SQL', afterLabel, afterSql)}
            </div>
        </div>
    `;
}

function renderContent(state: WebviewState): string {
    if (state.kind === 'loading') {
        return `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <h2 class="loading-title">Analyzing SQL comparison...</h2>
                <p class="loading-subtitle">Comparing <code>${escapeHtml(state.beforeLabel)}</code> with <code>${escapeHtml(state.afterLabel)}</code></p>
                <p class="loading-note">Running local static analysis on the extension host. SQL is never executed or transmitted.</p>
            </div>
        `;
    }

    const { beforeLabel, afterLabel, beforeSql, afterSql, outcome } = state;

    if (outcome.kind === 'validation-error') {
        return `
            <div class="header-badges">
                ${renderBadge('Risk', 'Not assessed', 'neutral')}
                ${renderBadge('Confidence', 'Not assessed', 'neutral')}
                <span class="badge badge-amber">VALIDATION ERROR</span>
            </div>

            <div class="card card-validation-error">
                <h2 class="error-title">Input Validation Error</h2>
                <p class="error-message">${escapeHtml(outcome.message)}</p>
                <p class="error-note">No semantic assessment was produced. Please provide valid SQL text for both queries.</p>
            </div>

            <div class="section">
                <h2 class="section-title">Submitted SQL Snapshots</h2>
                <div class="sql-grid">
                    ${renderSqlBlock('Before SQL', beforeLabel, beforeSql)}
                    ${renderSqlBlock('After SQL', afterLabel, afterSql)}
                </div>
            </div>
        `;
    }

    if (outcome.kind === 'operational-error') {
        return `
            <div class="header-badges">
                ${renderBadge('Risk', 'Not assessed', 'neutral')}
                ${renderBadge('Confidence', 'Not assessed', 'neutral')}
                <span class="badge badge-red">OPERATIONAL ERROR</span>
            </div>

            <div class="card card-operational-error">
                <h2 class="error-title">Operational Analysis Error</h2>
                <p class="error-message">${escapeHtml(outcome.message)}</p>
                <p class="error-note">Static analysis failed without producing a result. Risk and confidence are not assessed.</p>
            </div>

            <div class="section">
                <h2 class="section-title">Submitted SQL Snapshots</h2>
                <div class="sql-grid">
                    ${renderSqlBlock('Before SQL', beforeLabel, beforeSql)}
                    ${renderSqlBlock('After SQL', afterLabel, afterSql)}
                </div>
            </div>
        `;
    }

    return renderSemanticResult(outcome.result, beforeLabel, afterLabel, beforeSql, afterSql);
}

export function renderHtml(state: WebviewState): string {
    const subtitle = state.kind === 'loading'
        ? `Comparing Before: ${state.beforeLabel} ➔ After: ${state.afterLabel}`
        : `Before: ${state.beforeLabel} ➔ After: ${state.afterLabel}`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data:;">
    <title>Semantic Delta Review</title>
    <style>
        :root {
            --sd-canvas: #F4F5F0;
            --sd-card: #FFFFFF;
            --sd-text: #203238;
            --sd-text-muted: #607075;
            --sd-border: #DCE2DB;
            --sd-petrol: #126A60;
            --sd-petrol-tint: #E8F3EE;
            --sd-amber-text: #87530A;
            --sd-amber-bg: #FFF2D8;
            --sd-amber-border: #F2D59B;
            --sd-red-text: #9A3939;
            --sd-red-bg: #FCEDEC;
            --sd-red-border: #F5C2C0;
            --sd-sql-bg: #17242A;
            --sd-sql-header: #1F3036;
            --sd-sql-text: #D9E3E5;
            --sd-sql-border: #34464E;
            --sd-font-ui: "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            --sd-font-mono: "IBM Plex Mono", Menlo, Monaco, Consolas, "Courier New", monospace;
        }

        body {
            margin: 0;
            padding: 24px;
            background-color: var(--sd-canvas);
            color: var(--sd-text);
            font-family: var(--sd-font-ui);
            font-size: 14px;
            line-height: 1.5;
            box-sizing: border-box;
        }

        .container {
            max-width: 1100px;
            margin: 0 auto;
        }

        .app-header {
            margin-bottom: 20px;
            border-bottom: 1px solid var(--sd-border);
            padding-bottom: 16px;
        }

        .app-title {
            margin: 0 0 4px 0;
            font-size: 20px;
            font-weight: 600;
            color: var(--sd-text);
        }

        .app-subtitle {
            margin: 0;
            font-size: 13px;
            color: var(--sd-text-muted);
            font-family: var(--sd-font-mono);
        }

        .header-badges {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 20px;
            align-items: center;
        }

        .badge {
            display: inline-flex;
            align-items: center;
            padding: 3px 10px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            line-height: 1.3;
        }

        .badge-label {
            font-weight: 400;
            margin-right: 4px;
            color: inherit;
            opacity: 0.85;
        }

        .badge-neutral {
            background-color: #EEF2F4;
            color: var(--sd-text-muted);
            border: 1px solid var(--sd-border);
        }

        .badge-petrol {
            background-color: var(--sd-petrol-tint);
            color: var(--sd-petrol);
            border: 1px solid #C2DFD7;
        }

        .badge-amber {
            background-color: var(--sd-amber-bg);
            color: var(--sd-amber-text);
            border: 1px solid var(--sd-amber-border);
        }

        .badge-red {
            background-color: var(--sd-red-bg);
            color: var(--sd-red-text);
            border: 1px solid var(--sd-red-border);
        }

        .badge-category {
            background-color: #EBF1F4;
            color: #2F4C58;
            border: 1px solid #CCD8DE;
            font-family: var(--sd-font-mono);
            font-size: 11px;
        }

        .card {
            background-color: var(--sd-card);
            border: 1px solid var(--sd-border);
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 20px;
        }

        .card-no-findings {
            border-left: 4px solid var(--sd-amber-border);
        }

        .card-limitation {
            border-left: 4px solid var(--sd-amber-border);
            background-color: #FFFDF8;
        }

        .limitation-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
        }

        .limitation-title {
            font-weight: 600;
            color: var(--sd-amber-text);
        }

        .limitation-list {
            margin: 0;
            padding-left: 20px;
            color: var(--sd-text);
        }

        .limitations-neutral {
            font-size: 12px;
            color: var(--sd-text-muted);
            margin-bottom: 16px;
            font-style: italic;
        }

        .conservative-notice {
            margin: 8px 0 0 0;
            color: var(--sd-text);
            font-size: 13px;
        }

        .card-validation-error {
            border-left: 4px solid var(--sd-amber-border);
            background-color: var(--sd-amber-bg);
        }

        .card-operational-error {
            border-left: 4px solid var(--sd-red-border);
            background-color: var(--sd-red-bg);
        }

        .error-title {
            margin: 0 0 8px 0;
            font-size: 16px;
            font-weight: 600;
        }

        .card-validation-error .error-title {
            color: var(--sd-amber-text);
        }

        .card-operational-error .error-title {
            color: var(--sd-red-text);
        }

        .error-message {
            margin: 0 0 8px 0;
            font-family: var(--sd-font-mono);
            font-size: 13px;
            color: var(--sd-text);
        }

        .error-note {
            margin: 0;
            font-size: 12px;
            color: var(--sd-text-muted);
        }

        .section {
            margin-bottom: 24px;
        }

        .section-title {
            font-size: 15px;
            font-weight: 600;
            color: var(--sd-text);
            margin: 0 0 10px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .section-body {
            margin: 0;
            color: var(--sd-text);
            background-color: var(--sd-card);
            padding: 12px 16px;
            border-radius: 6px;
            border: 1px solid var(--sd-border);
        }

        .findings-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .finding-card {
            background-color: var(--sd-card);
            border: 1px solid var(--sd-border);
            border-radius: 6px;
            padding: 12px 16px;
        }

        .finding-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        .finding-index {
            font-weight: 600;
            color: var(--sd-text);
        }

        .finding-badges {
            display: flex;
            gap: 6px;
        }

        .finding-description {
            color: var(--sd-text);
            font-size: 13px;
        }

        .meaning-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }

        @media (max-width: 700px) {
            .meaning-grid {
                grid-template-columns: 1fr;
            }
        }

        .meaning-box {
            background-color: var(--sd-card);
            border: 1px solid var(--sd-border);
            border-radius: 6px;
            padding: 12px 16px;
        }

        .meaning-label {
            display: block;
            font-weight: 600;
            font-size: 12px;
            color: var(--sd-text-muted);
            margin-bottom: 4px;
        }

        .meaning-text {
            margin: 0;
            color: var(--sd-text);
            font-size: 13px;
        }

        .context-note {
            color: var(--sd-text-muted);
            font-size: 12px;
            margin: 0 0 16px 0;
        }

        .context-fields {
            margin: 0;
            overflow-wrap: anywhere;
        }

        .context-fields dt {
            font-weight: 600;
            color: var(--sd-text-muted);
            font-size: 12px;
        }

        .context-fields dd {
            margin: 0 0 10px 0;
        }

        .action-box {
            margin-top: 10px;
            background-color: var(--sd-card);
            border: 1px solid var(--sd-border);
            border-radius: 6px;
            padding: 12px 16px;
        }

        .action-label {
            font-weight: 600;
            font-size: 12px;
            color: var(--sd-text-muted);
            display: block;
            margin-bottom: 4px;
        }

        .action-text {
            margin: 0;
            color: var(--sd-text);
            font-size: 13px;
        }

        .sql-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }

        @media (max-width: 800px) {
            .sql-grid {
                grid-template-columns: 1fr;
            }
        }

        .sql-box {
            background-color: var(--sd-sql-bg);
            border: 1px solid var(--sd-sql-border);
            border-radius: 6px;
            overflow: hidden;
        }

        .sql-header {
            background-color: var(--sd-sql-header);
            padding: 8px 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--sd-sql-border);
        }

        .sql-title {
            color: var(--sd-sql-text);
            font-weight: 600;
            font-size: 12px;
        }

        .sql-label {
            color: #93A7AE;
            font-family: var(--sd-font-mono);
            font-size: 11px;
        }

        .sql-code {
            margin: 0;
            padding: 12px;
            color: var(--sd-sql-text);
            font-family: var(--sd-font-mono);
            font-size: 12px;
            line-height: 1.4;
            overflow-x: auto;
            white-space: pre-wrap;
            word-break: break-word;
        }

        .app-footer {
            margin-top: 32px;
            padding-top: 16px;
            border-top: 1px solid var(--sd-border);
            font-size: 11px;
            color: var(--sd-text-muted);
            text-align: center;
        }

        .loading-container {
            text-align: center;
            padding: 48px 24px;
            background-color: var(--sd-card);
            border: 1px solid var(--sd-border);
            border-radius: 6px;
        }

        .loading-spinner {
            width: 36px;
            height: 36px;
            margin: 0 auto 16px auto;
            border: 3px solid var(--sd-border);
            border-top-color: var(--sd-petrol);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .loading-title {
            margin: 0 0 8px 0;
            font-size: 18px;
            font-weight: 600;
            color: var(--sd-text);
        }

        .loading-subtitle {
            margin: 0 0 16px 0;
            font-size: 13px;
            color: var(--sd-text-muted);
        }

        .loading-note {
            margin: 0;
            font-size: 12px;
            color: var(--sd-text-muted);
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="app-header">
            <h1 class="app-title">Semantic Delta Review</h1>
            <p class="app-subtitle">${escapeHtml(subtitle)}</p>
        </header>

        <main id="main-content">
            ${renderContent(state)}
            ${state.kind === 'comparison' ? renderComparisonContext(state.context) : ''}
        </main>

        <footer class="app-footer">
            Static analysis only. SQL is never executed. Risk and confidence describe different dimensions; this report is not a safety guarantee.
        </footer>
    </div>
</body>
</html>`;
}
