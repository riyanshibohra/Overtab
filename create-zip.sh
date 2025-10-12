#!/bin/bash
# Simple ZIP creator for Chrome Web Store

echo "📦 Creating submission ZIP..."

zip -r overtab-v1.0.0.zip \
  manifest.json \
  src/ \
  icons/ \
  -x "*.git*" \
  -x "*.DS_Store" \
  -x "*node_modules/*" \
  -x "*.zip"

echo "✅ Created overtab-v1.0.0.zip"
ls -lh overtab-v1.0.0.zip

