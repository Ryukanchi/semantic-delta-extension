# Phase 1 integration verification

Date: 2026-09-21. Scope: reproducible engine installation and the existing
input/example commands with Markdown output.

## Baseline and scope

- Branch: `feat/before-after-mvp`.
- Extension starting commit: `b8c1f20f0d80e3a1d5652629a8fcff745b49a951`.
- Engine source commit: `4be996823978be175253cdb760aba44448650d6b`, version 1.0.2.
- Engine repository unchanged; its pre-existing untracked `CODEBASE-HANDOFF.md`
  was left in place.
- No WebView, file/Before-After command, Git integration, PostgreSQL mode, or
  new semantic analysis logic was added.

## Dependency decision

The extension now installs the unchanged verified engine tarball from `vendor`.
Its SHA-256 and all 71 archived files were verified before adoption. The
lockfile records version 1.0.2 and archive integrity instead of a sibling link
with stale 0.1.0 metadata. Existing development dependency versions were not
upgraded. See [full provenance](../vendor/README.md).

## Checks

| Check | Result |
| --- | --- |
| TypeScript build | Passed with the installed public ESM package and its public result type |
| ESLint | Passed |
| `npm test` | 16 tests passed, including real engine findings, no findings, derived-table limitations, optional-field handling, invalid input and operational failures |
| `npm run test:extension` | 2 tests passed in VS Code 1.110.0 on macOS arm64 |
| Minimum-version runtime | VS Code 1.110.0, Electron 39.6.0, Node 22.22.0 |
| Development runtime | Node 24.18.0, TypeScript 5.9.3 |
| Fresh production consumer | `npm ci --omit=dev` installed 4 packages and delivered a real high-risk/low-confidence limited report through the compiled controller |
| Consumer package resolution | Resolved inside the consumer's own `node_modules`; engine was a directory, not a symlink to the source repository |
| Clean development reinstall | `npm ci --offline` from the populated repository-local cache succeeded; build, lint, 16 Node tests and 2 host tests passed again afterward |
| Whitespace checks | `git diff --check` and a separate check of new text files passed |

The production consumer was created under ignored `.cache` inside this
repository. It received the manifest, lockfile, archive, checksum script and
compiled output. It used no sibling engine checkout. Registry packages remain
necessary for transitive dependencies; the engine archive is not a complete
offline dependency bundle.

The host tests exercise activation/command registration and delivery into a
real Markdown editor. They do not automate InputBox/QuickPick interaction.
Operational failure tests inject loader/engine/display failures; they do not
modify or replace the shipped engine. A derived-table fixture exercises a
real limitation result without fabricating a Penpot outcome.

## Remaining limits

- No VSIX packaging/installation validation or Marketplace publication.
- No Windows/Linux host run; no complete interactive command walkthrough.
- Analysis remains synchronous on the Extension Host. No full-analysis
  timeout, cancellation, or background execution was added.
- The engine has no structured exception taxonomy. Empty/whitespace input is
  locally validated; other thrown errors are shown as failed operations with
  no semantic result. Exception message text is not parsed for classification.
- Existing engine wording, including the documented domain-specific join
  explanation, remains unchanged.
- The 379-test engine suite was not rerun; engine sources were not changed.
- Installation reported a deprecation warning for the existing test-tooling
  dependency `glob@10.5.0`. No dependency upgrade or audit fix was performed.
- npm did not enable the optional `fsevents` install script. The tested build
  and host paths passed; watch mode was not part of this verification.

This phase prepares the result and error boundaries for a later true
Before/After command and minimal WebView. It does not claim that those features
already exist.
