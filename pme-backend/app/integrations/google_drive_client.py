import re
from typing import Any

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from app.config import settings


_FOLDER_ID_PATTERNS = (
    r"/folders/([a-zA-Z0-9_-]+)",
    r"[?&]id=([a-zA-Z0-9_-]+)",
    r"/d/([a-zA-Z0-9_-]+)",
)


def extract_drive_id(url: str | None) -> str | None:
    if not url:
        return None

    for pattern in _FOLDER_ID_PATTERNS:
        match = re.search(pattern, url)
        if match:
            return match.group(1)

    return None


def get_drive_service():
    """Initialize a Google Drive API service using the configured OAuth refresh token."""
    if (
        not settings.GOOGLE_CLIENT_ID
        or not settings.GOOGLE_CLIENT_SECRET
        or not settings.GOOGLE_REFRESH_TOKEN
    ):
        return None

    credentials = Credentials(
        token=None,
        refresh_token=settings.GOOGLE_REFRESH_TOKEN,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        scopes=["https://www.googleapis.com/auth/drive.readonly"],
    )
    return build("drive", "v3", credentials=credentials, cache_discovery=False)


def list_folder_files(folder_url: str | None) -> list[dict[str, Any]]:
    """List all non-trashed files in a Google Drive folder URL."""
    folder_id = extract_drive_id(folder_url)
    if not folder_id:
        return []

    try:
        service = get_drive_service()
        if service is None:
            return []

        results = (
            service.files()
            .list(
                q=f"'{folder_id}' in parents and trashed=false",
                fields="files(id,name,mimeType,createdTime,webViewLink,webContentLink)",
                orderBy="createdTime desc",
            )
            .execute()
        )
        return results.get("files", [])
    except Exception:
        return []