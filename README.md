# semantic-delta-extension

## What This Is

![Extension Demo](docs/assets/extension-demo.png)

A VS Code extension for running semantic-delta-detector directly in your editor.

The extension is intentionally thin: it collects two SQL queries, calls the core detector package, and opens the result as a Markdown report.

Core detector repo: https://github.com/Ryukanchi/semantic-delta-detector

## Why It Matters

Same-looking SQL can mean different KPIs. This extension helps catch metric definition drift before teams compare incompatible dashboard numbers.

## How It Works

- Run `Semantic Delta: Run Example` for a Quick Pick of built-in demo cases.
- Select an example to open a Markdown report.
- Run `Semantic Delta: Run Demo` to enter custom Query A and Query B.
- The extension calls `semantic-delta-detector` for the semantic comparison.

The report includes summary, similarity, risk, confidence, business meaning, key findings, explanation, recommendation, and both input queries.

## Example

Query A:

```sql
SELECT COUNT(DISTINCT user_id) FROM events WHERE event = 'login'
```

Query B:

```sql
SELECT COUNT(*) FROM events WHERE event = 'login'
```

Expected interpretation:

- Query A counts unique users with login events.
- Query B counts login event rows.
- This is high risk because repeated events by the same user can make row counts larger than user counts.

## Architecture

- `semantic-delta-extension` owns the VS Code command and Markdown rendering.
- `semantic-delta-detector` owns semantic analysis and risk interpretation.
- The extension does not duplicate detector logic.

## Status

Early prototype. The extension is useful for local demos and iteration, but it is not presented as production-ready or marketplace-published.
