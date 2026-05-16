#!/bin/bash
set -e

# Release script for ai-harness-cli
# Usage: ./scripts/release.sh [patch|minor|major]

VERSION_TYPE=${1:-patch}

if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo "Error: Version type must be patch, minor, or major"
    echo "Usage: $0 [patch|minor|major]"
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting release process...${NC}"

# Step 1: Pre-flight checks
echo -e "${YELLOW}Step 1: Pre-flight checks${NC}"

# Check if git is clean
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${RED}Error: Working directory is not clean. Please commit or stash changes.${NC}"
    git status
    exit 1
fi

echo "✓ Git working directory is clean"

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version: $CURRENT_VERSION"

# Calculate new version using semver logic
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]}

case $VERSION_TYPE in
    major)
        NEW_MAJOR=$((MAJOR + 1))
        NEW_VERSION="${NEW_MAJOR}.0.0"
        ;;
    minor)
        NEW_MINOR=$((MINOR + 1))
        NEW_VERSION="${MAJOR}.${NEW_MINOR}.0"
        ;;
    patch)
        NEW_PATCH=$((PATCH + 1))
        NEW_VERSION="${MAJOR}.${MINOR}.${NEW_PATCH}"
        ;;
esac

echo "New version: $NEW_VERSION"
echo ""

# Step 2: Install dependencies and verify
echo -e "${YELLOW}Step 2: Installing dependencies${NC}"
npm ci
echo "✓ Dependencies installed"
echo ""

# Step 3: Run checks
echo -e "${YELLOW}Step 3: Running checks${NC}"
echo "Building..."
npm run build
echo "✓ Build successful"

echo "Running tests..."
npm test
echo "✓ Tests pass"

echo "Running typecheck..."
npm run typecheck
echo "✓ Typecheck passes"

echo "Running lint..."
npm run lint
echo "✓ Lint passes"
echo ""

# Step 4: Bump version
echo -e "${YELLOW}Step 4: Bumping version${NC}"
npm version $NEW_VERSION --no-git-tag-version
echo "✓ Version bumped to $NEW_VERSION"
echo ""

# Step 5: Commit and tag
echo -e "${YELLOW}Step 5: Creating commit and tag${NC}"
git add package.json package-lock.json
git commit -m "chore(release): v${NEW_VERSION}"
git tag -a "v${NEW_VERSION}" -m "Release v${NEW_VERSION}"
echo "✓ Created commit and tag v${NEW_VERSION}"
echo ""

# Step 6: Push
echo -e "${YELLOW}Step 6: Pushing to remote${NC}"
git push
git push origin "v${NEW_VERSION}"
echo "✓ Pushed commit and tag"
echo ""

echo -e "${GREEN}✓ Release v${NEW_VERSION} complete!${NC}"
echo ""
echo "The GitHub Actions workflow will now:"
echo "  1. Run tests"
echo "  2. Build the package"
echo "  3. Publish to NPM"
echo "  4. Create a GitHub release"
echo ""
echo "Monitor progress at: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]//;s/.git$//')/actions"
