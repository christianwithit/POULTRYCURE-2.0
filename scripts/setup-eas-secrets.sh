#!/bin/bash

# Script to add all required environment variables to EAS secrets
# Run this script from the project root: bash scripts/setup-eas-secrets.sh

echo "🔐 Setting up EAS secrets for PoultryCure..."
echo ""

# Load .env file
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your environment variables first."
    exit 1
fi

# Source the .env file
export $(cat .env | grep -v '^#' | xargs)

# Check if variables are set
if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ EXPO_PUBLIC_SUPABASE_URL not found in .env"
    exit 1
fi

if [ -z "$EXPO_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ EXPO_PUBLIC_SUPABASE_ANON_KEY not found in .env"
    exit 1
fi

if [ -z "$EXPO_PUBLIC_GEMINI_API_KEY" ]; then
    echo "❌ EXPO_PUBLIC_GEMINI_API_KEY not found in .env"
    exit 1
fi

echo "📝 Adding secrets to EAS..."
echo ""

# Add Supabase secrets
echo "Adding EXPO_PUBLIC_SUPABASE_URL..."
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "$EXPO_PUBLIC_SUPABASE_URL" --force

echo "Adding EXPO_PUBLIC_SUPABASE_ANON_KEY..."
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "$EXPO_PUBLIC_SUPABASE_ANON_KEY" --force

# Add Gemini secrets
echo "Adding EXPO_PUBLIC_GEMINI_API_KEY..."
eas secret:create --scope project --name EXPO_PUBLIC_GEMINI_API_KEY --value "$EXPO_PUBLIC_GEMINI_API_KEY" --force

echo "Adding EXPO_PUBLIC_GEMINI_MODEL..."
eas secret:create --scope project --name EXPO_PUBLIC_GEMINI_MODEL --value "${EXPO_PUBLIC_GEMINI_MODEL:-gemini-2.5-flash}" --force

echo "Adding EXPO_PUBLIC_GEMINI_MAX_TOKENS..."
eas secret:create --scope project --name EXPO_PUBLIC_GEMINI_MAX_TOKENS --value "${EXPO_PUBLIC_GEMINI_MAX_TOKENS:-2048}" --force

echo "Adding EXPO_PUBLIC_GEMINI_TIMEOUT..."
eas secret:create --scope project --name EXPO_PUBLIC_GEMINI_TIMEOUT --value "${EXPO_PUBLIC_GEMINI_TIMEOUT:-30000}" --force

echo ""
echo "✅ All secrets added successfully!"
echo ""
echo "📋 Verify secrets with: eas secret:list"
echo "🏗️  Build preview APK with: eas build --profile preview --platform android"
