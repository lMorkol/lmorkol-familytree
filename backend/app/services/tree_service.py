from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.tree_repo import TreeRepository
from app.repositories.human_repo import HumanRepository
from app.repositories.user_repo import UserRepository
from app.repositories.role_repo import RoleRepository
from app.dependencies import require_tree_access

VALID_ROLES = {"admin", "editor", "reader"}


class TreeService:
    def __init__(self, db: Session):
        self.db = db
        self.tree_repo = TreeRepository(db)
        self.human_repo = HumanRepository(db)
        self.user_repo = UserRepository(db)
        self.role_repo = RoleRepository(db)

    def get_user_trees(self, user: User) -> list[dict]:
        trees = self.tree_repo.get_user_trees(user.user_id)
        return [{"id": t.tree_id, "name": t.name, "photo": t.photo} for t in trees]

    def get_tree_info(self, tree_id: int, user: User) -> dict:
        require_tree_access(tree_id, user, self.db)
        tree = self.tree_repo.get_by_id(tree_id)
        return {"name": tree.name, "createdBy": tree.created_by}

    def get_tree_humans(self, tree_id: int, user: User, search: str | None = None,
                        first_name: str | None = None, second_name: str | None = None,
                        gender: str | None = None, place_of_birth: str | None = None,
                        country: str | None = None, limit: int | None = None,
                        offset: int | None = None) -> dict:
        require_tree_access(tree_id, user, self.db)
        total = self.human_repo.count_by_tree(tree_id, search=search, first_name=first_name,
                                               second_name=second_name, gender=gender,
                                               place_of_birth=place_of_birth, country=country)
        humans = self.human_repo.get_by_tree(tree_id, search=search, first_name=first_name,
                                              second_name=second_name, gender=gender,
                                              place_of_birth=place_of_birth, country=country,
                                              limit=limit, offset=offset)
        items = [
            {
                "humanId": h.human_id,
                "firstName": h.first_name,
                "secondName": h.second_name,
                "gender": h.gender,
                "photo": h.photo,
            }
            for h in humans
        ]
        return {"items": items, "total": total}

    def update_tree(self, tree_id: int, user: User, name: str | None = None, photo: str | None = None) -> dict:
        require_tree_access(tree_id, user, self.db, min_role="admin")
        tree = self.tree_repo.get_by_id(tree_id)
        if name is not None:
            tree.name = name
        if photo is not None:
            tree.photo = photo
        self.db.commit()
        self.db.refresh(tree)
        return {"id": tree.tree_id, "name": tree.name}

    def delete_tree(self, tree_id: int, user: User) -> bool:
        require_tree_access(tree_id, user, self.db, min_role="admin")
        return self.tree_repo.soft_delete(tree_id)

    def create_tree(self, name: str, user: User) -> dict:
        from app.repositories.role_repo import RoleRepository

        tree = self.tree_repo.create(name, created_by=user.user_id)
        role_repo = RoleRepository(self.db)
        admin_role = role_repo.get_role_by_name("admin")
        self.tree_repo.add_user(tree.tree_id, user.user_id, admin_role.role_id)
        return {"id": tree.tree_id, "name": tree.name}

    def get_tree_structure(self, tree_id: int, user: User) -> dict:
        require_tree_access(tree_id, user, self.db)
        humans = self.human_repo.get_by_tree(tree_id)

        from app.models.relation import HumanRelationship, RelationshipType
        rels = (
            self.db.query(HumanRelationship)
            .join(RelationshipType, HumanRelationship.relation_id == RelationshipType.relation_id)
            .all()
        )

        human_ids = {h.human_id for h in humans}
        rt_ids = list(set(r.relation_id for r in rels))
        rts = self.db.query(RelationshipType).filter(RelationshipType.relation_id.in_(rt_ids)).all() if rt_ids else []
        rt_map = {rt.relation_id: rt.name for rt in rts}

        relations = []
        for r in rels:
            if r.from_human_id in human_ids and r.to_human_id in human_ids:
                relations.append({
                    "from": r.from_human_id,
                    "to": r.to_human_id,
                    "type": rt_map.get(r.relation_id, "unknown"),
                    "startDate": str(r.start_date) if r.start_date else None,
                    "endDate": str(r.end_date) if r.end_date else None,
                })

        return {
            "humans": [
                {
                    "id": h.human_id,
                    "firstName": h.first_name,
                    "secondName": h.second_name,
                    "patronymic": h.patronymic,
                    "gender": h.gender,
                    "birthDate": str(h.birth_date) if h.birth_date else None,
                    "deathDate": str(h.death_date) if h.death_date else None,
                    "placeOfBirth": h.place_of_birth,
                    "photo": h.photo,
                }
                for h in humans
            ],
            "relations": relations,
        }

    def list_members(self, tree_id: int, user: User) -> dict:
        require_tree_access(tree_id, user, self.db)
        items = self.tree_repo.get_tree_users(tree_id)
        return {"items": items}

    def invite_member(self, tree_id: int, user: User, login: str | None = None, user_id: int | None = None, role_name: str = "reader") -> dict:
        require_tree_access(tree_id, user, self.db, min_role="admin")

        if role_name not in VALID_ROLES:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid role: {role_name}")

        target = None
        if user_id is not None:
            target = self.user_repo.get_by_id(user_id)
        elif login:
            target = self.user_repo.get_by_login(login)
        if target is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        existing = self.tree_repo.get_tree_user(tree_id, target.user_id)
        if existing is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is already a member of this tree")

        role = self.role_repo.get_role_by_name(role_name)
        if role is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Role '{role_name}' not found")

        self.tree_repo.add_user(tree_id, target.user_id, role.role_id)
        return {
            "userId": target.user_id,
            "login": target.login,
            "firstName": target.first_name,
            "secondName": target.second_name,
            "role": role_name,
            "isActive": True,
        }

    def update_member_role(self, tree_id: int, user: User, target_user_id: int, role_name: str) -> dict:
        require_tree_access(tree_id, user, self.db, min_role="admin")

        if role_name not in VALID_ROLES:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid role: {role_name}")

        if user.user_id == target_user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot change your own role")

        tree = self.tree_repo.get_by_id(tree_id)
        if tree.created_by == target_user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot change the creator's role")

        target_member = self.tree_repo.get_tree_user(tree_id, target_user_id)
        if target_member is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User is not a member of this tree")

        target_role = self.role_repo.get_role_by_name(role_name)
        if target_role is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Role '{role_name}' not found")

        from app.models.role import Role
        old_role = self.db.query(Role).filter(Role.role_id == target_member.role_id).first()
        if old_role and old_role.name == "admin" and role_name != "admin":
            if self.tree_repo.count_admins(tree_id) <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot demote the last admin",
                )

        self.tree_repo.update_user_role(tree_id, target_user_id, target_role.role_id)
        return {
            "userId": target_user_id,
            "role": role_name,
        }

    def remove_member(self, tree_id: int, user: User, target_user_id: int) -> bool:
        require_tree_access(tree_id, user, self.db, min_role="admin")

        if user.user_id == target_user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Use leave_tree to leave the tree")

        tree = self.tree_repo.get_by_id(tree_id)
        if tree.created_by == target_user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot remove the tree creator")

        target_member = self.tree_repo.get_tree_user(tree_id, target_user_id)
        if target_member is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User is not a member of this tree")

        from app.models.role import Role
        target_role = self.db.query(Role).filter(Role.role_id == target_member.role_id).first()
        if target_role and target_role.name == "admin":
            if self.tree_repo.count_admins(tree_id) <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot remove the last admin",
                )

        return self.tree_repo.remove_user(tree_id, target_user_id)

    def leave_tree(self, tree_id: int, user: User) -> bool:
        require_tree_access(tree_id, user, self.db)

        tree = self.tree_repo.get_by_id(tree_id)
        if tree.created_by == user.user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The tree creator cannot leave the tree",
            )

        member = self.tree_repo.get_tree_user(tree_id, user.user_id)
        if member is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="You are not a member of this tree")

        from app.models.role import Role
        role = self.db.query(Role).filter(Role.role_id == member.role_id).first()
        if role and role.name == "admin":
            if self.tree_repo.count_admins(tree_id) <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot leave tree as the last admin. Assign another admin first.",
                )

        return self.tree_repo.remove_user(tree_id, user.user_id)
