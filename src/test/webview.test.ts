import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import type { SemanticComparisonResult } from 'semantic-delta-detector' with { 'resolution-mode': 'import' };
import { escapeHtml, renderHtml } from '../webview/renderHtml';
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
