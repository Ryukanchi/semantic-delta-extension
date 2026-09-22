import type { ComparisonOutcome } from '../comparison';

export type WebviewState =
    | {
          kind: 'loading';
          beforeLabel: string;
          afterLabel: string;
      }
    | {
          kind: 'comparison';
          beforeLabel: string;
          afterLabel: string;
          beforeSql: string;
          afterSql: string;
          outcome: ComparisonOutcome;
      };
