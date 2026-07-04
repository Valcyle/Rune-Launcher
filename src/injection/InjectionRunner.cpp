#include "injection/InjectionRunner.hpp"
#include "injection/Injector.hpp"
#include "ui/Logger.hpp"
#include <nlohmann/json.hpp>
#include <fstream>
#include <iostream>
#include <thread>
#include <chrono>

namespace rune {

InjectionRunner::InjectionRunner(ProfileManager profileManager, DependencyResolver resolver)
    : m_profileManager(std::move(profileManager)), m_resolver(std::move(resolver)) {}

bool InjectionRunner::run(const std::string& activeProfileName, const std::wstring& targetProcessName) const {
    // 1. Verify dependencies first
    std::vector<std::string> depErrors;
    if (!m_resolver.resolve(activeProfileName, depErrors)) {
        std::cerr << "Cannot inject. Dependency resolution failed:" << std::endl;
        for (const auto& err : depErrors) {
            std::cerr << " - " << err << std::endl;
        }
        return false;
    }

    std::filesystem::path profilePath = m_profileManager.getProfilePath(activeProfileName);
    std::vector<std::filesystem::path> dllsToInject;

    // Build the list of DLLs to inject in the correct order:
    // Add global Loader Core DLL (RuneCore.dll) located in the launcher root directory.
    std::filesystem::path rootPath = profilePath.parent_path().parent_path();
    dllsToInject.push_back(std::filesystem::absolute(rootPath / "RuneCore.dll"));
    
    // Loop and add all .dll files inside "profiles/[Active_Profile]/external/"
    std::filesystem::path externalPath = profilePath / "external";
    if (std::filesystem::exists(externalPath)) {
        for (const auto& entry : std::filesystem::directory_iterator(externalPath)) {
            if (entry.path().extension() == ".dll") {
                dllsToInject.push_back(std::filesystem::absolute(entry.path()));
            }
        }
    }
    
    // Loop through all folders in "profiles/[Active_Profile]/mods/"
    //         - For each folder, read manifest.json
    //         - Extract the "entrypoint" DLL name
    //         - Add its absolute path (mods/[Mod_ID]/[entrypoint]) to the injection list.
    //         Hint: Re-use your scoped ifstream manifest reading logic.
    std::filesystem::path modsPath = profilePath / "mods";
    if (std::filesystem::exists(modsPath)) {
        for (const auto& entry : std::filesystem::directory_iterator(modsPath)) {
            if (entry.is_directory()) {
                std::filesystem::path manifestPath = entry.path() / "manifest.json";
                if (std::filesystem::exists(manifestPath)) {
                    std::ifstream manifestFile(manifestPath);
                    if (manifestFile.is_open()) {
                        nlohmann::json manifest;
                        manifestFile >> manifest;
                        if (manifest.contains("entrypoint")) {
                            std::string entrypointName = manifest["entrypoint"].get<std::string>();
                            dllsToInject.push_back(std::filesystem::absolute(entry.path() / entrypointName));
                        }
                    }
                }
            }
        }
    }
    
    // Scan for target process
    Logger::getInstance().log(Logger::Level::Info, "InjectionRunner", "Waiting for Minecraft process...");
    DWORD pid = 0;
    pid = findProcessId(targetProcessName);
    if (pid == 0) {
        // Game is not running, trigger startup via protocol link
        Logger::getInstance().log(Logger::Level::Debug, "InjectionRunner", "Minecraft process not found. Launching via protocol handler...");
        ShellExecute(NULL, "open", "cmd", "/c start minecraft://", NULL, SW_HIDE);
        Logger::getInstance().log(Logger::Level::Info, "InjectionRunner", "Launched Minecraft. Awaiting process spawn...");
        
        // Loop up to 30 times (15 seconds max) to await process spawn
        for (int i = 0; i < 30; ++i) {
            std::this_thread::sleep_for(std::chrono::milliseconds(500));
            pid = findProcessId(targetProcessName);
            if (pid != 0) {
                break;
            }
        }
    }

    if (pid == 0) {
        Logger::getInstance().log(Logger::Level::Error, "InjectionRunner", "Failed to detect Minecraft process after startup.");
        return false;
    }
    
    Logger::getInstance().log(Logger::Level::Info, "InjectionRunner", "Target process detected (PID: " + std::to_string(pid) + "). Awaiting process initialization...");
    // Give UWP sandbox runtime extra 2 seconds to initialize memory and dynamic libraries fully before injection
    std::this_thread::sleep_for(std::chrono::milliseconds(2000));

    // Inject DLLs sequentially
    // Loop through dllsToInject and call rune::injectDll(pid, path) for each DLL.
    // If any injection fails, report failure and return false.
    // Loop through dllsToInject and call rune::injectDll(pid, path) for each DLL.
    // If any injection fails, report failure and return false.
    for (size_t i = 0; i < dllsToInject.size(); ++i) {
        const auto& dllPath = dllsToInject[i];
        Logger::getInstance().log(Logger::Level::Info, "InjectionRunner", "Injecting DLL: " + dllPath.string());
        if (!injectDll(pid, dllPath)) {
            Logger::getInstance().log(Logger::Level::Error, "InjectionRunner", "Failed to inject DLL: " + dllPath.string());
            return false;
        }

        // Sleep between injections to allow DLLs to safely complete initializations.
        // Sleep 1000ms after RuneCore.dll (the first item), and 2000ms for subsequent DLLs.
        if (i < dllsToInject.size() - 1) {
            std::this_thread::sleep_for(std::chrono::milliseconds(i == 0 ? 1000 : 4000));
        }
    }
    
    return true;
}

} // namespace rune
