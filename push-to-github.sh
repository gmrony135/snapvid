#!/usr/bin/env bash
# SnapVid → GitHub
# Usage:
#   ./push-to-github.sh <github-username> <repo-name> [private|public]
# Needs a GitHub token with "repo" scope. Provide it one of two ways:
#   export GITHUB_TOKEN=ghp_xxx      (recommended — nothing is written to disk)
#   or just run it and paste the token when prompted.
set -euo pipefail

USER_NAME="${1:-}"
REPO="${2:-snapvid}"
VISIBILITY="${3:-public}"

[ -z "$USER_NAME" ] && { echo "usage: ./push-to-github.sh <github-username> [repo-name] [public|private]"; exit 1; }

if [ -z "${GITHUB_TOKEN:-}" ]; then
  read -r -s -p "GitHub token (repo scope, input hidden): " GITHUB_TOKEN; echo
fi

echo "→ creating ${USER_NAME}/${REPO} (${VISIBILITY}) if it doesn't exist…"
echo "  (রিপোটি টোকেনের মালিকের অ্যাকাউন্টে তৈরি হবে — তাই টোকেন অবশ্যই ${USER_NAME}-এর হতে হবে)"
curl -sS -o /tmp/gh_create.json -w "%{http_code}\n" \
  -X POST https://api.github.com/user/repos \
  -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  -d "{\"name\":\"${REPO}\",\"description\":\"SnapVid — save your favorite videos, simply.\",\"private\":$([ "$VISIBILITY" = private ] && echo true || echo false),\"has_issues\":true,\"has_wiki\":false}" \
  | grep -qE "201|422" || {
    echo
    if grep -q '"status": "401"' /tmp/gh_create.json; then
      echo "✗ টোকেন গ্রহণ করা হয়নি (401). টোকেন ঠিক আছে কিনা, আর মেয়াদ শেষ হয়ে গেছে কিনা দেখুন।"
      echo "  দরকার: classic token + 'repo' scope, আর টোকেনটি অবশ্যই ${USER_NAME} অ্যাকাউন্টের হতে হবে।"
    else
      echo "✗ রিপো তৈরি করা যায়নি। GitHub যা বলেছে:"
    fi
    cat /tmp/gh_create.json; exit 1;
  }

echo "→ pushing…"
git remote remove origin 2>/dev/null || true
git remote add origin "https://${USER_NAME}:${GITHUB_TOKEN}@github.com/${USER_NAME}/${REPO}.git"
git branch -M main
git push -u origin main

echo "→ storing a credential-free remote so the token isn't left in .git/config…"
git remote set-url origin "https://github.com/${USER_NAME}/${REPO}.git"

echo "✅ done → https://github.com/${USER_NAME}/${REPO}"
