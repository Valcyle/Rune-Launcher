#include "injection/InjectionRunner.hpp"
#include "injection/Injector.hpp"
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
    std::wcout << L"Waiting for process: " << targetProcessName << L"..." << std::endl;
    DWORD pid = 0;
    
    // Write a loop that checks findProcessId(targetProcessName) every 500 milliseconds 
    //       until a non-zero process ID is detected.
    //       Hint: Use std::this_thread::sleep_for(std::chrono::milliseconds(500));
    while (pid == 0) {
        pid = findProcessId(targetProcessName);
        if (pid == 0) {
            std::this_thread::sleep_for(std::chrono::milliseconds(500));
        }
    }
    
    std::cout << "Target process detected (PID: " << pid << ")." << std::endl;

    // Inject DLLs sequentially
    // Loop through dllsToInject and call rune::injectDll(pid, path) for each DLL.
    // If any injection fails, report failure and return false.
    for (const auto& dllPath : dllsToInject) {
        if (!injectDll(pid, dllPath)) {
            std::cerr << "Failed to inject DLL: " << dllPath.string() << std::endl;
            return false;
        }
    }
    
    return true;
}

} // namespace rune
