import * as assert from 'node:assert/strict';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { executeCompare } from '../../compareController';
import { isSqlDocument, resolveEditorSnapshot } from '../../documentResolver';
import { presentComparison } from '../../reportController';
import { ReviewPanel } from '../../reviewPanel';
import { pickWorkspaceBeforeSql } from '../../workspaceSqlDiscovery';

suite('Extension Host integration', () => {
    test('activates the development extension and registers all three commands', async () => {
        const root = path.resolve(__dirname, '../../..');
        const extension = vscode.extensions.all.find(item => item.extensionPath === root);
        assert.ok(extension, `Development extension not found at ${root}`);
        await extension.activate();
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('semantic-delta.compareSql'));
        assert.ok(commands.includes('semantic-delta.runDemo'));
        assert.ok(commands.includes('semantic-delta.runExample'));
    });

    test('isSqlDocument validates languageId and file extensions correctly', () => {
        // sql languageId => true
        assert.equal(isSqlDocument({ languageId: 'sql', fileName: 'Untitled-1' }), true);
        // .sql => true
        assert.equal(isSqlDocument({ languageId: 'plaintext', fileName: '/path/to/query.sql' }), true);
        // .SQL => true
        assert.equal(isSqlDocument({ languageId: 'plaintext', fileName: '/path/to/query.SQL' }), true);
        // Markdown / Untitled-1 => false
        assert.equal(isSqlDocument({ languageId: 'markdown', fileName: 'Untitled-1' }), false);
        // another non-SQL document => false
        assert.equal(isSqlDocument({ languageId: 'json', fileName: 'package.json' }), false);
        assert.equal(isSqlDocument({ languageId: 'javascript', fileName: 'app.js' }), false);
    });

    test('active Markdown document cannot be used as After SQL and is rejected', async () => {
        const markdownDoc = await vscode.workspace.openTextDocument({
            content: '# Semantic Delta Result\nSome markdown report',
            language: 'markdown',
        });
        const editor = await vscode.window.showTextDocument(markdownDoc);
        assert.equal(vscode.window.activeTextEditor, editor);
        assert.equal(isSqlDocument(editor.document), false);

        // compareSql guards against non-SQL active document and returns before creating ReviewPanel
        await vscode.commands.executeCommand('semantic-delta.compareSql');
        assert.equal(ReviewPanel.currentPanel, undefined);

        await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
    });

    test('active SQL document is accepted as After SQL', async () => {
        const sqlDoc = await vscode.workspace.openTextDocument({
            content: 'SELECT * FROM users',
            language: 'sql',
        });
        const editor = await vscode.window.showTextDocument(sqlDoc);
        assert.equal(vscode.window.activeTextEditor, editor);
        assert.equal(isSqlDocument(editor.document), true);

        const snapshot = resolveEditorSnapshot(editor);
        assert.equal(snapshot.text, 'SELECT * FROM users');

        await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
    });

    test('opens a real engine result in a Markdown editor', async () => {
        let document: vscode.TextDocument | undefined;
        await presentComparison('SELECT COUNT(*) FROM orders',
            "SELECT COUNT(*) FROM (SELECT id FROM orders WHERE status = 'paid') paid", {
                showReport: async content => {
                    document = await vscode.workspace.openTextDocument({ content, language: 'markdown' });
                    await vscode.window.showTextDocument(document);
                },
                showValidationError: message => assert.fail(message),
                showOperationalError: message => assert.fail(message),
            });
        assert.ok(document);
        assert.equal(document.languageId, 'markdown');
        assert.ok(document.getText().includes('- Risk: high\n- Confidence: low'));
        assert.ok(document.getText().includes('subquery in FROM/JOIN'));
        assert.equal(vscode.window.activeTextEditor?.document, document);
        await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
    });

    test('creates ReviewPanel and delivers a real comparison result into Webview', async () => {
        const panel = ReviewPanel.createOrShow();
        assert.ok(panel);

        const outcome = await executeCompare(
            { label: 'orders.before.sql', text: 'SELECT COUNT(*) FROM orders' },
            { label: 'orders.after.sql', text: "SELECT COUNT(*) FROM (SELECT id FROM orders WHERE status = 'paid') paid" },
            panel,
        );

        assert.equal(outcome.kind, 'result');
        if (outcome.kind === 'result') {
            assert.equal(outcome.result.risk_level, 'high');
            assert.equal(outcome.result.confidence_level, 'low');
        }

        panel.dispose();
    });

    test('pickWorkspaceBeforeSql discovers SQL files, presents useful relative labels, and returns selected URI', async () => {
        const fakeUri1 = vscode.Uri.file('/workspace/models/orders.sql');
        const fakeUri2 = vscode.Uri.file('/workspace/staging/stg_users.sql');
        let quickPickItems: Array<{ label: string; uri: vscode.Uri }> | undefined;

        const selectedUri = await pickWorkspaceBeforeSql({
            findFiles: async () => [fakeUri1, fakeUri2],
            asRelativePath: pathOrUri => (typeof pathOrUri === 'string' ? pathOrUri : pathOrUri.path).replace(/^\/workspace\//, ''),
            showQuickPick: async <T extends vscode.QuickPickItem>(items: T[] | Thenable<T[]>) => {
                const resolved = await items;
                quickPickItems = resolved as unknown as Array<{ label: string; uri: vscode.Uri }>;
                return resolved[0];
            },
        });

        assert.ok(quickPickItems);
        assert.equal(quickPickItems.length, 2);
        // Useful relative labels sorted alphabetically
        assert.equal(quickPickItems[0].label, 'models/orders.sql');
        assert.equal(quickPickItems[1].label, 'staging/stg_users.sql');
        assert.equal(selectedUri, fakeUri1);
    });

    test('pickWorkspaceBeforeSql shows warning and returns undefined when workspace has no SQL files', async () => {
        let warningShown = '';

        const result = await pickWorkspaceBeforeSql({
            findFiles: async () => [],
            showWarningMessage: async (msg: string) => {
                warningShown = msg;
                return undefined;
            },
        });

        assert.equal(result, undefined);
        assert.ok(warningShown.includes('No SQL files found in the current workspace'));
    });

    test('pickWorkspaceBeforeSql exits cleanly with undefined when user cancels QuickPick', async () => {
        let warningShown = false;

        const result = await pickWorkspaceBeforeSql({
            findFiles: async () => [vscode.Uri.file('/workspace/query.sql')],
            asRelativePath: () => 'query.sql',
            showQuickPick: async () => undefined, // user pressed Escape
            showWarningMessage: async () => {
                warningShown = true;
                return undefined;
            },
        });

        assert.equal(result, undefined);
        assert.equal(warningShown, false, 'Cancellation must not show an error or warning');
    });

    test('selected Before file is compared against active After editor preserving unsaved buffer', async () => {
        // Open an active SQL editor with unsaved edits
        const afterDoc = await vscode.workspace.openTextDocument({
            content: 'SELECT COUNT(*) FROM users WHERE is_active = true',
            language: 'sql',
        });
        const editor = await vscode.window.showTextDocument(afterDoc);
        assert.equal(vscode.window.activeTextEditor, editor);

        // Before file snapshot
        const beforeSnapshot = {
            label: 'users.before.sql',
            text: 'SELECT COUNT(*) FROM users',
        };
        const afterSnapshot = resolveEditorSnapshot(editor);
        assert.equal(afterSnapshot.text, 'SELECT COUNT(*) FROM users WHERE is_active = true');

        const panel = ReviewPanel.createOrShow();
        const outcome = await executeCompare(beforeSnapshot, afterSnapshot, panel);

        assert.equal(outcome.kind, 'result');
        if (outcome.kind === 'result') {
            assert.ok(outcome.result.detected_differences.length > 0);
            assert.ok(outcome.result.detected_differences.some(d => d.category === 'filter_logic_mismatch' || d.category === 'business_logic_mismatch'));
        }

        panel.dispose();
        await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
    });

    test('pickWorkspaceBeforeSql excludes active After file from candidates and another file remains selectable', async () => {
        const afterUri = vscode.Uri.file('/workspace/models/orders.after.sql');
        const beforeUri = vscode.Uri.file('/workspace/models/orders.before.sql');
        let quickPickItems: Array<{ label: string; uri: vscode.Uri }> | undefined;

        const selectedUri = await pickWorkspaceBeforeSql({
            activeAfterUri: afterUri,
            findFiles: async () => [afterUri, beforeUri],
            asRelativePath: pathOrUri => (typeof pathOrUri === 'string' ? pathOrUri : pathOrUri.path).replace(/^\/workspace\//, ''),
            showQuickPick: async <T extends vscode.QuickPickItem>(items: T[] | Thenable<T[]>) => {
                const resolved = await items;
                quickPickItems = resolved as unknown as Array<{ label: string; uri: vscode.Uri }>;
                return resolved[0];
            },
        });

        assert.ok(quickPickItems);
        assert.equal(quickPickItems.length, 1);
        assert.equal(quickPickItems[0].label, 'models/orders.before.sql');
        assert.equal(selectedUri, beforeUri);
    });

    test('pickWorkspaceBeforeSql treats workspace with only the active After file as empty candidate set', async () => {
        const afterUri = vscode.Uri.file('/workspace/models/orders.after.sql');
        let warningShown = '';

        const result = await pickWorkspaceBeforeSql({
            activeAfterUri: afterUri,
            findFiles: async () => [afterUri],
            showWarningMessage: async (msg: string) => {
                warningShown = msg;
                return undefined;
            },
        });

        assert.equal(result, undefined);
        assert.ok(warningShown.includes('No SQL files found in the current workspace'));
    });
});
