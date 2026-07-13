from sqlalchemy import Column, Integer, Text, DateTime, func

from app.database import Base


class Album(Base):
    __tablename__ = "albums"

    id = Column(Integer, primary_key=True, autoincrement=True)
    human_id = Column(Integer, nullable=False)
    name = Column(Text, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, server_default=func.now())


class AlbumMedia(Base):
    __tablename__ = "album_media"

    id = Column(Integer, primary_key=True, autoincrement=True)
    album_id = Column(Integer, nullable=False)
    media_id = Column(Integer, nullable=False)
