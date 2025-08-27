#!/bin/bash

# Qodana Local Analysis Script
# This script runs Qodana code quality analysis locally

QODANA_TOKEN="${QODANA_TOKEN:-}"
PROJECT_DIR="$(pwd)"
OUTPUT_DIR="$PROJECT_DIR/test-output/qodana"

echo "🔍 Running Qodana code quality analysis..."
echo "📁 Project directory: $PROJECT_DIR"
echo "📂 Output directory: $OUTPUT_DIR"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Run Qodana
if [ -n "$QODANA_TOKEN" ]; then
    echo "🔑 Using Qodana token for cloud features"
    docker run --rm \
        -v "$PROJECT_DIR:/data/project/" \
        -e QODANA_TOKEN="$QODANA_TOKEN" \
        jetbrains/qodana-js:latest \
        --results-dir /data/project/test-output/qodana
else
    echo "⚠️  No Qodana token found. Running without cloud features."
    docker run --rm \
        -v "$PROJECT_DIR:/data/project/" \
        jetbrains/qodana-js:latest \
        --results-dir /data/project/test-output/qodana
fi

# Check if analysis was successful
if [ $? -eq 0 ]; then
    echo "✅ Qodana analysis completed successfully!"
    echo "📊 Results available at: $OUTPUT_DIR/report.html"
    
    # Open report in browser if available
    if command -v open &> /dev/null; then
        open "$OUTPUT_DIR/report.html"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "$OUTPUT_DIR/report.html"
    fi
else
    echo "❌ Qodana analysis failed"
    exit 1
fi