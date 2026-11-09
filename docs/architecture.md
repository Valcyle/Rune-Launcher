# Launcher and runtime architecture (draft)

Status: design draft. Describes the current launcher and the intended v1 split
between Launcher, RuneCore, and future versioned loader delivery.

Related: `RuneModLoader/docs/mod-api.md`, `RuneModLoader/docs/multiplayer.md`.

## Components

| Component | Responsibility |
|---|---|
| `launcher.exe` | Win32/WebView2 host, profile UI, import, dependency check, injection, update |
| React UI (`ui/`) | Profile management, mod list, settings, update UI |
| `RuneCore.dll` | Optional private loader (`-WithLoader` builds only): session read, mod discovery, API host, mod lifecycle |
| `profiles/` | Isolated mod sets (`mods/`, `external/`, `profile_config.json`) |
| Discord RPC | Optional presence, separate from mod loading |

## Runtime flow

Public launcher (default, no RuneCore):

```text
launcher starts
  -> resolve root: dev repo root or %LOCALAPPDATA%\Rune
  -> ensure profiles/
  -> show WebView2 UI (ui/dist in dev, AppData Launcher/ui in production)
  -> user presses Launch
       -> resolve dependencies for the active profile
       -> find or start Minecraft.Windows.exe
       -> inject external/*.dll
       -> inject mod entrypoints directly (legacy fallback)
```

Private loader build (`build.ps1 -WithLoader`):

```text
  -> write <root>/session.json
  -> inject RuneCore.dll
  -> inject external/*.dll
  -> RuneCore reads session.json and loads mods
```

If RuneCore injection fails in the private loader build, the launcher falls back
to direct external/mod injection. The public launcher never writes
`session.json` and does not provide the Rune mod API lifecycle.

## session.json

Private loader builds only:

```json
{
  "profile": "RML",
  "api_version": "0.1.0"
}
```

Planned fields:

- `loader_version`: selected RuneCore version.
- `loader_path`: absolute path to the selected `RuneCore.dll` (optional).
- `mod_set_hash`: advisory multiplayer hash.

RuneCore derives `<root>` from its own DLL path and validates the profile name.
The file is runtime state and must stay gitignored.

## Injection ownership

Public launcher:

- Injects `external/*.dll` and mod entrypoints directly.
- Does not inject RuneCore and does not call the Rune mod API.
- `.runemod` packages still import, but their entrypoint DLLs are loaded by the
  launcher, not by RuneCore.

Private loader build:

- Injects `RuneCore.dll` first, then `external/*.dll`.
- RuneCore loads `mods/*` entrypoints and calls the mod API.
- The launcher must not inject mod entrypoints when RuneCore succeeded; doing so
  creates a second module reference and prevents clean unload.
- Direct mod injection is only a fallback when RuneCore injection fails.

## Embedding decision

Public launcher (default):

- `build.ps1` embeds `WebView2Loader.dll` and every `ui/dist` file as hex arrays
  in `src/ui/GeneratedResources.cpp`.
- `RuneCore.dll` is not embedded; the generated RuneCore array has size 0.
- `launcher.exe` is about 2.8 MB.
- The generated source is about 12 MB because bytes are stored as text.

Private loader build (`build.ps1 -WithLoader`):

- Additionally embeds `RuneCore.dll` (about 0.5 MB), producing a launcher around
  3.3 MB.
- This build is for private beta/testing only and must not be published while
  loader distribution is paused.

Decision:

- Keep RuneCore out of public launcher releases. Public value is profile
  management, mod import, dependency checks, external DLL injection, and update.
- Keep the private `-WithLoader` path for testing the loader without changing the
  public build.
- Replace hex source generation with PE `RCDATA` resources, and optionally embed
  the UI as a single zip extracted on first run/update. This is a build and
  maintainability improvement, not a size emergency.
- Do not change the existing launcher auto-update flow as part of this change.

## Loader delivery roadmap

| Phase | Behavior |
|---|---|
| v1 public | No loader in public launcher releases; external DLL injection only |
| private beta | `-WithLoader` build for testers; RuneModLoader repo stays private |
| v1.1 | Local loader store: `%LOCALAPPDATA%\Rune\loaders\<version>\RuneCore.dll` |
| v1.2 | `loader_manifest.json` with version, SHA256, minimum launcher version |
| Later | Download required loader version; fall back to a private bundled baseline |

Safety rules for future loader updates:

- Do not ship a loader-enabled public build until loader distribution is approved.
- Never remove the last-known-good loader.
- Download to a temporary path, verify SHA256, then atomically rename.
- Keep launcher update and loader update independent.
- Do not block game launch if loader download fails.
- Log the selected loader version and source.

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

Public build (default):

```text
npm ci && npm run build
  -> .\build.ps1              (launcher-only)
  -> package release assets
  -> upload with version, SHA256, release notes
```

Private loader build:

```text
build RuneModLoader (Release)
  -> copy RuneCore.dll to Rune-Launcher
  -> .\build.ps1 -WithLoader
  -> test only; do not publish while loader distribution is paused
```

CI should build the public launcher-only artifact from a clean checkout. If a
private loader job exists, it must be separate and must not upload public assets.

## Open questions

- PE `RCDATA` vs compressed `ui.zip` vs both.
- Static `WebView2LoaderStatic.lib` to remove the loader DLL.
- Where to host shared `RuneCommon` code (header-only vs small static library).
- Whether profiles can pin a loader version.
- Update signing beyond SHA256.
- Launcher log file in production (currently console-only in dev).
