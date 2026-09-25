import { compareQueries, type EngineLoader } from './comparison';
import { buildMarkdownReport } from './report';

export interface ReportView {
    showReport(report: string): Promise<void>;
    showValidationError(message: string): void;
    showOperationalError(message: string): void;
}

export async function presentComparison(
    queryA: string,
    queryB: string,
    view: ReportView,
    title?: string,
    loadEngine?: EngineLoader,
): Promise<void> {
    const outcome = await compareQueries(queryA, queryB, loadEngine);
    if (outcome.kind === 'validation-error') {
        view.showValidationError(`Semantic Delta: ${outcome.message} No semantic assessment was produced.`);
        return;
    }
    if (outcome.kind === 'analysis-unavailable') {
        view.showValidationError(`Semantic Delta analysis unavailable: ${outcome.message} Risk: Not assessed. Confidence: Not assessed.`);
        return;
    }
    if (outcome.kind === 'operational-error') {
        view.showOperationalError(`Semantic Delta analysis failed: ${outcome.message} Risk: Not assessed. Confidence: Not assessed.`);
        return;
    }

    try {
        await view.showReport(buildMarkdownReport(outcome.result, queryA, queryB, title));
    } catch {
        // Analysis may have succeeded; a display failure must not invent a
        // different semantic result or announce successful report delivery.
        view.showOperationalError('Semantic Delta could not display the report. The analysis result was not presented; retry the comparison.');
    }
}
