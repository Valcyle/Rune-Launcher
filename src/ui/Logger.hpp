#pragma once
#include <string>
#include <mutex>
#include <iostream>

namespace rune {

/**
 * @brief Thread-safe Logger utility for debugging.
 */
class Logger {
public:
    enum class Level {
        Debug,
        Info,
        Warning,
        Error
    };

    /**
     * @brief Access singleton Logger instance.
     */
    static Logger& getInstance();

    /**
     * @brief Writes a message to the console.
     * @param level Logging level flag.
     * @param tag Mod/Module identifier tag.
     * @param message Log message.
     */
    void log(Level level, const std::string& tag, const std::string& message);

private:
    Logger() = default;
    ~Logger() = default;
    Logger(const Logger&) = delete;
    Logger& operator=(const Logger&) = delete;

private:
    std::mutex m_mutex;
};

} // namespace rune
