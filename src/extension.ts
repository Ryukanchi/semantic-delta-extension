import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	const disposable = vscode.commands.registerCommand('semantic-delta.runDemo', async () => {

		const queryA = await vscode.window.showInputBox({
			title: 'Semantic Delta',
			prompt: 'Paste Query A',
			placeHolder: 'SELECT * FROM events WHERE event = \'login\''
		});

		if (!queryA) {
			vscode.window.showWarningMessage('Query A was not provided.');
			return;
		}
		55
		const queryB = await vscode.window.showInputBox({
			title: 'Semantic Delta',
			prompt: 'Paste Query B',
			placeHolder: 'SELECT * FROM users WHERE subscription_status = \'paid\''
		});

		if (!queryB) {
			vscode.window.showWarningMessage('Query B was not provided.');
			return;
		}

		const tableA = queryA.toLowerCase().match(/from\s+(\w+)/)?.[1];
		const tableB = queryB.toLowerCase().match(/from\s+(\w+)/)?.[1];

		const whereA = queryA.toLowerCase().match(/where\s+(.+)/)?.[1];
		const whereB = queryB.toLowerCase().match(/where\s+(.+)/)?.[1];
		const selectA = queryA.toLowerCase().match(/select\s+(.+?)\s+from/)?.[1];
		const selectB = queryB.toLowerCase().match(/select\s+(.+?)\s+from/)?.[1];

		let message = '';

		if (tableA !== tableB) {
		message += `Table changed: ${tableA || 'unknown'} → ${tableB || 'unknown'}\n`;
		}

		if (whereA !== whereB) {
		message += `Condition changed: ${whereA || 'none'} → ${whereB || 'none'}`;
		}

		if (!message) {
		message = 'No semantic difference detected.';
		}

		vscode.window.showInformationMessage(message.replace(/\n/g, ' | '));

		});

		context.subscriptions.push(disposable);
		}

		export function deactivate() {}