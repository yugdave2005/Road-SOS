#pragma once
#include <string>
#include "../geo/BoundingBox.hpp"

namespace QueryBuilder {
    // Builds the Overpass QL query string replacing {{bbox}} with the actual bbox.
    std::string buildQuery(const BoundingBox& bbox);
}
