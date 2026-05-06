from app.integrations.locational_clearance_client import check_clearance
from app.config import settings


def get_project_clearance(project_id: str):
    """
    This gets the project clearance data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    if not settings.LOCATIONAL_CLEARANCE_API_BASE_URL:
        return {
            "is_clearanced": False,
            "reference_no": None,
            "checked_at": None
        }