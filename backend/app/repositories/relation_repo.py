from sqlalchemy.orm import Session

from app.models.relation import HumanRelationship, RelationshipType


class RelationRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_type_by_name(self, name: str) -> RelationshipType | None:
        return self.db.query(RelationshipType).filter(RelationshipType.name == name).first()

    def get_by_id(self, relation_id: int) -> HumanRelationship | None:
        return self.db.query(HumanRelationship).filter(HumanRelationship.id == relation_id).first()

    def get_by_human(self, human_id: int) -> list[HumanRelationship]:
        return (
            self.db.query(HumanRelationship)
            .filter(HumanRelationship.from_human_id == human_id)
            .all()
        )

    def create(self, from_human_id: int, to_human_id: int, relation_type_id: int,
               start_date=None, end_date=None) -> HumanRelationship:
        rel = HumanRelationship(
            from_human_id=from_human_id,
            to_human_id=to_human_id,
            relation_id=relation_type_id,
            start_date=start_date,
            end_date=end_date,
        )
        self.db.add(rel)
        self.db.commit()
        self.db.refresh(rel)
        return rel

    def update(self, relation: HumanRelationship, **kwargs) -> HumanRelationship:
        for key, value in kwargs.items():
            if value is not None:
                setattr(relation, key, value)
        self.db.commit()
        self.db.refresh(relation)
        return relation

    def delete(self, relation: HumanRelationship) -> None:
        self.db.delete(relation)
        self.db.commit()
