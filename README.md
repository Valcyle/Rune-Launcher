# RuneLauncher

RuneLauncher is a native, high-performance, multi-profile launcher for `RuneModLoader`. It is designed as a hybrid Win32 / WebView2 desktop application that combines the performance of native C++ file operations and DLL injection with the rich user experience of a React/TypeScript interface.

## Key Features
- **Isolated Profiles**: Create and switch between multiple independent modding environments (Profiles).
- **Auto-Sorting Mod Importer**: Automatically detects, validates, extracts, and sorts `.runemod` (ZIP archives) and standalone `.dll` mods.
- **Dependency Resolver**: Full dependency checking supporting semantic versioning operators (`>=` and `^`).
- **Sequential Injector**: Performs native process discovery and injects mod loader cores and libraries in a strict sequential order.
- **Single-EXE Packaging**: Embeds all frontend assets, supporting DLLs, and loader cores directly inside the executable.
- **Discord Rich Presence (RPC)**: Integrated lightweight, native Named Pipe IPC connection showcasing your active modding profile and gameplay status directly on Discord.

---

## Tech Stack
- **Language**: C++20 (Backend), TypeScript / JavaScript (Frontend)
- **UI Runtime**: `Microsoft.Web.WebView2` (Native OS WebView engine)
- **Frontend Framework**: React 18+ (bundled via Vite)
- **JSON Utility**: `nlohmann/json` (Single-header modern C++ library)
- **Compression**: Windows Shell COM interfaces (zero external library dependencies)
- **Build System**: CMake 3.15+ & PowerShell 5.1+

---

## Prerequisites
To build and develop RuneLauncher, ensure you have the following installed:
- **C++20 Compiler**: MinGW-w64 GCC (15.2+) or Microsoft Visual C++ (MSVC)
- **CMake**: version 3.15 or higher
- **Node.js**: version 18 or higher (for UI package management and compilation)
- **PowerShell**: version 5.1 or higher (for the automated packaging and compilation script)

---

## Getting Started

### Quick Build (Recommended)
An automated PowerShell script handles building the React frontend, generating C++ embedded payloads, downloading dependencies, and compiling the C++ executable.

Run the following command from the repository root:
```powershell
.\build.ps1
```
The compiled binary will be generated under `build_cmake/launcher.exe`.

### Manual Build Step-by-Step
If you prefer to run the steps manually, follow these instructions:

#### 1. Compile the React Frontend
```bash
cd ui
npm install
npm run build
cd ..
```
This generates the static files in the [ui/dist/](file:///c:/Users/yamad/Desktop/projects/rune-project/Rune-Launcher/ui/dist) directory.

#### 2. Configure CMake to download WebView2
```powershell
cmake -B build_cmake -G "MinGW Makefiles"
```
This step downloads the required Microsoft WebView2 SDK NuGet package under `build_cmake/webview2_sdk/` and extracts `WebView2Loader.dll`.

#### 3. Embed Assets into C++ Source
Run the resource embedding generator (part of `build.ps1` script block 3) to serialize frontend assets, `WebView2Loader.dll`, and `RuneCore.dll` into hexadecimal byte arrays in [src/GeneratedResources.cpp](file:///c:/Users/yamad/Desktop/projects/rune-project/Rune-Launcher/src/GeneratedResources.cpp).

#### 4. Compile the Application
```powershell
cmake --build build_cmake
```

---

## Architecture & System Design

### Directory Structure
```
.
├── CMakeLists.txt              # CMake build configuration
├── build.ps1                   # Automated build and asset embedding script
├── RuneCore.dll                # Loader Core injected on startup
├── spec.md                     # Project system specification
├── include/
│   └── nlohmann/               # JSON parsing header library
├── src/
│   ├── main.cpp                # App entrypoint (mode selection, self-installer)
│   ├── ui/                     # WebView2 host window and UI embedding
│   │   ├── AppWindow.hpp/cpp
│   │   └── GeneratedResources.hpp/cpp
│   ├── profile/                # Profile directory creator and scanner
│   │   ├── ProfileManager.hpp/cpp
│   │   ├── ModImporter.hpp/cpp
│   │   └── ZipUtility.hpp/cpp
│   └── injection/              # DLL injection and SemVer checking
│       ├── DependencyResolver.hpp/cpp
│       ├── Injector.hpp/cpp
│       └── InjectionRunner.hpp/cpp
└── ui/                         # React/TypeScript Frontend
    ├── dist/                   # Compiled frontend build target
    ├── src/                    # UI code components
    └── package.json            # Vite/Node configurations
```

### Profile Layout Specification
Upon starting, RuneLauncher scans or creates directories under its resolved root folder in the following structure:
```
profiles/
├── Default/                     # Default active profile
│   ├── external/                # Raw standalone client DLLs (e.g. wrapper.dll)
│   └── mods/                    # Unpacked .runemod directories
│       └── com.example.mod/     # Isolated Mod ID directory
│           ├── manifest.json    # Mod specification
│           └── entrypoint.dll   # Core mod payload DLL
└── [Custom_Profile]/
    ├── external/
    └── mods/
```

### Self-Packaging Mechanism
To maintain a single-binary distribution strategy, `build.ps1` packages binary assets directly into [src/ui/GeneratedResources.cpp](file:///c:/Users/yamad/Desktop/projects/rune-project/Rune-Launcher/src/ui/GeneratedResources.cpp).
On startup:
- **Development Mode**: Detected if `CMakeLists.txt` is found in the directory hierarchy. The app runs directly in the source directory.
- **Production Mode**: Prompts the user to install. If accepted, it creates `%USERPROFILE%\AppData\Local\Rune\Launcher`, installs `launcher.exe`, extracts `WebView2Loader.dll`, `RuneCore.dll`, and extracts all static UI files into the `ui/` subdirectory. It also creates a Desktop shortcut.
- **Self-Updating**: On every launch in Production Mode, the embedded resources are unpacked to the AppData folder, ensuring the UI is always in sync with the compiled executable version.

---

## JS <-> C++ Bridge (IPC Interface)

Communication between the React frontend and the C++ backend is performed using WebView2's messaging interfaces.

### JS to C++ (Web Message Actions)
The frontend triggers actions by posting a JSON object containing an `action` string and optional `data`:
```javascript
window.chrome.webview.postMessage({
  action: "actionName",
  data: { ... }
});
```

| Action | Data Type | Description |
| :--- | :--- | :--- |
| `minimizeWindow` | None | Minimizes the Win32 window to the taskbar. |
| `maximizeWindow` | None | Toggles the window state between maximized and normal. |
| `closeWindow` | None | Closes the application. |
| `getProfiles` | None | Requests the backend to re-sync profiles, mods, and external DLLs. |
| `switchProfile` | `{ name: string }` | Switches the active profile workspace. |
| `launchGame` | None | Spawns an async thread to verify dependencies and scan for game processes. |
| `selectAndImportFile`| None | Triggers native Win32 `GetOpenFileName` file dialog to import a mod. |

### C++ to JS (Events)
The C++ backend sends JSON payloads using `PostWebMessageAsJson` wrapped in the following schema:
```json
{
  "event": "eventName",
  "detail": { ... }
}
```

- **`profilesUpdated`**: Sent on startup, profile switch, or file import.
  ```json
  {
    "event": "profilesUpdated",
    "detail": {
      "profiles": ["Default", "Modded-Env"],
      "active": "Default",
      "mods": [
        {
          "id": "com.example.mymod",
          "name": "Super Engine Optimizer",
          "version": "1.0.4",
          "entrypoint": "optimizer.dll"
        }
      ],
      "externals": [
        {
          "name": "cheat_client.dll",
          "path": "external/cheat_client.dll"
        }
      ]
    }
  }
  ```
- **`launchStatus`**: Signals progress during the game launch procedure.
  ```json
  {
    "event": "launchStatus",
    "detail": {
      "status": "resolving" | "success" | "failed"
    }
  }
  ```
- **`importStatus`**: Signals the result of a user file import.
  ```json
  {
    "event": "importStatus",
    "detail": {
      "status": "success" | "failed",
      "message": "Detailed description of validation outcome"
    }
  }
  ```

---

## Mod Package Format (.runemod)

A mod package is distributed as a custom ZIP container renamed with the `.runemod` extension. It must contain a `manifest.json` file at the root level alongside its binaries.

### manifest.json Schema Example
```json
{
  "id": "com.example.mymod",
  "name": "Super Engine Optimizer",
  "version": "1.0.4",
  "author": "DeveloperName",
  "description": "Optimizes rendering pipelines for better FPS.",
  "api_version": "0.1.0",
  "entrypoint": "optimizer.dll",
  "dependencies": {
    "com.rune.api_core": ">=0.1.0",
    "com.example.custom_gui_lib": "^1.0.0"
  }
}
```

### Dependency Operators
- `==` (Default): Exact version match.
- `>=`: Installs must be greater than or equal to the requested version.
- `^`: Compatible version (must match the Major version, and Minor/Patch must be greater than or equal to the requested version).

---

## CLI Commands Reference
The launcher can be run in headless/automation mode using console flags:
```powershell
# Import a mod file into the active profile
.\launcher.exe -import "C:\path\to\mod.runemod"

# Wait for process and inject all active mods immediately
.\launcher.exe -launch "Minecraft.Windows.exe"
```

---

## Troubleshooting

### WebView2 Runtime Missing
If the launcher displays a blank/white screen or errors on startup, ensure the Microsoft Edge WebView2 Runtime is installed. It is pre-installed on Windows 11 but may need manual installation on older Windows releases.

### Injection Failures
- Run the launcher as an Administrator if the target process has high privilege levels.
- Check that the loader core `RuneCore.dll` is present in the application parent directory.
- Verify that dependency resolution passes; look for errors outputted in the debug log.
