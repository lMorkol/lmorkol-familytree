from sqlalchemy.orm import Session

from app.models.media import HumanMedia


class MediaRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_human(self, human_id: int) -> list[HumanMedia]:
        return (
            self.db.query(HumanMedia)
            .filter(HumanMedia.human_id == human_id)
            .order_by(HumanMedia.created_at.desc())
            .all()
        )

    def get_by_id(self, media_id: int) -> HumanMedia | None:
        return self.db.query(HumanMedia).filter(HumanMedia.id == media_id).first()

    def get_by_ids(self, media_ids: list[int]) -> list[HumanMedia]:
        if not media_ids:
            return []
        return self.db.query(HumanMedia).filter(HumanMedia.id.in_(media_ids)).all()

    def create(self, human_id: int, file_path: str, file_type: str,
               original_filename: str, mime_type: str | None = None,
               title: str | None = None, description: str | None = None) -> HumanMedia:
        media = HumanMedia(
            human_id=human_id,
            file_path=file_path,
            file_type=file_type,
            original_filename=original_filename,
            mime_type=mime_type,
            title=title,
            description=description,
        )
        self.db.add(media)
        self.db.commit()
        self.db.refresh(media)
        return media

    def delete(self, media: HumanMedia) -> None:
        self.db.delete(media)
        self.db.commit()
