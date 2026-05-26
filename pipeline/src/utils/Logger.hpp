#pragma once
#include <iostream>
#include <string_view>
#include <chrono>

namespace Logger {
    inline void info(std::string_view msg) noexcept {
        std::cerr << "[INFO] " << msg << "\n";
    }
    inline void warn(std::string_view msg) noexcept {
        std::cerr << "[WARN] " << msg << "\n";
    }
    inline void error(std::string_view msg) noexcept {
        std::cerr << "[ERROR] " << msg << "\n";
    }
}
