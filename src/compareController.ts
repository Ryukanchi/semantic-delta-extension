import { compareQueries, type ComparisonOutcome, type EngineLoader } from './comparison';

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
    ): boolean;
}

export async function executeCompare(
    beforeSnapshot: DocumentSnapshot,
    afterSnapshot: DocumentSnapshot,
    view: ReviewView,
    loadEngine?: EngineLoader,
): Promise<ComparisonOutcome> {
    const requestId = view.startComparison(beforeSnapshot.label, afterSnapshot.label);
    const outcome = await compareQueries(beforeSnapshot.text, afterSnapshot.text, loadEngine);
    view.deliverOutcome(
        requestId,
        beforeSnapshot.label,
        afterSnapshot.label,
        beforeSnapshot.text,
        afterSnapshot.text,
        outcome,
    );
    return outcome;
}
