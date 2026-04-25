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
		const riskIndicator = {
			low: '🟢',
			medium: '🟡',
			high: '🔴',
		}[result.risk_level as 'low' | 'medium' | 'high'];
		const findings = result.detected_differences.length === 0
			? ['- No meaningful semantic differences detected.']
			: result.detected_differences.map(
				(difference) => `- **${difference.impact.toUpperCase()}** ${difference.description}`,
			);
		const report = [
			'# Semantic Delta Result',
			'',
			'## Summary',
			`- Similarity: ${result.semantic_similarity_score}%`,
			`- Risk: ${riskIndicator} ${result.risk_level.toUpperCase()}`,
			`- Confidence: ${result.confidence_level.toUpperCase()}`,
			'',
			'## Business Meaning',
			`- Query A: ${result.likely_business_meaning_a}`,
			`- Query B: ${result.likely_business_meaning_b}`,
			'',
			'## Key Findings',
			...findings,
			'',
			'## Explanation',
			result.explanation,
			'',
			'## Recommendation',
			result.recommendation,
			'',
			'## Query A',
			'```sql',
			queryA,
			'```',
			'',
			'## Query B',
			'```sql',
			queryB,
			'```',
		].join('\n');

		const document = await vscode.workspace.openTextDocument({
			content: report,
			language: 'markdown',
		});

		await vscode.window.showTextDocument(document);
		vscode.window.showInformationMessage('Semantic Delta report generated');

		});

		context.subscriptions.push(disposable);
		}

		export function deactivate() {}
