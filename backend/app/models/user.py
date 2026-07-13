from sqlalchemy import Column, Integer, Text, Boolean, DateTime
from sqlalchemy.sql import func

from app.database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    first_name = Column(Text, nullable=False)
    second_name = Column(Text, nullable=False)
    login = Column(Text, unique=True, nullable=False)
    password = Column(Text, nullable=False)
    gender = Column(Text, nullable=False, server_default="male")
    email = Column(Text, nullable=True)
    phone = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    human_id = Column(Integer, nullable=True)
    human_tree_id = Column(Integer, nullable=True)
    is_deleted = Column(Boolean, default=False)
