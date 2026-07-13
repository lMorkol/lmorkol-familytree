from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.auth import (
    UserRegisterRequest, UserRegisterResponse,
    UserLoginRequest, UserLoginResponse,
    UserProfileResponse, UserChangePasswordRequest,
    UserProfileUpdateRequest,
)
from app.schemas.common import DataResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/user", tags=["Auth"])


@router.post("/register", response_model=DataResponse[UserRegisterResponse])
def register(request: UserRegisterRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    result = service.register(
        login=request.login,
        password=request.password,
        first_name=request.firstName,
        second_name=request.secondName,
        gender=request.gender,
        email=request.email,
        phone=request.phone,
    )
    return DataResponse(data=UserRegisterResponse(id=result["id"], token=result["token"]))


@router.post("/login", response_model=DataResponse[UserLoginResponse])
def login(request: UserLoginRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    token = service.login(login=request.login, password=request.password)
    return DataResponse(data=UserLoginResponse(token=token))


@router.get("/me", response_model=DataResponse[UserProfileResponse])
def get_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = AuthService(db)
    result = service.get_profile(user)
    return DataResponse(data=UserProfileResponse(**result))


@router.patch("/me/password", response_model=DataResponse[dict])
def change_password(
    request: UserChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    result = service.change_password(user, new_password=request.newPassword)
    return DataResponse(data=result)


@router.patch("/me", response_model=DataResponse[UserProfileResponse])
def update_profile(
    request: UserProfileUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    result = service.update_profile(user, first_name=request.firstName, second_name=request.secondName,
                                    human_id=request.humanId, email=request.email, phone=request.phone,
                                    human_tree_id=request.humanTreeId)
    return DataResponse(data=UserProfileResponse(**result))
