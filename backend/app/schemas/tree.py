from pydantic import BaseModel, Field


class TreeCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)


class TreeCreateResponse(BaseModel):
    id: int
    name: str


class TreeListItem(BaseModel):
    id: int
    name: str
    photo: str | None = None


class TreeListResponse(BaseModel):
    items: list[TreeListItem]


class TreeInfoResponse(BaseModel):
    name: str
    createdBy: int | None = None


class TreeMemberInviteRequest(BaseModel):
    login: str | None = None
    userId: int | None = None
    role: str


class TreeMemberUpdateRequest(BaseModel):
    role: str


class TreeMemberResponse(BaseModel):
    userId: int
    login: str
    firstName: str
    secondName: str
    role: str
    isActive: bool


class TreeMembersResponse(BaseModel):
    items: list[TreeMemberResponse]
