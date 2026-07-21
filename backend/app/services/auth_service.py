from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.user_repo import UserRepository
from app.repositories.tree_repo import TreeRepository
from app.repositories.role_repo import RoleRepository
from app.repositories.human_repo import HumanRepository
from app.utils.security import hash_password, verify_password, create_access_token


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.tree_repo = TreeRepository(db)
        self.role_repo = RoleRepository(db)
        self.human_repo = HumanRepository(db)

    def register(self, login: str, password: str, first_name: str, second_name: str,
                  gender: str = "male", email: str | None = None, phone: str | None = None) -> dict:
        login = login.lower().strip()
        existing = self.user_repo.get_by_login(login)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this login already exists",
            )

        user = self.user_repo.create(
            first_name=first_name,
            second_name=second_name,
            login=login,
            password=hash_password(password),
            gender=gender,
            email=email,
            phone=phone,
        )

        tree = self.tree_repo.create(name=f"Дерево {first_name} {second_name}", created_by=user.user_id)

        admin_role = self.role_repo.get_role_by_name("admin")
        if admin_role is None:
            from app.models.role import Role
            admin_role = Role(name="admin", description="Полный доступ к дереву")
            self.db.add(admin_role)
            self.db.commit()
            self.db.refresh(admin_role)
        self.tree_repo.add_user(tree.tree_id, user.user_id, admin_role.role_id)

        human = self.human_repo.create(
            tree_id=tree.tree_id,
            first_name=first_name,
            second_name=second_name,
            patronymic=None,
            gender=gender,
        )
        self.user_repo.update_human_id(user.user_id, human.human_id, tree.tree_id)
        self.tree_repo.set_human_id(tree.tree_id, user.user_id, human.human_id)

        token = create_access_token(user.user_id)
        return {"id": user.user_id, "token": token}

    def login(self, login: str, password: str) -> str:
        login = login.lower().strip()
        user = self.user_repo.get_by_login(login)
        if user is None or not verify_password(password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid login or password",
            )
        return create_access_token(user.user_id)

    def get_profile(self, user) -> dict:
        trees = self.tree_repo.get_user_trees_with_human(user.user_id)

        return {
            "id": user.user_id,
            "login": user.login,
            "firstName": user.first_name,
            "secondName": user.second_name,
            "email": user.email,
            "phone": user.phone,
            "trees": trees,
        }

    def change_password(self, user, new_password: str) -> dict:
        hashed = hash_password(new_password)
        self.user_repo.update_password(user.user_id, hashed)
        return {"success": True}

    def update_profile(self, user, first_name: str, second_name: str, human_id: int | None = None,
                       email: str | None = None, phone: str | None = None,
                       human_tree_id: int | None = None) -> dict:
        self.user_repo.update_profile(user.user_id, first_name, second_name, email=email, phone=phone)
        if human_tree_id is not None:
            self.tree_repo.set_human_id(human_tree_id, user.user_id, human_id)
        trees = self.tree_repo.get_user_trees_with_human(user.user_id)
        return {
            "id": user.user_id,
            "login": user.login,
            "firstName": first_name,
            "secondName": second_name,
            "email": email,
            "phone": phone,
            "trees": trees,
        }
