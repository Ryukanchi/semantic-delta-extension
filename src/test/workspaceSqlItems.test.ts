import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    buildSqlQuickPickCandidates,
    isExcludedSqlPath,
    toRelativeSqlPath,
} from '../workspaceSqlItems';

test('isExcludedSqlPath correctly identifies and excludes generated/dependency directories', () => {
    // Obvious generated / dependency paths
    assert.equal(isExcludedSqlPath('node_modules/pkg/query.sql'), true);
    assert.equal(isExcludedSqlPath('.git/hooks/query.sql'), true);
    assert.equal(isExcludedSqlPath('out/test/fixtures/query.sql'), true);
    assert.equal(isExcludedSqlPath('dist/bundle/query.sql'), true);
    assert.equal(isExcludedSqlPath('.vscode-test/vscode-darwin/query.sql'), true);
    assert.equal(isExcludedSqlPath('.cache/test/query.sql'), true);
    assert.equal(isExcludedSqlPath('build/reports/query.sql'), true);
    assert.equal(isExcludedSqlPath('vendor/semantic-delta/query.sql'), true);

    // Windows backslash path
    assert.equal(isExcludedSqlPath('node_modules\\some-pkg\\query.sql'), true);

    // Valid project paths
    assert.equal(isExcludedSqlPath('models/marts/revenue.sql'), false);
    assert.equal(isExcludedSqlPath('examples/pr-before.sql'), false);
    assert.equal(isExcludedSqlPath('queries/users.sql'), false);
    assert.equal(isExcludedSqlPath('query.sql'), false);
});

test('toRelativeSqlPath formats clean relative paths with forward slashes', () => {
    const root = '/Users/test/project';
    assert.equal(toRelativeSqlPath('/Users/test/project/models/orders.sql', root), 'models/orders.sql');
    assert.equal(toRelativeSqlPath('/Users/test/project/query.sql', root), 'query.sql');
});

test('buildSqlQuickPickCandidates creates useful relative labels and sorts alphabetically', () => {
    const raw = [
        { file: 'uri-3', relativePath: 'staging/stg_users.sql' },
        { file: 'uri-1', relativePath: 'models/orders.sql' },
        { file: 'uri-excluded', relativePath: 'node_modules/dep/test.sql' },
        { file: 'uri-2', relativePath: 'models/customers.sql' },
        { file: 'uri-vendor-excluded', relativePath: 'vendor/engine/query.sql' },
    ];

    const candidates = buildSqlQuickPickCandidates(raw);

    assert.equal(candidates.length, 3);
    // Useful relative labels
    assert.equal(candidates[0].label, 'models/customers.sql');
    assert.equal(candidates[0].file, 'uri-2');
    assert.equal(candidates[1].label, 'models/orders.sql');
    assert.equal(candidates[1].file, 'uri-1');
    assert.equal(candidates[2].label, 'staging/stg_users.sql');
    assert.equal(candidates[2].file, 'uri-3');
});

test('buildSqlQuickPickCandidates handles empty array gracefully', () => {
    const candidates = buildSqlQuickPickCandidates([]);
    assert.deepEqual(candidates, []);
});

test('buildSqlQuickPickCandidates handles array with only excluded files', () => {
    const candidates = buildSqlQuickPickCandidates([
        { file: 'u1', relativePath: 'node_modules/a.sql' },
        { file: 'u2', relativePath: 'out/b.sql' },
    ]);
    assert.deepEqual(candidates, []);
});

test('buildSqlQuickPickCandidates excludes active After file when predicate is provided', () => {
    const raw = [
        { file: 'uri-after', relativePath: 'models/orders.after.sql' },
        { file: 'uri-before', relativePath: 'models/orders.before.sql' },
    ];

    const candidates = buildSqlQuickPickCandidates(raw, file => file === 'uri-after');
    assert.equal(candidates.length, 1);
    assert.equal(candidates[0].label, 'models/orders.before.sql');
    assert.equal(candidates[0].file, 'uri-before');
});

test('buildSqlQuickPickCandidates returns empty array when only After file is present', () => {
    const raw = [
        { file: 'uri-after', relativePath: 'models/orders.after.sql' },
    ];

    const candidates = buildSqlQuickPickCandidates(raw, file => file === 'uri-after');
    assert.deepEqual(candidates, []);
});

