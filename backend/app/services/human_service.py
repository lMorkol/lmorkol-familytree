from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.human_repo import HumanRepository
from app.dependencies import require_tree_access


class HumanService:
    def __init__(self, db: Session):
        self.db = db
        self.human_repo = HumanRepository(db)

    def create_human(self, tree_id: int, user: User, **kwargs) -> dict:
        require_tree_access(tree_id, user, self.db, min_role="editor")
        from datetime import datetime
        if "birth_date" in kwargs and kwargs["birth_date"]:
            kwargs["birth_date"] = datetime.fromisoformat(kwargs["birth_date"])
        if "death_date" in kwargs and kwargs["death_date"]:
            kwargs["death_date"] = datetime.fromisoformat(kwargs["death_date"])
        human = self.human_repo.create(tree_id=tree_id, **kwargs)
        return {"humanId": human.human_id}

    def get_human(self, human_id: int, user: User) -> dict:
        human = self.human_repo.get_by_id(human_id)
        if human is None:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Human not found")
        require_tree_access(human.tree_id, user, self.db)
        return {
            "humanId": human.human_id,
            "firstName": human.first_name,
            "secondName": human.second_name,
            "patronymic": human.patronymic,
            "gender": human.gender,
            "birthDate": str(human.birth_date) if human.birth_date else None,
            "deathDate": str(human.death_date) if human.death_date else None,
            "placeOfBirth": human.place_of_birth,
            "country": human.country,
            "treeId": human.tree_id,
            "photo": human.photo,
        }

    def update_human(self, human_id: int, user: User, **kwargs) -> dict:
        human = self.human_repo.get_by_id(human_id)
        if human is None:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Human not found")
        require_tree_access(human.tree_id, user, self.db, min_role="editor")
        from datetime import datetime
        if "birth_date" in kwargs and kwargs["birth_date"]:
            kwargs["birth_date"] = datetime.fromisoformat(kwargs["birth_date"])
        elif "birth_date" in kwargs:
            kwargs["birth_date"] = None
        if "death_date" in kwargs and kwargs["death_date"]:
            kwargs["death_date"] = datetime.fromisoformat(kwargs["death_date"])
        elif "death_date" in kwargs:
            kwargs["death_date"] = None
        updated = self.human_repo.update(human, **kwargs)
        return {
            "humanId": updated.human_id,
            "firstName": updated.first_name,
            "secondName": updated.second_name,
            "patronymic": updated.patronymic,
            "gender": updated.gender,
            "birthDate": str(updated.birth_date) if updated.birth_date else None,
            "deathDate": str(updated.death_date) if updated.death_date else None,
            "placeOfBirth": updated.place_of_birth,
            "country": updated.country,
            "treeId": updated.tree_id,
            "photo": updated.photo,
        }

    def delete_human(self, human_id: int, user: User) -> dict:
        human = self.human_repo.get_by_id(human_id)
        if human is None:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Human not found")
        require_tree_access(human.tree_id, user, self.db, min_role="admin")
        self.human_repo.soft_delete(human)
        return {"humanId": human.human_id}

    def search_humans(self, query: str, user: User, tree_id: int | None = None) -> list[dict]:
        from app.models.human import Human
        from sqlalchemy import or_

        q = self.db.query(Human).filter(Human.is_deleted == False)

        if tree_id:
            q = q.filter(Human.tree_id == tree_id)

        like_pattern = f"%{query}%"
        q = q.filter(
            or_(
                Human.first_name.ilike(like_pattern),
                Human.second_name.ilike(like_pattern),
                Human.patronymic.ilike(like_pattern),
                Human.human_id == query if query.isdigit() else False,
            )
        )

        q = q.limit(20)
        results = []
        for h in q.all():
            try:
                require_tree_access(h.tree_id, user, self.db, min_role="reader")
            except Exception:
                continue
            name = " ".join(filter(None, [h.second_name, h.first_name, h.patronymic]))
            results.append({
                "humanId": h.human_id,
                "name": name or f"Человек #{h.human_id}",
                "gender": h.gender,
                "treeId": h.tree_id,
            })
        return results
