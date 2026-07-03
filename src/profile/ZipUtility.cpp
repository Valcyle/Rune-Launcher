#include "profile/ZipUtility.hpp"
#include <windows.h>
#include <shldisp.h>
#include <comdef.h>
#include <iostream>

namespace rune {

bool extractZip(const std::filesystem::path& zipPath, const std::filesystem::path& destPath) {
    if (!std::filesystem::exists(destPath)) {
        std::filesystem::create_directories(destPath);
    }

    // Initialize COM library
    HRESULT hr = CoInitializeEx(NULL, COINIT_APARTMENTTHREADED | COINIT_DISABLE_OLE1DDE);
    if (FAILED(hr) && hr != RPC_E_CHANGED_MODE) {
        std::cerr << "CoInitializeEx failed: " << std::hex << hr << std::endl;
        return false;
    }

    bool success = false;
    IShellDispatch* pShell = nullptr;
    
    // Create Shell instance
    hr = CoCreateInstance(CLSID_Shell, nullptr, CLSCTX_INPROC_SERVER, IID_IShellDispatch, (void**)&pShell);
    if (SUCCEEDED(hr)) {
        Folder* pZipFolder = nullptr;
        Folder* pDestFolder = nullptr;

        // COM needs absolute paths and wide strings
        std::wstring zipStr = std::filesystem::absolute(zipPath).make_preferred().wstring();
        std::wstring destStr = std::filesystem::absolute(destPath).make_preferred().wstring();

        _variant_t varZip(zipStr.c_str());
        _variant_t varDest(destStr.c_str());

        HRESULT hrZip = pShell->NameSpace(varZip, &pZipFolder);
        HRESULT hrDest = pShell->NameSpace(varDest, &pDestFolder);

        if (SUCCEEDED(hrZip) && SUCCEEDED(hrDest) && pZipFolder && pDestFolder) {
            FolderItems* pItems = nullptr;
            hr = pZipFolder->Items(&pItems);
            if (SUCCEEDED(hr) && pItems) {
                // Options: 
                // 4    = Do not show progress dialog.
                // 16   = Respond "Yes to All" to any dialog boxes.
                // 1024 = Do not show UI on error.
                _variant_t varOptions(static_cast<long>(4 | 16 | 1024));
                _variant_t varItems(pItems);
                
                hr = pDestFolder->CopyHere(varItems, varOptions);
                if (SUCCEEDED(hr)) {
                    success = true;
                }
                pItems->Release();
            }
        }

        if (pZipFolder) pZipFolder->Release();
        if (pDestFolder) pDestFolder->Release();
        pShell->Release();
    }

    CoUninitialize();
    return success;
}

} // namespace rune
