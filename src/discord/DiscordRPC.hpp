#pragma once
#include <string>
#include <thread>
#include <atomic>
#include <mutex>
#include <windows.h>

namespace rune {

/**
 * @brief Thread-safe lightweight Discord Rich Presence (RPC) client.
 *        Communicates locally with the Discord desktop client via Win32 Named Pipes.
 */
class DiscordRPC {
public:
    /**
     * @brief Access the singleton instance.
     */
    static DiscordRPC& getInstance();

    /**
     * @brief Initializes the Discord RPC manager. Starts background thread to handle connections.
     * @param clientId Discord Application ID.
     */
    void initialize(const std::string& clientId);

    /**
     * @brief Updates the active Rich Presence details on Discord.
     * @param state State text (e.g. "Profile: Default").
     * @param details Activity details (e.g. "Browsing Mods", "Playing Minecraft").
     * @param isPlaying Set to true if active gameplay is running (adds elapsed timer and updates assets).
     */
    void updateActivity(const std::string& state, const std::string& details, bool isPlaying = false);

    /**
     * @brief Safely shuts down the RPC connection and stops background threads.
     */
    void shutdown();

private:
    DiscordRPC() = default;
    ~DiscordRPC();
    DiscordRPC(const DiscordRPC&) = delete;
    DiscordRPC& operator=(const DiscordRPC&) = delete;

    void connectionLoop();
    bool connectPipe();
    bool sendHandshake();
    bool sendPayload(int opcode, const std::string& jsonStr);
    bool readResponse(int32_t& outOpcode, std::string& outJsonStr);

private:
    std::string m_clientId;
    HANDLE m_hPipe = INVALID_HANDLE_VALUE;
    std::thread m_thread;
    std::atomic<bool> m_running{false};
    std::atomic<bool> m_connected{false};
    std::mutex m_mutex;

    // Cache to restore states on reconnection
    std::string m_currentState;
    std::string m_currentDetails;
    bool m_currentIsPlaying = false;
    uint64_t m_startTimestamp = 0;
};

} // namespace rune
