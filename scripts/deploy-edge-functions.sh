#!/bin/bash

# Edge Functions Deployment Script
# This script deploys the Supabase Edge Functions for Phase 4

echo "🚀 Starting Edge Functions Deployment..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if user is logged in to Supabase
echo "🔐 Checking Supabase authentication..."
if ! supabase status &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please run:"
    echo "supabase login"
    exit 1
fi

# Get project status
echo "📊 Checking project status..."
supabase status

# Deploy diagnose function
echo "🤖 Deploying diagnose function..."
supabase functions deploy diagnose --no-verify-jwt

if [ $? -eq 0 ]; then
    echo "✅ Diagnose function deployed successfully"
else
    echo "❌ Failed to deploy diagnose function"
    exit 1
fi

# Deploy health-check function
echo "🏥 Deploying health-check function..."
supabase functions deploy health-check --no-verify-jwt

if [ $? -eq 0 ]; then
    echo "✅ Health-check function deployed successfully"
else
    echo "❌ Failed to deploy health-check function"
    exit 1
fi

# Set environment variables
echo "🔧 Setting environment variables..."

# Note: These need to be set manually in Supabase Dashboard for security
echo "⚠️  IMPORTANT: Set these secrets in Supabase Dashboard:"
echo "   - GEMINI_API_KEY: Your Google Generative AI API key"
echo "   - SUPABASE_URL: Your Supabase project URL"
echo "   - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key"

# Run database migration
echo "🗄️  Running database migration..."
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Database migration completed"
else
    echo "❌ Database migration failed"
    exit 1
fi

# Test the functions
echo "🧪 Testing deployed functions..."

# Test health check
echo "🏥 Testing health check function..."
HEALTH_RESPONSE=$(curl -s -X POST 'https://your-project.supabase.co/functions/v1/health-check' \
  -H 'Content-Type: application/json' \
  -d '{"timestamp": '$(date +%s)000'}')

if [[ $HEALTH_RESPONSE == *"healthy"* ]]; then
    echo "✅ Health check function is working"
else
    echo "⚠️  Health check function may have issues"
    echo "Response: $HEALTH_RESPONSE"
fi

# Show function URLs
echo "📡 Function URLs:"
supabase functions list

echo ""
echo "🎉 Edge Functions Deployment Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Set environment variables in Supabase Dashboard"
echo "2. Test the diagnose function with a real request"
echo "3. Update the app to use edge functions"
echo "4. Monitor function logs and performance"
echo ""
echo "🔗 Useful Commands:"
echo "  supabase functions list                    # List all functions"
echo "  supabase functions logs diagnose           # View diagnose logs"
echo "  supabase functions logs health-check       # View health-check logs"
echo "  supabase functions serve                   # Serve locally for testing"
