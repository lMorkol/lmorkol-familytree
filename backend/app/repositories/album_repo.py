from sqlalchemy.orm import Session

from app.models.album import Album, AlbumMedia


class AlbumRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_human(self, human_id: int) -> list[Album]:
        return self.db.query(Album).filter(Album.human_id == human_id).all()

    def get_by_id(self, album_id: int) -> Album | None:
        return self.db.query(Album).filter(Album.id == album_id).first()

    def create(self, human_id: int, name: str, description: str | None = None) -> Album:
        album = Album(human_id=human_id, name=name, description=description)
        self.db.add(album)
        self.db.commit()
        self.db.refresh(album)
        return album

    def update(self, album: Album, **kwargs) -> Album:
        for key, value in kwargs.items():
            if value is not None:
                setattr(album, key, value)
        self.db.commit()
        self.db.refresh(album)
        return album

    def delete(self, album: Album) -> None:
        self.db.query(AlbumMedia).filter(AlbumMedia.album_id == album.id).delete()
        self.db.delete(album)
        self.db.commit()

    def add_media(self, album_id: int, media_id: int) -> AlbumMedia:
        am = AlbumMedia(album_id=album_id, media_id=media_id)
        self.db.add(am)
        self.db.commit()
        return am

    def remove_media(self, album_id: int, media_id: int) -> None:
        self.db.query(AlbumMedia).filter(
            AlbumMedia.album_id == album_id,
            AlbumMedia.media_id == media_id,
        ).delete()
        self.db.commit()

    def get_media_ids(self, album_id: int) -> list[int]:
        rows = self.db.query(AlbumMedia.media_id).filter(AlbumMedia.album_id == album_id).all()
        return [r[0] for r in rows]

    def get_media_counts_by_albums(self, album_ids: list[int]) -> dict[int, int]:
        if not album_ids:
            return {}
        from sqlalchemy import func
        rows = (
            self.db.query(AlbumMedia.album_id, func.count(AlbumMedia.media_id))
            .filter(AlbumMedia.album_id.in_(album_ids))
            .group_by(AlbumMedia.album_id)
            .all()
        )
        return {album_id: count for album_id, count in rows}

    def get_all_media_ids_by_albums(self, album_ids: list[int]) -> dict[int, list[int]]:
        if not album_ids:
            return {}
        rows = (
            self.db.query(AlbumMedia.album_id, AlbumMedia.media_id)
            .filter(AlbumMedia.album_id.in_(album_ids))
            .all()
        )
        result: dict[int, list[int]] = {aid: [] for aid in album_ids}
        for album_id, media_id in rows:
            result[album_id].append(media_id)
        return result
