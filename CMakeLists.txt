cmake_minimum_required(VERSION 3.15)
project(RuneLauncher LANGUAGES CXX)

# Use C++20 standard
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Source files
set(SOURCES
    src/main.cpp
    src/ProfileManager.hpp
    src/ProfileManager.cpp
    src/ZipUtility.hpp
    src/ZipUtility.cpp
    src/ModImporter.hpp
    src/ModImporter.cpp
)

add_executable(launcher ${SOURCES})

# Set include directories
target_include_directories(launcher PRIVATE include)

# Compiler-specific settings
if(MSVC)
    target_compile_options(launcher PRIVATE /W4)
else()
    target_compile_options(launcher PRIVATE -Wall -Wextra)
endif()

# Link Windows COM libraries
if(WIN32)
    target_link_libraries(launcher PRIVATE ole32 oleaut32 uuid)
endif()
