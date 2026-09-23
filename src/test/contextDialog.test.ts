import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import type * as vscode from 'vscode';
import { collectComparisonContext } from '../context/contextDialog';

const defaultLabels = {
    beforeLabel: 'orders.before.sql',
    afterLabel: 'orders.after.sql',
};

test('collectComparisonContext returns undefined when user chooses SQL-only', async () => {
    let quickPickCalled = false;
    const result = await collectComparisonContext(defaultLabels, {
        showQuickPick: (async (items: unknown) => {
            quickPickCalled = true;
            const itemList = items as Array<{ action: string }>;
            return itemList.find(i => i.action === 'sql-only');
        }) as unknown as typeof vscode.window.showQuickPick,
        showInputBox: (async () => {
            assert.fail('showInputBox should not be called when user chooses SQL-only');
        }) as unknown as typeof vscode.window.showInputBox,
    });

    assert.equal(quickPickCalled, true);
    assert.equal(result, undefined);
});

test('collectComparisonContext returns null when user cancels QuickPick', async () => {
    const result = await collectComparisonContext(defaultLabels, {
        showQuickPick: (async () => undefined) as unknown as typeof vscode.window.showQuickPick,
        showInputBox: (async () => {
            assert.fail('showInputBox should not be called on QuickPick cancellation');
        }) as unknown as typeof vscode.window.showInputBox,
    });

    assert.equal(result, null);
});

test('collectComparisonContext returns null when user cancels any InputBox step', async () => {
    for (let cancelStep = 1; cancelStep <= 8; cancelStep += 1) {
        let currentStep = 0;
        const result = await collectComparisonContext(defaultLabels, {
            showQuickPick: (async (items: unknown) => {
                const itemList = items as Array<{ action: string }>;
                return itemList.find(i => i.action === 'add-context');
            }) as unknown as typeof vscode.window.showQuickPick,
            showInputBox: (async () => {
                currentStep += 1;
                if (currentStep === cancelStep) {
                    return undefined; // simulate Escape
                }
                return 'some value';
            }) as unknown as typeof vscode.window.showInputBox,
        });

        assert.equal(result, null, `Expected null when cancelling at step ${cancelStep}`);
    }
});

test('collectComparisonContext returns normalized context when user provides Before and After metadata', async () => {
    const inputs = [
        '  active_users_before  ', // 1: Before metric_name
        '  Paying users active in 30d  ', // 2: Before description
        '  finance  ', // 3: Before team_context
        '  executive reporting  ', // 4: Before intended_use
        '  active_users_after  ', // 5: After metric_name
        '  All active users in 7d  ', // 6: After description
        '  product  ', // 7: After team_context
        '  feature adoption  ', // 8: After intended_use
    ];

    let inputIndex = 0;
    const result = await collectComparisonContext(defaultLabels, {
        showQuickPick: (async (items: unknown) => {
            const itemList = items as Array<{ action: string }>;
            return itemList.find(i => i.action === 'add-context');
        }) as unknown as typeof vscode.window.showQuickPick,
        showInputBox: (async () => {
            const val = inputs[inputIndex];
            inputIndex += 1;
            return val;
        }) as unknown as typeof vscode.window.showInputBox,
    });

    assert.deepEqual(result, {
        before: {
            metric_name: 'active_users_before',
            description: 'Paying users active in 30d',
            team_context: 'finance',
            intended_use: 'executive reporting',
        },
        after: {
            metric_name: 'active_users_after',
            description: 'All active users in 7d',
            team_context: 'product',
            intended_use: 'feature adoption',
        },
    });
});

test('collectComparisonContext returns undefined when user leaves all fields blank', async () => {
    const result = await collectComparisonContext(defaultLabels, {
        showQuickPick: (async (items: unknown) => {
            const itemList = items as Array<{ action: string }>;
            return itemList.find(i => i.action === 'add-context');
        }) as unknown as typeof vscode.window.showQuickPick,
        showInputBox: (async () => '   ') as unknown as typeof vscode.window.showInputBox,
    });

    assert.equal(result, undefined);
});

test('collectComparisonContext supports Before-only context', async () => {
    const inputs = [
        'active_users', // 1: Before metric_name
        'finance description', // 2: Before description
        '', // 3: Before team_context (skipped)
        '', // 4: Before intended_use (skipped)
        '', // 5: After metric_name (skipped)
        '', // 6: After description (skipped)
        '', // 7: After team_context (skipped)
        '', // 8: After intended_use (skipped)
    ];

    let inputIndex = 0;
    const result = await collectComparisonContext(defaultLabels, {
        showQuickPick: (async (items: unknown) => {
            const itemList = items as Array<{ action: string }>;
            return itemList.find(i => i.action === 'add-context');
        }) as unknown as typeof vscode.window.showQuickPick,
        showInputBox: (async () => {
            const val = inputs[inputIndex];
            inputIndex += 1;
            return val;
        }) as unknown as typeof vscode.window.showInputBox,
    });

    assert.deepEqual(result, {
        before: {
            metric_name: 'active_users',
            description: 'finance description',
        },
    });
});

test('After metric name is empty by default even when Before has a name', async () => {
    let step = 0;
    const result = await collectComparisonContext(defaultLabels, {
        showQuickPick: (async (items: unknown) => {
            const itemList = items as Array<{ action: string }>;
            return itemList.find(i => i.action === 'add-context');
        }) as unknown as typeof vscode.window.showQuickPick,
        showInputBox: (async (options: vscode.InputBoxOptions) => {
            step += 1;
            if (step === 1) {
                return 'before_metric';
            }
            if (step === 5) {
                assert.equal(options.value, undefined);
                return options.value ?? '';
            }
            return '';
        }) as unknown as typeof vscode.window.showInputBox,
    });

    assert.equal(step, 8);
    assert.deepEqual(result, { before: { metric_name: 'before_metric' } });
});
