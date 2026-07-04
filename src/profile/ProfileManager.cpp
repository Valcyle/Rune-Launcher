#include "profile/ProfileManager.hpp"
#include <fstream>
#include <iostream>

namespace rune {

ProfileManager::ProfileManager(std::filesystem::path rootPath)
    : m_rootPath(std::move(rootPath)), m_profilesPath(m_rootPath / "profiles") {}

void ProfileManager::initialize() const {
    //if no profile exist create a default one
    if (!std::filesystem::exists(m_profilesPath) || std::filesystem::is_empty(m_profilesPath)) {
        std::filesystem::create_directories(m_profilesPath / "Default" / "external");
        std::filesystem::create_directories(m_profilesPath / "Default" / "mods");
    }
}

std::vector<std::string> ProfileManager::getProfiles() const {
    std::vector<std::string> profiles;
    if (!std::filesystem::exists(m_profilesPath)) {
        return profiles;
    }
    for (const auto& entry : std::filesystem::directory_iterator(m_profilesPath)) {
        if (entry.is_directory()) {
            profiles.push_back(entry.path().filename().string());
        }
    }
    return profiles;
}

std::filesystem::path ProfileManager::getProfilePath(const std::string& profileName) const {
    return m_profilesPath / profileName;
}

bool ProfileManager::createProfile(const std::string& profileName) const {
    if (profileName.empty()) return false;

    std::filesystem::path targetPath = m_profilesPath / profileName;
    if (std::filesystem::exists(targetPath)) {
        return false; // Profile already exists
    }

    try {
        std::filesystem::create_directories(targetPath / "external");
        std::filesystem::create_directories(targetPath / "mods");
        return true;
    } catch (...) {
        return false;
    }
}

nlohmann::json ProfileManager::getProfileConfig(const std::string& profileName) const {
    std::filesystem::path configPath = getProfilePath(profileName) / "profile_config.json";
    nlohmann::json defaultConfig = {
        {"disabled_mods", nlohmann::json::array()},
        {"disabled_externals", nlohmann::json::array()},
        {"mod_order", nlohmann::json::array()},
        {"external_order", nlohmann::json::array()}
    };

    if (!std::filesystem::exists(configPath)) {
        return defaultConfig;
    }

    try {
        std::ifstream file(configPath);
        if (file.is_open()) {
            nlohmann::json config;
            file >> config;
            // Ensure fields exist
            for (const auto& field : {"disabled_mods", "disabled_externals", "mod_order", "external_order"}) {
                if (!config.contains(field)) {
                    config[field] = nlohmann::json::array();
                }
            }
            return config;
        }
    } catch (...) {
        // Fallback
    }
    return defaultConfig;
}

void ProfileManager::saveProfileConfig(const std::string& profileName, const nlohmann::json& config) const {
    std::filesystem::path configPath = getProfilePath(profileName) / "profile_config.json";
    try {
        std::filesystem::create_directories(configPath.parent_path());
        std::ofstream file(configPath);
        if (file.is_open()) {
            file << config.dump(4);
        }
    } catch (const std::exception& e) {
        std::cerr << "Failed to save profile config: " << e.what() << std::endl;
    }
}

bool ProfileManager::deleteMod(const std::string& profileName, const std::string& modId, bool isExternal) const {
    std::filesystem::path profilePath = getProfilePath(profileName);
    std::filesystem::path targetPath = isExternal 
        ? profilePath / "external" / modId
        : profilePath / "mods" / modId;

    if (!std::filesystem::exists(targetPath)) {
        return false;
    }

    try {
        std::filesystem::remove_all(targetPath);
        
        // Clean references
        nlohmann::json config = getProfileConfig(profileName);
        std::string orderField = isExternal ? "external_order" : "mod_order";
        std::string disabledField = isExternal ? "disabled_externals" : "disabled_mods";

        if (config.contains(orderField) && config[orderField].is_array()) {
            auto& arr = config[orderField];
            for (auto it = arr.begin(); it != arr.end(); ) {
                if (*it == modId) {
                    it = arr.erase(it);
                } else {
                    ++it;
                }
            }
        }

        if (config.contains(disabledField) && config[disabledField].is_array()) {
            auto& arr = config[disabledField];
            for (auto it = arr.begin(); it != arr.end(); ) {
                if (*it == modId) {
                    it = arr.erase(it);
                } else {
                    ++it;
                }
            }
        }

        saveProfileConfig(profileName, config);
        return true;
    } catch (const std::exception& e) {
        std::cerr << "Failed to delete mod: " << e.what() << std::endl;
        return false;
    }
}

} // namespace rune
