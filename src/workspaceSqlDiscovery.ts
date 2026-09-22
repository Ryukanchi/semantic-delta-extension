import * as vscode from 'vscode';
import { buildSqlQuickPickCandidates } from './workspaceSqlItems';

export const DEFAULT_SQL_EXCLUDE_GLOB = '**/{node_modules,.git,out,dist,.vscode-test,.cache,build,vendor}/**';

export interface WorkspaceSqlQuickPickItem extends vscode.QuickPickItem {
    uri: vscode.Uri;
}

export interface PickBeforeSqlOptions {
    activeAfterUri?: vscode.Uri;
    findFiles?: (include: string, exclude?: string) => Thenable<vscode.Uri[]>;
    showQuickPick?: <T extends vscode.QuickPickItem>(
        items: T[] | Thenable<T[]>,
        options?: vscode.QuickPickOptions,
    ) => Thenable<T | undefined>;
    showWarningMessage?: (message: string) => Thenable<string | undefined>;
    asRelativePath?: (pathOrUri: string | vscode.Uri, includeWorkspaceFolder?: boolean) => string;
}

export async function findWorkspaceSqlFiles(
    findFilesFn: (include: string, exclude?: string) => Thenable<vscode.Uri[]> = vscode.workspace.findFiles,
): Promise<vscode.Uri[]> {
    return findFilesFn('**/*.sql', DEFAULT_SQL_EXCLUDE_GLOB);
}

export async function pickWorkspaceBeforeSql(
    options: PickBeforeSqlOptions = {},
): Promise<vscode.Uri | undefined> {
    const findFiles = options.findFiles ?? vscode.workspace.findFiles;
    const showQuickPick = options.showQuickPick ?? vscode.window.showQuickPick;
    const showWarningMessage = options.showWarningMessage ?? vscode.window.showWarningMessage;
    const asRelativePath = options.asRelativePath ?? vscode.workspace.asRelativePath;
    const activeAfterUri = options.activeAfterUri;

    let uris = await findFiles('**/*.sql', DEFAULT_SQL_EXCLUDE_GLOB);
    if (activeAfterUri) {
        const activeStr = activeAfterUri.toString();
        uris = uris.filter(uri => uri.toString() !== activeStr);
    }

    if (!uris || uris.length === 0) {
        await showWarningMessage('Semantic Delta: No SQL files found in the current workspace to compare as "Before".');
        return undefined;
    }

    const candidates = buildSqlQuickPickCandidates(
        uris.map(uri => ({
            file: uri,
            relativePath: asRelativePath(uri),
        })),
    );

    if (candidates.length === 0) {
        await showWarningMessage('Semantic Delta: No SQL files found in the current workspace to compare as "Before".');
        return undefined;
    }

    const quickPickItems: WorkspaceSqlQuickPickItem[] = candidates.map(c => ({
        label: c.label,
        uri: c.file,
    }));

    const selected = await showQuickPick(quickPickItems, {
        title: 'Semantic Delta: Select "Before" SQL Document',
        placeHolder: 'Choose a SQL file from the workspace to compare as "Before"',
        matchOnDescription: true,
    });

    if (!selected) {
        // User cancelled; exit cleanly without error or comparison
        return undefined;
    }

    return selected.uri;
}
