#include "profile/ModImporter.hpp"
#include "profile/ZipUtility.hpp"
#include <nlohmann/json.hpp>
#include <fstream>
#include <iostream>

namespace rune {

ModImporter::ModImporter(ProfileManager profileManager)
    : m_profileManager(std::move(profileManager)) {}

bool ModImporter::importFile(const std::filesystem::path& filePath, const std::string& activeProfileName) const {
    if (!std::filesystem::exists(filePath)) {
        std::cerr << "File does not exist: " << filePath.string() << std::endl;
        return false;
    }

    std::filesystem::path profilePath = m_profileManager.getProfilePath(activeProfileName);
    std::string ext = filePath.extension().string();

    if (ext == ".dll") {
        // Resolve destination directory: profiles/[Active_Profile]/external/
        std::filesystem::path destPath = profilePath / "external" / filePath.filename();
        
        // Make sure the destination directory exists.
        if (!std::filesystem::exists(destPath.parent_path())) {
            std::filesystem::create_directories(destPath.parent_path());
        }

        // Copy the file to target location: e.g. profiles/[Active_Profile]/external/[Filename].dll
        std::filesystem::copy_file(filePath, destPath, std::filesystem::copy_options::overwrite_existing);
        return true;
    } 
    else if (ext == ".runemod") {
        // Define paths:
        std::filesystem::path modsPath = profilePath / "mods";
        std::filesystem::path tmpPath = modsPath / ".tmp_extract";
        
        // Create a temporary .zip file path (e.g., "mods/.tmp_mod.zip")
        std::filesystem::path tempZipPath = modsPath / (filePath.stem().string() + ".zip");
        
        // Clean up any existing tmpPath and tempZipPath first
        std::filesystem::remove_all(tmpPath);
        std::filesystem::remove(tempZipPath);
        
        // Copy the .runemod file to the temporary .zip path
        try {
            std::filesystem::copy_file(filePath, tempZipPath);
        } catch (const std::filesystem::filesystem_error& e) {
            std::cerr << "Failed to copy mod file to temp ZIP: " << e.what() << std::endl;
            return false;
        }
        
        // Extract the ZIP using the temporary ZIP file
        bool extractSuccess = rune::extractZip(tempZipPath, tmpPath);
        
        // Always remove the temporary ZIP file right after extraction
        std::filesystem::remove(tempZipPath);
        
        if (!extractSuccess) {
            std::cerr << "Failed to extract ZIP file." << std::endl;
            return false;
        }
        
        // Look for "manifest.json" in tmpPath... 
        std::filesystem::path manifestPath = tmpPath / "manifest.json";
        if (!std::filesystem::exists(manifestPath)) {
            std::cerr << "manifest.json not found in the extracted ZIP." << std::endl;
            std::filesystem::remove_all(tmpPath);
            return false;
        }
        std::string modId;
        std::string entrypoint;
        {
            // Open manifest.json using std::ifstream, and parse it with nlohmann/json.
            std::ifstream f(manifestPath);
            nlohmann::json manifest;
            try {
                manifest = nlohmann::json::parse(f);
                // Extract "id" and "entrypoint"
                modId = manifest.at("id").get<std::string>();
                entrypoint = manifest.at("entrypoint").get<std::string>();
            } catch (nlohmann::json::parse_error& e) {
                std::cerr << "JSON parse error: " << e.what() << std::endl;
                std::filesystem::remove_all(tmpPath);
                return false;
            } catch (nlohmann::json::exception& e) {
                std::cerr << "JSON structure/format error: " << e.what() << std::endl;
                std::filesystem::remove_all(tmpPath);
                return false;
            }
        }

        // Verify that tmpPath / entrypoint exists.
        std::filesystem::path entrypointPath = tmpPath / entrypoint;
        if (!std::filesystem::exists(entrypointPath)) {
            std::cerr << "Entrypoint not found in the extracted ZIP." << std::endl;
            std::filesystem::remove_all(tmpPath);
            return false;
        }
        
        // If validation succeeds:
        // Move/rename tmpPath to modsPath / modId (Remove existing modId directory first if it exists).
        std::filesystem::path modPath = modsPath / modId;
        if (std::filesystem::exists(modPath)) {
            std::filesystem::remove_all(modPath);
        }
        std::filesystem::rename(tmpPath, modPath);
        return true;
    }

    std::cerr << "Unsupported file extension: " << ext << std::endl;
    return false;
}

} // namespace rune
