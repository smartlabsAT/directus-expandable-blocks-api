#!/bin/bash

# Cleanup Script for Test Outputs
# Removes all generated test output directories

echo "🧹 Cleaning up test outputs..."

# List of directories to clean
DIRS_TO_CLEAN=(
    "test-output"
    "coverage"
    ".qodana"
    "dist"
    ".vitest"
    "node_modules/.vitest"
    "node_modules/.cache"
)

# Clean each directory
for dir in "${DIRS_TO_CLEAN[@]}"; do
    if [ -d "$dir" ]; then
        echo "  📁 Removing $dir..."
        rm -rf "$dir"
    fi
done

# Clean specific files
FILES_TO_CLEAN=(
    "*.log"
    ".DS_Store"
    "*.tsbuildinfo"
)

for pattern in "${FILES_TO_CLEAN[@]}"; do
    echo "  📄 Removing $pattern files..."
    find . -name "$pattern" -type f -delete 2>/dev/null
done

echo "✅ Cleanup completed!"