#pragma once
#include <string>
#include <vector>
#include <string_view>
#include <expected>
#include "../memory/ArenaAllocator.hpp"

// Hot fields first for cache locality
struct alignas(64) Poi {
    double lat;
    double lon;
    uint32_t category_id;
    uint64_t osm_id;
    std::string_view name;
    std::string_view phone;
    std::string_view address;
};

namespace OverpassQuery {
    /**
     * Executes the Overpass query via HTTP, parses JSON using nlohmann/json,
     * and allocates POI structs via the ArenaAllocator.
     * Allocator contract: all returned POIs and string_views are allocated in 'arena'.
     */
    std::expected<std::vector<Poi*>, std::string> execute(
        const std::string& query, 
        ArenaAllocator& arena
    );
}
