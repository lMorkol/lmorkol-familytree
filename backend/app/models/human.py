from sqlalchemy import Column, Integer, Text, Boolean, DateTime, Time

from app.database import Base


class Human(Base):
    __tablename__ = "humans"

    human_id = Column(Integer, primary_key=True, autoincrement=True)
    first_name = Column(Text)
    second_name = Column(Text)
    patronymic = Column(Text)
    birth_date = Column(DateTime)
    birth_time = Column(Time)
    death_date = Column(DateTime)
    country = Column(Text)
    place_of_birth = Column(Text)
    gender = Column(Text, nullable=False)
    tree_id = Column(Integer, nullable=False)
    photo = Column(Text)
    is_deleted = Column(Boolean, default=False)
