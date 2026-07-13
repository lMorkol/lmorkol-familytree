from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.album_repo import AlbumRepository
from app.repositories.human_repo import HumanRepository
from app.repositories.media_repo import MediaRepository
from app.dependencies import require_tree_access


class AlbumService:
    def __init__(self, db: Session):
        self.db = db
        self.album_repo = AlbumRepository(db)
        self.human_repo = HumanRepository(db)
        self.media_repo = MediaRepository(db)

    def _check_human_access(self, human_id: int, user: User, min_role: str = "editor"):
        human = self.human_repo.get_by_id(human_id)
        if human is None:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Human not found")
        require_tree_access(human.tree_id, user, self.db, min_role=min_role)
        return human

    def get_albums(self, human_id: int, user: User) -> list[dict]:
        self._check_human_access(human_id, user, min_role="reader")
        albums = self.album_repo.get_by_human(human_id)
        album_ids = [a.id for a in albums]
        counts = self.album_repo.get_media_counts_by_albums(album_ids)
        result = []
        for a in albums:
            result.append({
                "id": a.id,
                "humanId": a.human_id,
                "name": a.name,
                "description": a.description,
                "mediaCount": counts.get(a.id, 0),
                "createdAt": str(a.created_at) if a.created_at else None,
            })
        return result

    def create_album(self, human_id: int, user: User, name: str, description: str | None = None) -> dict:
        self._check_human_access(human_id, user)
        album = self.album_repo.create(human_id=human_id, name=name, description=description)
        return {
            "id": album.id,
            "humanId": album.human_id,
            "name": album.name,
            "description": album.description,
            "mediaCount": 0,
            "createdAt": str(album.created_at) if album.created_at else None,
        }

    def update_album(self, album_id: int, user: User, name: str | None = None,
                     description: str | None = None) -> dict:
        album = self.album_repo.get_by_id(album_id)
        if album is None:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Album not found")
        self._check_human_access(album.human_id, user)
        kwargs = {}
        if name is not None:
            kwargs["name"] = name
        if description is not None:
            kwargs["description"] = description
        updated = self.album_repo.update(album, **kwargs)
        media_ids = self.album_repo.get_media_ids(updated.id)
        return {
            "id": updated.id,
            "humanId": updated.human_id,
            "name": updated.name,
            "description": updated.description,
            "mediaCount": len(media_ids),
            "createdAt": str(updated.created_at) if updated.created_at else None,
        }

    def delete_album(self, album_id: int, user: User) -> dict:
        album = self.album_repo.get_by_id(album_id)
        if album is None:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Album not found")
        self._check_human_access(album.human_id, user)
        self.album_repo.delete(album)
        return {"id": album_id}

    def add_media_to_album(self, album_id: int, media_id: int, user: User) -> dict:
        album = self.album_repo.get_by_id(album_id)
        if album is None:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Album not found")
        self._check_human_access(album.human_id, user)
        media = self.media_repo.get_by_id(media_id)
        if media is None:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")
        self.album_repo.add_media(album_id, media_id)
        return {"albumId": album_id, "mediaId": media_id}

    def remove_media_from_album(self, album_id: int, media_id: int, user: User) -> dict:
        album = self.album_repo.get_by_id(album_id)
        if album is None:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Album not found")
        self._check_human_access(album.human_id, user)
        self.album_repo.remove_media(album_id, media_id)
        return {"albumId": album_id, "mediaId": media_id}

    def get_album_media(self, album_id: int, user: User) -> list[dict]:
        album = self.album_repo.get_by_id(album_id)
        if album is None:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Album not found")
        self._check_human_access(album.human_id, user, min_role="reader")
        media_ids = self.album_repo.get_media_ids(album_id)
        media_items = self.media_repo.get_by_ids(media_ids) if media_ids else []
        media_map = {m.id: m for m in media_items}
        result = []
        for mid in media_ids:
            m = media_map.get(mid)
            if m:
                result.append({
                    "id": m.id,
                    "humanId": m.human_id,
                    "filePath": m.file_path,
                    "fileType": m.file_type,
                    "originalFilename": m.original_filename,
                    "mimeType": m.mime_type,
                    "title": m.title,
                    "description": m.description,
                    "createdAt": str(m.created_at) if m.created_at else None,
                })
        return result
