#!/usr/bin/env bash
#
# SnapVid — push this repo to GitHub.
#
#   ./sync.sh                 push the current branch to origin/main
#   ./sync.sh --install-hook  (re)install the post-commit hook that calls this
#                             script automatically after every commit
#   ./sync.sh --status        show whether everything is pushed
#
# The token is read from (in this order):
#   1. $GITHUB_TOKEN
#   2. .snapvid-token      (untracked, gitignored — chmod 600)
#
# Nothing about the token is ever written into .git/config, and the token is
# never printed. Every run appends to .git/autopush.log.

set -u

REPO_SLUG="${SNAPVID_REPO:-gmrony135/snapvid}"
BRANCH="${SNAPVID_BRANCH:-main}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT" || exit 1

TOKEN_FILE="$ROOT/.snapvid-token"
LOG="$ROOT/.git/autopush.log"
HOOK="$ROOT/.git/hooks/post-commit"
HOOK_SRC="$ROOT/tools/git-hooks/post-commit"

log() {
  mkdir -p "$(dirname "$LOG")"
  printf '%s  %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1" >> "$LOG"
}

say() { printf '%s\n' "$1"; log "$1"; }

# ---------------------------------------------------------------- --install --
if [ "${1:-}" = "--install-hook" ]; then
  mkdir -p "$ROOT/.git/hooks"
  if [ -f "$HOOK_SRC" ]; then
    cp "$HOOK_SRC" "$HOOK"
  else
    printf '#!/usr/bin/env bash\n# installed by sync.sh\n"$(git rev-parse --show-toplevel)/sync.sh" >/dev/null 2>&1 || true\n' > "$HOOK"
  fi
  chmod +x "$HOOK"
  say "installed post-commit hook → $HOOK"
  exit 0
fi

# ------------------------------------------------------------------ --status --
remote_head() {
  local TOKEN="${1:-}"
  if [ -n "$TOKEN" ]; then
    git -c credential.helper= ls-remote "https://x-access-token:${TOKEN}@github.com/${REPO_SLUG}.git" "refs/heads/${BRANCH}" 2>/dev/null | awk '{print substr($1,1,7)}'
  else
    curl -fsS "https://api.github.com/repos/${REPO_SLUG}/commits/${BRANCH}" 2>/dev/null \
      | python3 -c "import json,sys; print(json.load(sys.stdin)['sha'][:7])" 2>/dev/null
  fi
}

# --------------------------------------------------------------------- token --
TOKEN="${GITHUB_TOKEN:-}"
if [ -z "$TOKEN" ] && [ -f "$TOKEN_FILE" ]; then
  TOKEN="$(tr -d ' \t\r\n' < "$TOKEN_FILE")"
fi

if [ "${1:-}" = "--status" ]; then
  local_head="$(git rev-parse --short HEAD 2>/dev/null || echo '(no commit)')"
  up_head="$(remote_head "$TOKEN")"
  echo "local : $local_head"
  echo "github: ${up_head:-'(could not read)'}"
  [ "$local_head" = "$up_head" ] && echo "→ in sync" || echo "→ out of sync (run ./sync.sh)"
  # which files are uncommitted, if any
  if [ -n "$(git status --porcelain)" ]; then
    echo "→ uncommitted changes:"
    git status --short | sed 's/^/    /'
  else
    echo "→ working tree clean"
  fi
  exit 0
fi

if [ -z "$TOKEN" ]; then
  say "push skipped: no token. Put one in .snapvid-token (see README) or export GITHUB_TOKEN."
  exit 1
fi

# ------------------------------------------------- identity + remote (they can
# get lost when the workspace is restored, so make sure they exist) -----------
if ! git config user.email >/dev/null 2>&1; then
  git config user.name "SnapVid"
  git config user.email "snapvid@users.noreply.github.com"
fi
git config commit.gpgsign false

if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "https://github.com/${REPO_SLUG}.git"
fi
# the stored remote must never contain a token
if git remote get-url origin 2>/dev/null | grep -q '@github.com'; then
  git remote set-url origin "https://github.com/${REPO_SLUG}.git"
fi

# ---------------------------------------------------------------------- push --
if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
  say "push skipped: nothing committed yet."
  exit 0
fi

OUT="$(git -c credential.helper= push --quiet "https://x-access-token:${TOKEN}@github.com/${REPO_SLUG}.git" "HEAD:${BRANCH}" 2>&1)"
RC=$?
OUT="$(printf '%s' "$OUT" | sed -E 's#https://[^@]*@#https://***@#g')"

if [ $RC -eq 0 ]; then
  LOCAL="$(git rev-parse --short HEAD)"
  if printf '%s' "$OUT" | grep -qi "up-to-date"; then
    say "already pushed (${LOCAL})."
  else
    say "pushed ${LOCAL} → ${REPO_SLUG}@${BRANCH}"
    printf '%s\n' "  ${REPO_SLUG}/commit/$(git rev-parse HEAD)" | tee -a "$LOG"
  fi
  exit 0
fi

say "push FAILED: ${OUT:-unknown error}"
say "  the commit is safe locally — fix the token/network, then run ./sync.sh"
exit 1
