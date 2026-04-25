import * as vscode from 'vscode';

interface SemanticDeltaExample {
	title: string;
	queryA: string;
	queryB: string;
}

const examples: SemanticDeltaExample[] = [
	{
		title: 'Unique login users vs login event rows',
		queryA: "SELECT COUNT(DISTINCT user_id) FROM events WHERE event = 'login'",
		queryB: "SELECT COUNT(*) FROM events WHERE event = 'login'",
	},
	{
		title: 'Paid users vs all users',
		queryA: "SELECT COUNT(*) FROM users WHERE plan = 'paid'",
		queryB: 'SELECT COUNT(*) FROM users',
	},
	{
		title: 'Daily login counts vs monthly login counts',
		queryA: "SELECT DATE(created_at), COUNT(*) FROM events WHERE event = 'login' GROUP BY DATE(created_at)",
		queryB: "SELECT DATE_TRUNC('month', created_at), COUNT(*) FROM events WHERE event = 'login' GROUP BY DATE_TRUNC('month', created_at)",
	},
	{
		title: 'LEFT JOIN users/orders vs INNER JOIN users/orders',
		queryA: 'SELECT COUNT(*) FROM users u LEFT JOIN orders o ON u.id = o.user_id',
		queryB: 'SELECT COUNT(*) FROM users u JOIN orders o ON u.id = o.user_id',
	},
	{
		title: 'External users vs all users',
		queryA: "SELECT COUNT(*) FROM users WHERE email NOT LIKE '%@company.com'",
		queryB: 'SELECT COUNT(*) FROM users',
	},
];

interface SemanticComparisonResult {
	semantic_similarity_score: number;
	risk_level: 'low' | 'medium' | 'high';
	confidence_level: 'low' | 'medium' | 'high';
	likely_business_meaning_a: string;
	likely_business_meaning_b: string;
	detected_differences: Array<{
		impact: 'low' | 'medium' | 'high';
		description: string;
	}>;
	explanation: string;
	recommendation: string;
}

function buildMarkdownReport(
	result: SemanticComparisonResult,
	queryA: string,
	queryB: string,
	title?: string,
): string {
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
	const titleLines = title ? ['## Example', title, ''] : [];

	return [
		'# Semantic Delta Result',
		'',
		...titleLines,
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
}

async function openMarkdownReport(report: string): Promise<void> {
	const document = await vscode.workspace.openTextDocument({
		content: report,
		language: 'markdown',
	});

	await vscode.window.showTextDocument(document);
	vscode.window.showInformationMessage('Semantic Delta report generated');
}

async function runComparisonReport(queryA: string, queryB: string, title?: string): Promise<void> {
	const { compareSqlQueries } = await import('semantic-delta-detector');
	const result = compareSqlQueries(queryA, queryB);
	const report = buildMarkdownReport(result, queryA, queryB, title);

	await openMarkdownReport(report);
}

async function runDemo(): Promise<void> {
	const queryA = await vscode.window.showInputBox({
		title: 'Semantic Delta',
		prompt: 'Paste Query A',
		placeHolder: 'SELECT * FROM events WHERE event = \'login\'',
	});

	if (!queryA) {
		vscode.window.showWarningMessage('Query A was not provided.');
		return;
	}

	const queryB = await vscode.window.showInputBox({
		title: 'Semantic Delta',
		prompt: 'Paste Query B',
		placeHolder: 'SELECT * FROM users WHERE subscription_status = \'paid\'',
	});

	if (!queryB) {
		vscode.window.showWarningMessage('Query B was not provided.');
		return;
	}

	await runComparisonReport(queryA, queryB);
}

async function runExample(): Promise<void> {
	const selectedExample = await vscode.window.showQuickPick(
		examples.map((example) => ({
			label: example.title,
			example,
		})),
		{
			title: 'Semantic Delta',
			placeHolder: 'Choose an example',
		},
	);

	if (!selectedExample) {
		return;
	}

	await runComparisonReport(
		selectedExample.example.queryA,
		selectedExample.example.queryB,
		selectedExample.example.title,
	);
}

export function activate(context: vscode.ExtensionContext) {
	const runDemoDisposable = vscode.commands.registerCommand('semantic-delta.runDemo', runDemo);
	const runExampleDisposable = vscode.commands.registerCommand('semantic-delta.runExample', runExample);

	context.subscriptions.push(runDemoDisposable, runExampleDisposable);
}

export function deactivate() {}
