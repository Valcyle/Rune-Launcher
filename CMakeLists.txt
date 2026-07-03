cmake_minimum_required(VERSION 3.15)
project(RuneLauncher LANGUAGES CXX)

# Use C++20 standard
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Source files
set(SOURCES
    src/main.cpp
    src/profile/ProfileManager.hpp
    src/profile/ProfileManager.cpp
    src/profile/ZipUtility.hpp
    src/profile/ZipUtility.cpp
    src/profile/ModImporter.hpp
    src/profile/ModImporter.cpp
    src/injection/DependencyResolver.hpp
    src/injection/DependencyResolver.cpp
    src/injection/Injector.hpp
    src/injection/Injector.cpp
    src/injection/InjectionRunner.hpp
    src/injection/InjectionRunner.cpp
    src/ui/AppWindow.hpp
    src/ui/AppWindow.cpp
    src/ui/GeneratedResources.hpp
    src/ui/GeneratedResources.cpp
)

add_executable(launcher ${SOURCES})

# WebView2 SDK Auto-Download Setup
set(WEBVIEW2_VERSION "1.0.1264.42")
set(WEBVIEW2_DIR "${CMAKE_BINARY_DIR}/webview2_sdk")

if(NOT EXISTS "${WEBVIEW2_DIR}")
    message(STATUS "Downloading Microsoft.Web.WebView2 SDK v${WEBVIEW2_VERSION}...")
    file(DOWNLOAD 
        "https://www.nuget.org/api/v2/package/Microsoft.Web.WebView2/${WEBVIEW2_VERSION}"
        "${CMAKE_BINARY_DIR}/webview2.zip"
        SHOW_PROGRESS
    )
    message(STATUS "Extracting WebView2 SDK...")
    file(ARCHIVE_EXTRACT 
        INPUT "${CMAKE_BINARY_DIR}/webview2.zip"
        DESTINATION "${WEBVIEW2_DIR}"
    )
    file(REMOVE "${CMAKE_BINARY_DIR}/webview2.zip")
endif()

set(WEBVIEW2_INCLUDE_DIR "${WEBVIEW2_DIR}/build/native/include")
set(WEBVIEW2_DLL "${WEBVIEW2_DIR}/build/native/x64/WebView2Loader.dll")
set(WEBVIEW2_LIB "${WEBVIEW2_DIR}/build/native/x64/WebView2Loader.dll.lib")

# Set include directories
target_include_directories(launcher PRIVATE include src ${WEBVIEW2_INCLUDE_DIR})

# Compiler-specific settings
if(MSVC)
    target_compile_options(launcher PRIVATE /W4)
    set_target_properties(launcher PROPERTIES LINK_FLAGS "/SUBSYSTEM:WINDOWS")
else()
    target_compile_options(launcher PRIVATE -Wall -Wextra)
    # Hide console window in MinGW GUI application
    # target_link_options(launcher PRIVATE -mwindows)
endif()

# Link Windows COM & WebView2 libraries
if(WIN32)
    # Link libraries (WebView2 is now loaded dynamically via LoadLibrary)
    target_link_libraries(launcher PRIVATE ole32 oleaut32 uuid dwmapi)

    # Copy WebView2Loader.dll next to launcher executable
    add_custom_command(TARGET launcher POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy_if_different
        "${WEBVIEW2_DLL}"
        "$<TARGET_FILE_DIR:launcher>/WebView2Loader.dll"
    )
endif()
