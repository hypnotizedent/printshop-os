#!/bin/bash
# PrintShop OS: Push Local Changes to GitHub

# This guide walks you through syncing your local PrintShop OS 
# repository with the GitHub web repository.

echo "🚀 PUSHING PRINTSHOP OS TO GITHUB"
echo "=================================="
echo ""

# STEP 1: Check Current Status
echo "STEP 1: Check Current Status"
echo "---"
echo "This shows what commits are ready to push:"
echo ""
echo "$ git status"
echo ""
echo "Expected output should show:"
echo "  • Branch: 'main' (or your branch name)"
echo "  • 'Your branch is ahead of origin/main by X commits'"
echo "  • No uncommitted changes (all staged and committed)"
echo ""
echo "Run this command now:"
read -p "Press Enter to continue..."

# STEP 2: View Commits Before Pushing
echo ""
echo "STEP 2: View Commits You're About to Push"
echo "---"
echo "This shows the commits that will be pushed:"
echo ""
echo "$ git log origin/main..HEAD --oneline"
echo ""
echo "This shows commits on your local branch that aren't on GitHub yet."
echo "You should see your recent commits listed."
echo ""
echo "Run this command now:"
read -p "Press Enter to continue..."

# STEP 3: The Actual Push
echo ""
echo "STEP 3: Push to GitHub"
echo "---"
echo "This uploads your commits to GitHub:"
echo ""
echo "$ git push origin main"
echo ""
echo "What this does:"
echo "  • 'git push' = upload commits"
echo "  • 'origin' = GitHub repository (the default remote)"
echo "  • 'main' = the branch name"
echo ""
echo "Expected output:"
echo "  ✓ Counting objects: X"
echo "  ✓ Compressing objects: 100%"
echo "  ✓ Writing objects: 100%"
echo "  ✓ Your branch is up to date with 'origin/main'"
echo ""
echo "ARE YOU READY TO PUSH? This will upload your changes to GitHub."
read -p "Type 'yes' to confirm push, or 'no' to abort: " confirm
if [ "$confirm" = "yes" ]; then
    echo "Pushing now..."
    git push origin main
else
    echo "Push cancelled."
    exit 0
fi

# STEP 4: Verify Push
echo ""
echo "STEP 4: Verify Push Succeeded"
echo "---"
echo "Check that GitHub has the updates:"
echo ""
echo "$ git log origin/main..HEAD"
echo ""
echo "After a successful push, this should show NO commits."
echo "(If it shows commits, the push failed)"
echo ""
read -p "Press Enter to continue..."

# STEP 5: View on GitHub Web
echo ""
echo "STEP 5: Verify on GitHub.com"
echo "---"
echo "Open GitHub in your browser:"
echo ""
echo "https://github.com/hypnotizedent/printshop-os"
echo ""
echo "You should see:"
echo "  ✓ Recent commits now showing your new commits"
echo "  ✓ Files in .github/ folder with all new documentation"
echo "  ✓ Commit history showing your pushes"
echo ""

# STEP 6: Summary
echo ""
echo "✅ PUSH COMPLETE!"
echo "=================================="
echo ""
echo "Your local changes are now on GitHub. Team members can:"
echo "  • Clone the repository to get your changes"
echo "  • Create pull requests from your branches"
echo "  • Review the new planning documentation"
echo ""
