#!/bin/bash

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")

echo "--- Starting Build for version $VERSION ---"

echo "--- Cleaning old build artifacts ---"
rm -rf dist

echo "--- Installing dependencies ---"
npm install --silent

echo "--- Running build ---"
npm run build

if [ $? -ne 0 ]; then
    echo "[ERROR] Build failed!"
    exit 1
fi

echo "--- Packaging Extension ---"
# Ensure zip is installed
if command -v zip >/dev/null 2>&1; then
    cd dist && zip -r "../ask-gemini-v$VERSION.zip" . * && cd ..
else
    echo "[WARNING] 'zip' command not found. Skipping packaging."
fi

echo "--- Cleaning up node_modules and lockfile ---"
rm -rf node_modules
rm -f package-lock.json

echo "--- Done! Final package: ask-gemini-v$VERSION.zip ---"
echo "Closing in 5 seconds..."
sleep 5
exit 0
