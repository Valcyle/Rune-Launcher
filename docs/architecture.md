# Launcher and runtime architecture (draft)

Status: design draft. Describes the current launcher and the intended v1 split
between Launcher, RuneCore, and future versioned loader delivery.

Related: `RuneModLoader/docs/mod-api.md`, `RuneModLoader/docs/multiplayer.md`.

## Components

| Component | Responsibility |
|---|---|
| `launcher.exe` | Win32/WebView2 host, profile UI, import, dependency check, injection, update |
| React UI (`ui/`) | Profile management, mod list, settings, update UI |
| `RuneCore.dll` | Injected loader: session read, mod discovery, API host, mod lifecycle |
| `profiles/` | Isolated mod sets (`mods/`, `external/`, `profile_config.json`) |
| Discord RPC | Optional presence, separate from mod loading |

## Runtime flow

```text
launcher starts
  -> resolve root: dev repo root or %LOCALAPPDATA%\Rune
  -> ensure profiles/
  -> show WebView2 UI (ui/dist in dev, AppData Launcher/ui in production)
  -> user presses Launch
       -> resolve dependencies for the active profile
       -> write <root>/session.json
       -> find or start Minecraft.Windows.exe
       -> inject RuneCore.dll
       -> inject external/*.dll
       -> RuneCore reads session.json and loads mods
```

If RuneCore injection fails, the launcher falls back to injecting external and
mod entrypoint DLLs directly. That path keeps legacy mods working but does not
provide the Rune mod API or lifecycle.

## session.json

```json
{
  "profile": "RML",
  "api_version": "0.2.0"
}
```

Planned fields:

- `loader_version`: selected RuneCore version.
- `loader_path`: absolute path to the selected `RuneCore.dll` (optional).
- `mod_set_hash`: advisory multiplayer hash.

RuneCore derives `<root>` from its own DLL path and validates the profile name.
The file is runtime state and must stay gitignored.

## Injection ownership

- Launcher injects `RuneCore.dll` first.
- Launcher injects `external/*.dll` next.
- RuneCore loads `mods/*` entrypoints and calls the mod API.
- The launcher must not inject mod entrypoints when RuneCore succeeded; doing so
  creates a second module reference and prevents clean unload.
- Direct mod injection is only a fallback when RuneCore injection fails.

## Embedding decision

Current implementation:

- `build.ps1` converts `RuneCore.dll`, `WebView2Loader.dll`, and every
  `ui/dist` file into hex arrays in `src/ui/GeneratedResources.cpp`.
- The generated source is about 12 MB because bytes are stored as text.
- `launcher.exe` is about 3.3 MB. Embedded RuneCore contributes about 0.5 MB to
  the binary, so download size is not the main problem.
- The real costs are build time, repository size, and coupling launcher releases
  to loader releases.

Decision:

- v1 keeps RuneCore bundled as the last-known-good fallback.
- Replace hex source generation with PE `RCDATA` resources, and optionally embed
  the UI as a single zip extracted on first run/update. This is a build and
  maintainability improvement, not a size emergency.
- Do not change the existing launcher auto-update flow as part of this change.

## Loader delivery roadmap

| Phase | Behavior |
|---|---|
| v1 | Bundled RuneCore; auto-update unchanged |
| v1.1 | Local loader store: `%LOCALAPPDATA%\Rune\loaders\<version>\RuneCore.dll` |
| v1.2 | `loader_manifest.json` with version, SHA256, minimum launcher version |
| Later | Download required loader version; fall back to bundled on any failure |

Safety rules for future loader updates:

- Never remove the last-known-good loader.
- Download to a temporary path, verify SHA256, then atomically rename.
- Keep launcher update and loader update independent.
- Do not block game launch if loader download fails; use the bundled fallback.
- Log the selected loader version and source (bundled/downloaded).

## Profiles and config

```text
<root>/profiles/<name>/
  mods/<mod-id>/{manifest.json, entrypoint.dll}
  external/*.dll
  profile_config.json
```

`profile_config.json` controls `disabled_mods`, `disabled_externals`,
`mod_order`, and `external_order`. Runtime state; never commit.

## Versioning

- Launcher version: `RUNE_LAUNCHER_VERSION` in `src/ui/AppWindow.hpp`.
- Loader/API version: `RUNE_API_VERSION` in `RuneModLoader/include/rune_api.h`.
- `Version::GetVersionString()` reports the real game executable version.
- `GameVersion` enum is only for version-specific hooks and currently covers
  1.21.111/114/132. v1 targets the latest 1.26 line; multi-version hook support
  comes later.

## Security

- Mod DLLs are arbitrary native code; there is no sandbox.
- Current update flow downloads an exe from GitHub Releases without hash
  verification. Add SHA256 verification before production release.
- ZIP extraction currently uses Shell COM `CopyHere`, which is asynchronous and
  should be replaced with a deterministic zip library that rejects `..` paths.
- Do not log tokens, emails, account identifiers, or local user paths.
- Installer/updater must not remove the previous working binary until the new one
  is verified.

## Build and CI proposal

```text
build RuneModLoader (Release)
  -> copy RuneCore.dll to Rune-Launcher
  -> npm ci && npm run build
  -> build launcher
  -> package release assets
  -> upload with version, SHA256, release notes
```

CI should build both repos from clean checkouts and fail if the embedded loader
hash does not match the loader build output.

## Open questions

- PE `RCDATA` vs compressed `ui.zip` vs both.
- Static `WebView2LoaderStatic.lib` to remove the loader DLL.
- Where to host shared `RuneCommon` code (header-only vs small static library).
- Whether profiles can pin a loader version.
- Update signing beyond SHA256.
- Launcher log file in production (currently console-only in dev).
