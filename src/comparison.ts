import type {
    MetricDefinitionInput,
    SemanticComparisonResult,
} from 'semantic-delta-detector' with { 'resolution-mode': 'import' };
import type * as Engine from 'semantic-delta-detector' with { 'resolution-mode': 'import' };
import {
    normalizeComparisonContext,
    type ComparisonContextPayload,
} from './context/contextTypes';

export type EngineLoader = () => Promise<{
    compareSqlQueries?: typeof Engine.compareSqlQueries;
    compareMetricDefinitions?: typeof Engine.compareMetricDefinitions;
}>;

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
    contextOrLoader?: ComparisonContextPayload | EngineLoader,
    loadEngine?: EngineLoader,
): Promise<ComparisonOutcome> {
    const context = normalizeComparisonContext(
        typeof contextOrLoader === 'function' ? undefined : contextOrLoader,
    );
    const loader = typeof contextOrLoader === 'function'
        ? contextOrLoader
        : (loadEngine ?? (() => import('semantic-delta-detector')));

    const validationError = validateQuery(queryA, 'Query A') ?? validateQuery(queryB, 'Query B');
    if (validationError) {
        return { kind: 'validation-error', message: validationError };
    }

    try {
        const engine = await loader();

        if (context) {
            if (typeof engine.compareMetricDefinitions !== 'function') {
                throw new Error('Engine does not support compareMetricDefinitions.');
            }

            const inputA: MetricDefinitionInput = {
                query: queryA,
                ...(context?.before?.metric_name ? { metric_name: context.before.metric_name } : {}),
                ...(context?.before?.description ? { description: context.before.description } : {}),
                ...(context?.before?.team_context ? { team_context: context.before.team_context } : {}),
                ...(context?.before?.intended_use ? { intended_use: context.before.intended_use } : {}),
            };

            const inputB: MetricDefinitionInput = {
                query: queryB,
                ...(context?.after?.metric_name ? { metric_name: context.after.metric_name } : {}),
                ...(context?.after?.description ? { description: context.after.description } : {}),
                ...(context?.after?.team_context ? { team_context: context.after.team_context } : {}),
                ...(context?.after?.intended_use ? { intended_use: context.after.intended_use } : {}),
            };

            return { kind: 'result', result: engine.compareMetricDefinitions(inputA, inputB) };
        }

        if (typeof engine.compareSqlQueries !== 'function') {
            if (typeof engine.compareMetricDefinitions === 'function') {
                return {
                    kind: 'result',
                    result: engine.compareMetricDefinitions({ query: queryA }, { query: queryB }),
                };
            }
            throw new Error('Engine does not provide comparison functions.');
        }

        return { kind: 'result', result: engine.compareSqlQueries(queryA, queryB) };
    } catch (error) {
        // The public engine has no structured error taxonomy. Do not classify
        // thrown messages as semantic findings or fabricate an assessment.
        return { kind: 'operational-error', message: errorMessage(error) };
    }
}
