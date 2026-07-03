#include "ui/AppWindow.hpp"
#include "discord/DiscordRPC.hpp"
#include <windowsx.h>
#include <dwmapi.h>
#include <nlohmann/json.hpp>
#include <iostream>
#include <fstream>
#include <filesystem>
#include <thread>
#include <urlmon.h>

#pragma comment(lib, "urlmon.lib")

// Standard COM helper macros
#define CHECK_FAILURE(hr) if (FAILED(hr)) { std::cerr << "COM Failure: " << std::hex << hr << std::endl; return false; }

#include <functional>

// Macro to generate explicit WebView2 COM handler classes to resolve MinGW compilation issues
#define DEFINE_WEBVIEW2_CALLBACK(ClassName, InterfaceName, ArgsDecl, ArgsCall) \
class ClassName : public InterfaceName { \
public: \
    ClassName(std::function<HRESULT ArgsDecl> callback) : m_callback(callback), m_refCount(1) {} \
    virtual ~ClassName() {} \
    STDMETHODIMP QueryInterface(REFIID riid, void** ppvObject) override { \
        if (riid == IID_IUnknown || riid == IID_##InterfaceName) { \
            *ppvObject = static_cast<InterfaceName*>(this); \
            AddRef(); \
            return S_OK; \
        } \
        *ppvObject = nullptr; \
        return E_NOINTERFACE; \
    } \
    STDMETHODIMP_(ULONG) AddRef() override { return InterlockedIncrement(&m_refCount); } \
    STDMETHODIMP_(ULONG) Release() override { \
        ULONG count = InterlockedDecrement(&m_refCount); \
        if (count == 0) { delete this; } \
        return count; \
    } \
    STDMETHODIMP Invoke ArgsDecl override { return m_callback ArgsCall; } \
private: \
    std::function<HRESULT ArgsDecl> m_callback; \
    ULONG m_refCount; \
};

DEFINE_WEBVIEW2_CALLBACK(EnvCompletedHandler, ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler, 
    (HRESULT result, ICoreWebView2Environment* env), (result, env))

DEFINE_WEBVIEW2_CALLBACK(ControllerCompletedHandler, ICoreWebView2CreateCoreWebView2ControllerCompletedHandler, 
    (HRESULT result, ICoreWebView2Controller* controller), (result, controller))

DEFINE_WEBVIEW2_CALLBACK(MessageReceivedHandler, ICoreWebView2WebMessageReceivedEventHandler, 
    (ICoreWebView2* sender, ICoreWebView2WebMessageReceivedEventArgs* args), (sender, args))

namespace rune {

AppWindow::AppWindow(ProfileManager pm, ModImporter importer, DependencyResolver resolver, InjectionRunner runner)
    : m_profileManager(std::move(pm)), m_importer(std::move(importer)), m_resolver(std::move(resolver)), m_runner(std::move(runner)) {}

AppWindow::~AppWindow() {
    if (m_hWnd) {
        DestroyWindow(m_hWnd);
    }
}

LRESULT CALLBACK AppWindow::WndProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam) {
    AppWindow* pThis = reinterpret_cast<AppWindow*>(GetWindowLongPtr(hWnd, GWLP_USERDATA));

    switch (message) {
    case WM_NCCALCSIZE:
        if (wParam) {
            // Remove native Win32 title bar frame while keeping native shadow, rounded corners, and snap layouts
            return 0;
        }
        return DefWindowProc(hWnd, message, wParam, lParam);

    case WM_NCHITTEST: {
        POINT pt = { GET_X_LPARAM(lParam), GET_Y_LPARAM(lParam) };
        ScreenToClient(hWnd, &pt);

        RECT rect;
        GetClientRect(hWnd, &rect);

        const int border = 8; // Resize boundary width in pixels

        // Determine if mouse pointer is on resize borders
        bool isLeft = pt.x < border;
        bool isRight = pt.x >= rect.right - border;
        bool isTop = pt.y < border;
        bool isBottom = pt.y >= rect.bottom - border;

        if (isTop && isLeft) return HTTOPLEFT;
        if (isTop && isRight) return HTTOPRIGHT;
        if (isBottom && isLeft) return HTBOTTOMLEFT;
        if (isBottom && isRight) return HTBOTTOMRIGHT;

        if (isTop) return HTTOP;
        if (isBottom) return HTBOTTOM;
        if (isLeft) return HTLEFT;
        if (isRight) return HTRIGHT;

        // Match custom TitleBar height (40px)
        if (pt.y >= 0 && pt.y < 40) {
            // Ignore the rightmost 110px reserved for Min/Max/Close React buttons
            if (pt.x < rect.right - 110) {
                return HTCAPTION; // Allow window drag
            }
        }
        return HTCLIENT;
    }

    case WM_ERASEBKGND:
        return 1; // Suppress GDI background repaint to solve white flicker on resizing

    case WM_SIZE:
        if (pThis && pThis->m_webController) {
            RECT bounds;
            GetClientRect(hWnd, &bounds);
            pThis->m_webController->put_Bounds(bounds);
        }
        return 0;
    case WM_DESTROY:
        PostQuitMessage(0);
        return 0;
    default:
        return DefWindowProc(hWnd, message, wParam, lParam);
    }
}

bool AppWindow::create(int width, int height, const std::wstring& title) {
    HINSTANCE hInstance = GetModuleHandle(nullptr);

    // Register Win32 Window Class
    WNDCLASSEXW wcex = {};
    wcex.cbSize = sizeof(WNDCLASSEX);
    wcex.style = CS_HREDRAW | CS_VREDRAW;
    wcex.lpfnWndProc = WndProc;
    wcex.hInstance = hInstance;
    wcex.hCursor = LoadCursor(nullptr, IDC_ARROW);
    wcex.hbrBackground = (HBRUSH)(COLOR_WINDOW + 1);
    wcex.lpszClassName = L"RuneLauncherWindowClass";

    if (!RegisterClassExW(&wcex)) {
        std::cerr << "Failed to register window class." << std::endl;
        return false;
    }

    // Create Window
    m_hWnd = CreateWindowExW(
        0, L"RuneLauncherWindowClass", title.c_str(),
        WS_OVERLAPPEDWINDOW,
        CW_USEDEFAULT, CW_USEDEFAULT, width, height,
        nullptr, nullptr, hInstance, nullptr
    );

    if (!m_hWnd) {
        std::cerr << "Failed to create window." << std::endl;
        return false;
    }

    SetWindowLongPtr(m_hWnd, GWLP_USERDATA, reinterpret_cast<LONG_PTR>(this));

    // Force frame recalculation so NCCALCSIZE is triggered and removes the native title bar cleanly
    SetWindowPos(m_hWnd, nullptr, 0, 0, 0, 0, SWP_FRAMECHANGED | SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER);

    // Extend window frame using DWM to prevent standard double buttons from drawing on startup
    MARGINS margins = {0, 0, 0, 0};
    DwmExtendFrameIntoClientArea(m_hWnd, &margins);

    ShowWindow(m_hWnd, SW_SHOWNORMAL);
    UpdateWindow(m_hWnd);

    // Initialize WebView2
    if (!initializeWebView()) {
        std::cerr << "Failed to initialize WebView2." << std::endl;
        return false;
    }

    return true;
}

void AppWindow::runMessageLoop() {
    MSG msg;
    while (GetMessage(&msg, nullptr, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }
}

bool AppWindow::initializeWebView() {
    // Dynamically load WebView2Loader.dll at runtime to prevent OS startup link errors when distributed as a standalone EXE
    HMODULE hLoader = LoadLibraryW(L"WebView2Loader.dll");
    if (!hLoader) {
        std::cerr << "Failed to load WebView2Loader.dll dynamically." << std::endl;
        return false;
    }

    typedef HRESULT (STDAPICALLTYPE *CreateEnvWithOptionsFunc)(
        PCWSTR browserExecutableFolder,
        PCWSTR userDataFolder,
        ICoreWebView2EnvironmentOptions* environmentOptions,
        ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler* environmentCreatedHandler
    );

    auto pCreateEnv = (CreateEnvWithOptionsFunc)GetProcAddress(hLoader, "CreateCoreWebView2EnvironmentWithOptions");
    if (!pCreateEnv) {
        std::cerr << "Failed to locate CreateCoreWebView2EnvironmentWithOptions in WebView2Loader.dll." << std::endl;
        FreeLibrary(hLoader);
        return false;
    }

    HRESULT hr = pCreateEnv(
        nullptr, nullptr, nullptr,
        new EnvCompletedHandler(
            [this, hLoader](HRESULT result, ICoreWebView2Environment* env) -> HRESULT {
                if (FAILED(result)) {
                    FreeLibrary(hLoader);
                    return result;
                }

                env->CreateCoreWebView2Controller(
                    m_hWnd,
                    new ControllerCompletedHandler(
                        [this, env, hLoader](HRESULT res, ICoreWebView2Controller* controller) -> HRESULT {
                            if (FAILED(res)) {
                                FreeLibrary(hLoader);
                                return res;
                            }

                            m_webController = controller;
                            m_webController->get_CoreWebView2(&m_webView);

                            // Enable DevTools for debugging IPC connection
                            Microsoft::WRL::ComPtr<ICoreWebView2Settings> settings;
                            if (SUCCEEDED(m_webView->get_Settings(&settings))) {
                                settings->put_AreDevToolsEnabled(TRUE);
                                settings->put_AreDefaultContextMenusEnabled(FALSE); // Disable browser right-click menu
                            }

                            // Set default background color to transparent to prevent white flicker during resize
                            Microsoft::WRL::ComPtr<ICoreWebView2Controller2> controller2;
                            const IID local_IID_ICoreWebView2Controller2 = {0xc979903e, 0xd4ca, 0x4228, {0x92, 0xeb, 0x47, 0xee, 0x3f, 0xa9, 0x6e, 0xab}};
                            if (SUCCEEDED(m_webController->QueryInterface(local_IID_ICoreWebView2Controller2, reinterpret_cast<void**>(controller2.GetAddressOf())))) {
                                COREWEBVIEW2_COLOR transparentColor = {0, 0, 0, 0}; // Transparent (Alpha = 0)
                                controller2->put_DefaultBackgroundColor(transparentColor);
                            }

                            // Resize WebView to fit parent client bounds
                            RECT bounds;
                            GetClientRect(m_hWnd, &bounds);
                            m_webController->put_Bounds(bounds);

                            // 3. Configure folder mapping & Navigate
                            setupVirtualHostMapping();

                            // 4. Set up JS message receivers
                            registerBridgeCallbacks();

                            // 5. Send profiles to UI
                            syncProfilesToUI();

                            // Update initial Discord Rich Presence
                            DiscordRPC::getInstance().updateActivity("Profile: Default", "Browsing Mods", false);

                            // Keep hLoader active for the WebView lifetime
                            return S_OK;
                        }
                    )
                );
                return S_OK;
            }
        )
    );

    return SUCCEEDED(hr);
}

void AppWindow::setupVirtualHostMapping() {
    if (!m_webView) return;

    // Get ICoreWebView2_3 interface for folder mapping
    Microsoft::WRL::ComPtr<ICoreWebView2_3> webView3;
    HRESULT hr = m_webView->QueryInterface(IID_ICoreWebView2_3, reinterpret_cast<void**>(webView3.GetAddressOf()));
    if (SUCCEEDED(hr)) {
        // Resolve absolute folder path for static files (e.g. ui/dist or AppData ui folder)
        std::filesystem::path rootPath = m_profileManager.getProfilePath("Default").parent_path().parent_path();
        std::filesystem::path uiPath = rootPath / "Launcher" / "ui";
        if (!std::filesystem::exists(uiPath)) {
            // Fallback for Development Mode (running out of the local source repo)
            uiPath = rootPath / "ui" / "dist";
        }
        std::wstring uiPathStr = std::filesystem::absolute(uiPath).make_preferred().wstring();

        // Map http://rune-launcher.app to ui/dist
        webView3->SetVirtualHostNameToFolderMapping(
            L"rune-launcher.app",
            uiPathStr.c_str(),
            COREWEBVIEW2_HOST_RESOURCE_ACCESS_KIND_ALLOW
        );

        // Revert to HTTP scheme to bypass certificate warnings on local mapping while keeping JSON parsing active
        m_webView->Navigate(L"http://rune-launcher.app/index.html");
    } else {
        std::cerr << "Failed to query ICoreWebView2_3. Local mapping disabled." << std::endl;
        // Fallback navigation
        m_webView->Navigate(L"about:blank");
    }
}

void AppWindow::registerBridgeCallbacks() {
    if (!m_webView) return;

    m_webView->add_WebMessageReceived(
        new MessageReceivedHandler(
            [this](ICoreWebView2* /*sender*/, ICoreWebView2WebMessageReceivedEventArgs* args) -> HRESULT {
                LPWSTR messageRaw = nullptr;
                // Use get_WebMessageAsJson to correctly parse object postMessages sent from React
                if (SUCCEEDED(args->get_WebMessageAsJson(&messageRaw)) && messageRaw) {
                    std::wstring wMsg(messageRaw);
                    CoTaskMemFree(messageRaw);

                    // Convert wide string to utf8 string
                    int sizeNeeded = WideCharToMultiByte(CP_UTF8, 0, wMsg.c_str(), (int)wMsg.size(), nullptr, 0, nullptr, nullptr);
                    std::string u8Msg(sizeNeeded, 0);
                    WideCharToMultiByte(CP_UTF8, 0, wMsg.c_str(), (int)wMsg.size(), &u8Msg[0], sizeNeeded, nullptr, nullptr);

                    handleWebMessage(u8Msg);
                }
                return S_OK;
            }
        ),
        nullptr
    );
}

void AppWindow::postEventToUI(const std::string& eventName, const std::string& jsonDetail) const {
    if (!m_webView) return;

    try {
        // Wrap custom event and payload securely inside a single JSON object
        nlohmann::json message = {
            {"event", eventName},
            {"detail", nlohmann::json::parse(jsonDetail)}
        };
        
        std::string dump = message.dump();
        int sizeNeeded = MultiByteToWideChar(CP_UTF8, 0, dump.c_str(), (int)dump.size(), nullptr, 0);
        std::wstring wDump(sizeNeeded, 0);
        MultiByteToWideChar(CP_UTF8, 0, dump.c_str(), (int)dump.size(), &wDump[0], sizeNeeded);

        m_webView->PostWebMessageAsJson(wDump.c_str());
    } catch (const std::exception& e) {
        std::cerr << "Failed to post web message: " << e.what() << std::endl;
    }
}

void AppWindow::handleWebMessage(const std::string& messageJson) {
    std::cout << "[DEBUG] Received message from JS: " << messageJson << std::endl;
    try {
        auto msg = nlohmann::json::parse(messageJson);
        std::string action = msg.at("action").get<std::string>();

        if (action == "minimizeWindow") {
            ShowWindow(m_hWnd, SW_MINIMIZE);
        }
        else if (action == "dragWindow") {
            ReleaseCapture();
            SendMessageW(m_hWnd, WM_NCLBUTTONDOWN, HTCAPTION, 0);
        }
        else if (action == "maximizeWindow") {
            WINDOWPLACEMENT wp = { sizeof(wp) };
            if (GetWindowPlacement(m_hWnd, &wp)) {
                if (wp.showCmd == SW_SHOWMAXIMIZED) {
                    ShowWindow(m_hWnd, SW_SHOWNORMAL);
                } else {
                    ShowWindow(m_hWnd, SW_SHOWMAXIMIZED);
                }
            }
        }
        else if (action == "closeWindow") {
            PostMessage(m_hWnd, WM_CLOSE, 0, 0);
        }
        else if (action == "getAppVersion") {
            nlohmann::json response = {
                {"version", RUNE_LAUNCHER_VERSION}
            };
            postEventToUI("appVersion", response.dump());
        }
        else if (action == "triggerUpdate") {
            if (!m_isUpdating) {
                std::string downloadUrl = msg.at("data").at("url").get<std::string>();
                std::cout << "[System] Auto-update triggered. URL: " << downloadUrl << std::endl;
                startUpdateDownload(downloadUrl);
            }
        }
        else if (action == "getProfiles") {
            syncProfilesToUI();
        } 
        else if (action == "switchProfile") {
            std::string profileName = msg.at("data").at("name").get<std::string>();
            std::cout << "Switching profile to: " << profileName << std::endl;
            // State updates inside launcher backend can be done here.
            
            // Update Discord Rich Presence
            DiscordRPC::getInstance().updateActivity("Profile: " + profileName, "Browsing Mods", false);

            // Re-sync after switch
            syncProfilesToUI();
        } 
        else if (action == "launchGame") {
            std::cout << "Triggering game launch..." << std::endl;
            
            // Asynchronously start launch sequence to avoid blocking the Win32 main thread
            std::thread([this]() {
                std::vector<std::string> errors;
                std::string activeProfile = "Default"; // Simple default profile target for MVP
                
                postEventToUI("launchStatus", "{\"status\": \"resolving\"}");
                
                // Update Rich Presence to "Playing Minecraft" during gameplay
                DiscordRPC::getInstance().updateActivity("Profile: " + activeProfile, "Playing Minecraft", true);
                
                bool success = m_runner.run(activeProfile, L"Minecraft.Windows.exe");
                if (success) {
                    postEventToUI("launchStatus", "{\"status\": \"success\"}");
                } else {
                    postEventToUI("launchStatus", "{\"status\": \"failed\"}");
                    // Revert back to Browsing on failure
                    DiscordRPC::getInstance().updateActivity("Profile: " + activeProfile, "Browsing Mods", false);
                }
            }).detach();
        }
        else if (action == "selectAndImportFile") {
            // Native open file dialog (COM/Win32)
            OPENFILENAMEW ofn = {};
            wchar_t szFile[260] = { 0 };
            ofn.lStructSize = sizeof(ofn);
            ofn.hwndOwner = m_hWnd;
            ofn.lpstrFile = szFile;
            ofn.nMaxFile = sizeof(szFile) / sizeof(wchar_t);
            ofn.lpstrFilter = L"Mod Files (*.dll;*.runemod)\0*.dll;*.runemod\0All Files (*.*)\0*.*\0";
            ofn.nFilterIndex = 1;
            ofn.Flags = OFN_PATHMUSTEXIST | OFN_FILEMUSTEXIST;

            if (GetOpenFileNameW(&ofn)) {
                std::filesystem::path filePath(ofn.lpstrFile);
                std::string activeProfile = "Default";
                
                std::cout << "Selected file: " << filePath.string() << std::endl;
                bool success = m_importer.importFile(filePath, activeProfile);
                
                if (success) {
                    postEventToUI("importStatus", "{\"status\": \"success\", \"message\": \"Mod imported successfully!\"}");
                } else {
                    postEventToUI("importStatus", "{\"status\": \"failed\", \"message\": \"Failed to validate or extract mod.\"}");
                }
                syncProfilesToUI();
            }
        }
    } catch (const std::exception& e) {
        std::cerr << "Failed to parse web message JSON: " << e.what() << std::endl;
    }
}

void AppWindow::syncProfilesToUI() const {
    std::cout << "[DEBUG] syncProfilesToUI called" << std::endl;
    try {
        auto profiles = m_profileManager.getProfiles();
        std::string activeProfile = "Default"; // Default active for MVP
        
        std::filesystem::path profilePath = m_profileManager.getProfilePath(activeProfile);
        std::filesystem::path modsPath = profilePath / "mods";
        
        nlohmann::json modsArray = nlohmann::json::array();
        
        if (std::filesystem::exists(modsPath)) {
            for (const auto& entry : std::filesystem::directory_iterator(modsPath)) {
                if (entry.is_directory()) {
                    std::filesystem::path manifestPath = entry.path() / "manifest.json";
                    if (std::filesystem::exists(manifestPath)) {
                        std::ifstream manifestFile(manifestPath);
                        if (manifestFile.is_open()) {
                            nlohmann::json manifest;
                            manifestFile >> manifest;
                            
                            nlohmann::json modInfo = {
                                {"id", manifest.value("id", entry.path().filename().string())},
                                {"name", manifest.value("name", entry.path().filename().string())},
                                {"version", manifest.value("version", "1.0.0")},
                                {"entrypoint", manifest.value("entrypoint", "")}
                            };
                            modsArray.push_back(modInfo);
                        }
                    }
                }
            }
        }

        // Scan profiles/[Profile]/external/ for raw client DLLs
        std::filesystem::path externalPath = profilePath / "external";
        nlohmann::json externalsArray = nlohmann::json::array();
        
        if (std::filesystem::exists(externalPath)) {
            for (const auto& entry : std::filesystem::directory_iterator(externalPath)) {
                if (entry.is_regular_file() && entry.path().extension() == ".dll") {
                    nlohmann::json extInfo = {
                        {"name", entry.path().filename().string()},
                        {"path", "external/" + entry.path().filename().string()}
                    };
                    externalsArray.push_back(extInfo);
                }
            }
        }

        nlohmann::json detail = {
            {"profiles", profiles},
            {"active", activeProfile},
            {"mods", modsArray},
            {"externals", externalsArray},
            {"version", RUNE_LAUNCHER_VERSION}
        };
        postEventToUI("profilesUpdated", detail.dump());
    } catch (const std::exception& e) {
        std::cerr << "Failed to sync profiles to UI: " << e.what() << std::endl;
    }
}

void AppWindow::startUpdateDownload(const std::string& downloadUrl) {
    m_isUpdating = true;
    postEventToUI("updateStatus", "{\"status\": \"downloading\"}");

    std::thread([this, downloadUrl]() {
        try {
            // Resolve absolute path to AppData/Local/Rune/Launcher
            std::filesystem::path rootPath = m_profileManager.getProfilePath("Default").parent_path().parent_path();
            std::filesystem::path launcherFolder = rootPath / "Launcher";
            std::filesystem::path newExePath = launcherFolder / "launcher.new";

            // If we are in dev mode, newExePath will be next to the current exe
            wchar_t modulePath[MAX_PATH];
            if (GetModuleFileNameW(nullptr, modulePath, MAX_PATH) != 0) {
                std::filesystem::path currentExe(modulePath);
                // Check if running from dev directory (has CMakeLists.txt/build.ps1 in folder or parent)
                std::filesystem::path devRoot = currentExe.parent_path();
                bool isDev = std::filesystem::exists(devRoot / "CMakeLists.txt") || std::filesystem::exists(devRoot / "build.ps1");
                if (!isDev && devRoot.has_parent_path()) {
                    isDev = std::filesystem::exists(devRoot.parent_path() / "CMakeLists.txt") || std::filesystem::exists(devRoot.parent_path() / "build.ps1");
                }
                if (isDev) {
                    newExePath = currentExe.parent_path() / "launcher.new";
                }
            }

            // Convert URL to wstring
            int sizeNeeded = MultiByteToWideChar(CP_UTF8, 0, downloadUrl.c_str(), (int)downloadUrl.size(), nullptr, 0);
            std::wstring wUrl(sizeNeeded, 0);
            MultiByteToWideChar(CP_UTF8, 0, downloadUrl.c_str(), (int)downloadUrl.size(), &wUrl[0], sizeNeeded);

            std::wstring wDest = newExePath.wstring();

            // Download file synchronously in this background thread
            HRESULT hr = URLDownloadToFileW(nullptr, wUrl.c_str(), wDest.c_str(), 0, nullptr);
            if (SUCCEEDED(hr)) {
                std::cout << "[System] Downloaded update binary successfully to " << newExePath.string() << std::endl;
                postEventToUI("updateStatus", "{\"status\": \"applying\"}");
                
                // Introduce small delay to ensure UI states render correctly
                std::this_thread::sleep_for(std::chrono::milliseconds(1000));
                
                finalizeAndRestart(newExePath);
            } else {
                std::cerr << "[System] Failed to download update binary. HRESULT: " << std::hex << hr << std::endl;
                m_isUpdating = false;
                postEventToUI("updateStatus", "{\"status\": \"failed\"}");
            }
        } catch (const std::exception& e) {
            std::cerr << "[System] Exception in update download thread: " << e.what() << std::endl;
            m_isUpdating = false;
            postEventToUI("updateStatus", "{\"status\": \"failed\"}");
        }
    }).detach();
}

void AppWindow::finalizeAndRestart(const std::filesystem::path& newExePath) {
    try {
        wchar_t modulePath[MAX_PATH];
        if (GetModuleFileNameW(nullptr, modulePath, MAX_PATH) == 0) {
            throw std::runtime_error("Failed to retrieve current executable path.");
        }
        std::filesystem::path currentExe(modulePath);
        std::filesystem::path oldExe = currentExe.parent_path() / "launcher.old";

        // Remove previous launcher.old if it exists
        if (std::filesystem::exists(oldExe)) {
            try { std::filesystem::remove(oldExe); } catch(...) {}
        }

        // Rename running exe to launcher.old
        std::filesystem::rename(currentExe, oldExe);

        // Rename launcher.new to launcher.exe
        std::filesystem::rename(newExePath, currentExe);

        // Launch the newly updated executable
        STARTUPINFOW si = { sizeof(si) };
        PROCESS_INFORMATION pi;
        std::wstring cmd = L"\"" + currentExe.wstring() + L"\"";
        if (CreateProcessW(nullptr, &cmd[0], nullptr, nullptr, FALSE, 0, nullptr, nullptr, &si, &pi)) {
            CloseHandle(pi.hProcess);
            CloseHandle(pi.hThread);
        } else {
            // On launch failure, try to restore back to original state
            std::filesystem::rename(currentExe, newExePath);
            std::filesystem::rename(oldExe, currentExe);
            throw std::runtime_error("Failed to spawn the newly updated process.");
        }

        // Exit process immediately
        ExitProcess(0);

    } catch (const std::exception& e) {
        std::cerr << "[System] Self update replacement failed: " << e.what() << std::endl;
        m_isUpdating = false;
        postEventToUI("updateStatus", "{\"status\": \"failed\"}");
    }
}

} // namespace rune
