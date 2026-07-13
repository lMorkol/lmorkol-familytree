from sqlalchemy.orm import Session

from app.models.tree import Tree
from app.models.tree_user import TreeUser
from app.models.user import User
from app.models.role import Role


class TreeRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, tree_id: int) -> Tree | None:
        return self.db.query(Tree).filter(Tree.tree_id == tree_id, Tree.is_deleted == False).first()

    def get_user_trees(self, user_id: int) -> list[Tree]:
        tree_ids = (
            self.db.query(TreeUser.tree_id)
            .filter(TreeUser.user_id == user_id, TreeUser.is_active == True)
            .all()
        )
        ids = [t[0] for t in tree_ids]
        return self.db.query(Tree).filter(Tree.tree_id.in_(ids), Tree.is_deleted == False).all()

    def create(self, name: str, created_by: int | None = None) -> Tree:
        tree = Tree(name=name, created_by=created_by)
        self.db.add(tree)
        self.db.commit()
        self.db.refresh(tree)
        return tree

    def add_user(self, tree_id: int, user_id: int, role_id: int) -> TreeUser:
        tree_user = TreeUser(tree_id=tree_id, user_id=user_id, role_id=role_id)
        self.db.add(tree_user)
        self.db.commit()
        self.db.refresh(tree_user)
        return tree_user

    def get_tree_users(self, tree_id: int) -> list[dict]:
        rows = (
            self.db.query(TreeUser, User, Role)
            .join(User, TreeUser.user_id == User.user_id)
            .join(Role, TreeUser.role_id == Role.role_id)
            .filter(TreeUser.tree_id == tree_id, TreeUser.is_active == True, User.is_deleted == False)
            .all()
        )
        return [
            {
                "userId": u.user_id,
                "login": u.login,
                "firstName": u.first_name,
                "secondName": u.second_name,
                "role": r.name,
                "isActive": tu.is_active,
            }
            for tu, u, r in rows
        ]

    def get_tree_user(self, tree_id: int, user_id: int) -> TreeUser | None:
        return (
            self.db.query(TreeUser)
            .filter(TreeUser.tree_id == tree_id, TreeUser.user_id == user_id, TreeUser.is_active == True)
            .first()
        )

    def update_user_role(self, tree_id: int, user_id: int, role_id: int) -> TreeUser | None:
        tree_user = self.get_tree_user(tree_id, user_id)
        if tree_user is None:
            return None
        tree_user.role_id = role_id
        self.db.commit()
        self.db.refresh(tree_user)
        return tree_user

    def remove_user(self, tree_id: int, user_id: int) -> bool:
        tree_user = self.get_tree_user(tree_id, user_id)
        if tree_user is None:
            return False
        self.db.delete(tree_user)
        self.db.commit()
        return True

    def count_admins(self, tree_id: int) -> int:
        admin_role = self.db.query(Role).filter(Role.name == "admin").first()
        if admin_role is None:
            return 0
        return (
            self.db.query(TreeUser)
            .filter(TreeUser.tree_id == tree_id, TreeUser.role_id == admin_role.role_id, TreeUser.is_active == True)
            .count()
        )

    def soft_delete(self, tree_id: int) -> bool:
        tree = self.get_by_id(tree_id)
        if tree is None:
            return False
        tree.is_deleted = True
        self.db.commit()
        return True

    def set_human_id(self, tree_id: int, user_id: int, human_id: int | None) -> TreeUser | None:
        tu = self.get_tree_user(tree_id, user_id)
        if tu is None:
            return None
        tu.human_id = human_id
        self.db.commit()
        self.db.refresh(tu)
        return tu

    def get_human_id(self, tree_id: int, user_id: int) -> int | None:
        tu = self.get_tree_user(tree_id, user_id)
        return tu.human_id if tu else None

    def get_user_trees_with_human(self, user_id: int) -> list[dict]:
        rows = (
            self.db.query(TreeUser, Tree)
            .join(Tree, TreeUser.tree_id == Tree.tree_id)
            .filter(TreeUser.user_id == user_id, TreeUser.is_active == True, Tree.is_deleted == False)
            .all()
        )
        return [
            {"id": t.tree_id, "name": t.name, "humanId": tu.human_id}
            for tu, t in rows
        ]
