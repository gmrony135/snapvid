#!/usr/bin/env bash
#
# SnapVid — commit and push in one step.
#
#   ./commit.sh "what changed"      stage everything, commit, push
#   ./commit.sh -m "message" …      anything after the script name is passed to git commit
#
# Why this exists: this workspace does not preserve .git/config, so the git
# identity and the origin remote can vanish between sessions. sync.sh restores
# them, and this wrapper makes sure a commit can always be made with a valid
# author. The post-commit hook then pushes.

set -u
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT" || exit 1

git config user.name "SnapVid"
git config user.email "snapvid@users.noreply.github.com"
git config commit.gpgsign false
[ -z "$(git remote)" ] && git remote add origin "https://github.com/${SNAPVID_REPO:-gmrony135/snapvid}.git"

git add -A

if git diff --cached --quiet; then
  echo "nothing to commit — pushing anything that is waiting"
  ./sync.sh
  exit $?
fi

if [ "${1:-}" = "-m" ]; then
  git commit -q "$@"
else
  git commit -q -m "${1:-Update}"
fi

./sync.sh
