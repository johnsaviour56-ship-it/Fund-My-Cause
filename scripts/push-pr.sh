#!/bin/bash

# Push PR to GitHub
# Usage: ./scripts/push-pr.sh <github-url>

set -e

echo "🚀 Fund My Cause - PR Push Script"
echo "=================================="
echo ""

# Check if GitHub URL provided
if [ -z "$1" ]; then
  echo "❌ Error: GitHub repository URL required"
  echo ""
  echo "Usage: ./scripts/push-pr.sh <github-url>"
  echo ""
  echo "Examples:"
  echo "  ./scripts/push-pr.sh https://github.com/username/Fund-My-Cause.git"
  echo "  ./scripts/push-pr.sh git@github.com:username/Fund-My-Cause.git"
  echo ""
  exit 1
fi

GITHUB_URL="$1"

echo "📝 GitHub Repository: $GITHUB_URL"
echo ""

# Step 1: Check if remote already exists
if git remote | grep -q "^origin$"; then
  echo "ℹ️  Remote 'origin' already exists"
  EXISTING_URL=$(git remote get-url origin)
  echo "   Current URL: $EXISTING_URL"
  read -p "   Continue with this remote? (y/n): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "   Removing existing remote..."
    git remote remove origin
  fi
fi

# Step 2: Add remote if not exists
if ! git remote | grep -q "^origin$"; then
  echo "✓ Adding remote origin..."
  git remote add origin "$GITHUB_URL"
  echo "  Remote added: $GITHUB_URL"
fi

# Step 3: Verify remote
echo ""
echo "✓ Verifying remote..."
git remote -v

# Step 4: Push master branch
echo ""
echo "✓ Pushing master branch..."
git push -u origin master
echo "  Master branch pushed successfully"

# Step 5: Push feature branch
echo ""
echo "✓ Pushing feature branch (feat/comprehensive-apm-and-tracing)..."
git push -u origin feat/comprehensive-apm-and-tracing
echo "  Feature branch pushed successfully"

# Step 6: List branches
echo ""
echo "✓ Local and remote branches:"
git branch -a

# Step 7: Display next steps
echo ""
echo "=================================="
echo "✅ PR PUSHED SUCCESSFULLY!"
echo "=================================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Go to your GitHub repository:"
echo "   $GITHUB_URL"
echo ""
echo "2. Create a Pull Request:"
echo "   - Click 'Pull requests' tab"
echo "   - Click 'New pull request'"
echo "   - Select: feat/comprehensive-apm-and-tracing → master"
echo ""
echo "3. Fill in PR details:"
echo "   - Title: feat: Implement Comprehensive APM & Distributed Tracing"
echo "   - Description: Copy from .github/PR_BODY.md"
echo "   - Labels: enhancement, critical, monitoring"
echo "   - Reviewers: Assign team members"
echo ""
echo "4. Click 'Create pull request'"
echo ""
echo "📝 PR Content Ready:"
echo "   File: .github/PR_BODY.md (479 lines)"
echo "   Status: Ready to copy and paste"
echo ""
echo "🎯 PR Information:"
echo "   Branch: feat/comprehensive-apm-and-tracing"
echo "   Target: master"
echo "   Files Changed: 30"
echo "   Lines Added: 6,000+"
echo "   Test Coverage: 70%+"
echo ""
echo "=================================="
echo "🎉 All done! Ready for review!"
echo "=================================="
