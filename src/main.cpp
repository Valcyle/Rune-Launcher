#include "ProfileManager.hpp"
#include "ModImporter.hpp"
#include <iostream>

int main(int argc, char* argv[]) {
    try {
        // Use current directory as launcher root for testing
        std::filesystem::path rootPath = std::filesystem::current_path();
        std::cout << "Launcher root path: " << rootPath.string() << std::endl;

        rune::ProfileManager pm(rootPath);
        pm.initialize();

        rune::ModImporter importer(pm);
        std::string activeProfile = "Default";

        // If file path is passed as command argument, trigger import
        if (argc > 1) {
            std::filesystem::path fileToImport(argv[1]);
            std::cout << "Attempting to import file: " << fileToImport.string() << std::endl;
            
            bool success = importer.importFile(fileToImport, activeProfile);
            if (success) {
                std::cout << "Import SUCCEEDED." << std::endl;
            } else {
                std::cout << "Import FAILED." << std::endl;
                return 1;
            }
        } else {
            std::cout << "Usage: launcher.exe <file_to_import>" << std::endl;
        }

        std::cout << "Scanning profiles..." << std::endl;
        auto profiles = pm.getProfiles();
        std::cout << "Profiles found (" << profiles.size() << "):" << std::endl;
        for (const auto& name : profiles) {
            std::cout << " - " << name << " (Path: " << pm.getProfilePath(name).string() << ")" << std::endl;
        }
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
    return 0;
}
