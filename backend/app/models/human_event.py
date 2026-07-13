from sqlalchemy import Column, Integer, Text

from app.database import Base


class HumanEvent(Base):
    __tablename__ = "human_events"

    human_id = Column(Integer, primary_key=True)
    event_id = Column(Integer, primary_key=True)
    role = Column(Text, default="participant")
