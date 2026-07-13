from sqlalchemy.orm import Session

from app.models.event import Event
from app.models.human_event import HumanEvent


class EventRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, event_id: int) -> Event | None:
        return self.db.query(Event).filter(Event.event_id == event_id, Event.is_deleted == False).first()

    def get_by_human(self, human_id: int) -> list[Event]:
        event_ids = (
            self.db.query(HumanEvent.event_id)
            .filter(HumanEvent.human_id == human_id)
            .all()
        )
        ids = [e[0] for e in event_ids]
        return self.db.query(Event).filter(Event.event_id.in_(ids), Event.is_deleted == False).all()

    def create(self, start_date, end_date=None, name: str = "", description: str = "") -> Event:
        event = Event(start_date=start_date, end_date=end_date, name=name, description=description)
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def link_to_human(self, human_id: int, event_id: int) -> HumanEvent:
        he = HumanEvent(human_id=human_id, event_id=event_id)
        self.db.add(he)
        self.db.commit()
        return he

    def update(self, event: Event, **kwargs) -> Event:
        for key, value in kwargs.items():
            if value is not None:
                setattr(event, key, value)
        self.db.commit()
        self.db.refresh(event)
        return event

    def soft_delete(self, event: Event) -> Event:
        event.is_deleted = True
        self.db.commit()
        return event
