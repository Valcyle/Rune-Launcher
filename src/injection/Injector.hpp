#pragma once
#include <windows.h>
#include <filesystem>
#include <string>

namespace rune {

/**
 * @brief Find the Process ID (PID) of a running process by its executable name.
 *        Performs case-insensitive snapshot-based searching.
 * @param processName The name of the process (e.g. L"Minecraft.Windows.exe").
 * @return The process ID if found, or 0 if not found.
 */
DWORD findProcessId(const std::wstring& processName);

/**
 * @brief Injects a DLL into a target process using Remote Thread Injection (CreateRemoteThread).
 *        Allocates memory in target context, writes the DLL absolute path, and spawns LoadLibraryW.
 * @param processId Target process ID.
 * @param dllPath Path of the DLL to inject.
 * @return true if injection succeeded and LoadLibrary returned a non-zero handle, false otherwise.
 */
bool injectDll(DWORD processId, const std::filesystem::path& dllPath);

} // namespace rune
