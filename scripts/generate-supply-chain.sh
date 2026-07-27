#!/usr/bin/env bash

set -euo pipefail

if [[ $# -gt 1 ]]; then
  echo "Usage: $0 [OUTPUT_DIR]" >&2
  exit 2
fi

command -v npm >/dev/null 2>&1 || {
  echo "npm is required" >&2
  exit 1
}
command -v jq >/dev/null 2>&1 || {
  echo "jq is required" >&2
  exit 1
}

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_dir="$(cd "${script_dir}/.." && pwd)"
output_dir="${1:-${project_dir}/supply-chain}"
case "$output_dir" in
  /*) ;;
  *) output_dir="${project_dir}/${output_dir}" ;;
esac
mkdir -p "$output_dir"

sbom="${output_dir}/one-web.cdx.json"
license_report="${output_dir}/one-web-licenses.tsv"
dependency_tree="${output_dir}/one-web-dependencies.json"

(
  cd "$project_dir"
  npm sbom --sbom-format=cyclonedx --sbom-type=application >"$sbom"
  npm ls --all --json >"$dependency_tree"
)

jq -r '
  ["PACKAGE", "VERSION", "LICENSE"],
  (
    .components[] |
    [
      ((.group // "") + "/" + .name | sub("^/"; "")),
      (.version // ""),
      (
        [.licenses[]?.license.id, .licenses[]?.license.name]
        | map(select(. != null and . != ""))
        | unique
        | if length == 0 then "UNKNOWN" else join(",") end
      )
    ]
  )
  | @tsv
' "$sbom" >"$license_report"

(
  cd "$output_dir"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum \
      "$(basename "$sbom")" \
      "$(basename "$license_report")" \
      "$(basename "$dependency_tree")" >one-web-supply-chain.sha256
  else
    shasum -a 256 \
      "$(basename "$sbom")" \
      "$(basename "$license_report")" \
      "$(basename "$dependency_tree")" >one-web-supply-chain.sha256
  fi
)

echo "Generated ${sbom}"
echo "Generated ${license_report}"
echo "Generated ${dependency_tree}"
