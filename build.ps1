# Simple build script for RuneLauncher C++ backend using MinGW g++
# Usage: .\build.ps1

if (-not (Test-Path "build")) {
    New-Item -ItemType Directory -Path "build" | Out-Null
}

Write-Host "Compiling RuneLauncher..."
g++ -std=c++20 -O2 src/main.cpp src/ProfileManager.cpp -o build/launcher.exe

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build Succeeded: build/launcher.exe" -ForegroundColor Green
} else {
    Write-Host "Build Failed" -ForegroundColor Red
    exit $LASTEXITCODE
}
