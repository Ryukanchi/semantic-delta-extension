import * as vscode from 'vscode';
import { validateQuery } from './comparison';
import { executeCompare } from './compareController';
import { isSqlDocument, resolveEditorSnapshot, resolveFileUriSnapshot } from './documentResolver';
import { presentComparison } from './reportController';
import { ReviewPanel } from './reviewPanel';
import { pickWorkspaceBeforeSql } from './workspaceSqlDiscovery';

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

async function compareSql(): Promise<void> {
	const activeEditor = vscode.window.activeTextEditor;
	if (!activeEditor || !isSqlDocument(activeEditor.document)) {
		vscode.window.showWarningMessage('Semantic Delta: Please open or focus a SQL document (.sql) to compare as "After".');
		return;
	}

	const beforeUri = await pickWorkspaceBeforeSql({
		activeAfterUri: activeEditor.document.uri,
	});
	if (!beforeUri) {
		return;
	}

	const afterSnapshot = resolveEditorSnapshot(activeEditor);

	let beforeSnapshot;
	try {
		beforeSnapshot = await resolveFileUriSnapshot(beforeUri);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to read file.';
		vscode.window.showErrorMessage(`Semantic Delta: Could not read Before file: ${message}`);
		return;
	}

	const panel = ReviewPanel.createOrShow();
	await executeCompare(beforeSnapshot, afterSnapshot, panel);
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
	await presentComparison(queryA, queryB, {
		showReport: openMarkdownReport,
		showValidationError: message => { void vscode.window.showWarningMessage(message); },
		showOperationalError: message => { void vscode.window.showErrorMessage(message); },
	}, title);
}

async function runDemo(): Promise<void> {
	const queryA = await vscode.window.showInputBox({
		title: 'Semantic Delta',
		prompt: 'Paste Query A',
		validateInput: value => validateQuery(value, 'Query A'),
		placeHolder: 'SELECT * FROM events WHERE event = \'login\'',
	});

	if (queryA === undefined) {
		return;
	}

	const queryB = await vscode.window.showInputBox({
		title: 'Semantic Delta',
		prompt: 'Paste Query B',
		validateInput: value => validateQuery(value, 'Query B'),
		placeHolder: 'SELECT * FROM users WHERE subscription_status = \'paid\'',
	});

	if (queryB === undefined) {
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
	const compareSqlDisposable = vscode.commands.registerCommand('semantic-delta.compareSql', compareSql);
	const runDemoDisposable = vscode.commands.registerCommand('semantic-delta.runDemo', runDemo);
	const runExampleDisposable = vscode.commands.registerCommand('semantic-delta.runExample', runExample);

	context.subscriptions.push(compareSqlDisposable, runDemoDisposable, runExampleDisposable);
}

export function deactivate() {}
