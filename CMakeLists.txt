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
)

add_executable(launcher ${SOURCES})

# Compiler-specific settings
if(MSVC)
    target_compile_options(launcher PRIVATE /W4)
else()
    target_compile_options(launcher PRIVATE -Wall -Wextra)
endif()
