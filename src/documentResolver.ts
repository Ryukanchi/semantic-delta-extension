import * as vscode from 'vscode';
import type { DocumentSnapshot } from './compareController';

export function isSqlDocument(document: { languageId: string; fileName: string }): boolean {
    return document.languageId === 'sql' || document.fileName.toLowerCase().endsWith('.sql');
}

function snapshotLabel(uri: vscode.Uri, isDirty: boolean, isUntitled = false, fileName?: string): string {
    const location = isUntitled
        ? (fileName || 'Untitled SQL')
        : vscode.workspace.asRelativePath(uri, true);
    return isDirty || isUntitled ? `${location} (unsaved changes)` : location;
}

export function resolveEditorSnapshot(editor: vscode.TextEditor): DocumentSnapshot {
    const document = editor.document;
    // getText() returns the in-memory editor buffer including unsaved changes
    return {
        label: snapshotLabel(document.uri, document.isDirty, document.isUntitled, document.fileName),
        text: document.getText(),
    };
}

export async function resolveFileUriSnapshot(uri: vscode.Uri): Promise<DocumentSnapshot> {
    // If the file is already open in an editor, respect any unsaved changes
    const openDoc = vscode.workspace.textDocuments.find(doc => doc.uri.toString() === uri.toString());
    if (openDoc) {
        return {
            label: snapshotLabel(uri, openDoc.isDirty),
            text: openDoc.getText(),
        };
    }

    const bytes = await vscode.workspace.fs.readFile(uri);
    return {
        label: snapshotLabel(uri, false),
        text: Buffer.from(bytes).toString('utf8'),
    };
}
