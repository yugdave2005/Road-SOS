#include "GeoJsonWriter.hpp"
#include "../utils/Logger.hpp"
#include <fstream>
#include <chrono>
#include <iomanip>

namespace GeoJsonWriter {
    std::string getCategoryString(uint32_t category_id) {
        switch(category_id) {
            case 1: return "hospital"; // includes trauma_centre based on prompt definition
            case 2: return "police";
            case 3: return "ambulance_station";
            case 4: return "pharmacy";
            case 5: return "fire_station";
            case 6: return "car_repair"; // represents towing / repair
            case 7: return "tyres"; // represents puncture_shop
            default: return "unknown";
        }
    }

    std::string escapeJson(std::string_view s) {
        std::string res;
        res.reserve(s.size());
        for (char c : s) {
            if (c == '"') res += "\\\"";
            else if (c == '\\') res += "\\\\";
            else if (c == '\b') res += "\\b";
            else if (c == '\f') res += "\\f";
            else if (c == '\n') res += "\\n";
            else if (c == '\r') res += "\\r";
            else if (c == '\t') res += "\\t";
            else res += c;
        }
        return res;
    }

    std::expected<void, std::string> write(const std::string& filepath, const std::vector<Poi*>& pois) {
        std::ofstream out(filepath);
        if (!out.is_open()) {
            return std::unexpected("Failed to open file for writing: " + filepath);
        }

        uint64_t now_epoch = std::chrono::duration_cast<std::chrono::seconds>(
            std::chrono::system_clock::now().time_since_epoch()
        ).count();

        out << "{\"type\":\"FeatureCollection\",\"features\":[\n";

        for (size_t i = 0; i < pois.size(); ++i) {
            const Poi* poi = pois[i];
            out << "{\"type\":\"Feature\",\"geometry\":{\"type\":\"Point\",\"coordinates\":["
                << std::fixed << std::setprecision(6) << poi->lon << "," << poi->lat << "]},"
                << "\"properties\":{"
                << "\"osm_id\":" << poi->osm_id << ","
                << "\"category\":\"" << getCategoryString(poi->category_id) << "\","
                << "\"name\":\"" << escapeJson(poi->name) << "\","
                << "\"phone\":\"" << escapeJson(poi->phone) << "\","
                << "\"last_updated\":" << now_epoch << ","
                << "\"data_source\":\"osm\""
                << "}}";
            
            if (i < pois.size() - 1) out << ",\n";
            else out << "\n";
        }

        out << "]}\n";
        out.close();

        if (out.fail()) {
            return std::unexpected("An error occurred while writing the GeoJSON file.");
        }

        Logger::info("Successfully wrote " + std::to_string(pois.size()) + " features to " + filepath);
        return {};
    }
}
