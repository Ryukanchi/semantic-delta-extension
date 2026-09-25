import * as path from 'node:path';

export const DEFAULT_SQL_EXCLUDE_DIRS: readonly string[] = [
    'node_modules',
    '.git',
    'out',
    'dist',
    '.vscode-test',
    '.cache',
    'build',
    'vendor',
];

export function isExcludedSqlPath(
    relativePath: string,
    excludeDirs: readonly string[] = DEFAULT_SQL_EXCLUDE_DIRS,
): boolean {
    const normalized = relativePath.replace(/\\/g, '/');
    const segments = normalized.split('/');
    return segments.some(segment => excludeDirs.includes(segment));
}

export function toRelativeSqlPath(fsPath: string, rootPath: string): string {
    const rel = path.relative(rootPath, fsPath);
    return rel.replace(/\\/g, '/');
}

export interface SqlQuickPickCandidate<T> {
    label: string;
    description?: string;
    file: T;
}

export function buildSqlQuickPickCandidates<T>(
    candidates: Array<{ file: T; relativePath: string }>,
    excludePredicate?: (file: T, relativePath: string) => boolean,
): SqlQuickPickCandidate<T>[] {
    return candidates
        .filter(c => !isExcludedSqlPath(c.relativePath) && (!excludePredicate || !excludePredicate(c.file, c.relativePath)))
        .map(c => ({
            label: c.relativePath,
            file: c.file,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
}
