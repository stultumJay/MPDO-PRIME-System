import requests
from fastapi import HTTPException

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"


def geocode_address(barangay: str, street: str) -> dict:
    """
    This helper handles the geocode address step for location data
    It cleans the input and returns the location values in a shape the backend can reuse
    """
    query = f"{street}, {barangay}, Alubijid, Misamis Oriental, Philippines"

    try:
        response = requests.get(
            NOMINATIM_URL,
            params={
                "q": query,
                "format": "json",
                "limit": 1,
            },
            headers={
                "User-Agent": "pme-system"
            },
            timeout=10,
        )

        response.raise_for_status()
        data = response.json()

        if not data:
            raise HTTPException(404, "Location not found")

        result = data[0]

        return {
            "latitude": float(result["lat"]),
            "longitude": float(result["lon"]),
            "display_name": result.get("display_name"),
            "municipality": "Alubijid",
            "region": "Region X",
            "island": "Mindanao",
            "country": "Philippines",
        }

    except Exception as e:
        raise HTTPException(500, f"Geocoding failed: {str(e)}")