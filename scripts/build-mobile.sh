#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# BuddyMarket — Mobile Build Script
# Builds the web app and syncs it to iOS and Android Capacitor projects
# ─────────────────────────────────────────────────────────────────────────────
set -e

echo "🏗️  Building BuddyMarket for mobile..."

# 1. Build the web app
echo "📦 Building web app..."
pnpm build

# 2. Sync Capacitor (copies web assets + updates native projects)
echo "🔄 Syncing Capacitor..."
npx cap sync

# 3. Copy icons and splash screens
echo "🎨 Copying assets..."
# iOS icons are managed via Xcode / AppIcon.appiconset
# Android icons are in android/app/src/main/res/

echo ""
echo "✅ Build complete!"
echo ""
echo "Next steps:"
echo "  iOS:     npx cap open ios    → Build & Archive in Xcode"
echo "  Android: npx cap open android → Build APK/AAB in Android Studio"
echo ""
echo "📱 iOS submission:"
echo "  1. Open Xcode → Product → Archive"
echo "  2. Distribute App → App Store Connect"
echo "  3. Upload to App Store Connect"
echo ""
echo "🤖 Android submission:"
echo "  1. Open Android Studio → Build → Generate Signed Bundle/APK"
echo "  2. Choose Android App Bundle (.aab)"
echo "  3. Upload to Google Play Console"
