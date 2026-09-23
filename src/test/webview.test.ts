import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import type { SemanticComparisonResult } from 'semantic-delta-detector' with { 'resolution-mode': 'import' };
import { escapeHtml, formatDecisionRisk, renderHtml } from '../webview/renderHtml';
import type { WebviewState } from '../webview/types';

const mockResult: SemanticComparisonResult = {
    metric_name_a: 'orders_count',
    metric_name_b: 'distinct_orders_count',
    semantic_similarity_score: 85,
    risk_level: 'high',
    confidence_level: 'medium',
    evidence_sources: ['sql_only'],
    detected_differences: [
        {
            category: 'aggregation_mismatch',
            description: 'Query A counts all rows while Query B counts distinct orders.',
            impact: 'high',
        },
    ],
    explanation: 'Counting distinct orders differs from row count when duplicate rows exist.',
    likely_business_meaning_a: 'Total order records including duplicates.',
    likely_business_meaning_b: 'Unique orders count.',
    recommendation: 'Align on whether duplicates represent valid distinct business transactions.',
};

test('renderHtml renders normal semantic result with findings and SQL snapshots', () => {
    const state: WebviewState = {
        kind: 'comparison',
        beforeLabel: 'orders.before.sql',
        afterLabel: 'orders.after.sql',
        beforeSql: 'SELECT COUNT(*) FROM orders',
        afterSql: 'SELECT COUNT(DISTINCT id) FROM orders',
        outcome: {
            kind: 'result',
            result: mockResult,
        },
    };

    const html = renderHtml(state);

    assert.ok(html.includes('Risk:</span> <span class="badge-value">HIGH</span>'));
    assert.ok(html.includes('Confidence:</span> <span class="badge-value">MEDIUM</span>'));
    assert.ok(html.includes('Evidence sources:</span> sql_only'));
    assert.ok(html.includes('85/100'));
    assert.ok(html.includes('aggregation_mismatch'));
    assert.ok(html.includes('Finding 1'));
    assert.ok(html.includes('Query A counts all rows while Query B counts distinct orders.'));
    assert.ok(html.includes('Counting distinct orders differs from row count when duplicate rows exist.'));
    assert.ok(html.includes('Total order records including duplicates.'));
    assert.ok(html.includes('Unique orders count.'));
    assert.ok(html.includes('Align on whether duplicates represent valid distinct business transactions.'));
    assert.ok(html.includes('SELECT COUNT(*) FROM orders'));
    assert.ok(html.includes('SELECT COUNT(DISTINCT id) FROM orders'));
    assert.ok(html.includes('orders.before.sql'));
    assert.ok(html.includes('orders.after.sql'));
    assert.ok(html.includes('Static analysis only. SQL is never executed.'));
});

test('renderHtml renders contextual evidence sources badge when context was used', () => {
    const contextualResult: SemanticComparisonResult = {
        ...mockResult,
        evidence_sources: ['sql', 'metric_name', 'team_context', 'intended_use'],
    };
    const state: WebviewState = {
        kind: 'comparison',
        beforeLabel: 'orders.before.sql',
        afterLabel: 'orders.after.sql',
        beforeSql: 'SELECT 1',
        afterSql: 'SELECT 2',
        outcome: {
            kind: 'result',
            result: contextualResult,
        },
    };

    const html = renderHtml(state);
    assert.ok(html.includes('Evidence sources:</span> sql, metric_name, team_context, intended_use'));
});

test('renderHtml shows every supplied verdict and impact field without inventing absent values', () => {
    const richResult: SemanticComparisonResult = {
        ...mockResult,
        verdict: 'HIGH RISK: Metric meaning changed.',
        impact: {
            severity: 'HIGH',
            decisionRisk: 'Revenue decisions may change.',
            affectedMeaning: 'Before includes all orders; After includes matched orders.',
            recommendedAction: 'Review customer matching before release.',
            evidence: ['LEFT JOIN became INNER JOIN.'],
        },
    };
    const state: WebviewState = {
        kind: 'comparison',
        beforeLabel: 'models/a/query.sql',
        afterLabel: 'models/b/query.sql (unsaved changes)',
        beforeSql: 'SELECT 1',
        afterSql: 'SELECT 2',
        outcome: { kind: 'result', result: richResult },
    };

    const html = renderHtml(state);
    assert.ok(html.includes('HIGH RISK: Metric meaning changed.'));
    assert.ok(html.includes('Business Impact'));
    assert.ok(html.includes('Severity:</strong> HIGH'));
    assert.ok(html.includes('Revenue decisions may change.'));
    assert.ok(html.includes('Before includes all orders; After includes matched orders.'));
    assert.ok(html.includes('LEFT JOIN became INNER JOIN.'));
    assert.ok(html.includes('Review customer matching before release.'));
    assert.ok(html.includes('models/a/query.sql'));
    assert.ok(html.includes('models/b/query.sql (unsaved changes)'));
    assert.ok(html.includes('Similarity is a heuristic score'));

    const withoutOptionalFields = renderHtml({
        ...state,
        outcome: { kind: 'result', result: mockResult },
    });
    assert.ok(!withoutOptionalFields.includes('Business Impact'));
    assert.ok(!withoutOptionalFields.includes('Metric meaning changed.'));
});

test('formatDecisionRisk strips leading Decision risk: prefix case-insensitively', () => {
    assert.equal(
        formatDecisionRisk('Decision risk: aggregation changes may change what is counted.'),
        'aggregation changes may change what is counted.',
    );
    assert.equal(
        formatDecisionRisk('decision risk:  join changes may include or exclude users.'),
        'join changes may include or exclude users.',
    );
    assert.equal(
        formatDecisionRisk('No significant business impact detected.'),
        'No significant business impact detected.',
    );
});

test('renderHtml avoids duplicate Decision risk: label when impact.decisionRisk contains the prefix', () => {
    const richResult: SemanticComparisonResult = {
        ...mockResult,
        impact: {
            severity: 'HIGH',
            decisionRisk: 'Decision risk: aggregation changes may change what is counted.',
            affectedMeaning: 'Before includes all orders; After includes matched orders.',
            recommendedAction: 'Review customer matching before release.',
            evidence: ['LEFT JOIN became INNER JOIN.'],
        },
    };
    const state: WebviewState = {
        kind: 'comparison',
        beforeLabel: 'a.sql',
        afterLabel: 'b.sql',
        beforeSql: 'SELECT 1',
        afterSql: 'SELECT 2',
        outcome: { kind: 'result', result: richResult },
    };

    const html = renderHtml(state);
    assert.ok(html.includes('<p><strong>Decision risk:</strong> aggregation changes may change what is counted.</p>'));
    assert.ok(!html.includes('Decision risk: Decision risk:'));
});

test('renderHtml shows exact normalized context for both sides and escapes it', () => {
    const state: WebviewState = {
        kind: 'comparison',
        beforeLabel: 'models/a/query.sql',
        afterLabel: 'models/b/query.sql',
        beforeSql: 'SELECT 1',
        afterSql: 'SELECT 2',
        outcome: { kind: 'result', result: mockResult },
        context: {
            before: { metric_name: '  revenue  ', description: '<img src=x onerror=alert(1)>' },
            after: { intended_use: 'Executive reporting', team_context: 'finance' },
        },
    };

    const html = renderHtml(state);
    assert.ok(html.includes('Supplied Comparison Context'));
    assert.ok(html.includes('Metric name</dt><dd>revenue'));
    assert.ok(html.includes('Intended use</dt><dd>Executive reporting'));
    assert.ok(html.includes('Team context</dt><dd>finance'));
    assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
    assert.ok(!html.includes('<img src=x onerror=alert(1)>'));
    assert.ok(html.includes('not independently verified'));

    const sqlOnly = renderHtml({ ...state, context: undefined });
    assert.ok(sqlOnly.includes('No additional business context was supplied (SQL only).'));
});

test('renderHtml renders limitations banner when parser limitations are present', () => {
    const resultWithLimitations: SemanticComparisonResult = {
        ...mockResult,
        parser_limitations: ['Derived table in FROM clause is only partially modeled.'],
    };

    const state: WebviewState = {
        kind: 'comparison',
        beforeLabel: 'before.sql',
        afterLabel: 'after.sql',
        beforeSql: 'SELECT 1',
        afterSql: 'SELECT 2',
        outcome: {
            kind: 'result',
            result: resultWithLimitations,
        },
    };

    const html = renderHtml(state);

    assert.ok(html.includes('ANALYSIS LIMITATIONS'));
    assert.ok(html.includes('Analysis is limited. Additional differences may be unreported.'));
    assert.ok(html.includes('Derived table in FROM clause is only partially modeled.'));
});

test('renderHtml renders conservative notice when no findings are detected', () => {
    const resultNoFindings: SemanticComparisonResult = {
        ...mockResult,
        detected_differences: [],
        risk_level: 'low',
        confidence_level: 'low',
    };

    const state: WebviewState = {
        kind: 'comparison',
        beforeLabel: 'before.sql',
        afterLabel: 'after.sql',
        beforeSql: 'SELECT 1',
        afterSql: 'SELECT 1',
        outcome: {
            kind: 'result',
            result: resultNoFindings,
        },
    };

    const html = renderHtml(state);

    assert.ok(html.includes('NO MODELED DIFFERENCES DETECTED'));
    assert.ok(html.includes('No modeled differences detected. This is not proof of semantic equivalence or a guarantee of safety. Continue normal review and testing.'));
    assert.ok(html.includes('Risk:</span> <span class="badge-value">LOW</span>'));
    assert.ok(html.includes('Confidence:</span> <span class="badge-value">LOW</span>'));
});

test('renderHtml renders validation error with not assessed badges and submitted SQL', () => {
    const state: WebviewState = {
        kind: 'comparison',
        beforeLabel: 'empty.sql',
        afterLabel: 'after.sql',
        beforeSql: '   ',
        afterSql: 'SELECT * FROM users',
        outcome: {
            kind: 'validation-error',
            message: 'Query A must contain SQL text.',
        },
    };

    const html = renderHtml(state);

    assert.ok(html.includes('VALIDATION ERROR'));
    assert.ok(html.includes('Risk:</span> <span class="badge-value">Not assessed</span>'));
    assert.ok(html.includes('Confidence:</span> <span class="badge-value">Not assessed</span>'));
    assert.ok(html.includes('Query A must contain SQL text.'));
    assert.ok(html.includes('No semantic assessment was produced.'));
    assert.ok(html.includes('SELECT * FROM users'));
});

test('renderHtml renders operational error with not assessed badges and error message', () => {
    const state: WebviewState = {
        kind: 'comparison',
        beforeLabel: 'before.sql',
        afterLabel: 'after.sql',
        beforeSql: 'SELECT 1',
        afterSql: 'SELECT 2',
        outcome: {
            kind: 'operational-error',
            message: 'Engine process crashed unexpectedly.',
        },
    };

    const html = renderHtml(state);

    assert.ok(html.includes('OPERATIONAL ERROR'));
    assert.ok(html.includes('Risk:</span> <span class="badge-value">Not assessed</span>'));
    assert.ok(html.includes('Confidence:</span> <span class="badge-value">Not assessed</span>'));
    assert.ok(html.includes('Engine process crashed unexpectedly.'));
    assert.ok(html.includes('Static analysis failed without producing a result.'));
    assert.ok(!html.includes('Risk:</span> <span class="badge-value">LOW</span>'));
});

test('renderHtml renders loading state with spinner and comparing labels', () => {
    const state: WebviewState = {
        kind: 'loading',
        beforeLabel: 'baseline.sql',
        afterLabel: 'target.sql',
    };

    const html = renderHtml(state);

    assert.ok(html.includes('Analyzing SQL comparison...'));
    assert.ok(html.includes('baseline.sql'));
    assert.ok(html.includes('target.sql'));
    assert.ok(html.includes('loading-spinner'));
    assert.ok(html.includes('local static analysis on the extension host'));
});

test('escapeHtml prevents XSS injection in all rendered fields', () => {
    const malicious = '<script>alert("xss")</script>&"\'';
    const escaped = escapeHtml(malicious);

    assert.ok(!escaped.includes('<script>'));
    assert.ok(escaped.includes('&lt;script&gt;'));
    assert.ok(escaped.includes('&amp;'));
    assert.ok(escaped.includes('&quot;'));
    assert.ok(escaped.includes('&#39;'));

    const state: WebviewState = {
        kind: 'comparison',
        beforeLabel: '<img src=x onerror=alert(1)>',
        afterLabel: '<b>after</b>',
        beforeSql: 'SELECT * FROM "<script>"',
        afterSql: 'SELECT * FROM \'<script>\'',
        outcome: {
            kind: 'operational-error',
            message: 'Error with <script> tag',
        },
    };

    const html = renderHtml(state);
    assert.ok(!html.includes('<script>'));
    assert.ok(!html.includes('<img src=x'));
    assert.ok(html.includes('&lt;script&gt;'));
});

test('renderHtml renders SQL Diff section with unified diff lines, line numbers, and changes', () => {
    const state: WebviewState = {
        kind: 'comparison',
        beforeLabel: 'orders.before.sql',
        afterLabel: 'orders.after.sql',
        beforeSql: 'SELECT total FROM orders LEFT JOIN users ON orders.user_id = users.id;',
        afterSql: 'SELECT total FROM orders INNER JOIN users ON orders.user_id = users.id;\nAND total > 100;',
        outcome: {
            kind: 'result',
            result: mockResult,
        },
    };

    const html = renderHtml(state);

    assert.ok(html.includes('SQL Diff'));
    assert.ok(html.includes('Unified Text Diff'));
    assert.ok(html.includes('diff-stat-removed'));
    assert.ok(html.includes('diff-stat-added'));
    assert.ok(html.includes('-1'));
    assert.ok(html.includes('+2'));
    assert.ok(html.includes('marker-removed'));
    assert.ok(html.includes('marker-added'));
    assert.ok(html.includes('diff-nums'));
    assert.ok(html.includes('LEFT JOIN users'));
    assert.ok(html.includes('INNER JOIN users'));
    assert.ok(html.includes('AND total &gt; 100;'));
    assert.ok(html.includes('Text diff only. Line changes are not mapped to specific semantic findings.'));
});

test('renderHtml renders SQL Diff with identical text badge when SQLs match', () => {
    const state: WebviewState = {
        kind: 'comparison',
        beforeLabel: 'query.sql',
        afterLabel: 'query.sql',
        beforeSql: 'SELECT 1;',
        afterSql: 'SELECT 1;',
        outcome: {
            kind: 'result',
            result: mockResult,
        },
    };

    const html = renderHtml(state);
    assert.ok(html.includes('Identical text'));
    assert.ok(html.includes('1 / 1'));
    assert.ok(html.includes('SELECT 1;'));
});

test('renderHtml preserves SQL Snapshots alongside SQL Diff', () => {
    const state: WebviewState = {
        kind: 'comparison',
        beforeLabel: 'a.sql',
        afterLabel: 'b.sql',
        beforeSql: 'SELECT a;',
        afterSql: 'SELECT b;',
        outcome: {
            kind: 'result',
            result: mockResult,
        },
    };

    const html = renderHtml(state);
    assert.ok(html.includes('SQL Diff'));
    assert.ok(html.includes('SQL Snapshots'));
    assert.ok(html.includes('Before SQL'));
    assert.ok(html.includes('After SQL'));
});
