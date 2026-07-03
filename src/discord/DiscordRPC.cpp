#include "discord/DiscordRPC.hpp"
#include "ui/Logger.hpp"
#include <nlohmann/json.hpp>
#include <chrono>
#include <iostream>
#include <sstream>
#include <iomanip>

namespace rune {

DiscordRPC& DiscordRPC::getInstance() {
    static DiscordRPC instance;
    return instance;
}

DiscordRPC::~DiscordRPC() {
    shutdown();
}

void DiscordRPC::initialize(const std::string& clientId) {
    if (m_running) return;

    m_clientId = clientId;
    m_running = true;
    m_connected = false;

    // Default status details
    m_currentState = "Browsing Profiles";
    m_currentDetails = "Idle";
    m_currentIsPlaying = false;

    Logger::getInstance().log(Logger::Level::Info, "DiscordRPC", "Initializing Discord RPC manager...");
    m_thread = std::thread(&DiscordRPC::connectionLoop, this);
}

void DiscordRPC::shutdown() {
    if (!m_running) return;

    Logger::getInstance().log(Logger::Level::Info, "DiscordRPC", "Shutting down Discord RPC manager...");
    m_running = false;
    if (m_thread.joinable()) {
        m_thread.join();
    }

    std::lock_guard<std::mutex> lock(m_mutex);
    if (m_hPipe != INVALID_HANDLE_VALUE) {
        // Send close frame optional but polite
        sendPayload(2, "{}");
        CloseHandle(m_hPipe);
        m_hPipe = INVALID_HANDLE_VALUE;
    }
    m_connected = false;
}

void DiscordRPC::updateActivity(const std::string& state, const std::string& details, bool isPlaying) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_currentState = state;
    m_currentDetails = details;
    
    if (isPlaying) {
        if (!m_currentIsPlaying) {
            // Started playing: mark start timestamp
            m_startTimestamp = std::chrono::duration_cast<std::chrono::seconds>(
                std::chrono::system_clock::now().time_since_epoch()
            ).count();
        }
    } else {
        m_startTimestamp = 0;
    }
    m_currentIsPlaying = isPlaying;

    std::stringstream logMsg;
    logMsg << "Updating activity -> State: \"" << state << "\", Details: \"" << details << "\", Playing: " << (isPlaying ? "true" : "false");
    Logger::getInstance().log(Logger::Level::Info, "DiscordRPC", logMsg.str());

    if (!m_connected) {
        Logger::getInstance().log(Logger::Level::Warning, "DiscordRPC", "Postponed activity update (Discord named pipe is not connected).");
        return;
    }

    nlohmann::json activity = {
        {"state", state},
        {"details", details}
    };

    if (m_startTimestamp > 0) {
        activity["timestamps"] = {
            {"start", m_startTimestamp}
        };
    }

    // Embed registered developer portal assets
    activity["assets"] = {
        {"large_image", isPlaying ? "runemodloader" : "runelauncher"},
        {"large_text", isPlaying ? "Rune Mod Loader" : "Rune Launcher"}
    };

    nlohmann::json payload = {
        {"cmd", "SET_ACTIVITY"},
        {"args", {
            {"pid", static_cast<int>(GetCurrentProcessId())},
            {"activity", activity}
        }},
        {"nonce", "rune_launcher_nonce"}
    };

    if (sendPayload(1, payload.dump())) {
        Logger::getInstance().log(Logger::Level::Debug, "DiscordRPC", "Activity payload successfully written to pipe. Awaiting response...");
        int32_t op;
        std::string resp;
        if (readResponse(op, resp)) {
            std::stringstream ss;
            ss << "Activity update response received (Opcode: " << op << "): " << resp;
            Logger::getInstance().log(Logger::Level::Info, "DiscordRPC", ss.str());
            try {
                auto j = nlohmann::json::parse(resp);
                if (j.contains("evt") && j["evt"] == "ERROR") {
                    std::stringstream ess;
                    ess << "Discord Activity Error: " << j["data"]["message"] << " (Code: " << j["data"]["code"] << ")";
                    Logger::getInstance().log(Logger::Level::Error, "DiscordRPC", ess.str());
                }
            } catch (...) {
                // Ignore parsing issues for checking errors
            }
        } else {
            Logger::getInstance().log(Logger::Level::Error, "DiscordRPC", "Failed to read activity update response.");
        }
    } else {
        Logger::getInstance().log(Logger::Level::Error, "DiscordRPC", "Failed to write activity payload to pipe.");
    }
}

void DiscordRPC::connectionLoop() {
    while (m_running) {
        if (!m_connected) {
            if (connectPipe()) {
                if (sendHandshake()) {
                    m_connected = true;
                    // Force update activity with cached states
                    updateActivity(m_currentState, m_currentDetails, m_currentIsPlaying);
                } else {
                    CloseHandle(m_hPipe);
                    m_hPipe = INVALID_HANDLE_VALUE;
                }
            }
        } else {
            // Keep-alive check using PeekNamedPipe
            DWORD bytesAvailable = 0;
            if (!PeekNamedPipe(m_hPipe, nullptr, 0, nullptr, &bytesAvailable, nullptr)) {
                Logger::getInstance().log(Logger::Level::Warning, "DiscordRPC", "Connection to Discord Named Pipe lost.");
                m_connected = false;
                CloseHandle(m_hPipe);
                m_hPipe = INVALID_HANDLE_VALUE;
            }
        }
        // Check connection state every 2 seconds
        std::this_thread::sleep_for(std::chrono::seconds(2));
    }
}

bool DiscordRPC::connectPipe() {
    // Discord IPC named pipes are named from discord-ipc-0 to discord-ipc-9
    for (int i = 0; i < 10; ++i) {
        std::wstring pipeName = L"\\\\.\\pipe\\discord-ipc-" + std::to_wstring(i);
        m_hPipe = CreateFileW(
            pipeName.c_str(),
            GENERIC_READ | GENERIC_WRITE,
            0,
            nullptr,
            OPEN_EXISTING,
            0,
            nullptr
        );
        if (m_hPipe != INVALID_HANDLE_VALUE) {
            std::stringstream ss;
            ss << "Successfully connected to Discord named pipe: discord-ipc-" << i;
            Logger::getInstance().log(Logger::Level::Info, "DiscordRPC", ss.str());
            return true;
        } else {
            DWORD err = GetLastError();
            // ERROR_FILE_NOT_FOUND (2) is expected if Discord desktop client is not running
            if (err != ERROR_FILE_NOT_FOUND) {
                std::stringstream ss;
                ss << "Failed to open pipe discord-ipc-" << i << ". Win32 Error Code: " << err;
                Logger::getInstance().log(Logger::Level::Debug, "DiscordRPC", ss.str());
            }
        }
    }
    return false;
}

bool DiscordRPC::sendHandshake() {
    nlohmann::json handshake = {
        {"v", 1},
        {"client_id", m_clientId}
    };
    bool success = sendPayload(0, handshake.dump());
    if (success) {
        Logger::getInstance().log(Logger::Level::Debug, "DiscordRPC", "Discord IPC handshake sent. Awaiting response...");
        int32_t op;
        std::string resp;
        if (readResponse(op, resp)) {
            std::stringstream ss;
            ss << "Discord IPC handshake response received (Opcode: " << op << "): " << resp;
            Logger::getInstance().log(Logger::Level::Info, "DiscordRPC", ss.str());
            try {
                auto j = nlohmann::json::parse(resp);
                if (j.contains("evt") && j["evt"] == "READY") {
                    Logger::getInstance().log(Logger::Level::Info, "DiscordRPC", "Discord IPC Handshake success: client is READY.");
                    return true;
                } else if (j.contains("evt") && j["evt"] == "ERROR") {
                    std::stringstream ess;
                    ess << "Discord Handshake Error: " << j["data"]["message"];
                    Logger::getInstance().log(Logger::Level::Error, "DiscordRPC", ess.str());
                    return false;
                }
            } catch (...) {
                Logger::getInstance().log(Logger::Level::Warning, "DiscordRPC", "Failed to parse handshake JSON response.");
            }
        } else {
            Logger::getInstance().log(Logger::Level::Error, "DiscordRPC", "Failed to read handshake response.");
            return false;
        }
    } else {
        Logger::getInstance().log(Logger::Level::Error, "DiscordRPC", "Discord IPC handshake write failed.");
    }
    return success;
}

bool DiscordRPC::sendPayload(int opcode, const std::string& jsonStr) {
    if (m_hPipe == INVALID_HANDLE_VALUE) return false;

    // Discord IPC Protocol Packet structure:
    // [int32 opcode] [int32 length] [JSON string]
    int32_t header[2];
    header[0] = opcode;
    header[1] = static_cast<int32_t>(jsonStr.length());

    DWORD bytesWritten = 0;
    
    // Write Packet Header
    BOOL success = WriteFile(m_hPipe, header, sizeof(header), &bytesWritten, nullptr);
    if (!success || bytesWritten != sizeof(header)) {
        DWORD err = GetLastError();
        std::stringstream ss;
        ss << "Failed to write packet header to named pipe. Win32 Error: " << err;
        Logger::getInstance().log(Logger::Level::Error, "DiscordRPC", ss.str());
        return false;
    }

    // Write Packet Payload
    success = WriteFile(m_hPipe, jsonStr.c_str(), static_cast<DWORD>(jsonStr.length()), &bytesWritten, nullptr);
    if (!success || bytesWritten != jsonStr.length()) {
        DWORD err = GetLastError();
        std::stringstream ss;
        ss << "Failed to write packet payload to named pipe. Win32 Error: " << err;
        Logger::getInstance().log(Logger::Level::Error, "DiscordRPC", ss.str());
        return false;
    }

    FlushFileBuffers(m_hPipe);
    return true;
}

bool DiscordRPC::readResponse(int32_t& outOpcode, std::string& outJsonStr) {
    if (m_hPipe == INVALID_HANDLE_VALUE) return false;

    int32_t header[2];
    DWORD bytesRead = 0;
    int timeoutMs = 2000;
    int elapsedMs = 0;
    DWORD bytesAvailable = 0;

    // Wait for header to arrive
    while (m_running) {
        if (PeekNamedPipe(m_hPipe, nullptr, 0, nullptr, &bytesAvailable, nullptr) && bytesAvailable >= sizeof(header)) {
            break;
        }
        std::this_thread::sleep_for(std::chrono::milliseconds(50));
        elapsedMs += 50;
        if (elapsedMs >= timeoutMs) {
            Logger::getInstance().log(Logger::Level::Debug, "DiscordRPC", "Timeout waiting for response header.");
            return false;
        }
    }

    if (!m_running) return false;

    BOOL success = ReadFile(m_hPipe, header, sizeof(header), &bytesRead, nullptr);
    if (!success || bytesRead != sizeof(header)) {
        DWORD err = GetLastError();
        std::stringstream ss;
        ss << "Failed to read response header from named pipe. Win32 Error: " << err;
        Logger::getInstance().log(Logger::Level::Error, "DiscordRPC", ss.str());
        return false;
    }

    outOpcode = header[0];
    int32_t length = header[1];

    if (length <= 0) {
        outJsonStr = "";
        return true;
    }

    // Wait for payload to arrive
    elapsedMs = 0;
    while (m_running) {
        if (PeekNamedPipe(m_hPipe, nullptr, 0, nullptr, &bytesAvailable, nullptr) && bytesAvailable >= static_cast<DWORD>(length)) {
            break;
        }
        std::this_thread::sleep_for(std::chrono::milliseconds(50));
        elapsedMs += 50;
        if (elapsedMs >= timeoutMs) {
            Logger::getInstance().log(Logger::Level::Debug, "DiscordRPC", "Timeout waiting for response payload.");
            return false;
        }
    }

    if (!m_running) return false;

    std::vector<char> buffer(length + 1, 0);
    success = ReadFile(m_hPipe, buffer.data(), static_cast<DWORD>(length), &bytesRead, nullptr);
    if (!success || bytesRead != static_cast<DWORD>(length)) {
        DWORD err = GetLastError();
        std::stringstream ss;
        ss << "Failed to read response payload from named pipe. Win32 Error: " << err;
        Logger::getInstance().log(Logger::Level::Error, "DiscordRPC", ss.str());
        return false;
    }

    outJsonStr = std::string(buffer.data(), bytesRead);
    return true;
}

} // namespace rune
