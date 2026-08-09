#!/usr/bin/env bash

set -Eeuo pipefail

usage() {
  echo "Usage: $0 OUTPUT_DIR SOURCE_SHA" >&2
}

if [[ $# -ne 2 ]]; then
  usage
  exit 2
fi

output_dir="$1"
source_sha="$2"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_dir="$(cd "${script_dir}/.." && pwd)"

if [[ ! "${source_sha}" =~ ^[0-9a-f]{40}$ ]]; then
  echo "SOURCE_SHA must be a full lowercase Git commit SHA" >&2
  exit 2
fi
if [[ -z "${output_dir}" || "${output_dir}" == "/" || -e "${output_dir}" ]]; then
  echo "OUTPUT_DIR must be a new, non-root path" >&2
  exit 2
fi

dist_dir="${project_dir}/dist"
web_archive="${project_dir}/version/app-1.0.0.zip"
test -s "${dist_dir}/index.html"
test -s "${web_archive}"
unzip -t "${web_archive}" >/dev/null

archive_check_dir="$(mktemp -d "${TMPDIR:-/tmp}/one-web-archive-check.XXXXXX")"
trap 'rm -rf -- "${archive_check_dir}"' EXIT
unzip -q "${web_archive}" -d "${archive_check_dir}"
archive_version="${archive_check_dir}/version.json"
test -s "${archive_version}" || {
  echo "version/app-1.0.0.zip does not contain version.json" >&2
  exit 1
}
node - "${archive_version}" <<'NODE'
const fs = require('node:fs')
const metadata = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
if (metadata.version !== '1.0.0' || metadata.url !== 'app-1.0.0.zip') {
  throw new Error('unexpected Web archive version metadata')
}
NODE
rm -f -- "${archive_version}"
if ! diff -qr "${dist_dir}" "${archive_check_dir}" >/dev/null; then
  echo "version/app-1.0.0.zip does not match the current dist build" >&2
  exit 1
fi

mkdir -p "${output_dir}"
cp -R "${dist_dir}" "${output_dir}/dist"
install -m 0644 "${web_archive}" "${output_dir}/app.zip"
printf '%s\n' "${source_sha}" >"${output_dir}/SOURCE_SHA"
printf '%s\n' '1.0.0' >"${output_dir}/WEB_VERSION"
: >"${output_dir}/.nojekyll"

(
  cd "${output_dir}"
  sha256sum app.zip >app.zip.sha256
  find dist -type f -print0 | LC_ALL=C sort -z | xargs -0 sha256sum >dist.sha256
)

SOURCE_SHA="${source_sha}" \
SOURCE_REPOSITORY="${GITHUB_REPOSITORY:-local/Oneinstack-Panel-Web}" \
SOURCE_RUN_ID="${GITHUB_RUN_ID:-local}" \
SOURCE_RUN_NUMBER="${GITHUB_RUN_NUMBER:-0}" \
BUILT_AT="$(date -u '+%Y-%m-%dT%H:%M:%SZ')" \
node - "${output_dir}/build-info.json" <<'NODE'
const fs = require('node:fs')
const output = process.argv[2]
const document = {
  schemaVersion: 1,
  repository: process.env.SOURCE_REPOSITORY,
  sourceSha: process.env.SOURCE_SHA,
  webVersion: '1.0.0',
  builtAt: process.env.BUILT_AT,
  runId: process.env.SOURCE_RUN_ID,
  runNumber: Number(process.env.SOURCE_RUN_NUMBER)
}
fs.writeFileSync(output, `${JSON.stringify(document, null, 2)}\n`, { mode: 0o644 })
NODE

cat >"${output_dir}/README.md" <<'EOF'
# OneinStack Panel Web build artifacts

This branch is generated from `main` by GitHub Actions. Do not edit it by hand.

- `app.zip`: immutable frontend archive consumed by Oneinstack-Panel releases.
- `app.zip.sha256`: archive integrity checksum.
- `dist/`: expanded production assets for inspection.
- `dist.sha256`: checksums for every expanded asset.
- `SOURCE_SHA` and `build-info.json`: source provenance.
EOF

echo "Prepared web publish tree at ${output_dir}"
