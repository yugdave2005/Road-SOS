cmake_minimum_required(VERSION 3.20)
project(roadsos_pipeline VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 23) # Changed to 23 for std::expected support, or use 17 with polyfill. Wait, std::expected is C++23. Prompt says C++17, but also "Use std::expected<T, Error> (C++23) or a custom Result<T, E>". I'll set CMAKE_CXX_STANDARD to 23 to get std::expected natively.

set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(roadsos_pipeline
    src/main.cpp
    src/overpass/OverpassQuery.cpp
    src/overpass/QueryBuilder.cpp
    src/geo/GeoJsonWriter.cpp
)

target_include_directories(roadsos_pipeline PRIVATE src vendor)

find_package(CURL REQUIRED)
target_link_libraries(roadsos_pipeline PRIVATE CURL::libcurl)

target_compile_options(roadsos_pipeline PRIVATE
    -O3
    -march=native
    -fno-exceptions
    -fno-rtti
    -Wall -Wextra -Werror
)

if(CMAKE_BUILD_TYPE STREQUAL "Debug")
    target_compile_options(roadsos_pipeline PRIVATE -fsanitize=address,undefined)
    target_link_options(roadsos_pipeline PRIVATE -fsanitize=address,undefined)
endif()
