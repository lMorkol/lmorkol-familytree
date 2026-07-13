from pydantic import BaseModel, Field


class UserRegisterRequest(BaseModel):
    login: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=128)
    firstName: str = Field(..., min_length=1, max_length=100)
    secondName: str = Field(..., min_length=1, max_length=100)
    gender: str = Field(..., pattern="^(male|female)$")
    email: str | None = None
    phone: str | None = None


class UserRegisterResponse(BaseModel):
    id: int
    token: str


class UserLoginRequest(BaseModel):
    login: str
    password: str


class UserLoginResponse(BaseModel):
    token: str


class TreeInfo(BaseModel):
    id: int
    name: str
    humanId: int | None = None


class UserProfileResponse(BaseModel):
    id: int
    login: str
    firstName: str
    secondName: str
    email: str | None = None
    phone: str | None = None
    trees: list[TreeInfo] = []


class UserChangePasswordRequest(BaseModel):
    newPassword: str


class UserProfileUpdateRequest(BaseModel):
    firstName: str
    secondName: str
    email: str | None = None
    phone: str | None = None
    humanId: int | None = None
    humanTreeId: int | None = None
