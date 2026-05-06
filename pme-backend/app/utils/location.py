from app.utils.geocoding import geocode_address


def normalize_location(barangay: str, street: str) -> dict:
    """
    This sends the location text into the geocoding helper and reshapes the result for the project record
    The returned dictionary is ready to be saved directly into the project location fields
    """
    # Geocoding fills in the map coordinates and the broader place names around the raw address
    geo = geocode_address(barangay, street)

    return {
        "barangay": barangay,
        "street": street,
        "location_lat": geo["latitude"],
        "location_lng": geo["longitude"],
        "municipality": geo["municipality"],
        "region": geo["region"],
        "island": geo["island"],
        "country": geo["country"],
    }
