# MarketSense API Deployment Script for PowerShell
# This script compiles and deploys the Lambda function with environment variables

# Load environment variables from .env file
if (Test-Path .env) {
    Write-Host "Loading environment variables from .env file..."
    Get-Content .env | ForEach-Object {
        if (!$_.StartsWith('#') -and $_.Length -gt 0) {
            $key, $value = $_ -split '=', 2
            [Environment]::SetEnvironmentVariable($key, $value)
        }
    }
} else {
    Write-Host "No .env file found. Using default or environment variables."
}

# Build TypeScript code
Write-Host "Building TypeScript code..."
npm run build

# Check if build was successful
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed. Aborting deployment."
    exit 1
}

# Deploy with serverless framework
Write-Host "Deploying to AWS Lambda..."
$deployCommand = "npx serverless deploy"

# Add parameters if environment variables are set
if ($env:ALPHA_VANTAGE_API_KEY) { $deployCommand += " --param=`"ALPHA_VANTAGE_API_KEY=$env:ALPHA_VANTAGE_API_KEY`"" }
if ($env:FINNHUB_API_KEY) { $deployCommand += " --param=`"FINNHUB_API_KEY=$env:FINNHUB_API_KEY`"" }
if ($env:NEWSAPI_API_KEY) { $deployCommand += " --param=`"NEWSAPI_API_KEY=$env:NEWSAPI_API_KEY`"" }
if ($env:NEWSDATA_API_KEY) { $deployCommand += " --param=`"NEWSDATA_API_KEY=$env:NEWSDATA_API_KEY`"" }
if ($env:GEMINI_API_KEY) { $deployCommand += " --param=`"GEMINI_API_KEY=$env:GEMINI_API_KEY`"" }
if ($env:GEMINI_API_KEY_2) { $deployCommand += " --param=`"GEMINI_API_KEY_2=$env:GEMINI_API_KEY_2`"" }
if ($env:GEMINI_API_KEY_3) { $deployCommand += " --param=`"GEMINI_API_KEY_3=$env:GEMINI_API_KEY_3`"" }
if ($env:ML_SERVICE_URL) { 
    $deployCommand += " --param=`"ML_SERVICE_URL=$env:ML_SERVICE_URL`"" 
} else {
    $deployCommand += " --param=`"ML_SERVICE_URL=http://localhost:5000`"" 
}

# Execute the deployment command
Invoke-Expression $deployCommand

# Check if deployment was successful
if ($LASTEXITCODE -ne 0) {
    Write-Host "Deployment failed."
    exit 1
}

Write-Host "Deployment completed successfully!"
Write-Host "API is now available at the endpoint shown above."
Write-Host "Check the CloudWatch logs for any issues."