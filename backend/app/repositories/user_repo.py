from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> User | None:
        return self.db.query(User).filter(User.user_id == user_id, User.is_deleted == False).first()

    def get_by_login(self, login: str) -> User | None:
        return self.db.query(User).filter(User.login == login, User.is_deleted == False).first()

    def create(self, first_name: str, second_name: str, login: str, password: str,
               gender: str = "male", email: str | None = None, phone: str | None = None) -> User:
        user = User(
            first_name=first_name,
            second_name=second_name,
            login=login,
            password=password,
            gender=gender,
            email=email,
            phone=phone,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_password(self, user_id: int, hashed_password: str) -> User | None:
        user = self.get_by_id(user_id)
        if user is None:
            return None
        user.password = hashed_password
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_profile(self, user_id: int, first_name: str, second_name: str,
                       email: str | None = None, phone: str | None = None) -> User | None:
        user = self.get_by_id(user_id)
        if user is None:
            return None
        user.first_name = first_name
        user.second_name = second_name
        user.email = email
        user.phone = phone
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_human_id(self, user_id: int, human_id: int | None, human_tree_id: int | None = None) -> User | None:
        user = self.get_by_id(user_id)
        if user is None:
            return None
        user.human_id = human_id
        user.human_tree_id = human_tree_id
        self.db.commit()
        self.db.refresh(user)
        return user
