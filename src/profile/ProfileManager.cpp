#include "profile/ProfileManager.hpp"

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

} // namespace rune
