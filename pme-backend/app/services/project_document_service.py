from app.integrations.document_tracking_client import fetch_documents, download_document


def get_project_documents(project_id):
    """
    This gets the project documents data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    docs = fetch_documents(str(project_id))

    return [
        {
            "document_id": d.get("id"),
            "document_name": d.get("name"),
            "document_type": d.get("type"),
            "uploaded_at": d.get("uploaded_at"),
        }
        for d in docs
    ]


def get_document_stream(document_id):
    """
    This gets the document stream data the caller asked for
    It applies the needed lookup rules and returns the result in the shape the next layer expects
    """
    response = download_document(document_id)

    if not response:
        return None

    return response
