#pragma once
#include <cstddef>

namespace rune {

struct EmbeddedFile {
    const char* relativePath;
    const unsigned char* data;
    size_t size;
};

// Array of all packed files in the React UI ui/dist folder
extern const EmbeddedFile EMBEDDED_UI_FILES[];
extern const size_t EMBEDDED_UI_FILES_COUNT;

// Packed bytes of WebView2Loader.dll
extern const unsigned char EMBEDDED_LOADER_DLL[];
extern const size_t EMBEDDED_LOADER_DLL_SIZE;

} // namespace rune
