#include "VersionManager.hpp"
#include <windows.h>
#include <shlobj.h>
#include <filesystem>
#include <iostream>
#include <algorithm>
#include <nlohmann/json.hpp>

namespace fs = std::filesystem;

// Helper to convert wstring to utf8 string
static std::string utf8_encode(const std::wstring &wstr) {
    if (wstr.empty()) return std::string();
    int size_needed = WideCharToMultiByte(CP_UTF8, 0, &wstr[0], (int)wstr.size(), NULL, 0, NULL, NULL);
    std::string strTo(size_needed, 0);
    WideCharToMultiByte(CP_UTF8, 0, &wstr[0], (int)wstr.size(), &strTo[0], size_needed, NULL, NULL);
    return strTo;
}

std::wstring VersionManager::getProductVersion(const std::wstring& filePath) {
    DWORD dummy;
    DWORD size = GetFileVersionInfoSizeW(filePath.c_str(), &dummy);
    if (size == 0) return L"Unknown";

    std::vector<BYTE> buffer(size);
    if (!GetFileVersionInfoW(filePath.c_str(), 0, size, buffer.data())) {
        return L"Unknown";
    }

    VS_FIXEDFILEINFO* fileInfo = nullptr;
    UINT len = 0;
    if (VerQueryValueW(buffer.data(), L"\\", (LPVOID*)&fileInfo, &len) && len > 0 && fileInfo != nullptr) {
        DWORD dwLeftMost = HIWORD(fileInfo->dwProductVersionMS);
        DWORD dwSecondLeft = LOWORD(fileInfo->dwProductVersionMS);
        DWORD dwSecondRight = HIWORD(fileInfo->dwProductVersionLS);
        DWORD dwRightMost = LOWORD(fileInfo->dwProductVersionLS);
        
        return std::to_wstring(dwLeftMost) + L"." +
               std::to_wstring(dwSecondLeft) + L"." +
               std::to_wstring(dwSecondRight) + L"." +
               std::to_wstring(dwRightMost);
    }
    return L"Unknown";
}

std::vector<MinecraftVersion> VersionManager::scanVersions(bool scanEnabled) {
    std::vector<MinecraftVersion> results;
    if (!scanEnabled) {
        return results;
    }

    // Get APPDATA (Roaming) and LOCALAPPDATA (Local) path via environmental variables
    std::wstring appDataPath;
    std::wstring localAppDataPath;

    wchar_t* appDataVar = nullptr;
    size_t len = 0;
    if (_wdupenv_s(&appDataVar, &len, L"APPDATA") == 0 && appDataVar != nullptr) {
        appDataPath = appDataVar;
        free(appDataVar);
    }

    wchar_t* localAppDataVar = nullptr;
    if (_wdupenv_s(&localAppDataVar, &len, L"LOCALAPPDATA") == 0 && localAppDataVar != nullptr) {
        localAppDataPath = localAppDataVar;
        free(localAppDataVar);
    }

    // 1. Scan LeviLauncher
    // Path: APPDATA\levilauncher.exe\versions\<instance_name>\Minecraft.Windows.exe
    if (!appDataPath.empty()) {
        fs::path leviBase = fs::path(appDataPath) / L"levilauncher.exe" / L"versions";
        if (fs::exists(leviBase) && fs::is_directory(leviBase)) {
            for (const auto& entry : fs::directory_iterator(leviBase)) {
                if (entry.is_directory()) {
                    fs::path exePath = entry.path() / L"Minecraft.Windows.exe";
                    if (fs::exists(exePath)) {
                        std::wstring instanceName = entry.path().filename().wstring();
                        std::wstring verStr = getProductVersion(exePath.wstring());
                        
                        MinecraftVersion mv;
                        mv.name = instanceName + L" (" + verStr + L") [LeviLauncher]";
                        mv.path = exePath.wstring();
                        mv.source = L"levimc";
                        mv.version = verStr;
                        results.push_back(mv);
                    }
                }
            }
        }
    }

    // 2. Scan Oderso
    // Path: LOCALAPPDATA\OderSo\Versions\<instance_name>\Minecraft.Windows.exe
    if (!localAppDataPath.empty()) {
        fs::path odersoBase = fs::path(localAppDataPath) / L"OderSo" / L"Versions";
        if (fs::exists(odersoBase) && fs::is_directory(odersoBase)) {
            for (const auto& entry : fs::directory_iterator(odersoBase)) {
                if (entry.is_directory()) {
                    fs::path exePath = entry.path() / L"Minecraft.Windows.exe";
                    if (fs::exists(exePath)) {
                        std::wstring instanceName = entry.path().filename().wstring();
                        std::wstring verStr = getProductVersion(exePath.wstring());
                        
                        MinecraftVersion mv;
                        mv.name = instanceName + L" (" + verStr + L") [OderSo]";
                        mv.path = exePath.wstring();
                        mv.source = L"oderso";
                        mv.version = verStr;
                        results.push_back(mv);
                    }
                }
            }
        }
    }

    return results;
}

std::string VersionManager::serializeToJson(const std::vector<MinecraftVersion>& versions) {
    nlohmann::json arr = nlohmann::json::array();
    for (const auto& v : versions) {
        nlohmann::json obj = {
            {"name", utf8_encode(v.name)},
            {"path", utf8_encode(v.path)},
            {"source", utf8_encode(v.source)},
            {"version", utf8_encode(v.version)}
        };
        arr.push_back(obj);
    }
    return arr.dump();
}
