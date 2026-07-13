from sqlalchemy import Column, Integer, Boolean, UniqueConstraint

from app.database import Base


class TreeUser(Base):
    __tablename__ = "tree_users"

    tree_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, primary_key=True)
    role_id = Column(Integer, nullable=False)
    human_id = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
