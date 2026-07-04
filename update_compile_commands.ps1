# Update compile_commands.json for clangd diagnostics/autocomplete
Write-Host "Generating compile commands using CMake with MinGW generator..." -ForegroundColor Cyan
cmake -B build_compile_commands -G "MinGW Makefiles" -DCMAKE_EXPORT_COMPILE_COMMANDS=ON

if ($LASTEXITCODE -eq 0) {
    Write-Host "Copying compile_commands.json to workspace root..." -ForegroundColor Cyan
    Copy-Item -Path .\build_compile_commands\compile_commands.json -Destination .\ -Force
    Write-Host "Successfully updated compile_commands.json!" -ForegroundColor Green
} else {
    Write-Host "CMake configuration failed. Please check the build_compile_commands directory." -ForegroundColor Red
    exit $LASTEXITCODE
}
