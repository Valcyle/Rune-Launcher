#pragma once

#include "ProfileManager.hpp"
#include <string>
#include <vector>

namespace rune {

/**
 * @brief Represents a semantic version (SemVer) with major, minor, and patch components.
 */
struct Version {
    int major = 0;
    int minor = 0;
    int patch = 0;

    /**
     * @brief Parses a version string (e.g. "1.2.3") into a Version struct.
     * @param versionStr The version string to parse.
     * @return The parsed Version object.
     */
    static Version parse(const std::string& versionStr);

    /**
     * @brief Checks if this version is equal to another version.
     */
    bool operator==(const Version& other) const;

    /**
     * @brief Checks if this version is greater than or equal to another version.
     */
    bool operator>=(const Version& other) const;

    /**
     * @brief Checks if this version satisfies a given constraint (e.g., ">=1.0.0", "^1.5.0").
     * @param constraint The SemVer constraint string.
     * @return true if this version satisfies the constraint, false otherwise.
     */
    bool satisfies(const std::string& constraint) const;
};

/**
 * @brief Resolves and validates mod dependencies for launcher profiles.
 */
class DependencyResolver {
public:
    /**
     * @brief Constructs a DependencyResolver with the specified ProfileManager.
     * @param profileManager Profile manager used to locate mod directories.
     */
    explicit DependencyResolver(ProfileManager profileManager);

    /**
     * @brief Resolves dependencies for all mods within a specific profile.
     * @param activeProfileName Name of the profile to scan and validate.
     * @param outErrors Out parameter that will be filled with error details if validation fails.
     * @return true if all dependencies are satisfied, false otherwise.
     */
    bool resolve(const std::string& activeProfileName, std::vector<std::string>& outErrors) const;

private:
    ProfileManager m_profileManager;
};

} // namespace rune
