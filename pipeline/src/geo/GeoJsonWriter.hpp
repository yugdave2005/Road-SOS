#pragma once
#include <string>
#include <vector>
#include <expected>
#include "../overpass/OverpassQuery.hpp" // For Poi struct

namespace GeoJsonWriter {
    /**
     * Writes a collection of POIs to a GeoJSON file format.
     * Streams output directly to prevent memory exhaustion.
     */
    std::expected<void, std::string> write(const std::string& filepath, const std::vector<Poi*>& pois);
}
