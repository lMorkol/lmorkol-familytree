import os

from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.media_repo import MediaRepository
from app.repositories.human_repo import HumanRepository
from app.dependencies import require_tree_access

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")

FILE_TYPE_MAP = {
    "image/": "photo",
    "video/": "video",
    "audio/": "audio",
}


def detect_file_type(mime_type: str | None) -> str:
    if not mime_type:
        return "document"
    for prefix, ftype in FILE_TYPE_MAP.items():
        if mime_type.startswith(prefix):
            return ftype
    return "document"


class MediaService:
    def __init__(self, db: Session):
        self.db = db
        self.media_repo = MediaRepository(db)
        self.human_repo = HumanRepository(db)

    def upload_media(self, human_id: int, user: User, filename: str, file_content: bytes,
                     mime_type: str | None = None, title: str | None = None,
                     description: str | None = None) -> dict:
        from fastapi import HTTPException, status

        human = self.human_repo.get_by_id(human_id)
        if human is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Human not found")
        require_tree_access(human.tree_id, user, self.db, min_role="editor")

        import uuid
        file_type = detect_file_type(mime_type)
        ext = os.path.splitext(filename)[1] or ".bin"
        safe_name = f"human_{human_id}_{uuid.uuid4().hex[:12]}{ext}"
        file_path = os.path.join(UPLOAD_DIR, safe_name)

        with open(file_path, "wb") as f:
            f.write(file_content)

        media = self.media_repo.create(
            human_id=human_id,
            file_path=safe_name,
            file_type=file_type,
            original_filename=filename,
            mime_type=mime_type,
            title=title,
            description=description,
        )

        return {
            "id": media.id,
            "humanId": media.human_id,
            "filePath": media.file_path,
            "fileType": media.file_type,
            "originalFilename": media.original_filename,
            "mimeType": media.mime_type,
            "title": media.title,
            "description": media.description,
            "createdAt": str(media.created_at) if media.created_at else None,
        }

    def get_media(self, human_id: int, user: User) -> list[dict]:
        human = self.human_repo.get_by_id(human_id)
        if human is None:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Human not found")
        require_tree_access(human.tree_id, user, self.db, min_role="reader")

        items = self.media_repo.get_by_human(human_id)
        return [
            {
                "id": m.id,
                "humanId": m.human_id,
                "filePath": m.file_path,
                "fileType": m.file_type,
                "originalFilename": m.original_filename,
                "mimeType": m.mime_type,
                "title": m.title,
                "description": m.description,
                "createdAt": str(m.created_at) if m.created_at else None,
            }
            for m in items
        ]

    def delete_media(self, media_id: int, user: User) -> dict:
        from fastapi import HTTPException, status

        media = self.media_repo.get_by_id(media_id)
        if media is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")

        human = self.human_repo.get_by_id(media.human_id)
        require_tree_access(human.tree_id, user, self.db, min_role="editor")

        file_path = os.path.join(UPLOAD_DIR, media.file_path)
        if os.path.exists(file_path):
            os.remove(file_path)

        self.media_repo.delete(media)
        return {"id": media_id}
