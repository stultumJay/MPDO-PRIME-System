import requests
from app.config import settings

def fetch_documents(project_id: str):
    if not settings.DOCUMENT_TRACKING_API_BASE_URL:
        return []

    url = f"{settings.DOCUMENT_TRACKING_API_BASE_URL}/projects/{project_id}/documents"

    try:
        response = requests.get(
            url,
            headers={"Authorization": f"Bearer {settings.DOCUMENT_TRACKING_API_KEY}"},
            timeout=settings.EXTERNAL_API_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        data = response.json()
        return data if isinstance(data, list) else []
    except requests.RequestException:
        return []

def download_document(document_id: str):
    if not settings.DOCUMENT_TRACKING_API_BASE_URL:
        return None

    url = f"{settings.DOCUMENT_TRACKING_API_BASE_URL}/documents/{document_id}/download"

    try:
        return requests.get(
            url,
            headers={"Authorization": f"Bearer {settings.DOCUMENT_TRACKING_API_KEY}"},
            timeout=settings.EXTERNAL_API_TIMEOUT_SECONDS,
            stream=True,
        )
    except requests.RequestException:
        return None