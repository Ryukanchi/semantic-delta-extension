import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    hasComparisonContext,
    normalizeComparisonContext,
    normalizeContextFields,
    normalizeField,
} from '../context/contextTypes';

test('normalizeField trims strings and treats empty/whitespace as undefined', () => {
    assert.equal(normalizeField('  hello  '), 'hello');
    assert.equal(normalizeField(''), undefined);
    assert.equal(normalizeField('   '), undefined);
    assert.equal(normalizeField('\n\t '), undefined);
    assert.equal(normalizeField(undefined), undefined);
    assert.equal(normalizeField(null), undefined);
    assert.equal(normalizeField(123), undefined);
});

test('normalizeContextFields extracts only supported fields and normalizes whitespace', () => {
    const input = {
        metric_name: '  active_users  ',
        description: '  Monthly active users count  ',
        team_context: '  analytics  ',
        intended_use: '  kpi reporting  ',
    };

    const normalized = normalizeContextFields(input);
    assert.deepEqual(normalized, {
        metric_name: 'active_users',
        description: 'Monthly active users count',
        team_context: 'analytics',
        intended_use: 'kpi reporting',
    });
});

test('normalizeContextFields strips unsupported fields', () => {
    const inputWithExtra = {
        metric_name: 'active_users',
        description: 'Valid description',
        owner: 'Jane Doe',
        business_definition: 'Should not leak',
        source_domain: 'commerce',
        dashboard: 'Exec Summary',
        population: 'all users',
        extra_object: { foo: 'bar' },
    };

    const normalized = normalizeContextFields(inputWithExtra);
    assert.deepEqual(normalized, {
        metric_name: 'active_users',
        description: 'Valid description',
    });
    assert.equal((normalized as Record<string, unknown>).owner, undefined);
    assert.equal((normalized as Record<string, unknown>).business_definition, undefined);
    assert.equal((normalized as Record<string, unknown>).source_domain, undefined);
    assert.equal((normalized as Record<string, unknown>).dashboard, undefined);
    assert.equal((normalized as Record<string, unknown>).population, undefined);
    assert.equal((normalized as Record<string, unknown>).extra_object, undefined);
});

test('normalizeContextFields returns undefined when all fields are empty or whitespace', () => {
    assert.equal(normalizeContextFields({}), undefined);
    assert.equal(
        normalizeContextFields({
            metric_name: '   ',
            description: '',
            team_context: '  \t\n',
            intended_use: '',
        }),
        undefined,
    );
    assert.equal(normalizeContextFields(undefined), undefined);
});

test('normalizeComparisonContext keeps Before and After metadata isolated', () => {
    const payload = {
        before: {
            metric_name: 'orders_total',
            team_context: 'finance',
        },
        after: {
            metric_name: 'unique_orders',
            team_context: 'product',
        },
    };

    const normalized = normalizeComparisonContext(payload);
    assert.deepEqual(normalized, {
        before: {
            metric_name: 'orders_total',
            team_context: 'finance',
        },
        after: {
            metric_name: 'unique_orders',
            team_context: 'product',
        },
    });
});

test('normalizeComparisonContext handles asymmetric context (Before only or After only)', () => {
    const beforeOnly = normalizeComparisonContext({
        before: { metric_name: 'orders_total' },
        after: { metric_name: '   ' },
    });
    assert.deepEqual(beforeOnly, {
        before: { metric_name: 'orders_total' },
    });

    const afterOnly = normalizeComparisonContext({
        before: {},
        after: { intended_use: 'reporting' },
    });
    assert.deepEqual(afterOnly, {
        after: { intended_use: 'reporting' },
    });
});

test('normalizeComparisonContext returns undefined when both sides are empty', () => {
    assert.equal(normalizeComparisonContext(undefined), undefined);
    assert.equal(normalizeComparisonContext({}), undefined);
    assert.equal(
        normalizeComparisonContext({
            before: { metric_name: '  ' },
            after: { description: '  ' },
        }),
        undefined,
    );
});

test('hasComparisonContext correctly determines if any context exists', () => {
    assert.equal(hasComparisonContext(undefined), false);
    assert.equal(hasComparisonContext({}), false);
    assert.equal(hasComparisonContext({ before: {}, after: {} }), false);
    assert.equal(
        hasComparisonContext({
            before: { metric_name: 'active_users' },
        }),
        true,
    );
    assert.equal(
        hasComparisonContext({
            after: { team_context: 'finance' },
        }),
        true,
    );
});
