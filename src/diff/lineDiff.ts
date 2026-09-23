export type DiffLineType = 'unchanged' | 'added' | 'removed';

export interface DiffLine {
    type: DiffLineType;
    beforeLineNumber?: number;
    afterLineNumber?: number;
    text: string;
}

export interface LineDiffResult {
    lines: DiffLine[];
    hasChanges: boolean;
    addedCount: number;
    removedCount: number;
    isTruncated: boolean;
}

export interface LineDiffOptions {
    maxDiffLines?: number;
}

const DEFAULT_MAX_DIFF_LINES = 1000;
const MAX_DP_CELLS = 250_000;

function splitLines(text: string): string[] {
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    if (normalized.length === 0) {
        return [];
    }
    return normalized.split('\n');
}

export function computeLineDiff(
    textBefore: string,
    textAfter: string,
    options?: LineDiffOptions,
): LineDiffResult {
    const maxDiffLines = options?.maxDiffLines ?? DEFAULT_MAX_DIFF_LINES;
    const a = splitLines(textBefore);
    const b = splitLines(textAfter);

    if (a.length === 0 && b.length === 0) {
        return {
            lines: [],
            hasChanges: false,
            addedCount: 0,
            removedCount: 0,
            isTruncated: false,
        };
    }

    // Common prefix
    let start = 0;
    while (start < a.length && start < b.length && a[start] === b[start]) {
        start++;
    }

    // Common suffix
    let endA = a.length - 1;
    let endB = b.length - 1;
    while (endA >= start && endB >= start && a[endA] === b[endB]) {
        endA--;
        endB--;
    }

    const lines: DiffLine[] = [];
    let beforeLine = 1;
    let afterLine = 1;

    // 1. Add common prefix lines
    for (let i = 0; i < start; i++) {
        lines.push({
            type: 'unchanged',
            beforeLineNumber: beforeLine++,
            afterLineNumber: afterLine++,
            text: a[i],
        });
    }

    // 2. Middle divergent section
    const midA = a.slice(start, endA + 1);
    const midB = b.slice(start, endB + 1);
    const n = midA.length;
    const m = midB.length;

    if (n > 0 || m > 0) {
        if (n === 0) {
            // Only additions
            for (let j = 0; j < m; j++) {
                lines.push({
                    type: 'added',
                    beforeLineNumber: undefined,
                    afterLineNumber: afterLine++,
                    text: midB[j],
                });
            }
        } else if (m === 0) {
            // Only removals
            for (let i = 0; i < n; i++) {
                lines.push({
                    type: 'removed',
                    beforeLineNumber: beforeLine++,
                    afterLineNumber: undefined,
                    text: midA[i],
                });
            }
        } else if (n * m > MAX_DP_CELLS) {
            // Safety fallback for massive divergent sections
            for (let i = 0; i < n; i++) {
                lines.push({
                    type: 'removed',
                    beforeLineNumber: beforeLine++,
                    afterLineNumber: undefined,
                    text: midA[i],
                });
            }
            for (let j = 0; j < m; j++) {
                lines.push({
                    type: 'added',
                    beforeLineNumber: undefined,
                    afterLineNumber: afterLine++,
                    text: midB[j],
                });
            }
        } else {
            // Standard dynamic programming LCS
            const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));

            for (let i = 0; i < n; i++) {
                for (let j = 0; j < m; j++) {
                    if (midA[i] === midB[j]) {
                        dp[i + 1][j + 1] = dp[i][j] + 1;
                    } else {
                        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
                    }
                }
            }

            // Backtrack LCS path
            let i = n;
            let j = m;
            const midDiff: Array<{ type: DiffLineType; text: string }> = [];

            while (i > 0 || j > 0) {
                if (i > 0 && j > 0 && midA[i - 1] === midB[j - 1]) {
                    midDiff.push({ type: 'unchanged', text: midA[i - 1] });
                    i--;
                    j--;
                } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
                    midDiff.push({ type: 'added', text: midB[j - 1] });
                    j--;
                } else if (i > 0) {
                    midDiff.push({ type: 'removed', text: midA[i - 1] });
                    i--;
                }
            }

            midDiff.reverse();

            for (const item of midDiff) {
                if (item.type === 'unchanged') {
                    lines.push({
                        type: 'unchanged',
                        beforeLineNumber: beforeLine++,
                        afterLineNumber: afterLine++,
                        text: item.text,
                    });
                } else if (item.type === 'removed') {
                    lines.push({
                        type: 'removed',
                        beforeLineNumber: beforeLine++,
                        afterLineNumber: undefined,
                        text: item.text,
                    });
                } else {
                    lines.push({
                        type: 'added',
                        beforeLineNumber: undefined,
                        afterLineNumber: afterLine++,
                        text: item.text,
                    });
                }
            }
        }
    }

    // 3. Add common suffix lines
    for (let k = endA + 1; k < a.length; k++) {
        lines.push({
            type: 'unchanged',
            beforeLineNumber: beforeLine++,
            afterLineNumber: afterLine++,
            text: a[k],
        });
    }

    const addedCount = lines.filter(l => l.type === 'added').length;
    const removedCount = lines.filter(l => l.type === 'removed').length;
    const hasChanges = addedCount > 0 || removedCount > 0;

    let isTruncated = false;
    let finalLines = lines;
    if (lines.length > maxDiffLines) {
        finalLines = lines.slice(0, maxDiffLines);
        isTruncated = true;
    }

    return {
        lines: finalLines,
        hasChanges,
        addedCount,
        removedCount,
        isTruncated,
    };
}
