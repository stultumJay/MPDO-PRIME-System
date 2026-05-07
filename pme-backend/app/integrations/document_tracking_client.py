import requests

from app.config import settings


def fetch_document_by_dtn(dtn_no: str) -> dict | None:
    """
    Fetch a document from Supabase using DTN mapped to the documents.id column.
    """
    if not settings.DOCUMENT_TRACKING_API_BASE_URL or not settings.DOCUMENT_TRACKING_API_KEY:
        return None

    url = f"{settings.DOCUMENT_TRACKING_API_BASE_URL}/documents"

    try:
        response = requests.get(
            url,
            headers={
                "apikey": settings.DOCUMENT_TRACKING_API_KEY,
                "Authorization": f"Bearer {settings.DOCUMENT_TRACKING_API_KEY}",
                "Content-Type": "application/json",
            },
            params={
                "id": f"eq.{dtn_no}",
                "select": "id,title,type,document_url",
                "limit": 1,
            },
            timeout=settings.EXTERNAL_API_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        data = response.json()

        if isinstance(data, list) and data:
            return data[0]

        return None
    except requests.RequestException:
        return None