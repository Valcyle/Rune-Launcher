#include "profile/ProfileManager.hpp"
#include "profile/ModImporter.hpp"
#include "injection/DependencyResolver.hpp"
#include "injection/InjectionRunner.hpp"
#include "ui/AppWindow.hpp"
#include "ui/GeneratedResources.hpp"
#include "discord/DiscordRPC.hpp"
#include <iostream>
#include <fstream>
#include <shlobj.h>
#include <objbase.h>
#include <wrl/client.h>
#include <windows.h>

bool createDesktopShortcut(const std::filesystem::path& targetExePath) {
    Microsoft::WRL::ComPtr<IShellLinkW> shellLink;
    HRESULT hr = CoCreateInstance(CLSID_ShellLink, nullptr, CLSCTX_INPROC_SERVER, IID_PPV_ARGS(&shellLink));
    if (SUCCEEDED(hr)) {
        shellLink->SetPath(targetExePath.wstring().c_str());
        shellLink->SetDescription(L"Rune Launcher Shortcut");
        shellLink->SetWorkingDirectory(targetExePath.parent_path().wstring().c_str());
        
        Microsoft::WRL::ComPtr<IPersistFile> persistFile;
        hr = shellLink.As(&persistFile);
        if (SUCCEEDED(hr)) {
            wchar_t desktopPath[MAX_PATH];
            if (SUCCEEDED(SHGetFolderPathW(nullptr, CSIDL_DESKTOP, nullptr, 0, desktopPath))) {
                std::filesystem::path linkPath = std::filesystem::path(desktopPath) / L"Rune Launcher.lnk";
                hr = persistFile->Save(linkPath.wstring().c_str(), TRUE);
                return SUCCEEDED(hr);
            }
        }
    }
    return false;
}

bool extractFile(const std::filesystem::path& destPath, const unsigned char* data, size_t size) {
    try {
        std::filesystem::create_directories(destPath.parent_path());
        std::ofstream outFile(destPath, std::ios::binary);
        if (!outFile.is_open()) return false;
        outFile.write(reinterpret_cast<const char*>(data), size);
        return true;
    } catch (...) {
        return false;
    }
}

int main(int argc, char* argv[]) {
    bool isDevMode = false;
    try {
        // 1. Resolve run environment and paths
        std::filesystem::path exePath = std::filesystem::absolute(argv[0]);
        std::filesystem::path appDataRoot = "";
        wchar_t localAppData[MAX_PATH];
        if (SUCCEEDED(SHGetFolderPathW(nullptr, CSIDL_LOCAL_APPDATA, nullptr, 0, localAppData))) {
            appDataRoot = std::filesystem::path(localAppData) / "Rune";
        }

        // Detect Dev Mode safely without entering recursive root parent loops
        std::filesystem::path devRoot = exePath.parent_path();
        if (std::filesystem::exists(devRoot / "CMakeLists.txt") || std::filesystem::exists(devRoot / "build.ps1")) {
            isDevMode = true;
        } else if (devRoot.has_parent_path()) {
            std::filesystem::path parentRoot = devRoot.parent_path();
            if (std::filesystem::exists(parentRoot / "CMakeLists.txt") || std::filesystem::exists(parentRoot / "build.ps1")) {
                isDevMode = true;
                devRoot = parentRoot;
            }
        }

        std::filesystem::path rootPath;
        std::filesystem::path launcherFolder;

        HRESULT hrCOM = CoInitializeEx(nullptr, COINIT_APARTMENTTHREADED | COINIT_DISABLE_OLE1DDE);
        if (FAILED(hrCOM)) {
            std::cerr << "Failed to initialize COM library." << std::endl;
            return 1;
        }

        if (isDevMode) {
            // Allocate a console window for debug mode on Windows GUI applications
            AllocConsole();
            FILE* fDummy;
            freopen_s(&fDummy, "CONOUT$", "w", stdout);
            freopen_s(&fDummy, "CONOUT$", "w", stderr);
            std::cout << "[System] Debug console allocated for Development Mode." << std::endl;

            rootPath = devRoot;
            launcherFolder = exePath.parent_path();
            // In Dev Mode, ensure WebView2Loader.dll is present next to the exe
            std::filesystem::path dllPath = launcherFolder / "WebView2Loader.dll";
            if (!std::filesystem::exists(dllPath)) {
                extractFile(dllPath, rune::EMBEDDED_LOADER_DLL, rune::EMBEDDED_LOADER_DLL_SIZE);
            }
        } else {
            rootPath = appDataRoot;
            launcherFolder = appDataRoot / "Launcher";

            std::filesystem::path installedExe = launcherFolder / "launcher.exe";
            bool isInstalled = false;
            // Prevent equivalent() from throwing filesystem_error when the AppData folder doesn't exist yet
            if (std::filesystem::exists(launcherFolder) && std::filesystem::exists(installedExe)) {
                try {
                    isInstalled = std::filesystem::equivalent(exePath.parent_path(), launcherFolder);
                } catch (...) {
                    isInstalled = false;
                }
            }

            if (!isInstalled) {
                // Self-installation prompt for production users (English for global distribution)
                int result = MessageBoxW(
                    nullptr,
                    L"Would you like to install Rune Launcher to your system?\n(This will extract launcher assets to AppData/Local/Rune and create a desktop shortcut)",
                    L"Rune Launcher Setup",
                    MB_YESNO | MB_ICONQUESTION
                );

                if (result == IDYES) {
                    std::filesystem::create_directories(launcherFolder);
                    std::filesystem::create_directories(appDataRoot / "profiles");

                    // Copy executable
                    std::filesystem::copy_file(exePath, installedExe, std::filesystem::copy_options::overwrite_existing);

                    // Extract DLL next to the installed target
                    extractFile(launcherFolder / "WebView2Loader.dll", rune::EMBEDDED_LOADER_DLL, rune::EMBEDDED_LOADER_DLL_SIZE);

                    // Extract RuneCore.dll to rootPath for the InjectionRunner
                    extractFile(rootPath / "RuneCore.dll", rune::EMBEDDED_RUNE_CORE_DLL, rune::EMBEDDED_RUNE_CORE_DLL_SIZE);

                    // Extract all UI static files
                    for (size_t i = 0; i < rune::EMBEDDED_UI_FILES_COUNT; ++i) {
                        const auto& uiFile = rune::EMBEDDED_UI_FILES[i];
                        std::filesystem::path fileDest = launcherFolder / "ui" / uiFile.relativePath;
                        extractFile(fileDest, uiFile.data, uiFile.size);
                    }

                    // Create Desktop shortcut
                    createDesktopShortcut(installedExe);

                    MessageBoxW(nullptr, L"Installation completed successfully!\nPlease launch the app using the desktop shortcut.", L"Success", MB_OK | MB_ICONINFORMATION);

                    // Spawn the installed executable
                    STARTUPINFOW si = { sizeof(si) };
                    PROCESS_INFORMATION pi;
                    std::wstring cmd = L"\"" + installedExe.wstring() + L"\"";
                    if (CreateProcessW(nullptr, &cmd[0], nullptr, nullptr, FALSE, 0, nullptr, nullptr, &si, &pi)) {
                        CloseHandle(pi.hProcess);
                        CloseHandle(pi.hThread);
                    }
                    CoUninitialize();
                    return 0;
                } else {
                    CoUninitialize();
                    return 0; // Terminate if user declines
                }
            } else {
                // If already running from installed AppData, unpack latest embedded UI on startup (supports seamless updates)
                std::filesystem::path dllPath = launcherFolder / "WebView2Loader.dll";
                if (!std::filesystem::exists(dllPath)) {
                    extractFile(dllPath, rune::EMBEDDED_LOADER_DLL, rune::EMBEDDED_LOADER_DLL_SIZE);
                }
                // Unpack RuneCore.dll on startup for update consistency
                extractFile(rootPath / "RuneCore.dll", rune::EMBEDDED_RUNE_CORE_DLL, rune::EMBEDDED_RUNE_CORE_DLL_SIZE);

                for (size_t i = 0; i < rune::EMBEDDED_UI_FILES_COUNT; ++i) {
                    const auto& uiFile = rune::EMBEDDED_UI_FILES[i];
                    std::filesystem::path fileDest = launcherFolder / "ui" / uiFile.relativePath;
                    extractFile(fileDest, uiFile.data, uiFile.size);
                }
            }
        }

        // 2. Launch normal routine
        rune::ProfileManager pm(rootPath);
        pm.initialize();

        // Initialize Discord Rich Presence with Client ID
        rune::DiscordRPC::getInstance().initialize("1522358629704138913");

        rune::ModImporter importer(pm);
        rune::DependencyResolver resolver(pm);
        rune::InjectionRunner runner(pm, resolver);
        std::string activeProfile = "Default";

        bool runLaunch = false;
        bool hasConsoleArg = false;
        std::wstring targetProcess = L"Minecraft.Windows.exe";

        for (int i = 1; i < argc; ++i) {
            std::string arg = argv[i];
            if (arg == "-import" && i + 1 < argc) {
                hasConsoleArg = true;
                std::filesystem::path fileToImport(argv[i + 1]);
                std::cout << "Attempting to import file: " << fileToImport.string() << std::endl;
                bool success = importer.importFile(fileToImport, activeProfile);
                std::cout << (success ? "Import SUCCEEDED." : "Import FAILED.") << std::endl;
                if (!success) {
                    rune::DiscordRPC::getInstance().shutdown();
                    if (isDevMode) FreeConsole();
                    CoUninitialize();
                    return 1;
                }
                i++;
            } else if (arg == "-launch") {
                hasConsoleArg = true;
                runLaunch = true;
                if (i + 1 < argc && argv[i + 1][0] != '-') {
                    std::string procName = argv[i + 1];
                    targetProcess = std::wstring(procName.begin(), procName.end());
                    i++;
                }
            }
        }

        if (hasConsoleArg) {
            if (runLaunch) {
                std::cout << "\nStarting launch and injection runner..." << std::endl;
                bool success = runner.run(activeProfile, targetProcess);
                if (success) {
                    std::cout << "Injection sequence COMPLETED successfully." << std::endl;
                } else {
                    std::cerr << "Injection sequence FAILED." << std::endl;
                    rune::DiscordRPC::getInstance().shutdown();
                    if (isDevMode) FreeConsole();
                    CoUninitialize();
                    return 1;
                }
            }
        } else {
            // UI Mode: Host WebView2 UI
            {
                rune::AppWindow app(pm, importer, resolver, runner);
                if (app.create(1024, 768, L"Rune Launcher")) {
                    app.runMessageLoop();
                }
            }
        }
        rune::DiscordRPC::getInstance().shutdown();
        if (isDevMode) FreeConsole();
        CoUninitialize();
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        rune::DiscordRPC::getInstance().shutdown();
        if (isDevMode) FreeConsole();
        CoUninitialize();
        return 1;
    }
    return 0;
}
