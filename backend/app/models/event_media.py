from sqlalchemy import Column, Integer, Text, DateTime, func

from app.database import Base


class EventMedia(Base):
    __tablename__ = "event_media"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(Integer, nullable=False)
    file_path = Column(Text, nullable=False)
    file_type = Column(Text, nullable=False)
    original_filename = Column(Text, nullable=False)
    mime_type = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
