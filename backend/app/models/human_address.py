from sqlalchemy import Column, Integer, Text, Boolean, Float, Date

from app.database import Base


class HumanAddress(Base):
    __tablename__ = "human_addresses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    human_id = Column(Integer, nullable=False)
    country = Column(Text)
    city = Column(Text)
    street = Column(Text)
    house = Column(Text)
    apartment = Column(Text)
    address_type = Column(Text)
    period_start = Column(Date)
    period_end = Column(Date)
    lat = Column(Float)
    lng = Column(Float)
    is_deleted = Column(Boolean, default=False)
