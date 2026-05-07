from app.integrations.document_tracking_client import fetch_document_by_dtn
from app.integrations.google_drive_client import list_folder_files


def get_project_documents(dtn_no: str | None):
    """
    Returns all document metadata from the Google Drive folder linked to a DTN.
    """
    if not dtn_no:
        return []

    row = fetch_document_by_dtn(dtn_no)

    if not row:
        return []

    folder_url = row.get("document_url")
    if not folder_url:
        return []

    documents = []
    for file in list_folder_files(folder_url):
        file_id = file.get("id")
        name = file.get("name") or "Project document"
        mime_type = file.get("mimeType")
        created_time = file.get("createdTime")

        documents.append(
            {
                "id": file_id,
                "document_id": file_id,
                "title": name,
                "type": mime_type,
                "document_url": file.get("webViewLink"),
                "folder_url": folder_url,
                "download_url": f"https://drive.google.com/uc?export=download&id={file_id}" if file_id else None,
                "name": name,
                "document_name": name,
                "document_type": mime_type,
                "view_url": file.get("webViewLink"),
                "uploaded_at": created_time,
                "created_at": created_time,
            }
        )

    return documents