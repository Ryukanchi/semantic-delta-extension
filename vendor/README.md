# Pinned engine artifact

The extension installs `semantic-delta-detector-1.0.2.tgz` from this directory.
This is the unchanged package validated in the engine's 2026-09-21 handoff.

| Provenance | Value |
| --- | --- |
| Package | `semantic-delta-detector@1.0.2` |
| Source repository | https://github.com/Ryukanchi/semantic-delta-detector |
| Source commit | `4be996823978be175253cdb760aba44448650d6b` |
| Source tag | `v1.0.2` |
| SHA-256 | `887d2b312d1517a20ca49775a19f6c18a2ac157f2e9d5b17e72ddce32fefd464` |
| Archive size | 402,442 bytes |
| Contents | 71 files, including compiled ESM, declarations, Worker modules and MIT license |
| Extension baseline before integration | `b8c1f20f0d80e3a1d5652629a8fcff745b49a951` |

Before copying the archive here, its checksum and all 71 files were compared
with the verified engine checkout and build. No engine source, metadata, build
output, or archive content was changed. The archive is intended to be versioned
alongside the extension.

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
PostgreSQL analysis. Keep its compiled package structure intact if PostgreSQL
is explicitly added later.

For an engine upgrade, verify a new source revision and package separately,
replace the artifact intentionally, and update the manifest, lockfile,
checksum check, provenance and integration tests together. A version string
alone is insufficient. The original build has no automatic prepare/prepack
step; do not package an unbuilt checkout.

VSIX packaging remains a separate validation step. The source archive and this
provenance file are excluded from VSIX; the installed runtime dependency must
be included instead.
