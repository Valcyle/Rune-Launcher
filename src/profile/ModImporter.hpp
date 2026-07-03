#pragma once

#include "profile/ProfileManager.hpp"
#include <filesystem>
#include <string>

namespace rune {

/**
 * @brief Handles importing and sorting of mod files (.dll and .runemod).
 *        Validates mods using manifest metadata before moving them.
 */
class ModImporter {
public:
    /**
     * @brief Constructs a ModImporter with the specified ProfileManager.
     * @param profileManager Profile manager used to locate profile directories.
     */
    explicit ModImporter(ProfileManager profileManager);

    /**
     * @brief Imports and sorts a given file into the specified active profile.
     *        If the file is .dll, it's moved to "external/".
     *        If the file is .runemod (ZIP), it is extracted, manifest.json is parsed,
     *        and directory structure is validated before relocating to "mods/[Mod_ID]".
     * @param filePath Path of the file to import.
     * @param activeProfileName Name of the profile to import into.
     * @return true if import and validation succeeded, false otherwise.
     */
    bool importFile(const std::filesystem::path& filePath, const std::string& activeProfileName) const;

private:
    ProfileManager m_profileManager;
};

} // namespace rune
