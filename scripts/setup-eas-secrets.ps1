# PowerShell script to add all required environment variables to EAS secrets
# Run this script from the project root: .\scripts\setup-eas-secrets.ps1

Write-Host "🔐 Setting up EAS secrets for PoultryCure..." -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file with your environment variables first."
    exit 1
}

# Load .env file
$envVars = @{}
Get-Content ".env" | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $envVars[$matches[1].Trim()] = $matches[2].Trim()
    }
}

# Check required variables
$required = @(
    "EXPO_PUBLIC_SUPABASE_URL",
    "EXPO_PUBLIC_SUPABASE_ANON_KEY",
    "EXPO_PUBLIC_GEMINI_API_KEY"
)

foreach ($var in $required) {
    if (-not $envVars.ContainsKey($var) -or [string]::IsNullOrWhiteSpace($envVars[$var])) {
        Write-Host "❌ $var not found in .env" -ForegroundColor Red
        exit 1
    }
}

Write-Host "📝 Adding secrets to EAS..." -ForegroundColor Yellow
Write-Host ""

# Add Supabase secrets
Write-Host "Adding EXPO_PUBLIC_SUPABASE_URL..."
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value $envVars["EXPO_PUBLIC_SUPABASE_URL"] --force

Write-Host "Adding EXPO_PUBLIC_SUPABASE_ANON_KEY..."
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value $envVars["EXPO_PUBLIC_SUPABASE_ANON_KEY"] --force

# Add Gemini secrets
Write-Host "Adding EXPO_PUBLIC_GEMINI_API_KEY..."
eas secret:create --scope project --name EXPO_PUBLIC_GEMINI_API_KEY --value $envVars["EXPO_PUBLIC_GEMINI_API_KEY"] --force

$geminiModel = if ($envVars.ContainsKey("EXPO_PUBLIC_GEMINI_MODEL")) { $envVars["EXPO_PUBLIC_GEMINI_MODEL"] } else { "gemini-2.5-flash" }
Write-Host "Adding EXPO_PUBLIC_GEMINI_MODEL..."
eas secret:create --scope project --name EXPO_PUBLIC_GEMINI_MODEL --value $geminiModel --force

$maxTokens = if ($envVars.ContainsKey("EXPO_PUBLIC_GEMINI_MAX_TOKENS")) { $envVars["EXPO_PUBLIC_GEMINI_MAX_TOKENS"] } else { "2048" }
Write-Host "Adding EXPO_PUBLIC_GEMINI_MAX_TOKENS..."
eas secret:create --scope project --name EXPO_PUBLIC_GEMINI_MAX_TOKENS --value $maxTokens --force

$timeout = if ($envVars.ContainsKey("EXPO_PUBLIC_GEMINI_TIMEOUT")) { $envVars["EXPO_PUBLIC_GEMINI_TIMEOUT"] } else { "30000" }
Write-Host "Adding EXPO_PUBLIC_GEMINI_TIMEOUT..."
eas secret:create --scope project --name EXPO_PUBLIC_GEMINI_TIMEOUT --value $timeout --force

Write-Host ""
Write-Host "✅ All secrets added successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Verify secrets with: eas secret:list" -ForegroundColor Cyan
Write-Host "🏗️ Build preview APK with: eas build --profile preview --platform android" -ForegroundColor Cyan
