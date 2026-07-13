from sqlalchemy import Column, Integer, String, Date, UniqueConstraint

from app.database import Base


class RelationshipType(Base):
    __tablename__ = "relationship_types"

    relation_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False, unique=True)


class HumanRelationship(Base):
    __tablename__ = "human_relationship"

    id = Column(Integer, primary_key=True, autoincrement=True)
    from_human_id = Column(Integer, nullable=False)
    to_human_id = Column(Integer, nullable=False)
    relation_id = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)

    __table_args__ = (
        UniqueConstraint("from_human_id", "to_human_id", "relation_id"),
    )
