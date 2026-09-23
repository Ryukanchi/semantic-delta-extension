import type * as vscode from 'vscode';
import {
    normalizeComparisonContext,
    normalizeContextFields,
    type ComparisonContextPayload,
} from './contextTypes';

export interface ContextDialogLabels {
    beforeLabel: string;
    afterLabel: string;
}

export interface ContextDialogOptions {
    showQuickPick?: typeof vscode.window.showQuickPick;
    showInputBox?: typeof vscode.window.showInputBox;
}

interface ContextChoiceItem extends vscode.QuickPickItem {
    action: 'sql-only' | 'add-context';
}

function getVscodeWindow(): typeof vscode.window {
    const vs = require('vscode') as typeof import('vscode');
    return vs.window;
}

export async function collectComparisonContext(
    labels: ContextDialogLabels,
    options: ContextDialogOptions = {},
): Promise<ComparisonContextPayload | undefined | null> {
    const showQuickPick = options.showQuickPick ?? getVscodeWindow().showQuickPick;
    const showInputBox = options.showInputBox ?? getVscodeWindow().showInputBox;

    const items: ContextChoiceItem[] = [
        {
            label: '$(play) Continue with SQL only',
            description: 'Run comparison without additional business metadata (default)',
            action: 'sql-only',
        },
        {
            label: '$(edit) Add Context',
            description: 'Specify metric name, description, team, or intended use for Before and After',
            action: 'add-context',
        },
    ];

    const choice = await showQuickPick<ContextChoiceItem>(items, {
        title: 'Semantic Delta: Comparison Context',
        placeHolder: 'Optionally provide business context for Before and After queries',
        ignoreFocusOut: true,
    });

    if (!choice) {
        // User cancelled QuickPick (Escape)
        return null;
    }

    if (choice.action === 'sql-only') {
        return undefined;
    }

    // Step 1/8: Before Metric Name
    const beforeMetricName = await showInputBox({
        title: `Semantic Delta: Before Context (1/8)`,
        prompt: `Metric name for Before SQL (${labels.beforeLabel}) — Press Enter to skip`,
        placeHolder: 'e.g. active_users',
        ignoreFocusOut: true,
    });
    if (beforeMetricName === undefined) {
        return null;
    }

    // Step 2/8: Before Description
    const beforeDescription = await showInputBox({
        title: `Semantic Delta: Before Context (2/8)`,
        prompt: `Description for Before SQL (${labels.beforeLabel}) — Press Enter to skip`,
        placeHolder: 'e.g. Paying users active in the last 30 days',
        ignoreFocusOut: true,
    });
    if (beforeDescription === undefined) {
        return null;
    }

    // Step 3/8: Before Team Context
    const beforeTeamContext = await showInputBox({
        title: `Semantic Delta: Before Context (3/8)`,
        prompt: `Team context for Before SQL (${labels.beforeLabel}) (e.g. finance, product) — Press Enter to skip`,
        placeHolder: 'e.g. product analytics',
        ignoreFocusOut: true,
    });
    if (beforeTeamContext === undefined) {
        return null;
    }

    // Step 4/8: Before Intended Use
    const beforeIntendedUse = await showInputBox({
        title: `Semantic Delta: Before Context (4/8)`,
        prompt: `Intended use for Before SQL (${labels.beforeLabel}) (e.g. executive reporting) — Press Enter to skip`,
        placeHolder: 'e.g. executive revenue reporting',
        ignoreFocusOut: true,
    });
    if (beforeIntendedUse === undefined) {
        return null;
    }

    // Step 5/8: After Metric Name must be supplied independently.
    const afterMetricName = await showInputBox({
        title: `Semantic Delta: After Context (5/8)`,
        prompt: `Metric name for After SQL (${labels.afterLabel}) — Press Enter to skip`,
        placeHolder: 'e.g. active_users',
        ignoreFocusOut: true,
    });
    if (afterMetricName === undefined) {
        return null;
    }

    // Step 6/8: After Description
    const afterDescription = await showInputBox({
        title: `Semantic Delta: After Context (6/8)`,
        prompt: `Description for After SQL (${labels.afterLabel}) — Press Enter to skip`,
        placeHolder: 'e.g. All active users who logged in during the last 7 days',
        ignoreFocusOut: true,
    });
    if (afterDescription === undefined) {
        return null;
    }

    // Step 7/8: After Team Context
    const afterTeamContext = await showInputBox({
        title: `Semantic Delta: After Context (7/8)`,
        prompt: `Team context for After SQL (${labels.afterLabel}) (e.g. finance, product) — Press Enter to skip`,
        placeHolder: 'e.g. product analytics',
        ignoreFocusOut: true,
    });
    if (afterTeamContext === undefined) {
        return null;
    }

    // Step 8/8: After Intended Use
    const afterIntendedUse = await showInputBox({
        title: `Semantic Delta: After Context (8/8)`,
        prompt: `Intended use for After SQL (${labels.afterLabel}) (e.g. feature adoption) — Press Enter to skip`,
        placeHolder: 'e.g. product feature adoption tracking',
        ignoreFocusOut: true,
    });
    if (afterIntendedUse === undefined) {
        return null;
    }

    const payload: ComparisonContextPayload = {
        before: normalizeContextFields({
            metric_name: beforeMetricName,
            description: beforeDescription,
            team_context: beforeTeamContext,
            intended_use: beforeIntendedUse,
        }),
        after: normalizeContextFields({
            metric_name: afterMetricName,
            description: afterDescription,
            team_context: afterTeamContext,
            intended_use: afterIntendedUse,
        }),
    };

    return normalizeComparisonContext(payload);
}
