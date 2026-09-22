import * as vscode from 'vscode';
import type { ComparisonOutcome } from './comparison';
import type { ReviewView } from './compareController';
import { renderHtml } from './webview/renderHtml';
import type { WebviewState } from './webview/types';

export { ReviewView };

export class ReviewPanel implements ReviewView {
    public static currentPanel: ReviewPanel | undefined;
    private static readonly viewType = 'semanticDelta.review';

    private readonly panel: vscode.WebviewPanel;
    private currentRequestId = 0;
    private isDisposed = false;

    private constructor(panel: vscode.WebviewPanel) {
        this.panel = panel;
        this.panel.onDidDispose(() => {
            this.dispose();
        });
    }

    public static createOrShow(): ReviewPanel {
        const column = vscode.window.activeTextEditor
            ? vscode.ViewColumn.Beside
            : vscode.ViewColumn.One;

        if (ReviewPanel.currentPanel && !ReviewPanel.currentPanel.isDisposed) {
            ReviewPanel.currentPanel.panel.reveal(column);
            return ReviewPanel.currentPanel;
        }

        const panel = vscode.window.createWebviewPanel(
            ReviewPanel.viewType,
            'Semantic Delta Review',
            column,
            {
                enableScripts: false,
                retainContextWhenHidden: true,
            },
        );

        ReviewPanel.currentPanel = new ReviewPanel(panel);
        return ReviewPanel.currentPanel;
    }

    public startComparison(beforeLabel: string, afterLabel: string): number {
        this.currentRequestId += 1;
        const requestId = this.currentRequestId;
        this.update({
            kind: 'loading',
            beforeLabel,
            afterLabel,
        });
        return requestId;
    }

    public deliverOutcome(
        requestId: number,
        beforeLabel: string,
        afterLabel: string,
        beforeSql: string,
        afterSql: string,
        outcome: ComparisonOutcome,
    ): boolean {
        if (requestId !== this.currentRequestId || this.isDisposed) {
            // Stale result or disposed panel; discard.
            return false;
        }

        this.update({
            kind: 'comparison',
            beforeLabel,
            afterLabel,
            beforeSql,
            afterSql,
            outcome,
        });
        return true;
    }

    private update(state: WebviewState): void {
        if (!this.isDisposed) {
            this.panel.webview.html = renderHtml(state);
        }
    }

    public dispose(): void {
        this.isDisposed = true;
        ReviewPanel.currentPanel = undefined;
    }
}
