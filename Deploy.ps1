# Read the manifest.json file
$manifestPath = "src\manifest.json"
$manifest = Get-Content $manifestPath | ConvertFrom-Json

# Extract the version
$version = $manifest.version

# Build the project
npm run build

# Package the extension
$zipFileName = "MakeMarket-v$version.zip"
Compress-Archive -Path "build\*" -DestinationPath $zipFileName -Force
Write-Host "Deployment package created: MakeMarket.zip"
