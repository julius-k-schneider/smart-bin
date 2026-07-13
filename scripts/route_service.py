import math


DEPOT = {
    "type": "depot",
    "label": "Waste Collection Depot",
    "lat": 50.9515,
    "lng": 6.889,
}


def distance_km(start, end):
    earth_radius = 6371
    lat_delta = math.radians(end["lat"] - start["lat"])
    lng_delta = math.radians(end["lng"] - start["lng"])
    value = (
        math.sin(lat_delta / 2) ** 2
        + math.cos(math.radians(start["lat"]))
        * math.cos(math.radians(end["lat"]))
        * math.sin(lng_delta / 2) ** 2
    )
    return earth_radius * 2 * math.atan2(math.sqrt(value), math.sqrt(1 - value))


def inclusion_reason(smart_bin, threshold):
    labels = {"trash": "Trash", "recycling": "Recycling", "compost": "Compost"}
    reasons = []
    for key, compartment in smart_bin["compartments"].items():
        if compartment["fill_level_percent"] >= threshold:
            reasons.append(f'{labels[key]} {round(compartment["fill_level_percent"])}%')
    return ", ".join(reasons)


def generate_route(bins, threshold, start_point=None):
    route_start = {
        "type": "depot",
        "label": start_point["label"],
        "lat": start_point["lat"],
        "lng": start_point["lng"],
    } if start_point else DEPOT.copy()
    remaining = [
        smart_bin
        for smart_bin in bins
        if any(item["fill_level_percent"] >= threshold for item in smart_bin["compartments"].values())
    ]
    stops = [route_start.copy()]
    current = route_start
    total_distance = 0

    while remaining:
        nearest = min(remaining, key=lambda smart_bin: distance_km(current, smart_bin))
        total_distance += distance_km(current, nearest)
        stops.append(
            {
                "type": "bin",
                "label": nearest["label"],
                "lat": nearest["lat"],
                "lng": nearest["lng"],
                "bin_id": nearest["bin_id"],
                "reason": inclusion_reason(nearest, threshold),
            }
        )
        remaining.remove(nearest)
        current = nearest

    if len(stops) > 1:
        total_distance += distance_km(current, route_start)
        return_stop = route_start.copy()
        return_stop["label"] = f'{route_start["label"]} (Return)'
        stops.append(return_stop)

    return {"stops": stops, "totalDistanceKm": round(total_distance, 2)}
