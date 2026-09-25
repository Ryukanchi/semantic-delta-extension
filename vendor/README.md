# Pinned engine artifact

The extension installs `semantic-delta-detector-1.0.4.tgz` from this directory.
This is the verified package containing the analysis-honesty patch: constructs
the lightweight analyzer does not model (set operations, window
specifications, `HAVING`, `DISTINCT ON`, row limits and `ORDER BY`) are
reported as parser limitations with a confidence cap. It also contains the
1.0.3 table-aware LEFT-to-INNER join explanation.

| Provenance | Value |
| --- | --- |
| Package | `semantic-delta-detector@1.0.4` |
| Source repository | https://github.com/Ryukanchi/semantic-delta-detector |
| Source commit | `41b7b887a986fd0eb01c654c170a4d09c2f9929a` (archive built from the same source tree before that commit) |
| SHA-256 | `91564f45bb7f0c48af8cab99b827fdf622ce338d6f3ff28472d86ba5a622223d` |
| Archive size | 404,812 bytes |
| Contents | 71 files, including compiled ESM, declarations, Worker modules and MIT license |
| Extension baseline before integration | `b8c1f20f0d80e3a1d5652629a8fcff745b49a951` |

Before copying the archive here, the engine build passed its full test suite,
and each packaged JavaScript module was compared with a transpilation of the
engine source it was built from. The archive is versioned alongside the
extension.

## Why an archive

The public npm registry lookup returned HTTP 404 on 2026-09-21. The previous
`file:../semantic-delta-detector` link depended on a mutable sibling checkout;
its lockfile metadata still described version 0.1.0.

The local archive fixes the engine bytes without publishing a package or
requiring another repository beside this one. `package-lock.json` records its
integrity and the resolved transitive dependencies, including
`node-sql-parser@5.4.0`. Installing those dependencies still requires registry
access or a populated npm cache. This is not an offline dependency bundle.

`npm run verify:engine` checks the archive checksum. It also runs before normal
installation and compilation. Use `npm ci` to reproduce the locked dependency
tree. The runtime imports the installed public package, never this archive or
an engine-internal module directly.

The extension still uses the public root `compareSqlQueries` function and its
lightweight analysis. Shipping the complete engine package does not enable
PostgreSQL analysis, so set operations and window specifications appear as
parser limitations rather than modeled findings. Keep its compiled package
structure intact if PostgreSQL is explicitly added later.

For an engine upgrade, verify a new source revision and package separately,
replace the artifact intentionally, and update the manifest, lockfile,
checksum check, provenance and integration tests together. A version string
alone is insufficient. The original build has no automatic prepare/prepack
step; do not package an unbuilt checkout.

VSIX packaging remains a separate validation step. The source archive and this
provenance file are excluded from VSIX; the installed runtime dependency must
be included instead.
