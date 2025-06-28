#!/bin/bash

set -e

echo "1. Making prebuild hook executable..."
chmod +x .platform/hooks/prebuild/01_npm_install.sh

echo "2. Removing any old deployment.zip..."
rm -f deployment.zip

echo "3. Creating new deployment.zip (excluding node_modules, .next, .git, .elasticbeanstalk, .DS_Store, *.log)..."
zip -r deployment.zip . -x "node_modules/*" ".next/*" ".git/*" ".elasticbeanstalk/*" ".DS_Store" "*.log"

echo "4. Verifying that the updated prebuild script is in the zip..."
if unzip -l deployment.zip | grep -q ".platform/hooks/prebuild/01_npm_install.sh"; then
    echo "   ✅ Script found in zip."
else
    echo "   ❌ Script NOT found in zip! Aborting."
    exit 1
fi

echo "5. Showing contents of the script inside the zip:"
unzip -p deployment.zip .platform/hooks/prebuild/01_npm_install.sh

echo "6. Done! Upload deployment.zip to Elastic Beanstalk."