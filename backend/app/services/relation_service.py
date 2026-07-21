from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.relation_repo import RelationRepository
from app.repositories.human_repo import HumanRepository
from app.dependencies import require_tree_access


class RelationService:
    def __init__(self, db: Session):
        self.db = db
        self.relation_repo = RelationRepository(db)
        self.human_repo = HumanRepository(db)

    def add_relation(self, human_id: int, user: User, relative_id: int, relation_type: str,
                     start_date: str | None = None, end_date: str | None = None) -> dict:
        if human_id == relative_id:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot create relation to yourself")

        human = self.human_repo.get_by_id(human_id)
        if human is None:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Human not found")
        require_tree_access(human.tree_id, user, self.db, min_role="editor")

        # Validate: cannot add spouse if one already exists
        if relation_type == "spouse":
            from app.models.relation import HumanRelationship as HR, RelationshipType as RT
            spouse_type = self.db.query(RT).filter(RT.name == "spouse").first()
            if spouse_type:
                existing = (
                    self.db.query(HR)
                    .filter(
                        HR.relation_id == spouse_type.relation_id,
                        ((HR.from_human_id == human_id) | (HR.to_human_id == human_id)),
                    )
                    .first()
                )
                if existing:
                    from fastapi import HTTPException, status
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="У этого человека уже есть супруг. Сначала сделайте текущего супруга бывшим.",
                    )
                existing_relative = (
                    self.db.query(HR)
                    .filter(
                        HR.relation_id == spouse_type.relation_id,
                        ((HR.from_human_id == relative_id) | (HR.to_human_id == relative_id)),
                    )
                    .first()
                )
                if existing_relative:
                    from fastapi import HTTPException, status
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="У выбранного человека уже есть супруг. Сначала сделайте текущего супруга бывшим.",
                    )

        rel_type = self.relation_repo.get_type_by_name(relation_type)
        if rel_type is None:
            from app.models.relation import RelationshipType
            rel_type = RelationshipType(name=relation_type)
            self.db.add(rel_type)
            self.db.commit()
            self.db.refresh(rel_type)

        INVERSE = {
            "parent": "child", "child": "parent",
            "spouse": "spouse", "ex_spouse": "ex_spouse",
            "adopted": "adopted",
            "brother": "brother", "sister": "sister", "sibling": "sibling",
            "grandmother": "grandchild", "grandfather": "grandchild",
            "grandchild": "grandparent",
            "stepbrother": "stepbrother", "stepsister": "stepsister",
        }

        from datetime import date
        parsed_start = date.fromisoformat(start_date) if start_date else None
        parsed_end = date.fromisoformat(end_date) if end_date else None

        rel = self.relation_repo.create(
            from_human_id=human_id,
            to_human_id=relative_id,
            relation_type_id=rel_type.relation_id,
            start_date=parsed_start,
            end_date=parsed_end,
        )

        inverse_name = INVERSE.get(relation_type)
        if inverse_name:
            inverse_type = self.relation_repo.get_type_by_name(inverse_name)
            if inverse_type:
                self.relation_repo.create(
                    from_human_id=relative_id,
                    to_human_id=human_id,
                    relation_type_id=inverse_type.relation_id,
                    start_date=parsed_start,
                    end_date=parsed_end,
                )

        return {
            "id": rel.id,
            "fromHumanId": rel.from_human_id,
            "toHumanId": rel.to_human_id,
            "relationType": relation_type,
            "startDate": str(rel.start_date) if rel.start_date else None,
            "endDate": str(rel.end_date) if rel.end_date else None,
        }

    def update_relation(self, relation_id: int, user: User, relation_type: str | None = None,
                        start_date: str | None = None, end_date: str | None = None) -> dict:
        rel = self.relation_repo.get_by_id(relation_id)
        if rel is None:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Relation not found")
        human = self.human_repo.get_by_id(rel.from_human_id)
        require_tree_access(human.tree_id, user, self.db, min_role="editor")

        from datetime import date
        kwargs = {}
        if start_date is not None:
            kwargs["start_date"] = date.fromisoformat(start_date) if start_date else None
        if end_date is not None:
            kwargs["end_date"] = date.fromisoformat(end_date) if end_date else None

        # Update relation type if changed
        new_type_name = None
        if relation_type:
            new_type = self.relation_repo.get_type_by_name(relation_type)
            if new_type and new_type.relation_id != rel.relation_id:
                new_type_name = relation_type
                self.relation_repo.update(rel, relation_id=new_type.relation_id)

        if kwargs:
            self.relation_repo.update(rel, **kwargs)

        # Also update the inverse relation
        from app.models.relation import HumanRelationship, RelationshipType

        INVERSE = {
            "parent": "child", "child": "parent",
            "spouse": "spouse", "ex_spouse": "ex_spouse",
            "adopted": "adopted",
            "brother": "brother", "sister": "sister", "sibling": "sibling",
            "grandmother": "grandchild", "grandfather": "grandchild",
            "grandchild": "grandparent",
            "stepbrother": "stepbrother", "stepsister": "stepsister",
        }

        # Determine inverse type name
        current_type = self.db.query(RelationshipType).filter(RelationshipType.relation_id == rel.relation_id).first()
        inverse_name = INVERSE.get(new_type_name or (current_type.name if current_type else ""))

        if inverse_name:
            inverse_type = self.db.query(RelationshipType).filter(RelationshipType.name == inverse_name).first()
            if inverse_type:
                inverse_rel = (
                    self.db.query(HumanRelationship)
                    .filter(
                        HumanRelationship.from_human_id == rel.to_human_id,
                        HumanRelationship.to_human_id == rel.from_human_id,
                    )
                    .first()
                )
                if inverse_rel:
                    inv_kwargs = dict(kwargs)
                    if new_type_name:
                        inv_kwargs["relation_id"] = inverse_type.relation_id
                    self.relation_repo.update(inverse_rel, **inv_kwargs)

        rt = self.db.query(RelationshipType).filter(RelationshipType.relation_id == rel.relation_id).first()
        return {
            "id": rel.id,
            "fromHumanId": rel.from_human_id,
            "toHumanId": rel.to_human_id,
            "relationType": rt.name if rt else "unknown",
            "startDate": str(rel.start_date) if rel.start_date else None,
            "endDate": str(rel.end_date) if rel.end_date else None,
        }

    def delete_relation(self, relation_id: int, user: User) -> dict:
        rel = self.relation_repo.get_by_id(relation_id)
        if rel is None:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Relation not found")
        human = self.human_repo.get_by_id(rel.from_human_id)
        require_tree_access(human.tree_id, user, self.db, min_role="editor")

        from app.models.relation import HumanRelationship, RelationshipType
        rt = self.db.query(RelationshipType).filter(RelationshipType.relation_id == rel.relation_id).first()
        INVERSE = {
            "parent": "child", "child": "parent",
            "spouse": "spouse", "ex_spouse": "ex_spouse",
            "adopted": "adopted",
            "brother": "brother", "sister": "sister", "sibling": "sibling",
            "grandmother": "grandchild", "grandfather": "grandchild",
            "grandchild": "grandparent",
            "stepbrother": "stepbrother", "stepsister": "stepsister",
        }
        inverse_name = INVERSE.get(rt.name) if rt else None

        if inverse_name:
            inverse_type = self.db.query(RelationshipType).filter(RelationshipType.name == inverse_name).first()
            if inverse_type:
                inverse_rel = (
                    self.db.query(HumanRelationship)
                    .filter(
                        HumanRelationship.from_human_id == rel.to_human_id,
                        HumanRelationship.to_human_id == rel.from_human_id,
                        HumanRelationship.relation_id == inverse_type.relation_id,
                    )
                    .first()
                )
                if inverse_rel:
                    self.db.delete(inverse_rel)

        self.db.delete(rel)
        self.db.commit()
        return {"id": rel.id}

    def get_relations_by_human(self, human_id: int, user: User) -> list[dict]:
        human = self.human_repo.get_by_id(human_id)
        if human is None:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Human not found")
        require_tree_access(human.tree_id, user, self.db, min_role="reader")
        rels = self.relation_repo.get_by_human(human_id)

        from app.models.relation import RelationshipType
        rt_ids = list(set(r.relation_id for r in rels))
        rts = self.db.query(RelationshipType).filter(RelationshipType.relation_id.in_(rt_ids)).all() if rt_ids else []
        rt_map = {rt.relation_id: rt.name for rt in rts}

        to_human_ids = list(set(r.to_human_id for r in rels))
        related_humans = self.human_repo.get_by_ids(to_human_ids) if to_human_ids else []
        related_map = {h.human_id: h for h in related_humans}

        result = []
        for r in rels:
            related = related_map.get(r.to_human_id)
            related_name = ""
            related_gender = ""
            if related:
                parts = [related.second_name, related.first_name, related.patronymic]
                related_name = " ".join(p for p in parts if p)
                related_gender = related.gender or ""
            result.append({
                "id": r.id,
                "fromHumanId": r.from_human_id,
                "toHumanId": r.to_human_id,
                "relationType": rt_map.get(r.relation_id, "unknown"),
                "relatedName": related_name,
                "relatedGender": related_gender,
                "startDate": str(r.start_date) if r.start_date else None,
                "endDate": str(r.end_date) if r.end_date else None,
            })
        return result
