from sqlalchemy import Column, Integer, Text, DateTime, func

from app.database import Base


class HumanMedia(Base):
    __tablename__ = "human_media"

    id = Column(Integer, primary_key=True, autoincrement=True)
    human_id = Column(Integer, nullable=False)
    file_path = Column(Text, nullable=False)
    file_type = Column(Text, nullable=False)  # photo, video, audio, document
    original_filename = Column(Text, nullable=False)
    mime_type = Column(Text)
    title = Column(Text)
    description = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
