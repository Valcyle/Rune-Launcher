# Simple build script for RuneLauncher C++ backend using MinGW g++
# Usage: .\build.ps1

if (-not (Test-Path "build")) {
    New-Item -ItemType Directory -Path "build" | Out-Null
}

Write-Host "Compiling RuneLauncher..."
g++ -std=c++20 -O2 -Iinclude src/main.cpp src/ProfileManager.cpp src/ZipUtility.cpp src/ModImporter.cpp src/DependencyResolver.cpp src/Injector.cpp src/InjectionRunner.cpp -o build/launcher.exe -lole32 -loleaut32 -luuid

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build Succeeded: build/launcher.exe" -ForegroundColor Green
} else {
    Write-Host "Build Failed" -ForegroundColor Red
    exit $LASTEXITCODE
}
