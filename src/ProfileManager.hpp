#pragma once

#include <filesystem>
#include <string>
#include <vector>

namespace rune {

/**
 * @brief Manages game profiles and directory structures for RuneLauncher.
 */
class ProfileManager {
public:
    /**
     * @brief Constructs a ProfileManager with the specified root path of the launcher.
     * @param rootPath The root directory where launcher.exe is located.
     */
    explicit ProfileManager(std::filesystem::path rootPath);

    /**
     * @brief Initializes the profiles directory layout.
     *        If the "profiles" directory does not exist or is empty,
     *        it automatically creates a "Default" profile with "external" and "mods" subdirectories.
     */
    void initialize() const;

    /**
     * @brief Scans the "profiles" directory and retrieves a list of all existing profile names.
     * @return A vector of profile directory names.
     */
    std::vector<std::string> getProfiles() const;

    /**
     * @brief Resolves the absolute path for a specific profile.
     * @param profileName The name of the profile folder.
     * @return The filesystem path to the profile's directory.
     */
    std::filesystem::path getProfilePath(const std::string& profileName) const;

private:
    std::filesystem::path m_rootPath;
    std::filesystem::path m_profilesPath;
};

} // namespace rune
