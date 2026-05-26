#include "geo/BoundingBox.hpp"
#include "geo/GeoJsonWriter.hpp"
#include "overpass/QueryBuilder.hpp"
#include "overpass/OverpassQuery.hpp"
#include "memory/ArenaAllocator.hpp"
#include "utils/Logger.hpp"

#include <iostream>
#include <string>

void printUsage() {
    std::cerr << "Usage: roadsos-pipeline --bbox <min_lon,min_lat,max_lon,max_lat> --output <out.geojson> [--radius-km <50>]\n";
}

int main(int argc, char** argv) {
    std::string bboxStr;
    std::string outputStr;

    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "--bbox" && i + 1 < argc) {
            bboxStr = argv[++i];
        } else if (arg == "--output" && i + 1 < argc) {
            outputStr = argv[++i];
        } else if (arg == "--radius-km" && i + 1 < argc) {
            ++i; // radius-km is unused in phase 1 based on spec, defaults implicitly via bbox expansion
        } else {
            printUsage();
            return 1;
        }
    }

    if (bboxStr.empty() || outputStr.empty()) {
        printUsage();
        return 1;
    }

    auto bboxOpt = BoundingBox::parse(bboxStr);
    if (!bboxOpt.has_value()) {
        Logger::error(bboxOpt.error());
        return 1;
    }
    const BoundingBox& bbox = bboxOpt.value();

    // 1. Initialize 256MB arena
    ArenaAllocator arena(256 * 1024 * 1024);

    // 2. Build query
    std::string query = QueryBuilder::buildQuery(bbox);
    Logger::info("Built Overpass query");

    // 3. Execute query
    auto poisOpt = OverpassQuery::execute(query, arena);
    if (!poisOpt.has_value()) {
        Logger::error(poisOpt.error());
        return 1;
    }
    const auto& pois = poisOpt.value();
    Logger::info("Fetched " + std::to_string(pois.size()) + " POIs.");

    // 4. Write GeoJSON
    auto writeRes = GeoJsonWriter::write(outputStr, pois);
    if (!writeRes.has_value()) {
        Logger::error(writeRes.error());
        return 1;
    }

    Logger::info("Pipeline finished successfully.");
    return 0;
}
