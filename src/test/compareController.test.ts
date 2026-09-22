import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ComparisonOutcome, EngineLoader } from '../comparison';
import { executeCompare, type DocumentSnapshot } from '../compareController';
import type { ReviewView } from '../reviewPanel';

class MockReviewView implements ReviewView {
    public currentRequestId = 0;
    public startCalls: Array<{ beforeLabel: string; afterLabel: string }> = [];
    public deliveredCalls: Array<{
        requestId: number;
        beforeLabel: string;
        afterLabel: string;
        beforeSql: string;
        afterSql: string;
        outcome: ComparisonOutcome;
    }> = [];

    public startComparison(beforeLabel: string, afterLabel: string): number {
        this.currentRequestId += 1;
        this.startCalls.push({ beforeLabel, afterLabel });
        return this.currentRequestId;
    }

    public deliverOutcome(
        requestId: number,
        beforeLabel: string,
        afterLabel: string,
        beforeSql: string,
        afterSql: string,
        outcome: ComparisonOutcome,
    ): boolean {
        if (requestId !== this.currentRequestId) {
            return false;
        }
        this.deliveredCalls.push({
            requestId,
            beforeLabel,
            afterLabel,
            beforeSql,
            afterSql,
            outcome,
        });
        return true;
    }
}

test('successful before/after document comparison delivers result to view', async () => {
    const view = new MockReviewView();
    const beforeSnapshot: DocumentSnapshot = {
        label: 'events.before.sql',
        text: "SELECT COUNT(DISTINCT user_id) FROM events WHERE event = 'login'",
    };
    const afterSnapshot: DocumentSnapshot = {
        label: 'events.after.sql',
        text: "SELECT COUNT(*) FROM events WHERE event = 'login'",
    };

    const outcome = await executeCompare(beforeSnapshot, afterSnapshot, view);

    assert.equal(outcome.kind, 'result');
    assert.equal(view.startCalls.length, 1);
    assert.equal(view.startCalls[0].beforeLabel, 'events.before.sql');
    assert.equal(view.startCalls[0].afterLabel, 'events.after.sql');

    assert.equal(view.deliveredCalls.length, 1);
    const delivered = view.deliveredCalls[0];
    assert.equal(delivered.beforeLabel, 'events.before.sql');
    assert.equal(delivered.afterLabel, 'events.after.sql');
    assert.equal(delivered.beforeSql, beforeSnapshot.text);
    assert.equal(delivered.afterSql, afterSnapshot.text);
    assert.equal(delivered.outcome.kind, 'result');
    if (delivered.outcome.kind === 'result') {
        assert.equal(delivered.outcome.result.risk_level, 'high');
        assert.equal(delivered.outcome.result.confidence_level, 'medium');
        assert.ok(delivered.outcome.result.detected_differences.length > 0);
    }
});

test('unsaved after editor content in snapshot is faithfully analyzed', async () => {
    const view = new MockReviewView();
    const beforeSnapshot: DocumentSnapshot = {
        label: 'query.sql',
        text: 'SELECT COUNT(*) FROM users WHERE is_paid AND is_active',
    };
    // Represents an editor with unsaved edits in its active buffer
    const unsavedAfterSnapshot: DocumentSnapshot = {
        label: 'query.sql (unsaved)',
        text: 'SELECT COUNT(*) FROM users WHERE is_paid OR is_active',
    };

    const outcome = await executeCompare(beforeSnapshot, unsavedAfterSnapshot, view);

    assert.equal(outcome.kind, 'result');
    assert.equal(view.deliveredCalls.length, 1);
    assert.equal(view.deliveredCalls[0].afterSql, 'SELECT COUNT(*) FROM users WHERE is_paid OR is_active');
    if (outcome.kind === 'result') {
        assert.ok(outcome.result.detected_differences.some(d => d.category === 'filter_logic_mismatch'));
    }
});

test('identical SQL delivers No Findings with low confidence and conservative notice', async () => {
    const view = new MockReviewView();
    const query = 'SELECT COUNT(*) FROM orders';
    const beforeSnapshot: DocumentSnapshot = { label: 'before.sql', text: query };
    const afterSnapshot: DocumentSnapshot = { label: 'after.sql', text: query };

    const outcome = await executeCompare(beforeSnapshot, afterSnapshot, view);

    assert.equal(outcome.kind, 'result');
    if (outcome.kind === 'result') {
        assert.equal(outcome.result.detected_differences.length, 0);
        assert.equal(outcome.result.risk_level, 'low');
        assert.equal(outcome.result.confidence_level, 'low');
    }
});

test('real derived-table query delivers result with parser_limitations', async () => {
    const view = new MockReviewView();
    const beforeSnapshot: DocumentSnapshot = {
        label: 'before.sql',
        text: 'SELECT COUNT(*) FROM orders',
    };
    const afterSnapshot: DocumentSnapshot = {
        label: 'after.sql',
        text: "SELECT COUNT(*) FROM (SELECT id FROM orders WHERE status = 'paid') paid",
    };

    const outcome = await executeCompare(beforeSnapshot, afterSnapshot, view);

    assert.equal(outcome.kind, 'result');
    if (outcome.kind === 'result') {
        assert.equal(outcome.result.risk_level, 'high');
        assert.equal(outcome.result.confidence_level, 'low');
        assert.ok(outcome.result.parser_limitations && outcome.result.parser_limitations.length > 0);
    }
});

test('whitespace-only input delivers validation-error without calling engine', async () => {
    const view = new MockReviewView();
    let engineCalled = false;
    const failingLoader: EngineLoader = async () => {
        engineCalled = true;
        throw new Error('Must not be called');
    };

    const beforeSnapshot: DocumentSnapshot = { label: 'before.sql', text: '   \n\t  ' };
    const afterSnapshot: DocumentSnapshot = { label: 'after.sql', text: 'SELECT 1' };

    const outcome = await executeCompare(beforeSnapshot, afterSnapshot, view, failingLoader);

    assert.equal(outcome.kind, 'validation-error');
    assert.equal(engineCalled, false);
    assert.equal(view.deliveredCalls.length, 1);
    assert.equal(view.deliveredCalls[0].outcome.kind, 'validation-error');
});

test('operational failure delivers operational-error without fake LOW risk', async () => {
    const view = new MockReviewView();
    const failingLoader: EngineLoader = async () => {
        throw new Error('Engine crash simulation');
    };

    const beforeSnapshot: DocumentSnapshot = { label: 'before.sql', text: 'SELECT 1' };
    const afterSnapshot: DocumentSnapshot = { label: 'after.sql', text: 'SELECT 2' };

    const outcome = await executeCompare(beforeSnapshot, afterSnapshot, view, failingLoader);

    assert.equal(outcome.kind, 'operational-error');
    assert.equal(view.deliveredCalls.length, 1);
    const delivered = view.deliveredCalls[0];
    assert.equal(delivered.outcome.kind, 'operational-error');
    if (delivered.outcome.kind === 'operational-error') {
        assert.ok(delivered.outcome.message.includes('Engine crash simulation'));
    }
});

test('stale result from older comparison is discarded when newer comparison has started', async () => {
    const view = new MockReviewView();

    // Start comparison 1
    const req1 = view.startComparison('file1.before.sql', 'file1.after.sql');
    assert.equal(req1, 1);

    // Start comparison 2 before comparison 1 delivers
    const req2 = view.startComparison('file2.before.sql', 'file2.after.sql');
    assert.equal(req2, 2);

    // Comparison 1 attempts to deliver late (stale)
    const delivered1 = view.deliverOutcome(
        req1,
        'file1.before.sql',
        'file1.after.sql',
        'SELECT 1',
        'SELECT 1',
        { kind: 'validation-error', message: 'Stale error' },
    );
    assert.equal(delivered1, false, 'Stale outcome should be rejected');

    // Comparison 2 delivers
    const delivered2 = view.deliverOutcome(
        req2,
        'file2.before.sql',
        'file2.after.sql',
        'SELECT 2',
        'SELECT 2',
        { kind: 'validation-error', message: 'Current error' },
    );
    assert.equal(delivered2, true, 'Current outcome should be accepted');

    assert.equal(view.deliveredCalls.length, 1);
    assert.equal(view.deliveredCalls[0].requestId, 2);
    assert.equal(view.deliveredCalls[0].beforeLabel, 'file2.before.sql');
});
