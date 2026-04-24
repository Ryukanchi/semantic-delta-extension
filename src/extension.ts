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

		const queryB = await vscode.window.showInputBox({
			title: 'Semantic Delta',
			prompt: 'Paste Query B',
			placeHolder: 'SELECT * FROM users WHERE subscription_status = \'paid\''
		});

		if (!queryB) {
			vscode.window.showWarningMessage('Query B was not provided.');
			return;
		}

		const { compareSqlQueries } = await import('semantic-delta-detector');
		const result = compareSqlQueries(queryA, queryB);
		const shortExplanation = result.explanation.split('. ')[0];
		const riskIndicator = {
			low: '🟢',
			medium: '🟡',
			high: '🔴',
		}[result.risk_level];
		const message = [
			'Semantic Delta Result',
			'',
			`Similarity: ${result.semantic_similarity_score}%`,
			`Risk: ${riskIndicator} ${result.risk_level.toUpperCase()}`,
			`Confidence: ${result.confidence_level.toUpperCase()}`,
			'',
			'Explanation:',
			shortExplanation,
		].join('\n');

		vscode.window.showInformationMessage(message);

		});

		context.subscriptions.push(disposable);
		}

		export function deactivate() {}
