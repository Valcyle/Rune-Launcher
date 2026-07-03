#pragma once
#include "profile/ProfileManager.hpp"
#include "injection/DependencyResolver.hpp"
#include <string>

namespace rune {

/**
 * @brief Coordinates and executes sequential DLL injections for active profiles.
 */
class InjectionRunner {
public:
    /**
     * @brief Constructs an InjectionRunner.
     * @param profileManager Profile manager used to locate profiles and dll folders.
     * @param resolver Dependency resolver to ensure dependencies are resolved before runner starts.
     */
    InjectionRunner(ProfileManager profileManager, DependencyResolver resolver);

    /**
     * @brief Scans for the target process, resolves the full list of DLLs in sequence,
     *        and injects them one by one into the target process.
     * @param activeProfileName Name of the profile to load DLLs from.
     * @param targetProcessName Name of the target process (e.g. L"Minecraft.Windows.exe").
     * @return true if target process was detected and all DLLs were successfully injected, false otherwise.
     */
    bool run(const std::string& activeProfileName, const std::wstring& targetProcessName) const;

private:
    ProfileManager m_profileManager;
    DependencyResolver m_resolver;
};

} // namespace rune
