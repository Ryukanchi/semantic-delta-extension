import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import { compareQueries, type EngineLoader } from '../comparison';
import { buildMarkdownReport } from '../report';
import { presentComparison, type ReportView } from '../reportController';

const before = "SELECT COUNT(DISTINCT user_id) FROM events WHERE event = 'login'";
const after = "SELECT COUNT(*) FROM events WHERE event = 'login'";

async function resultFor(a = before, b = after) {
    const outcome = await compareQueries(a, b);
    assert.equal(outcome.kind, 'result');
    if (outcome.kind !== 'result') {
        throw new Error('Expected a semantic result');
    }
    return outcome.result;
}

function recordingView() {
    const reports: string[] = [];
    const validationErrors: string[] = [];
    const operationalErrors: string[] = [];
    const view: ReportView = {
        showReport: async report => { reports.push(report); },
        showValidationError: message => { validationErrors.push(message); },
        showOperationalError: message => { operationalErrors.push(message); },
    };
    return { view, reports, validationErrors, operationalErrors };
}

test('real findings preserve risk, confidence, explanation, categories and impacts', async () => {
    const result = await resultFor();
    assert.equal(result.risk_level, 'high');
    assert.equal(result.confidence_level, 'medium');
    assert.ok(result.detected_differences.length > 0);
    const report = buildMarkdownReport(result, before, after);
    assert.ok(report.includes('- Risk: high\n- Confidence: medium'));
    const text = report.replace(/\\([^\w\s]|_)/g, '$1');
    assert.ok(text.includes(result.explanation));
    assert.ok(report.includes(result.recommendation));
    for (const finding of result.detected_differences) {
        assert.ok(report.includes(`Category: \`${finding.category}\``));
        assert.ok(report.includes(`Impact: ${finding.impact}`));
        assert.ok(text.includes(finding.description));
    }
    assert.ok(report.includes('`sql_only`'));
});

test('identical SQL remains low confidence and is explicitly not an equivalence guarantee', async () => {
    const result = await resultFor(before, before);
    assert.equal(result.detected_differences.length, 0);
    assert.equal(result.risk_level, 'low');
    assert.equal(result.confidence_level, 'low');
    const report = buildMarkdownReport(result, before, before);
    assert.ok(report.includes('- Risk: low\n- Confidence: low'));
    assert.ok(report.includes('No modeled differences detected.'));
    assert.ok(report.includes('not proof of semantic equivalence or a guarantee of safety'));
    assert.ok(report.includes('does not establish complete SQL coverage'));
    assert.ok(report.includes('heuristic score; not confidence or proof of equivalence'));
});

test('a real derived-table limitation is fully visible without reducing high risk', async () => {
    const a = 'SELECT COUNT(*) FROM orders';
    const b = "SELECT COUNT(*) FROM (SELECT id FROM orders WHERE status = 'paid') paid";
    const result = await resultFor(a, b);
    assert.equal(result.risk_level, 'high');
    assert.equal(result.confidence_level, 'low');
    assert.ok(result.parser_limitations?.length);
    const report = buildMarkdownReport(result, a, b);
    assert.ok(report.includes('- Risk: high\n- Confidence: low'));
    assert.ok(report.includes('Additional differences may be unreported.'));
    for (const limitation of result.parser_limitations) {
        assert.ok(report.includes(limitation));
    }
    assert.ok(!report.includes('No parser limitations were reported.'));
    assert.equal((report.match(/### Finding /g) ?? []).length, result.detected_differences.length);
});

test('the adapter preserves the complete result object, including multiple limitation notes', async () => {
    const result = await resultFor();
    result.parser_limitations = ['First limitation.', 'Second limitation.'];
    const outcome = await compareQueries(before, after, async () => ({ compareSqlQueries: () => result }));
    assert.equal(outcome.kind, 'result');
    if (outcome.kind === 'result') {
        assert.strictEqual(outcome.result, result);
    }
    const report = buildMarkdownReport(result, before, after);
    assert.ok(report.includes('First limitation.'));
    assert.ok(report.includes('Second limitation.'));
});

test('missing optional verdict/impact never introduces a reassuring fallback for high risk', async () => {
    const result = { ...await resultFor() };
    delete result.verdict;
    delete result.impact;
    const report = buildMarkdownReport(result, before, after);
    assert.ok(report.includes('- Risk: high'));
    assert.ok(report.includes('## Findings'));
    assert.ok(report.includes(result.recommendation));
    assert.ok(!report.includes('## Verdict'));
    assert.ok(!report.includes('## Business Impact'));
    assert.ok(!report.includes('No significant semantic risk detected'));
    assert.ok(!report.includes('No significant business impact detected'));
});

for (const [label, a, b] of [
    ['empty A', '', after],
    ['whitespace A', ' \n\t ', after],
    ['empty B', before, ''],
    ['whitespace B', before, ' \r\n\t '],
]) {
    test(`${label} is a validation error before the engine is loaded`, async () => {
        let loaded = false;
        const load: EngineLoader = async () => { loaded = true; throw new Error('must not load'); };
        const outcome = await compareQueries(a, b, load);
        assert.equal(outcome.kind, 'validation-error');
        assert.equal(loaded, false);
        assert.ok(!('result' in outcome));
        const recorded = recordingView();
        await presentComparison(a, b, recorded.view, undefined, load);
        assert.equal(recorded.validationErrors.length, 1);
        assert.equal(recorded.operationalErrors.length, 0);
        assert.equal(recorded.reports.length, 0);
    });
}

for (const [label, load] of [
    ['import failure', async () => { throw new Error('Cannot load engine package'); }],
    ['engine failure', async () => ({ compareSqlQueries: () => { throw new Error('Engine unavailable'); } })],
] satisfies Array<[string, EngineLoader]>) {
    test(`${label} is operational, with no fabricated semantic result`, async () => {
        const outcome = await compareQueries(before, after, load);
        assert.equal(outcome.kind, 'operational-error');
        assert.ok(!('result' in outcome));
        const recorded = recordingView();
        await presentComparison(before, after, recorded.view, undefined, load);
        assert.equal(recorded.reports.length, 0);
        assert.equal(recorded.validationErrors.length, 0);
        assert.equal(recorded.operationalErrors.length, 1);
        assert.ok(recorded.operationalErrors[0].includes('Risk: Not assessed. Confidence: Not assessed.'));
        assert.ok(!recorded.operationalErrors[0].includes('Risk: low'));
    });
}

test('an engine rejection for nonempty input is not guessed from its error text', async () => {
    const outcome = await compareQueries('-- comment only', after);
    assert.equal(outcome.kind, 'operational-error');
    assert.ok(!('result' in outcome));
});

test('successful comparison delivers one report and no error notification', async () => {
    const recorded = recordingView();
    await presentComparison(before, after, recorded.view);
    assert.equal(recorded.reports.length, 1);
    assert.equal(recorded.validationErrors.length, 0);
    assert.equal(recorded.operationalErrors.length, 0);
    assert.ok(recorded.reports[0].includes('- Risk: high\n- Confidence: medium'));
});

test('report display failure is handled without a success or replacement assessment', async () => {
    const recorded = recordingView();
    recorded.view.showReport = async () => { throw new Error('Editor disposed'); };
    await presentComparison(before, after, recorded.view);
    assert.equal(recorded.operationalErrors.length, 1);
    assert.ok(recorded.operationalErrors[0].includes('could not display the report'));
    assert.ok(!recorded.operationalErrors[0].includes('Risk: low'));
});

test('SQL backticks cannot terminate the report code block', async () => {
    const result = await resultFor();
    const query = "SELECT '```';\nSELECT '````';";
    const report = buildMarkdownReport(result, query, after);
    assert.ok(report.includes('`````sql\n' + query + '\n`````'));
});

test('engine-derived HTML and Markdown links remain report text', async () => {
    const result = { ...await resultFor(), explanation: '<script>alert(1)</script> [open](command:example)' };
    const report = buildMarkdownReport(result, before, after);
    assert.ok(!report.includes('<script>'));
    assert.ok(report.includes('&lt;script&gt;'));
    assert.ok(report.includes('\\[open\\](command:example)'));
});

test('compareQueries with no context calls compareSqlQueries and preserves SQL-only behavior', async () => {
    let sqlQueriesCalled = false;
    let metricDefsCalled = false;
    const mockResult = await resultFor();

    const loader: EngineLoader = async () => ({
        compareSqlQueries: (a, b) => {
            sqlQueriesCalled = true;
            assert.equal(a, before);
            assert.equal(b, after);
            return mockResult;
        },
        compareMetricDefinitions: () => {
            metricDefsCalled = true;
            return mockResult;
        },
    });

    const outcome = await compareQueries(before, after, undefined, loader);
    assert.equal(outcome.kind, 'result');
    assert.equal(sqlQueriesCalled, true);
    assert.equal(metricDefsCalled, false);
});

test('compareQueries with context calls compareMetricDefinitions with exact supported metadata', async () => {
    let metricDefsCalled = false;
    let passedInputA: unknown;
    let passedInputB: unknown;
    const mockResult = await resultFor();

    const loader: EngineLoader = async () => ({
        compareMetricDefinitions: (inputA, inputB) => {
            metricDefsCalled = true;
            passedInputA = inputA;
            passedInputB = inputB;
            return mockResult;
        },
    });

    const context = {
        before: {
            metric_name: 'orders_count',
            description: 'All orders',
            team_context: 'finance',
            intended_use: 'kpi',
        },
        after: {
            metric_name: 'unique_orders_count',
            team_context: 'product',
        },
    };

    const outcome = await compareQueries(before, after, context, loader);
    assert.equal(outcome.kind, 'result');
    assert.equal(metricDefsCalled, true);
    assert.deepEqual(passedInputA, {
        query: before,
        metric_name: 'orders_count',
        description: 'All orders',
        team_context: 'finance',
        intended_use: 'kpi',
    });
    assert.deepEqual(passedInputB, {
        query: after,
        metric_name: 'unique_orders_count',
        team_context: 'product',
    });
});

test('compareQueries does not pass unsupported metadata fields to compareMetricDefinitions', async () => {
    let passedInputA: Record<string, unknown> = {};
    const mockResult = await resultFor();

    const loader: EngineLoader = async () => ({
        compareMetricDefinitions: (inputA) => {
            passedInputA = inputA as unknown as Record<string, unknown>;
            return mockResult;
        },
    });

    const contextWithExtra = {
        before: {
            metric_name: 'login_users',
            extra_field: 'unsupported',
            owner: 'team lead',
            source_domain: 'auth',
        } as unknown as { metric_name: string },
    };

    const outcome = await compareQueries(before, after, contextWithExtra, loader);
    assert.equal(outcome.kind, 'result');
    assert.equal(passedInputA.metric_name, 'login_users');
    assert.equal(passedInputA.extra_field, undefined);
    assert.equal(passedInputA.owner, undefined);
    assert.equal(passedInputA.source_domain, undefined);
});

test('real engine detects naming_alignment_mismatch and increases confidence to high when metadata is supplied', async () => {
    // Query A is population (users), Query B is engagement (events with login).
    // They have different primary dimensions, which triggers naming_alignment_mismatch and hasMeaningfulSqlDifference.
    const queryA = "SELECT COUNT(DISTINCT user_id) FROM users";
    const queryB = "SELECT COUNT(*) FROM events WHERE event = 'login'";

    const context = {
        before: {
            metric_name: 'active_users',
            team_context: 'product analytics',
            intended_use: 'user activity monitoring',
        },
        after: {
            metric_name: 'active_users',
            team_context: 'product analytics',
            intended_use: 'user activity monitoring',
        },
    };

    const outcome = await compareQueries(queryA, queryB, context);
    assert.equal(outcome.kind, 'result');
    if (outcome.kind !== 'result') {
        throw new Error('Expected result');
    }

    const result = outcome.result;
    assert.equal(result.metric_name_a, 'active_users');
    assert.equal(result.metric_name_b, 'active_users');
    assert.equal(result.confidence_level, 'high');
    assert.ok(result.evidence_sources.includes('sql'));
    assert.ok(result.evidence_sources.includes('metric_name'));
    assert.ok(result.evidence_sources.includes('team_context'));
    assert.ok(result.evidence_sources.includes('intended_use'));
    assert.ok(!result.evidence_sources.includes('sql_only'));
    assert.ok(result.detected_differences.some(d => d.category === 'naming_alignment_mismatch'));
});

test('real engine detects team_context_mismatch when team contexts differ between Before and After', async () => {
    const context = {
        before: {
            team_context: 'finance',
        },
        after: {
            team_context: 'product',
        },
    };

    const outcome = await compareQueries(before, after, context);
    assert.equal(outcome.kind, 'result');
    if (outcome.kind !== 'result') {
        throw new Error('Expected result');
    }

    assert.ok(outcome.result.detected_differences.some(d => d.category === 'team_context_mismatch'));
    assert.ok(outcome.result.evidence_sources.includes('team_context'));
});
