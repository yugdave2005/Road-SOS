#pragma once
#include <string>
#include <sstream>
#include <expected>
#include <vector>

struct BoundingBox {
    double minLon;
    double minLat;
    double maxLon;
    double maxLat;

    // Parse from "minLon,minLat,maxLon,maxLat"
    static std::expected<BoundingBox, std::string> parse(const std::string& bboxStr) {
        std::stringstream ss(bboxStr);
        std::string token;
        std::vector<double> coords;
        
        while (std::getline(ss, token, ',')) {
            try {
                coords.push_back(std::stod(token));
            } catch (const std::exception&) {
                return std::unexpected("Invalid coordinate value: " + token);
            }
        }
        
        if (coords.size() != 4) {
            return std::unexpected("Bounding box must have exactly 4 coordinates.");
        }
        
        return BoundingBox{coords[0], coords[1], coords[2], coords[3]};
    }
};
