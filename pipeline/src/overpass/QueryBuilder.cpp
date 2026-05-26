#include "QueryBuilder.hpp"
#include <sstream>

namespace QueryBuilder {
    std::string buildQuery(const BoundingBox& bbox) {
        std::stringstream ss;
        // Overpass QL expects bbox in order: south,west,north,east (minLat,minLon,maxLat,maxLon)
        ss << bbox.minLat << "," << bbox.minLon << "," << bbox.maxLat << "," << bbox.maxLon;
        std::string bboxStr = ss.str();

        std::string query = R"([out:json][timeout:120];
(
  node["amenity"="hospital"]({{bbox}});
  node["amenity"="police"]({{bbox}});
  node["amenity"="fire_station"]({{bbox}});
  node["amenity"="pharmacy"]({{bbox}});
  node["emergency"="ambulance_station"]({{bbox}});
  node["shop"="tyres"]({{bbox}});
  node["shop"="car_repair"]({{bbox}});
  way["amenity"="hospital"]({{bbox}});
  way["amenity"="police"]({{bbox}});
  relation["amenity"="hospital"]({{bbox}});
);
out center tags;)";

        // Replace all occurrences of {{bbox}} with actual bboxStr
        size_t pos = 0;
        while ((pos = query.find("{{bbox}}", pos)) != std::string::npos) {
            query.replace(pos, 8, bboxStr);
            pos += bboxStr.length();
        }

        return query;
    }
}
