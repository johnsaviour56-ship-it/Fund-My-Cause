#!/usr/bin/env python3
"""
Create Pull Request on GitHub using GitHub API
"""

import json
import subprocess
import sys
from pathlib import Path

def read_pr_body():
    """Read PR body from file"""
    pr_file = Path(".github/PR_BODY.md")
    if not pr_file.exists():
        print("❌ Error: .github/PR_BODY.md not found")
        return None
    return pr_file.read_text()

def create_pr():
    """Create PR using GitHub API via git"""
    print("🚀 Creating Pull Request on GitHub...")
    print("")
    
    # Read PR body
    pr_body = read_pr_body()
    if not pr_body:
        return False
    
    # Extract title from PR body
    title = "feat: Implement Comprehensive Application Performance Monitoring & Distributed Tracing"
    
    # Escape special characters for JSON
    body_escaped = pr_body.replace('"', '\\"').replace('\n', '\\n')
    
    # Create PR using GitHub API
    pr_data = {
        "title": title,
        "body": pr_body,
        "head": "feat/comprehensive-apm-and-tracing",
        "base": "master"
    }
    
    print(f"📋 PR Title: {title}")
    print(f"📝 PR Body: {len(pr_body)} characters")
    print(f"🌿 Head Branch: feat/comprehensive-apm-and-tracing")
    print(f"🎯 Base Branch: master")
    print("")
    
    # Use curl to create PR (requires GitHub token in GITHUB_TOKEN env var)
    try:
        import os
        token = os.environ.get('GITHUB_TOKEN')
        if not token:
            print("⚠️  No GITHUB_TOKEN environment variable found")
            print("📋 To create PR, you need to:")
            print("   1. Set GITHUB_TOKEN environment variable with GitHub Personal Access Token")
            print("   2. Run this script again")
            print("")
            print("Alternative: Create PR manually at:")
            print("   https://github.com/johnsaviour56-ship-it/Fund-My-Cause/pull/new/feat/comprehensive-apm-and-tracing")
            return False
        
        # Create PR
        cmd = [
            "curl",
            "-X", "POST",
            "-H", f"Authorization: token {token}",
            "-H", "Accept: application/vnd.github.v3+json",
            "https://api.github.com/repos/johnsaviour56-ship-it/Fund-My-Cause/pulls",
            "-d", json.dumps(pr_data)
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            response = json.loads(result.stdout)
            if "html_url" in response:
                print("✅ PR Created Successfully!")
                print(f"📍 PR URL: {response['html_url']}")
                print(f"🔢 PR Number: #{response['number']}")
                return True
            else:
                print("❌ Error creating PR:")
                print(result.stdout)
                return False
        else:
            print("❌ Error creating PR:")
            print(result.stderr)
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = create_pr()
    sys.exit(0 if success else 1)
