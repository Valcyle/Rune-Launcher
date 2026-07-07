#include "injection/InjectionRunner.hpp"
#include "injection/Injector.hpp"
#include "ui/Logger.hpp"
#include <chrono>
#include <fstream>
#include <iostream>
#include <nlohmann/json.hpp>
#include <thread>

namespace rune {

InjectionRunner::InjectionRunner(ProfileManager profileManager,
                                 DependencyResolver resolver)
    : m_profileManager(std::move(profileManager)),
      m_resolver(std::move(resolver)) {}

bool InjectionRunner::run(const std::string &activeProfileName,
                          const std::wstring &targetProcessName,
                          const std::wstring &customExePath) const {
  // 1. Verify dependencies first
  std::vector<std::string> depErrors;
  if (!m_resolver.resolve(activeProfileName, depErrors)) {
    std::cerr << "Cannot inject. Dependency resolution failed:" << std::endl;
    for (const auto &err : depErrors) {
      std::cerr << " - " << err << std::endl;
    }
    return false;
  }

  std::filesystem::path profilePath =
      m_profileManager.getProfilePath(activeProfileName);
  std::vector<std::filesystem::path> dllsToInject;

  // Load config
  nlohmann::json config = m_profileManager.getProfileConfig(activeProfileName);

  // Build disabled sets for fast lookup
  std::vector<std::string> disabledExternals;
  if (config.contains("disabled_externals") &&
      config["disabled_externals"].is_array()) {
    for (const auto &d : config["disabled_externals"]) {
      disabledExternals.push_back(d.get<std::string>());
    }
  }
  std::vector<std::string> disabledMods;
  if (config.contains("disabled_mods") && config["disabled_mods"].is_array()) {
    for (const auto &d : config["disabled_mods"]) {
      disabledMods.push_back(d.get<std::string>());
    }
  }

  // 1. Add global Loader Core DLL (RuneCore.dll)
  std::filesystem::path rootPath = profilePath.parent_path().parent_path();
  dllsToInject.push_back(std::filesystem::absolute(rootPath / "RuneCore.dll"));

  // Helper lambda to check if a string exists in a vector
  auto contains = [](const std::vector<std::string> &vec,
                     const std::string &val) {
    return std::find(vec.begin(), vec.end(), val) != vec.end();
  };

  // 2. Add external DLLs
  std::filesystem::path externalPath = profilePath / "external";
  std::vector<std::string> diskExternals;
  if (std::filesystem::exists(externalPath)) {
    for (const auto &entry :
         std::filesystem::directory_iterator(externalPath)) {
      if (entry.path().extension() == ".dll") {
        diskExternals.push_back(entry.path().filename().string());
      }
    }
  }

  // Process external DLLs based on external_order
  if (config.contains("external_order") &&
      config["external_order"].is_array()) {
    for (const auto &orderedName : config["external_order"]) {
      std::string dllName = orderedName.get<std::string>();
      if (contains(diskExternals, dllName)) {
        if (!contains(disabledExternals, dllName)) {
          dllsToInject.push_back(
              std::filesystem::absolute(externalPath / dllName));
        }
        diskExternals.erase(
            std::remove(diskExternals.begin(), diskExternals.end(), dllName),
            diskExternals.end());
      }
    }
  }
  for (const auto &dllName : diskExternals) {
    if (!contains(disabledExternals, dllName)) {
      dllsToInject.push_back(std::filesystem::absolute(externalPath / dllName));
    }
  }

  // 3. Add Mod DLLs
  std::filesystem::path modsPath = profilePath / "mods";
  std::vector<std::string> diskMods;
  if (std::filesystem::exists(modsPath)) {
    for (const auto &entry : std::filesystem::directory_iterator(modsPath)) {
      if (entry.is_directory()) {
        diskMods.push_back(entry.path().filename().string());
      }
    }
  }

  auto getModEntrypoint =
      [&](const std::string &modId) -> std::filesystem::path {
    std::filesystem::path manifestPath = modsPath / modId / "manifest.json";
    if (std::filesystem::exists(manifestPath)) {
      std::ifstream manifestFile(manifestPath);
      if (manifestFile.is_open()) {
        nlohmann::json manifest;
        manifestFile >> manifest;
        if (manifest.contains("entrypoint")) {
          std::string entrypointName =
              manifest["entrypoint"].get<std::string>();
          return std::filesystem::absolute(modsPath / modId / entrypointName);
        }
      }
    }
    return "";
  };

  // Process mods based on mod_order
  if (config.contains("mod_order") && config["mod_order"].is_array()) {
    for (const auto &orderedId : config["mod_order"]) {
      std::string modId = orderedId.get<std::string>();
      if (contains(diskMods, modId)) {
        if (!contains(disabledMods, modId)) {
          auto path = getModEntrypoint(modId);
          if (!path.empty()) {
            dllsToInject.push_back(path);
          }
        }
        diskMods.erase(std::remove(diskMods.begin(), diskMods.end(), modId),
                       diskMods.end());
      }
    }
  }
  for (const auto &modId : diskMods) {
    if (!contains(disabledMods, modId)) {
      auto path = getModEntrypoint(modId);
      if (!path.empty()) {
        dllsToInject.push_back(path);
      }
    }
  }

  // Scan for target process
  DWORD pid = 0;

  if (!customExePath.empty()) {
    Logger::getInstance().log(Logger::Level::Info, "InjectionRunner",
                              "Launching custom Minecraft version directly...");
    
    // Check if file exists
    if (!std::filesystem::exists(customExePath)) {
      Logger::getInstance().log(Logger::Level::Error, "InjectionRunner",
                                "Custom Minecraft executable not found: " + std::filesystem::path(customExePath).string());
      return false;
    }

    // Launch via CreateProcessW
    STARTUPINFOW si = { sizeof(si) };
    PROCESS_INFORMATION pi = {};
    
    // Set Working Directory to the parent folder of the executable
    std::wstring workingDir = std::filesystem::path(customExePath).parent_path().wstring();
    
    // We create a mutable copy of the exe path since CreateProcessW can modify it
    std::vector<wchar_t> cmdLine(customExePath.begin(), customExePath.end());
    cmdLine.push_back(L'\0');

    BOOL createSuccess = CreateProcessW(
        nullptr,
        cmdLine.data(),
        nullptr,
        nullptr,
        FALSE,
        0,
        nullptr,
        workingDir.c_str(),
        &si,
        &pi
    );

    if (createSuccess) {
      pid = pi.dwProcessId;
      Logger::getInstance().log(Logger::Level::Info, "InjectionRunner",
                                "Successfully launched custom Minecraft process (PID: " + std::to_string(pid) + ")");
      // Close handles safely
      CloseHandle(pi.hProcess);
      CloseHandle(pi.hThread);
    } else {
      DWORD err = GetLastError();
      Logger::getInstance().log(Logger::Level::Error, "InjectionRunner",
                                "Failed to launch custom Minecraft. Error code: " + std::to_string(err));
      return false;
    }
  } else {
    Logger::getInstance().log(Logger::Level::Info, "InjectionRunner",
                              "Waiting for Minecraft process...");
    pid = findProcessId(targetProcessName);
    if (pid == 0) {
      // Game is not running, trigger startup via protocol link
      Logger::getInstance().log(
          Logger::Level::Debug, "InjectionRunner",
          "Minecraft process not found. Launching via protocol handler...");
      ShellExecute(NULL, "open", "cmd", "/c start minecraft://", NULL, SW_HIDE);
      Logger::getInstance().log(Logger::Level::Info, "InjectionRunner",
                                "Launched Minecraft. Awaiting process spawn...");

      // Loop up to 30 times (15 seconds max) to await process spawn
      for (int i = 0; i < 30; ++i) {
        std::this_thread::sleep_for(std::chrono::milliseconds(500));
        pid = findProcessId(targetProcessName);
        if (pid != 0) {
          break;
        }
      }
    }
  }

  if (pid == 0) {
    Logger::getInstance().log(
        Logger::Level::Error, "InjectionRunner",
        "Failed to detect Minecraft process after startup.");
    return false;
  }

  Logger::getInstance().log(
      Logger::Level::Info, "InjectionRunner",
      "Target process detected (PID: " + std::to_string(pid) +
          "). Awaiting process initialization...");
  // Give UWP sandbox/runtime extra 2 seconds to initialize memory and dynamic
  // libraries fully before injection
  std::this_thread::sleep_for(std::chrono::milliseconds(2000));

  // Inject DLLs sequentially
  // Loop through dllsToInject and call rune::injectDll(pid, path) for each DLL.
  // If any injection fails, report failure and return false.
  // Loop through dllsToInject and call rune::injectDll(pid, path) for each DLL.
  // If any injection fails, report failure and return false.
  for (size_t i = 0; i < dllsToInject.size(); ++i) {
    const auto &dllPath = dllsToInject[i];
    // temporary remove index 0 dll (RuneCore.dll) for now
    if (i == 0) {
      continue;
    }
    Logger::getInstance().log(Logger::Level::Info, "InjectionRunner",
                              "Injecting DLL: " + dllPath.string());
    if (!injectDll(pid, dllPath)) {
      Logger::getInstance().log(Logger::Level::Error, "InjectionRunner",
                                "Failed to inject DLL: " + dllPath.string());
      return false;
    }

    // Sleep between injections to allow DLLs to safely complete
    // initializations. Sleep 1000ms after RuneCore.dll (the first item), and
    // 2000ms for subsequent DLLs.
    if (i < dllsToInject.size() - 1) {
      std::this_thread::sleep_for(
          std::chrono::milliseconds(i == 0 ? 1000 : 2000));
    }
  }

  return true;
}

} // namespace rune
