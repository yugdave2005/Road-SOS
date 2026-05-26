#include "OverpassQuery.hpp"
#include "../utils/Logger.hpp"
#include "../../vendor/json.hpp"
#include <curl/curl.h>

using json = nlohmann::json;

namespace {
    size_t WriteCallback(void* contents, size_t size, size_t nmemb, void* userp) {
        ((std::string*)userp)->append((char*)contents, size * nmemb);
        return size * nmemb;
    }

    uint32_t getCategoryId(std::string_view amenity, std::string_view emergency, std::string_view shop) {
        if (amenity == "hospital" || amenity == "trauma_centre") return 1;
        if (amenity == "police") return 2;
        if (emergency == "ambulance_station") return 3;
        if (amenity == "pharmacy") return 4;
        if (amenity == "fire_station") return 5;
        if (shop == "car_repair") return 6;
        if (shop == "tyres") return 7;
        return 0; // unknown
    }

    std::string_view allocateString(ArenaAllocator& arena, const std::string& str) {
        if (str.empty()) return {};
        char* ptr = static_cast<char*>(arena.alloc(str.size() + 1, 1));
        if (!ptr) return {};
        std::copy(str.begin(), str.end(), ptr);
        ptr[str.size()] = '\0';
        return std::string_view(ptr, str.size());
    }
}

namespace OverpassQuery {
    std::expected<std::vector<Poi*>, std::string> execute(
        const std::string& query, 
        ArenaAllocator& arena
    ) {
        CURL* curl;
        CURLcode res;
        std::string readBuffer;

        curl = curl_easy_init();
        if (!curl) return std::unexpected("Failed to initialize libcurl");

        struct curl_slist* headers = NULL;
        headers = curl_slist_append(headers, "Content-Type: application/x-www-form-urlencoded");
        
        std::string postData = "data=" + query;
        const char* env_url = std::getenv("OVERPASS_API_URL");
        std::string url = env_url ? env_url : "https://overpass-api.de/api/interpreter";

        curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, postData.c_str());
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &readBuffer);
        curl_easy_setopt(curl, CURLOPT_TIMEOUT, 120L);

        Logger::info("Sending request to Overpass API...");
        res = curl_easy_perform(curl);
        
        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);

        if (res != CURLE_OK) {
            return std::unexpected(std::string("curl_easy_perform() failed: ") + curl_easy_strerror(res));
        }

        Logger::info("Request successful. Parsing JSON...");
        std::vector<Poi*> pois;

        try {
            auto j = json::parse(readBuffer);
            if (!j.contains("elements")) {
                return std::unexpected("JSON response does not contain 'elements'");
            }
            
            for (const auto& element : j["elements"]) {
                double lat = 0.0;
                double lon = 0.0;
                
                if (element.contains("lat") && element.contains("lon")) {
                    lat = element["lat"];
                    lon = element["lon"];
                } else if (element.contains("center")) { // ways/relations with "out center"
                    lat = element["center"]["lat"];
                    lon = element["center"]["lon"];
                } else {
                    continue;
                }

                uint64_t osm_id = element.value("id", 0ULL);
                std::string name = "";
                std::string phone = "";
                uint32_t category_id = 0;
                
                if (element.contains("tags")) {
                    const auto& tags = element["tags"];
                    std::string amenity = tags.value("amenity", "");
                    std::string emergency = tags.value("emergency", "");
                    std::string shop = tags.value("shop", "");
                    
                    category_id = getCategoryId(amenity, emergency, shop);
                    name = tags.value("name", "Unknown");
                    phone = tags.value("phone", "");
                }

                Poi* poi = static_cast<Poi*>(arena.alloc(sizeof(Poi), alignof(Poi)));
                if (!poi) return std::unexpected("Arena allocation failed for Poi struct");

                poi->lat = lat;
                poi->lon = lon;
                poi->osm_id = osm_id;
                poi->category_id = category_id;
                poi->name = allocateString(arena, name);
                poi->phone = allocateString(arena, phone);
                // address extraction omitted for brevity, can be expanded later

                pois.push_back(poi);
            }
        } catch (const std::exception& e) {
            return std::unexpected(std::string("JSON parse error: ") + e.what());
        }

        return pois;
    }
}
