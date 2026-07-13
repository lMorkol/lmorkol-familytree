from datetime import datetime

from sqlalchemy.orm import Session

from app.models.user import User
from app.models.human_event import HumanEvent
from app.models.event_media import EventMedia
from app.repositories.event_repo import EventRepository
from app.repositories.human_repo import HumanRepository
from app.dependencies import require_tree_access


class EventService:
    def __init__(self, db: Session):
        self.db = db
        self.event_repo = EventRepository(db)
        self.human_repo = HumanRepository(db)

    def _check_human_access(self, human_id: int, user: User, min_role: str = "editor"):
        human = self.human_repo.get_by_id(human_id)
        if human is None:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Human not found")
        require_tree_access(human.tree_id, user, self.db, min_role=min_role)
        return human

    def _get_event_human_tree_id(self, event_id: int) -> int | None:
        he = self.db.query(HumanEvent).filter(HumanEvent.event_id == event_id).first()
        if he is None:
            return None
        human = self.human_repo.get_by_id(he.human_id)
        return human.tree_id if human else None

    def _get_event_details(self, event_id: int) -> dict:
        participants = (
            self.db.query(HumanEvent)
            .filter(HumanEvent.event_id == event_id)
            .all()
        )
        human_ids = [p.human_id for p in participants]
        humans = self.human_repo.get_by_ids(human_ids) if human_ids else []
        human_map = {h.human_id: h for h in humans}

        participant_list = []
        for p in participants:
            human = human_map.get(p.human_id)
            if human:
                name = " ".join(filter(None, [human.second_name, human.first_name, human.patronymic]))
                participant_list.append({
                    "humanId": p.human_id,
                    "name": name or f"Человек #{p.human_id}",
                    "role": getattr(p, "role", None),
                })

        media_items = (
            self.db.query(EventMedia)
            .filter(EventMedia.event_id == event_id)
            .all()
        )
        media_list = [
            {
                "id": m.id,
                "filePath": m.file_path,
                "fileType": m.file_type,
                "originalFilename": m.original_filename,
            }
            for m in media_items
        ]

        return {"participants": participant_list, "media": media_list}

    def add_event(self, human_id: int, user: User, event_date: str, event_description: str,
                  event_end_date: str | None = None, name: str | None = None,
                  participants: list[int] | None = None) -> dict:
        self._check_human_access(human_id, user)
        start_date = datetime.fromisoformat(event_date)
        end_date = datetime.fromisoformat(event_end_date) if event_end_date else None
        event_name = name or event_description
        event = self.event_repo.create(start_date=start_date, end_date=end_date, name=event_name, description=event_description)
        self.event_repo.link_to_human(human_id, event.event_id)

        if participants:
            for pid in participants:
                if pid != human_id:
                    he = HumanEvent(human_id=pid, event_id=event.event_id, role="participant")
                    self.db.add(he)
            self.db.commit()

        details = self._get_event_details(event.event_id)
        return {
            "eventId": event.event_id,
            "eventDate": event_date,
            "eventEndDate": event_end_date,
            "eventDescription": event.description,
            "name": event.name,
            **details,
        }

    def update_event(self, event_id: int, user: User, event_date: str | None = None,
                     event_end_date: str | None = None, event_description: str | None = None,
                     name: str | None = None) -> dict:
        event = self.event_repo.get_by_id(event_id)
        if event is None:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
        tree_id = self._get_event_human_tree_id(event_id)
        if tree_id is not None:
            require_tree_access(tree_id, user, self.db, min_role="editor")
        kwargs = {}
        if event_date:
            kwargs["start_date"] = datetime.fromisoformat(event_date)
        if event_end_date is not None:
            kwargs["end_date"] = datetime.fromisoformat(event_end_date) if event_end_date else None
        if event_description:
            kwargs["description"] = event_description
        if name:
            kwargs["name"] = name
        updated = self.event_repo.update(event, **kwargs)
        details = self._get_event_details(updated.event_id)
        return {
            "eventId": updated.event_id,
            "eventDate": str(updated.start_date),
            "eventEndDate": str(updated.end_date) if updated.end_date else None,
            "eventDescription": updated.description,
            "name": updated.name,
            **details,
        }

    def delete_event(self, event_id: int, user: User) -> dict:
        event = self.event_repo.get_by_id(event_id)
        if event is None:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
        tree_id = self._get_event_human_tree_id(event_id)
        if tree_id is not None:
            require_tree_access(tree_id, user, self.db, min_role="editor")
        self.event_repo.soft_delete(event)
        return {"eventId": event.event_id}

    def get_events_by_human(self, human_id: int, user: User) -> list[dict]:
        self._check_human_access(human_id, user, min_role="reader")
        events = self.event_repo.get_by_human(human_id)
        result = []
        for e in events:
            details = self._get_event_details(e.event_id)
            result.append({
                "eventId": e.event_id,
                "eventDate": str(e.start_date),
                "eventEndDate": str(e.end_date) if e.end_date else None,
                "eventDescription": e.description,
                "name": e.name,
                **details,
            })
        result.sort(key=lambda x: x["eventDate"] or "", reverse=True)
        return result

    def upload_event_media(self, event_id: int, user: User, filename: str, file_content: bytes,
                           mime_type: str | None = None) -> dict:
        import os
        import time

        event = self.event_repo.get_by_id(event_id)
        if event is None:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

        he = self.db.query(HumanEvent).filter(HumanEvent.event_id == event_id).first()
        if he:
            human = self.human_repo.get_by_id(he.human_id)
            if human:
                require_tree_access(human.tree_id, user, self.db, min_role="editor")

        from app.services.media_service import detect_file_type, UPLOAD_DIR
        import uuid
        file_type = detect_file_type(mime_type)
        ext = os.path.splitext(filename)[1] or ".bin"
        safe_name = f"event_{event_id}_{uuid.uuid4().hex[:12]}{ext}"
        file_path = os.path.join(UPLOAD_DIR, safe_name)

        with open(file_path, "wb") as f:
            f.write(file_content)

        em = EventMedia(
            event_id=event_id,
            file_path=safe_name,
            file_type=file_type,
            original_filename=filename,
            mime_type=mime_type,
        )
        self.db.add(em)
        self.db.commit()

        return {
            "id": em.id,
            "filePath": em.file_path,
            "fileType": em.file_type,
            "originalFilename": em.original_filename,
        }
