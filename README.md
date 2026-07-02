# RuneLauncher

RuneLauncher is a native, multi-profile launcher for `RuneModLoader`.
It handles configuration management, file importing/sorting, dependency resolution, and native process injection.

## Project Structure
- `src/`: C++ backend source files.
  - `ProfileManager`: Manages directories and profile scanning on startup.
- `CMakeLists.txt`: Project build configuration for CMake.

## Getting Started

### Prerequisites
- C++20 Compiler (e.g., MinGW-w64 GCC 15.2+ or MSVC)
- CMake 3.15+
- PowerShell

### How to Build

#### Option A: Using CMake (Recommended)
```powershell
# Configure the build files
cmake -B build_cmake -G "MinGW Makefiles"

# Build the project
cmake --build build_cmake
```

#### Option B: Direct Compilation using Script
```powershell
# Run the helper script
.\build.ps1
```

The compiled binary will be generated under the `build_cmake/` or `build/` directory as `launcher.exe`.
