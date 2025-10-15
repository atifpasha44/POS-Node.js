#!/bin/bash

# iTHOTS POS Version Update Script
# Usage: ./update-version.sh 1.3.0 "New Feature Release"

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if version and release name are provided
if [ $# -lt 2 ]; then
    print_error "Usage: $0 <version> <release_name>"
    print_error "Example: $0 1.3.0 \"Enhanced Reporting Features\""
    exit 1
fi

NEW_VERSION=$1
RELEASE_NAME=$2
CURRENT_DATE=$(date +%Y-%m-%d)

print_status "Starting version update process..."
print_status "New Version: $NEW_VERSION"
print_status "Release Name: $RELEASE_NAME"
print_status "Build Date: $CURRENT_DATE"

# Validate version format
if ! [[ $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    print_error "Invalid version format. Use MAJOR.MINOR.PATCH (e.g., 1.3.0)"
    exit 1
fi

# Check if we're in the correct directory
if [ ! -f "frontend/src/version.js" ]; then
    print_error "version.js not found. Are you in the project root directory?"
    exit 1
fi

# Backup current version file
print_status "Creating backup of current version.js..."
cp frontend/src/version.js frontend/src/version.js.backup

# Update version.js
print_status "Updating frontend/src/version.js..."
sed -i "s/version: \"[^\"]*\"/version: \"$NEW_VERSION\"/" frontend/src/version.js
sed -i "s/buildDate: \"[^\"]*\"/buildDate: \"$CURRENT_DATE\"/" frontend/src/version.js
sed -i "s/releaseName: \"[^\"]*\"/releaseName: \"$RELEASE_NAME\"/" frontend/src/version.js

# Update package.json files
print_status "Updating package.json files..."
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" frontend/package.json
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" backend/package.json

# Verify updates
print_status "Verifying updates..."
if grep -q "version: \"$NEW_VERSION\"" frontend/src/version.js; then
    print_success "Version.js updated successfully"
else
    print_error "Failed to update version.js"
    exit 1
fi

if grep -q "\"version\": \"$NEW_VERSION\"" frontend/package.json; then
    print_success "Frontend package.json updated successfully"
else
    print_error "Failed to update frontend package.json"
    exit 1
fi

if grep -q "\"version\": \"$NEW_VERSION\"" backend/package.json; then
    print_success "Backend package.json updated successfully"
else
    print_error "Failed to update backend package.json"
    exit 1
fi

# Check syntax of version.js
print_status "Checking syntax of updated version.js..."
if node -c frontend/src/version.js; then
    print_success "Version.js syntax is valid"
else
    print_error "Syntax error in version.js. Restoring backup..."
    mv frontend/src/version.js.backup frontend/src/version.js
    exit 1
fi

# Clean up backup
rm frontend/src/version.js.backup

print_success "Version update completed successfully!"
print_status "Updated files:"
print_status "  - frontend/src/version.js"
print_status "  - frontend/package.json" 
print_status "  - backend/package.json"

print_warning "Don't forget to:"
print_warning "  1. Update the changelog in version.js"
print_warning "  2. Test the application"
print_warning "  3. Commit and tag the changes:"
print_warning "     git add ."
print_warning "     git commit -m \"chore: bump version to $NEW_VERSION - $RELEASE_NAME\""
print_warning "     git tag v$NEW_VERSION"
print_warning "     git push origin main --tags"

print_success "Version update process complete! 🎉"