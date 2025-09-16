#!/bin/bash
# SPDX-License-Identifier: Apache-2.0
# © 2025 NEUS Network, Inc. Contributors

# NEUS SDK Publishing Script
# Run this to publish the SDK to npm

set -e

echo "NEUS SDK v1.0.0 - Publishing to NPM"
echo "======================================="

# Check if logged into npm
echo "Checking npm authentication..."
npm whoami || (echo "Please login to npm first: npm login" && exit 1)

# Run tests
echo "Running tests..."
npm test || (echo "Tests failed. Fix before publishing." && exit 1)

# Run linter
echo "Running linter..."
npm run lint || (echo "Linting failed. Fix before publishing." && exit 1)

# Confirm version
echo ""
echo "Package Details:"
echo "Name: @neus/sdk"
echo "Version: 1.0.0"
echo "License: Apache-2.0"
echo ""

# Confirm publish
read -p "Ready to publish to npm? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Publishing cancelled."
    exit 1
fi

# Publish with public access
echo "Publishing to npm..."
npm publish --access public

echo ""
echo "Successfully published @neus/sdk@1.0.0"
echo ""
echo "Next Steps:"
echo "1. Create GitHub release with tag v1.0.0"
echo "2. Update documentation"
echo "3. Share integration examples"
echo ""