# Third-party notices

Rune-Launcher includes the following third-party components. Full license texts
are kept with the corresponding source or package and must be included in binary
releases.

## C++ / native

| Component | Version | License | Copyright |
|---|---|---|---|
| nlohmann/json | 3.12.0 | MIT | Niels Lohmann and contributors |
| MinHook (inside the bundled RuneCore) | 1.3.3 | BSD-2-Clause | Tsuda Kageyu |
| Dear ImGui (vendored in RuneModLoader, not compiled here) | 1.89.9 | MIT | Omar Cornut |
| Microsoft WebView2 SDK | 1.0.1264.42 | BSD-3-Clause-style Microsoft license | Microsoft Corporation |

License references:

- `third_party/nlohmann_json/LICENSE.txt` (and `include/nlohmann/json.hpp`,
  SPDX-License-Identifier: MIT)
- `third_party/webview2/LICENSE.txt`
- `../RuneModLoader/external/minhook/LICENSE.txt` (private loader build only)
- `../RuneModLoader/external/imgui/LICENSE.txt` (private loader build only)

`WebView2Loader.dll` is redistributed under the Microsoft WebView2 SDK license.
The WebView2 Runtime itself is not included; users install it separately
(usually already present on Windows 11 and updated Windows 10).

## UI

The React UI is built from npm packages. The lockfile currently resolves to
packages under MIT, Apache-2.0, BSD-3-Clause, ISC, 0BSD, and MPL-2.0 licenses.
MPL-2.0 components are used unmodified. React and Vite logos are trademarks of
their respective owners. Run a license audit such as
`npx license-checker --summary` before publishing a release and include the
generated notice with the distribution.

## Project artwork (not MIT)

Logo and artwork files are Copyright (c) 2026 d3cafe. They are not third-party
dependencies and are not licensed under the MIT License. See `LICENSE-ARTWORK`.

## Distribution checklist

- Include `LICENSE`, `NOTICE`, `LICENSE-ARTWORK`, and this file in the release
  archive/installer.
- Include the `third_party/` license texts in the release archive.
- Keep the MinHook and WebView2 copyright notices with the distributed binaries.
- Do not remove license headers from bundled third-party source files.

