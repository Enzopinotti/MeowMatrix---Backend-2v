#!/usr/bin/env sh
set -eu

repo_root="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
ref="$(tr -d '[:space:]' < "$repo_root/integration/frontend-ref.txt")"
target="$repo_root/.runtime/frontend-src"
remote="https://github.com/Enzopinotti/Meow-Matrix---Frontend.git"

case "$ref" in
  [0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]*) ;;
  *)
    echo "frontend-ref.txt must contain a commit SHA" >&2
    exit 1
    ;;
esac

mkdir -p "$repo_root/.runtime"

if [ ! -d "$target/.git" ]; then
  rm -rf "$target"
  git clone --filter=blob:none --no-checkout "$remote" "$target"
fi

git -C "$target" remote set-url origin "$remote"
git -C "$target" fetch --depth=1 origin "$ref"
git -C "$target" checkout --detach --force FETCH_HEAD

actual="$(git -C "$target" rev-parse HEAD)"
if [ "$actual" != "$ref" ]; then
  echo "Frontend checkout mismatch: expected $ref, got $actual" >&2
  exit 1
fi

if [ ! -f "$target/modern/Dockerfile" ]; then
  echo "Pinned frontend commit does not expose modern/Dockerfile" >&2
  exit 1
fi

printf 'Prepared frontend %s\n' "$actual"
