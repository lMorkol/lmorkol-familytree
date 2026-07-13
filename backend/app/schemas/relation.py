from pydantic import BaseModel


class HumanRelationCreateRequest(BaseModel):
    relativeId: int
    relationType: str
    startDate: str | None = None
    endDate: str | None = None


class HumanRelationResponse(BaseModel):
    id: int
    fromHumanId: int
    toHumanId: int
    relationType: str
    startDate: str | None = None
    endDate: str | None = None
