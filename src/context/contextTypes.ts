export interface SupportedContextFields {
    metric_name?: string;
    description?: string;
    team_context?: string;
    intended_use?: string;
}

export interface ComparisonContextPayload {
    before?: SupportedContextFields;
    after?: SupportedContextFields;
}

export function normalizeField(value: unknown): string | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

export function normalizeContextFields(
    fields: Partial<SupportedContextFields> | Record<string, unknown> | undefined,
): SupportedContextFields | undefined {
    if (!fields || typeof fields !== 'object') {
        return undefined;
    }

    const metric_name = normalizeField(fields.metric_name);
    const description = normalizeField(fields.description);
    const team_context = normalizeField(fields.team_context);
    const intended_use = normalizeField(fields.intended_use);

    if (!metric_name && !description && !team_context && !intended_use) {
        return undefined;
    }

    return {
        ...(metric_name ? { metric_name } : {}),
        ...(description ? { description } : {}),
        ...(team_context ? { team_context } : {}),
        ...(intended_use ? { intended_use } : {}),
    };
}

export function normalizeComparisonContext(
    payload: ComparisonContextPayload | undefined,
): ComparisonContextPayload | undefined {
    if (!payload || typeof payload !== 'object') {
        return undefined;
    }

    const before = normalizeContextFields(payload.before);
    const after = normalizeContextFields(payload.after);

    if (!before && !after) {
        return undefined;
    }

    return {
        ...(before ? { before } : {}),
        ...(after ? { after } : {}),
    };
}

export function hasComparisonContext(
    payload: ComparisonContextPayload | undefined,
): boolean {
    const normalized = normalizeComparisonContext(payload);
    return Boolean(normalized?.before || normalized?.after);
}
