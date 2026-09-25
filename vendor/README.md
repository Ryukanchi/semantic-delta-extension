# Pinned engine artifact

The extension installs `semantic-delta-detector-1.1.0.tgz` from this directory.
Version 1.1.0 requires evidence of a single supported SELECT query before
returning a semantic assessment. Unsupported input produces a typed error; a
vendor-parser rejection alone still produces a lightweight result with an
analysis limitation and conservative confidence. The 1.0.4 analysis-honesty
rules and earlier correctness fixes remain included.

| Provenance | Value |
| --- | --- |
| Package | `semantic-delta-detector@1.1.0` |
| Source repository | https://github.com/Ryukanchi/semantic-delta-detector |
| Source commit | `23efdaa4a5656b8193d40a22cffc9443b8ca47e7` |
| SHA-256 | `e4e2ac364f0267a089867bde365fd26e2795fad3e6996c9e06d6cb075cd2b5bb` |
| Archive size | 407,980 bytes |
| Contents | 73 files, including compiled ESM, declarations, Worker modules and MIT license |

The archive was built with `npm run build` followed by `npm pack` from the
source commit above. The Detector build, 412 tests, and diff check passed
before packaging. The package file list was inspected; pre-existing untracked
development files were not included.

## Why an archive

The previous sibling-checkout dependency was mutable. The committed archive
pins engine bytes without publishing a package or requiring a neighboring
repository. `package-lock.json` records its integrity and transitive
dependencies, including `node-sql-parser@5.4.0`. Installing those dependencies
still requires registry access or a populated npm cache; this is not an
offline dependency bundle.

`npm run verify:engine` checks the archive checksum before installation and
compilation. Use `npm ci` to reproduce the locked dependency tree. The runtime
imports the installed public package, never an engine-internal module or the
archive directly.

The extension still uses the public root `compareSqlQueries` function and its
lightweight analysis. Shipping the full engine package does not enable
PostgreSQL analysis in the extension.

For an engine upgrade, build and test a source revision, replace the archive,
and update the manifest, lockfile, checksum, provenance, and integration tests
together. The Detector has no automatic prepare/prepack step; do not package
an unbuilt checkout.

VSIX packaging is a separate validation step. The source archive and this
provenance file are excluded from VSIX; the installed runtime dependency must
be included instead.
