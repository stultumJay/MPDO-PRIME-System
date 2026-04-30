import requests
from app.config import settings

def check_clearance(project_id: str):
    empty = {
        "is_clearanced": False,
        "reference_no": None,
        "checked_at": None,
    }

    if not settings.LOCATIONAL_CLEARANCE_API_BASE_URL:
        return empty

    url = f"{settings.LOCATIONAL_CLEARANCE_API_BASE_URL}/projects/{project_id}/clearance"

    try:
        response = requests.get(
            url,
            headers={"Authorization": f"Bearer {settings.LOCATIONAL_CLEARANCE_API_KEY}"},
            timeout=settings.EXTERNAL_API_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        data = response.json()

        return {
            "is_clearanced": bool(data.get("approved", False)),
            "reference_no": data.get("reference_no"),
            "checked_at": data.get("checked_at"),
        }
    except requests.RequestException:
        return empty