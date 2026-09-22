import * as path from 'node:path';
import * as vscode from 'vscode';
import type { DocumentSnapshot } from './compareController';

export function isSqlDocument(document: { languageId: string; fileName: string }): boolean {
    return document.languageId === 'sql' || document.fileName.toLowerCase().endsWith('.sql');
}

export function resolveEditorSnapshot(editor: vscode.TextEditor): DocumentSnapshot {
    const fileName = editor.document.fileName;
    const label = fileName ? path.basename(fileName) : 'Untitled SQL';
    // getText() returns the in-memory editor buffer including unsaved changes
    return {
        label,
        text: editor.document.getText(),
    };
}

export async function resolveFileUriSnapshot(uri: vscode.Uri): Promise<DocumentSnapshot> {
    const label = path.basename(uri.fsPath);
    // If the file is already open in an editor, respect any unsaved changes
    const openDoc = vscode.workspace.textDocuments.find(doc => doc.uri.toString() === uri.toString());
    if (openDoc) {
        return {
            label,
            text: openDoc.getText(),
        };
    }

    const bytes = await vscode.workspace.fs.readFile(uri);
    return {
        label,
        text: Buffer.from(bytes).toString('utf8'),
    };
}
