#pragma once
#include <windows.h>
#include <WebView2.h>
#include <wrl.h>
#include <string>
#include <vector>
#include <memory>
#include "profile/ProfileManager.hpp"
#include "profile/ModImporter.hpp"
#include "injection/DependencyResolver.hpp"
#include "injection/InjectionRunner.hpp"

namespace rune {

/**
 * @brief Manages the Win32 application window and WebView2 control life cycle.
 */
class AppWindow {
public:
    AppWindow(ProfileManager pm, ModImporter importer, DependencyResolver resolver, InjectionRunner runner);
    ~AppWindow();

    // Launcher Version Definition
    static inline const std::string RUNE_LAUNCHER_VERSION = "1.0.0-beta.4";

    /**
     * @brief Creates the Win32 window and initializes WebView2.
     * @param width Width of the window.
     * @param height Height of the window.
     * @param title Title of the window.
     * @return true if successful, false otherwise.
     */
    bool create(int width, int height, const std::wstring& title);

    /**
     * @brief Runs the Win32 message loop. Blocks until the window is closed.
     */
    void runMessageLoop();

private:
    // Window procedure callback
    static LRESULT CALLBACK WndProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam);

    // Initializes WebView2 control inside the window
    bool initializeWebView();

    // Setup host to frontend folder mapping (SetVirtualHostNameToFolderMapping)
    void setupVirtualHostMapping();

    // Register JS -> C++ messaging handler
    void registerBridgeCallbacks();

    // Helper to send events to JS context
    void postEventToUI(const std::string& eventName, const std::string& jsonDetail) const;

    // Handler for messages received from JavaScript
    void handleWebMessage(const std::string& messageJson);

    // Sends profile list and statuses to React UI
    void syncProfilesToUI() const;

private:
    HWND m_hWnd = nullptr;
    
    // WebView2 Interface pointers
    Microsoft::WRL::ComPtr<ICoreWebView2Controller> m_webController;
    Microsoft::WRL::ComPtr<ICoreWebView2> m_webView;

    // Asynchronously downloads new exe and triggers self-update replacement
    void startUpdateDownload(const std::string& downloadUrl);
    void finalizeAndRestart(const std::filesystem::path& newExePath);

    // Backend dependencies
    ProfileManager m_profileManager;
    ModImporter m_importer;
    DependencyResolver m_resolver;
    InjectionRunner m_runner;

    // Update flag to prevent concurrent updates
    bool m_isUpdating = false;

    // Active Profile State
    std::string m_activeProfile = "Default";
};

} // namespace rune
