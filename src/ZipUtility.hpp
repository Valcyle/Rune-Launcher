#pragma once

#include <filesystem>

namespace rune {

/**
 * @brief Extracts a ZIP archive to the specified destination directory.
 *        Uses native Windows Shell COM API for dependency-free, safe extraction.
 * @param zipPath Absolute path to the ZIP archive.
 * @param destPath Absolute path to the destination directory.
 * @return true if successful, false otherwise.
 */
bool extractZip(const std::filesystem::path& zipPath, const std::filesystem::path& destPath);

} // namespace rune
