import { compareQueries, type ComparisonOutcome, type EngineLoader } from './comparison';
import { normalizeComparisonContext, type ComparisonContextPayload } from './context/contextTypes';

export interface DocumentSnapshot {
    label: string;
    text: string;
}

export interface ReviewView {
    startComparison(beforeLabel: string, afterLabel: string): number;
    deliverOutcome(
        requestId: number,
        beforeLabel: string,
        afterLabel: string,
        beforeSql: string,
        afterSql: string,
        outcome: ComparisonOutcome,
        context?: ComparisonContextPayload,
    ): boolean;
}

export async function executeCompare(
    beforeSnapshot: DocumentSnapshot,
    afterSnapshot: DocumentSnapshot,
    view: ReviewView,
    contextOrLoader?: ComparisonContextPayload | EngineLoader,
    loadEngine?: EngineLoader,
): Promise<ComparisonOutcome> {
    const context = normalizeComparisonContext(
        typeof contextOrLoader === 'function' ? undefined : contextOrLoader,
    );
    const loader = typeof contextOrLoader === 'function' ? contextOrLoader : loadEngine;

    const requestId = view.startComparison(beforeSnapshot.label, afterSnapshot.label);
    const outcome = await compareQueries(beforeSnapshot.text, afterSnapshot.text, context, loader);
    view.deliverOutcome(
        requestId,
        beforeSnapshot.label,
        afterSnapshot.label,
        beforeSnapshot.text,
        afterSnapshot.text,
        outcome,
        context,
    );
    return outcome;
}
