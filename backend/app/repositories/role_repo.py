from sqlalchemy.orm import Session

from app.models.role import Role
from app.models.tree_user import TreeUser


class RoleRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_role_by_name(self, name: str) -> Role | None:
        return self.db.query(Role).filter(Role.name == name).first()

    def get_user_role_in_tree(self, user_id: int, tree_id: int) -> Role | None:
        tree_user = (
            self.db.query(TreeUser)
            .filter(TreeUser.tree_id == tree_id, TreeUser.user_id == user_id, TreeUser.is_active == True)
            .first()
        )
        if tree_user is None:
            return None
        return self.db.query(Role).filter(Role.role_id == tree_user.role_id).first()
