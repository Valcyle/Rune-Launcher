#include "injection/Injector.hpp"
#include <tlhelp32.h>
#include <iostream>

namespace rune {

DWORD findProcessId(const std::wstring& processName) {
    DWORD pid = 0;
    HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hSnapshot == INVALID_HANDLE_VALUE) {
        return 0;
    }

    PROCESSENTRY32W pe;
    pe.dwSize = sizeof(pe);

    if (Process32FirstW(hSnapshot, &pe)) {
        do {
            // Case-insensitive comparison
            if (_wcsicmp(pe.szExeFile, processName.c_str()) == 0) {
                pid = pe.th32ProcessID;
                break;
            }
        } while (Process32NextW(hSnapshot, &pe));
    }

    CloseHandle(hSnapshot);
    return pid;
}

bool injectDll(DWORD processId, const std::filesystem::path& dllPath) {
    if (!std::filesystem::exists(dllPath)) {
        std::cerr << "DLL path does not exist: " << dllPath.string() << std::endl;
        return false;
    }

    std::wstring absoluteDllPath = std::filesystem::absolute(dllPath).make_preferred().wstring();

    // Open target process with required access rights
    HANDLE hProcess = OpenProcess(
        PROCESS_CREATE_THREAD | PROCESS_QUERY_INFORMATION | PROCESS_VM_OPERATION | PROCESS_VM_WRITE | PROCESS_VM_READ,
        FALSE,
        processId
    );

    if (!hProcess) {
        std::cerr << "Failed to open process ID " << processId << ". Error: " << GetLastError() << std::endl;
        return false;
    }

    bool success = false;
    size_t pathSizeInBytes = (absoluteDllPath.size() + 1) * sizeof(wchar_t);

    // Allocate memory in target process
    LPVOID pRemoteMemory = VirtualAllocEx(hProcess, nullptr, pathSizeInBytes, MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE);
    if (pRemoteMemory) {
        // Write DLL path to allocated memory
        if (WriteProcessMemory(hProcess, pRemoteMemory, absoluteDllPath.c_str(), pathSizeInBytes, nullptr)) {
            // Get address of LoadLibraryW in kernel32.dll
            LPVOID pLoadLibrary = (LPVOID)GetProcAddress(GetModuleHandleW(L"kernel32.dll"), "LoadLibraryW");
            if (pLoadLibrary) {
                // Create thread in target process that executes LoadLibraryW(pRemoteMemory)
                HANDLE hThread = CreateRemoteThread(
                    hProcess,
                    nullptr,
                    0,
                    (LPTHREAD_START_ROUTINE)pLoadLibrary,
                    pRemoteMemory,
                    0,
                    nullptr
                );

                if (hThread) {
                    // Wait for the thread to complete LoadLibraryW execution
                    WaitForSingleObject(hThread, INFINITE);
                    
                    DWORD exitCode = 0;
                    if (GetExitCodeThread(hThread, &exitCode)) {
                        // LoadLibraryW returns module handle. 0 (NULL) indicates failure.
                        if (exitCode != 0) {
                            success = true;
                        } else {
                            std::cerr << "LoadLibraryW returned NULL inside target process. Error: " << GetLastError() << std::endl;
                        }
                    }
                    CloseHandle(hThread);
                } else {
                    std::cerr << "CreateRemoteThread failed. Error: " << GetLastError() << std::endl;
                }
            } else {
                std::cerr << "Failed to resolve LoadLibraryW address." << std::endl;
            }
        } else {
            std::cerr << "WriteProcessMemory failed. Error: " << GetLastError() << std::endl;
        }
        // Free allocated memory
        VirtualFreeEx(hProcess, pRemoteMemory, 0, MEM_RELEASE);
    } else {
        std::cerr << "VirtualAllocEx failed. Error: " << GetLastError() << std::endl;
    }

    CloseHandle(hProcess);
    return success;
}

} // namespace rune
