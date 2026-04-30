from fastapi import HTTPException


ALUBIJID_BARANGAYS = {
    "Baybay",
    "Benigwayan",
    "Calatcat",
    "Lagtang",
    "Lanao",
    "Loguilo",
    "Lourdes",
    "Lumbo",
    "Molocboloc",
    "Poblacion",
    "Sampatulog",
    "Sungay",
    "Talaba",
    "Taparak",
    "Tugasnon",
    "Tula",
}

ALUBIJID_BARANGAY_COORDINATES = {
    "Baybay": (8.5850, 124.4540),
    "Benigwayan": (8.5480, 124.4750),
    "Calatcat": (8.5560, 124.4320),
    "Lagtang": (8.5710, 124.4900),
    "Lanao": (8.5920, 124.4970),
    "Loguilo": (8.5750, 124.5120),
    "Lourdes": (8.5250, 124.4650),
    "Lumbo": (8.5350, 124.4450),
    "Molocboloc": (8.5660, 124.4480),
    "Poblacion": (8.5730, 124.4730),
    "Sampatulog": (8.5380, 124.4940),
    "Sungay": (8.5550, 124.5060),
    "Talaba": (8.5950, 124.4680),
    "Taparak": (8.5120, 124.4450),
    "Tugasnon": (8.5050, 124.4830),
    "Tula": (8.5480, 124.5230),
}

ALUBIJID_BOUNDS = {
    "min_lat": 8.45,
    "max_lat": 8.68,
    "min_lng": 124.35,
    "max_lng": 124.58,
}


def validate_project_location(barangay: str | None, lat: float | None, lng: float | None) -> None:
    if barangay and barangay not in ALUBIJID_BARANGAYS:
        raise HTTPException(status_code=400, detail="Barangay must be within Alubijid.")

    if lat is None and lng is None:
        return

    if lat is None or lng is None:
        raise HTTPException(status_code=400, detail="Both latitude and longitude are required.")

    if not (
        ALUBIJID_BOUNDS["min_lat"] <= lat <= ALUBIJID_BOUNDS["max_lat"]
        and ALUBIJID_BOUNDS["min_lng"] <= lng <= ALUBIJID_BOUNDS["max_lng"]
    ):
        raise HTTPException(status_code=400, detail="Project coordinates must be within Alubijid.")
