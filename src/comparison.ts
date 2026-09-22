import type { SemanticComparisonResult } from 'semantic-delta-detector' with { 'resolution-mode': 'import' };
import type * as Engine from 'semantic-delta-detector' with { 'resolution-mode': 'import' };

export type EngineLoader = () => Promise<Pick<typeof Engine, 'compareSqlQueries'>>;

export type ComparisonOutcome =
    | { kind: 'result'; result: SemanticComparisonResult }
    | { kind: 'validation-error'; message: string }
    | { kind: 'operational-error'; message: string };

export function validateQuery(query: string, label: string): string | undefined {
    return query.trim().length === 0 ? `${label} must contain SQL text.` : undefined;
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'An unexpected error occurred.';
}

export async function compareQueries(
    queryA: string,
    queryB: string,
    loadEngine: EngineLoader = () => import('semantic-delta-detector'),
): Promise<ComparisonOutcome> {
    const validationError = validateQuery(queryA, 'Query A') ?? validateQuery(queryB, 'Query B');
    if (validationError) {
        return { kind: 'validation-error', message: validationError };
    }

    try {
        const engine = await loadEngine();
        return { kind: 'result', result: engine.compareSqlQueries(queryA, queryB) };
    } catch (error) {
        // The public engine has no structured error taxonomy. Do not classify
        // thrown messages as semantic findings or fabricate an assessment.
        return { kind: 'operational-error', message: errorMessage(error) };
    }
}
