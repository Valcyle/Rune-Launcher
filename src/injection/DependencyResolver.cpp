#include "injection/DependencyResolver.hpp"
#include <fstream>
#include <iostream>
#include <nlohmann/json.hpp>
#include <sstream>
#include <unordered_map>

namespace rune {

Version Version::parse(const std::string &versionStr) {
  Version v;
  std::string cleanStr = versionStr;
  // Remove potential 'v' prefix
  if (!cleanStr.empty() && (cleanStr[0] == 'v' || cleanStr[0] == 'V')) {
    cleanStr = cleanStr.substr(1);
  }

  std::stringstream ss(cleanStr);
  std::string segment;

  try {
    if (std::getline(ss, segment, '.'))
      v.major = std::stoi(segment);
    if (std::getline(ss, segment, '.'))
      v.minor = std::stoi(segment);
    if (std::getline(ss, segment, '.'))
      v.patch = std::stoi(segment);
  } catch (const std::exception &) {
    // Fallback for malformed versions
    v.major = v.minor = v.patch = 0;
  }

  return v;
}

bool Version::operator==(const Version &other) const {
  return major == other.major && minor == other.minor && patch == other.patch;
}

bool Version::operator>=(const Version &other) const {
  if (major != other.major)
    return major > other.major;
  if (minor != other.minor)
    return minor > other.minor;
  return patch >= other.patch;
}

bool Version::satisfies(const std::string &constraint) const {
  if (constraint.empty())
    return true;

  // Parse constraint operator and target version
  std::string op;
  std::string verStr;

  size_t i = 0;
  // Extract operator characters
  while (i < constraint.size() &&
         (constraint[i] == '>' || constraint[i] == '=' ||
          constraint[i] == '^' || constraint[i] == '~')) {
    op += constraint[i];
    i++;
  }
  verStr = constraint.substr(i);
  Version reqVer = Version::parse(verStr);

  if (op == ">=") {
    return *this >= reqVer;
  } else if (op == "^") {
    // Compatible version (Same major, installed minor/patch >= required
    // minor/patch)
    if (major != reqVer.major)
      return false;
    return *this >= reqVer;
  } else {
    // Default to exact match
    return *this == reqVer;
  }
}

DependencyResolver::DependencyResolver(ProfileManager profileManager)
    : m_profileManager(std::move(profileManager)) {}

bool DependencyResolver::resolve(const std::string &activeProfileName,
                                 std::vector<std::string> &outErrors) const {
  // Get path to "mods" directory: profiles/[Active_Profile]/mods
  std::filesystem::path modsPath =
      m_profileManager.getProfilePath(activeProfileName) / "mods";

  if (!std::filesystem::exists(modsPath)) {
    // No mods directory, trivially true
    return true;
  }

  std::unordered_map<std::string, std::string> installedMods;

  std::filesystem::directory_iterator modIt;
  try {
    modIt = std::filesystem::directory_iterator(modsPath);
  } catch (const std::filesystem::filesystem_error &) {
    return true; // No mods installed
  }

  for (const auto &entry : modIt) {
    if (!entry.is_directory())
      continue;

    std::filesystem::path modPath = entry.path();
    std::filesystem::path manifestPath = modPath / "manifest.json";

    if (!std::filesystem::exists(manifestPath)) {
      continue; // Skip directories without manifest
    }
    {
      std::ifstream f(manifestPath);
      nlohmann::json manifest;
      try {
        manifest = nlohmann::json::parse(f);
        std::string modId = manifest.at("id").get<std::string>();
        std::string version = manifest.at("version").get<std::string>();
        installedMods[modId] = version;
      } catch (...) {
        // Skip malformed manifests
      }
    }
  }

  // Iterate through all installed mods in the map again:
  //    - For each mod, read the "dependencies" object (if present) from
  //    manifest.json:
  //      "dependencies": {
  //         "com.mod.A": ">=1.0.0",
  //         "com.mod.B": "^2.0.0"
  //      }
  for (const auto &[modId, version] : installedMods) {
    std::filesystem::path modPath = modsPath / modId;
    std::filesystem::path manifestPath = modPath / "manifest.json";

    std::ifstream f(manifestPath);
    nlohmann::json manifest;
    try {
      manifest = nlohmann::json::parse(f);
    } catch (...) {
      continue; // Skip malformed manifests
    }
    //    - For each dependency target (e.g., depId = "com.mod.A", constraint =
    //    ">=1.0.0"):
    //      a. Check if depId exists in installedMods. If not, add error to
    //      outErrors:
    //         "Mod [modId] requires [depId] but it is not installed."
    //      b. If installed, parse its version: Version installedVer =
    //      Version::parse(installedMods[depId]); c. Check if
    //      installedVer.satisfies(constraint). If not, add error to outErrors:
    //         "Mod [modId] requires [depId] ([constraint]) but version
    //         [installedMods[depId]] is installed."
    if (manifest.contains("dependencies")) {
      for (const auto &[depId, constraintJson] :
           manifest["dependencies"].items()) {
        std::string constraint;
        try {
          constraint = constraintJson.get<std::string>();
        } catch (const nlohmann::json::exception &) {
          continue; // Skip invalid dependency formats
        }

        if (installedMods.find(depId) == installedMods.end()) {
          outErrors.push_back("Mod " + modId + " requires " + depId +
                              " but it is not installed.");
        } else {
          Version installedVer = Version::parse(installedMods[depId]);
          if (!installedVer.satisfies(constraint)) {
            outErrors.push_back("Mod " + modId + " requires " + depId + " (" +
                                constraint + ") but version " +
                                installedMods[depId] + " is installed.");
          }
        }
      }
    }
  }

  // Return true if outErrors is empty, false otherwise.
  if (outErrors.empty()) {
    return true;
  } else {
    return false;
  }
}

} // namespace rune
