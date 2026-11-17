#!/usr/bin/env bash
# TEMPORARY: publishes a test build of SEMOSS Chat from the current branch to a
# GitHub release until there is a CI job for it. Builds installers for this
# machine's OS only (macOS: arm64 + x64).
#
# Usage, in packages/playground-desktop:
#   pnpm release [--draft] [--skip-build]
#
#   --draft       create the release as a draft (only maintainers see it)
#   --skip-build  reuse what is already in release/ (just re-upload)
#
# The tag is desktop-v<version from package.json>. Bump "version" for each new
# build; re-running for the same version replaces the release's files for this OS.

set -euo pipefail

DRAFT=false
SKIP_BUILD=false
for arg in "$@"; do
	case "$arg" in
		--draft) DRAFT=true ;;
		--skip-build) SKIP_BUILD=true ;;
		-h | --help) sed -n '2,13p' "$0"; exit 0 ;;
		*) echo "Unknown option: $arg" >&2; exit 1 ;;
	esac
done

PKG_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ROOT_DIR="$(cd "$PKG_DIR/../.." && pwd)"
RELEASE_DIR="$PKG_DIR/release"

fail() { echo "error: $*" >&2; exit 1; }
step() { printf '\n==> %s\n' "$*"; }

# ---------- checks ----------
command -v gh >/dev/null || fail "the GitHub CLI (gh) is not installed: brew install gh"
gh auth status >/dev/null 2>&1 || fail "gh is not signed in: gh auth login"
command -v pnpm >/dev/null || fail "pnpm is not installed"
pnpm --version >/dev/null 2>&1 || fail "pnpm does not run; reinstall pnpm 12.18.0"

cd "$ROOT_DIR"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
SHA="$(git rev-parse HEAD)"
VERSION="$(node -p "require('$PKG_DIR/package.json').version")"
TAG="desktop-v$VERSION"
REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"

if [ -n "$(git status --porcelain)" ]; then
	echo "warning: you have uncommitted changes; they will be in the build but not in the tagged commit."
fi

# The release tag points at this commit, so GitHub needs to have it.
REMOTE_SHA="$(git ls-remote origin "refs/heads/$BRANCH" | cut -f1)"
if [ "$REMOTE_SHA" != "$SHA" ]; then
	echo "origin/$BRANCH is not at your current commit ($(git rev-parse --short HEAD))."
	read -r -p "Push $BRANCH to origin now? [y/N] " answer
	[ "$answer" = "y" ] || [ "$answer" = "Y" ] || fail "push the branch, then run this again"
	git push -u origin "$BRANCH"
fi

case "$(uname -s)" in
	Darwin) BUILDER_ARGS=(--mac --arm64 --x64) ;;
	Linux) BUILDER_ARGS=(--linux --x64) ;;
	MINGW* | MSYS* | CYGWIN*) BUILDER_ARGS=(--win --x64) ;;
	*) fail "unsupported OS: $(uname -s)" ;;
esac

echo
echo "Branch:   $BRANCH ($SHA)"
echo "Version:  $VERSION"
echo "Release:  $TAG on $REPO (pre-release$([ "$DRAFT" = true ] && echo ', draft'))"

# ---------- build ----------
if [ "$SKIP_BUILD" = false ]; then
	step "Installing dependencies"
	pnpm install --frozen-lockfile

	step "Building the app and the libraries it needs"
	pnpm exec turbo run build --filter=@semoss/playground-desktop...

	step "Packaging installers (${BUILDER_ARGS[*]})"
	rm -rf "$RELEASE_DIR"
	# Unsigned unless CSC_LINK / APPLE_ID etc. are set; then don't pick a
	# random identity from the keychain.
	if [ -z "${CSC_LINK:-}" ]; then
		export CSC_IDENTITY_AUTO_DISCOVERY=false
	fi
	(cd "$PKG_DIR" && pnpm exec electron-builder "${BUILDER_ARGS[@]}" --publish never)
fi

shopt -s nullglob
FILES=("$RELEASE_DIR"/*.dmg "$RELEASE_DIR"/*.zip "$RELEASE_DIR"/*.exe "$RELEASE_DIR"/*.AppImage)
shopt -u nullglob
[ "${#FILES[@]}" -gt 0 ] || fail "no installers found in $RELEASE_DIR"

step "Installers"
for f in "${FILES[@]}"; do
	printf '  %s (%s)\n' "$(basename "$f")" "$(du -h "$f" | cut -f1 | tr -d ' ')"
done

# ---------- publish ----------
if gh release view "$TAG" --repo "$REPO" >/dev/null 2>&1; then
	step "Release $TAG exists; uploading and replacing files"
	gh release upload "$TAG" "${FILES[@]}" --repo "$REPO" --clobber
else
	step "Creating release $TAG"
	FLAGS=(--prerelease)
	[ "$DRAFT" = true ] && FLAGS+=(--draft)
	NOTES="Test build of SEMOSS Chat from \`$BRANCH\` at $SHA.

Download the \`.dmg\` for your Mac: \`mac-arm64\` for Apple silicon (M1 and later), \`mac-x64\` for Intel.

**These builds are unsigned.**
- **macOS:** right-click the app and choose **Open**, or run \`xattr -dr com.apple.quarantine \"/Applications/SEMOSS Chat.app\"\`.
- **Windows:** at the SmartScreen warning, choose **More info → Run anyway**.
- **Linux:** \`chmod +x\` the AppImage, then run it."
	gh release create "$TAG" "${FILES[@]}" \
		--repo "$REPO" \
		--target "$SHA" \
		--title "SEMOSS Chat Desktop $VERSION" \
		--notes "$NOTES" \
		"${FLAGS[@]}"
fi

echo
echo "Done: https://github.com/$REPO/releases/tag/$TAG"
