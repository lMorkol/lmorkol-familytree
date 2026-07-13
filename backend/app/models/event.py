from sqlalchemy import Column, Integer, Text, Boolean, DateTime
from sqlalchemy.sql import func

from app.database import Base


class Event(Base):
    __tablename__ = "events"

    event_id = Column(Integer, primary_key=True, autoincrement=True)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True))
    name = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    is_deleted = Column(Boolean, default=False)
