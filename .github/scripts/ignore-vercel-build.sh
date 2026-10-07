#!/usr/bin/env bash

set -euo pipefail

current_sha="${VERCEL_GIT_COMMIT_SHA:-HEAD}"

is_documentation_or_github_config() {
  case "$1" in
    *.md|features/*.feature|features/*/*.feature|.github/*) return 0 ;;
    *) return 1 ;;
  esac
}

continue_with_build() {
  echo "$1; continue with the Vercel build."
  exit 1
}

skip_build_if_only_docs() {
  local changed_files="$1"
  while IFS= read -r file; do
    [[ -z "$file" ]] && continue
    if ! is_documentation_or_github_config "$file"; then
      echo "Build required because '$file' is outside documentation and GitHub configuration."
      exit 1
    fi
  done <<< "$changed_files"

  echo "Only documentation or GitHub configuration changed; skip the Vercel build."
  exit 0
}

previous_sha="${VERCEL_GIT_PREVIOUS_SHA:-}"
if [[ -n "$previous_sha" ]] && git cat-file -e "${previous_sha}^{commit}" 2>/dev/null; then
  changed_files="$(git diff --name-only "$previous_sha" "$current_sha")" || continue_with_build "Could not compare the previous successful deployment"
  skip_build_if_only_docs "$changed_files"
fi

# A first deployment has no previous successful deployment SHA. Compare with
# the parent commit when available so the initial documentation-only PR is also
# skipped.
if parent_sha="$(git rev-parse --verify "${current_sha}^" 2>/dev/null)"; then
  changed_files="$(git diff --name-only "$parent_sha" "$current_sha")" || continue_with_build "Could not compare the current commit with its parent"
  skip_build_if_only_docs "$changed_files"
fi

# For a root commit, inspect the complete snapshot. If it contains only docs and
# GitHub configuration, there is no application to build yet.
tracked_files="$(git ls-tree -r --name-only "$current_sha")" || continue_with_build "Could not inspect the current repository snapshot"
skip_build_if_only_docs "$tracked_files"
