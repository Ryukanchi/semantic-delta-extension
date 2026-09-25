# Semantic Delta VS Code extension

Semantic Delta compares the meaning of two SQL queries in VS Code. It uses the
public `semantic-delta-detector` API for findings, risk, confidence, explanation,
and recommendations. Analysis is local and static: SQL is never executed or sent
to a database.

## Commands

| Command | Current behavior |
| --- | --- |
| `Semantic Delta: Compare SQL` | Compare the active SQL editor as **After** with a **Before** `.sql` file selected from the workspace, then open a Review WebView. |
| `Semantic Delta: Run Demo` | Enter Query A and Query B in VS Code input boxes and open a Markdown report. |
| `Semantic Delta: Run Example` | Select one of the built-in SQL pairs and open a Markdown report. |

### Before/After workflow

1. Open or focus a SQL document (`sql` language mode or `.sql` filename). Its
   current editor buffer, including unsaved changes, will be **After**.
2. Run **Semantic Delta: Compare SQL**. Select a different `.sql` file from the
   workspace as **Before**. Generated and dependency directories are excluded
   from the picker. If that file is already open, its unsaved buffer is used.
3. Choose **Continue with SQL only**, or **Add Context**. Context asks separately
   for each side's metric name, description, team context, and intended use.
   Every field is optional; press Enter on an empty field to skip it. The After
   metric name is not inferred from Before.
4. Review the result in the WebView. Source labels identify the paths and mark
   unsaved snapshots. Supplied context is shown separately from engine-derived
   evidence and is not independently verified.

The Review WebView displays the engine's risk, confidence, heuristic similarity,
evidence sources, findings, limitations, explanation, business meaning,
recommendation, and optional verdict and impact. A compact jump navigation bar
provides direct anchor links to review sections (Summary, Findings, Impact,
SQL Diff, Snapshots, Context). A unified line-by-line SQL text diff highlights
added, removed, and unchanged lines with corresponding line numbers
(Before / After), while preserving full SQL snapshots. Text diffing is strictly
syntactic and clearly separated from semantic engine findings. The two SQL
snapshots remain visible for validation and operational errors. An operational
failure has no semantic assessment: risk and confidence are **Not assessed**.

Risk estimates the possible effect of a change. Confidence describes the
strength and completeness of available evidence. They are independent. A high
risk result can have low confidence. Similarity is a heuristic score, not
confidence or proof of equivalence. **No modeled differences detected** does not
prove that the queries are equivalent or safe. No reported parser limitations
does not establish complete SQL coverage. Semantic Delta is not a SQL validator.

The WebView is currently a read-only result view. The Markdown-report commands
remain available. There is no WebView editing, retry button, Git mode,
or PostgreSQL mode in this extension yet.

## Example

Query A counts unique users with login events:

```sql
SELECT COUNT(DISTINCT user_id) FROM events WHERE event = 'login'
```

Query B counts login event rows:

```sql
SELECT COUNT(*) FROM events WHERE event = 'login'
```

Repeated events from the same user can make these counts differ.

## Architecture and limits

- `src/extension.ts` registers commands and coordinates editor selection.
- `src/documentResolver.ts` captures the current text and source labels.
- `src/context/` collects optional, separate Before and After metadata.
- `src/comparison.ts` loads only the detector's public root API. SQL-only uses
  `compareSqlQueries`; supplied context uses `compareMetricDefinitions`.
- `src/compareController.ts` starts comparisons and associates results with a
  request. `src/reviewPanel.ts` discards results from older requests.
- `src/webview/renderHtml.ts` renders escaped text in a script-free WebView.
  The Markdown path uses `src/reportController.ts` and `src/report.ts`.

The lightweight detector comparison currently runs synchronously in the VS Code
Extension Host after the package loads. Large or difficult inputs can block the
host. Request IDs prevent an older result from replacing a newer one, but they
do not cancel computation. There is no full-analysis worker, timeout, or
cancellation yet. The detector's opt-in PostgreSQL parser worker is not used by
this extension.

The pinned 1.0.4 archive reports unsupported lightweight SQL constructs as
analysis limitations. It also includes the table-aware LEFT-to-INNER join
explanation that references the actual joined table rather than hard-coded
users/orders wording.

Empty or whitespace-only input is rejected before loading the engine. Other
thrown engine/import errors are operational failures, not synthetic low-risk
results; the public API does not provide structured exception codes. Parser
limitations returned in a valid result remain part of that result.

## Development and verification

The extension declares VS Code `^1.110.0`. Node 24.18.0 was used for local
development; the VS Code 1.110.0 Extension Host has also been tested. From this
repository:

```sh
npm ci
npm test
npm run test:extension
```

`npm test` verifies the vendored engine archive checksum, compiles TypeScript,
runs ESLint, and runs the Node tests. `npm run test:extension` compiles and lints,
then runs Extension Host tests against VS Code 1.110.0 with isolated profiles.
The current tests exercise real engine results, context and error paths,
rendering, activation, source snapshots, and panel delivery. They do not drive
all Quick Pick and Input Box interactions as a human would.

Use F5 for the development host. The detector dependency is the pinned 1.0.4
archive in `vendor/`, installed according to `package-lock.json`; the extension
does not need a neighboring detector checkout. The source checkout documents
archive provenance and upgrades in `vendor/README.md`.

VSIX packaging and a fresh installed-VSIX walkthrough are separate validation
steps. The `.vscodeignore` configuration excludes sources, tests, scripts, and
the source archive; packaging must include the installed runtime dependency.
The extension is not presented as Marketplace-published.

Core detector repository: https://github.com/Ryukanchi/semantic-delta-detector
