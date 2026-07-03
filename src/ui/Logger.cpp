#include "ui/Logger.hpp"
#include <chrono>
#include <iomanip>
#include <sstream>

namespace rune {

Logger& Logger::getInstance() {
    static Logger instance;
    return instance;
}

void Logger::log(Level level, const std::string& tag, const std::string& message) {
    std::lock_guard<std::mutex> lock(m_mutex);

    // Get current local system time
    auto now = std::chrono::system_clock::now();
    auto in_time_t = std::chrono::system_clock::to_time_t(now);
    
    std::tm timeInfo;
    localtime_s(&timeInfo, &in_time_t);

    std::stringstream timeStr;
    timeStr << std::put_time(&timeInfo, "%Y-%m-%d %H:%M:%S");

    std::string levelStr;
    switch (level) {
        case Level::Debug:   levelStr = "DEBUG"; break;
        case Level::Info:    levelStr = "INFO "; break;
        case Level::Warning: levelStr = "WARN "; break;
        case Level::Error:   levelStr = "ERROR"; break;
    }

    std::cout << "[" << timeStr.str() << "] [" << levelStr << "] [" << tag << "] " << message << std::endl;
}

} // namespace rune
