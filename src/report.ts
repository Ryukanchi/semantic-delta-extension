import type { SemanticComparisonResult } from 'semantic-delta-detector' with { 'resolution-mode': 'import' };

function markdownText(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/[\\`*_\[\]]/g, '\\$&');
}

function sqlBlock(query: string): string {
    let longest = 0;
    for (const match of query.matchAll(/`+/g)) {
        longest = Math.max(longest, match[0].length);
    }
    const fence = '`'.repeat(Math.max(3, longest + 1));
    return `${fence}sql\n${query}\n${fence}`;
}

export function buildMarkdownReport(
    result: SemanticComparisonResult,
    queryA: string,
    queryB: string,
    title?: string,
): string {
    const lines = [
        '# Semantic Delta Result',
        '',
        '## Summary',
        ...(title ? [`- Example: ${markdownText(title)}`] : []),
        `- Risk: ${result.risk_level}`,
        `- Confidence: ${result.confidence_level}`,
        `- Similarity: ${result.semantic_similarity_score}/100 (heuristic score; not confidence or proof of equivalence)`,
        `- Evidence sources: ${result.evidence_sources.map(source => `\`${source}\``).join(', ')}`,
    ];

    if (result.verdict) {
        lines.push('', '## Verdict', markdownText(result.verdict));
    }

    lines.push('', '## Findings');
    if (result.detected_differences.length === 0) {
        lines.push('No modeled differences detected. This is not proof of semantic equivalence or a guarantee of safety. Continue normal review and testing.');
    } else {
        for (const [index, finding] of result.detected_differences.entries()) {
            lines.push('', `### Finding ${index + 1}`, '',
                `- Category: \`${finding.category}\``,
                `- Impact: ${finding.impact}`, '', markdownText(finding.description));
        }
    }

    lines.push('', '## Analysis limitations');
    if (result.parser_limitations?.length) {
        lines.push('Analysis is limited. Additional differences may be unreported.');
        for (const limitation of result.parser_limitations) {
            lines.push('', markdownText(limitation));
        }
    } else {
        lines.push('No parser limitations were reported. This does not establish complete SQL coverage.');
    }

    lines.push('', '## Explanation', markdownText(result.explanation), '', '## Business Meaning',
        `- Query A (${markdownText(result.metric_name_a)}): ${markdownText(result.likely_business_meaning_a)}`,
        `- Query B (${markdownText(result.metric_name_b)}): ${markdownText(result.likely_business_meaning_b)}`);

    if (result.impact) {
        lines.push('', '## Business Impact',
            `- Severity: ${result.impact.severity}`, '',
            markdownText(result.impact.decisionRisk), '',
            markdownText(result.impact.affectedMeaning));
        if (result.impact.evidence.length) {
            lines.push('', '### Impact evidence', ...result.impact.evidence.map(item => `- ${markdownText(item)}`));
        }
    }

    lines.push('', '## Recommendation', markdownText(result.recommendation));
    if (result.impact?.recommendedAction && result.impact.recommendedAction !== result.recommendation) {
        lines.push('', '### Impact recommended action', markdownText(result.impact.recommendedAction));
    }
    lines.push('', '## Query A', sqlBlock(queryA), '', '## Query B', sqlBlock(queryB), '',
        'Static analysis only. SQL is not executed. Risk and confidence describe different dimensions; this report is not a safety guarantee.');
    return lines.join('\n');
}
