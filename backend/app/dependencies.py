from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User
from app.models.tree_user import TreeUser
from app.utils.security import decode_access_token

security = HTTPBearer()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    user_id = decode_access_token(credentials.credentials)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    user = db.query(User).filter(User.user_id == user_id, User.is_deleted == False).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user


def require_tree_access(tree_id: int, user: User, db: Session, min_role: str = "reader"):
    ROLE_HIERARCHY = {"admin": 3, "editor": 2, "reader": 1}

    tree_user = (
        db.query(TreeUser)
        .filter(TreeUser.tree_id == tree_id, TreeUser.user_id == user.user_id, TreeUser.is_active == True)
        .first()
    )
    if tree_user is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this tree",
        )

    from app.models.role import Role

    role = db.query(Role).filter(Role.role_id == tree_user.role_id).first()
    if role is None or ROLE_HIERARCHY.get(role.name, 0) < ROLE_HIERARCHY.get(min_role, 0):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Requires at least '{min_role}' role",
        )
    return tree_user
