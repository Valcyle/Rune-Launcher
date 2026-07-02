#include "ProfileManager.hpp"
#include <iostream>

int main() {
    try {
        std::filesystem::path rootPath = std::filesystem::current_path();
        std::cout << "Launcher root path: " << rootPath.string() << std::endl;

        rune::ProfileManager pm(rootPath);
        
        std::cout << "Initializing profile directories..." << std::endl;
        pm.initialize();

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
