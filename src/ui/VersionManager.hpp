#pragma once

#include <string>
#include <vector>

struct MinecraftVersion {
    std::wstring name;
    std::wstring path;
    std::wstring source;
    std::wstring version;
};

class VersionManager {
public:
    /**
     * @brief Scans for Minecraft installations from LeviLauncher and Oderso launchers.
     * @param scanEnabled True to run scanner, false to bypass and return empty list.
     * @return Vector of detected Minecraft version instances.
     */
    static std::vector<MinecraftVersion> scanVersions(bool scanEnabled);

    /**
     * @brief Serializes version instances array to a JSON string.
     */
    static std::string serializeToJson(const std::vector<MinecraftVersion>& versions);

private:
    static std::wstring getProductVersion(const std::wstring& filePath);
};
