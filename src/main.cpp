#include "ProfileManager.hpp"
#include "ModImporter.hpp"
#include "DependencyResolver.hpp"
#include "InjectionRunner.hpp"
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

        bool runLaunch = false;
        std::wstring targetProcess = L"Minecraft.Windows.exe";

        // Parse command line arguments
        // Usage:
        // launcher.exe -import <file_path>   -> Imports a DLL or mod package
        // launcher.exe -launch [process_name] -> Triggers dependency resolution and process injection
        for (int i = 1; i < argc; ++i) {
            std::string arg = argv[i];
            if (arg == "-import" && i + 1 < argc) {
                std::filesystem::path fileToImport(argv[i + 1]);
                std::cout << "Attempting to import file: " << fileToImport.string() << std::endl;
                bool success = importer.importFile(fileToImport, activeProfile);
                std::cout << (success ? "Import SUCCEEDED." : "Import FAILED.") << std::endl;
                if (!success) return 1;
                i++;
            } else if (arg == "-launch") {
                runLaunch = true;
                if (i + 1 < argc && argv[i + 1][0] != '-') {
                    std::string procName = argv[i + 1];
                    targetProcess = std::wstring(procName.begin(), procName.end());
                    i++;
                }
            }
        }

        rune::DependencyResolver resolver(pm);

        if (runLaunch) {
            std::cout << "\nStarting launch and injection runner..." << std::endl;
            rune::InjectionRunner runner(pm, resolver);
            bool success = runner.run(activeProfile, targetProcess);
            if (success) {
                std::cout << "Injection sequence COMPLETED successfully." << std::endl;
            } else {
                std::cerr << "Injection sequence FAILED." << std::endl;
                return 1;
            }
        } else {
            // Default run: dry-run dependency check
            std::cout << "\nResolving dependencies (dry-run)..." << std::endl;
            std::vector<std::string> errors;
            bool resolveSuccess = resolver.resolve(activeProfile, errors);
            if (resolveSuccess) {
                std::cout << "Dependency check: PASSED." << std::endl;
            } else {
                std::cout << "Dependency check: FAILED. Errors found (" << errors.size() << "):" << std::endl;
                for (const auto& err : errors) {
                    std::cout << " - " << err << std::endl;
                }
            }

            std::cout << "\nScanning profiles..." << std::endl;
            auto profiles = pm.getProfiles();
            std::cout << "Profiles found (" << profiles.size() << "):" << std::endl;
            for (const auto& name : profiles) {
                std::cout << " - " << name << " (Path: " << pm.getProfilePath(name).string() << ")" << std::endl;
            }
        }
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
    return 0;
}
