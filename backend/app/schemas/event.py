from pydantic import BaseModel


class HumanEventCreateRequest(BaseModel):
    eventDate: str
    eventEndDate: str | None = None
    eventDescription: str
    name: str | None = None
    participants: list[int] | None = None


class EventUpdateRequest(BaseModel):
    eventDate: str | None = None
    eventEndDate: str | None = None
    eventDescription: str | None = None
    name: str | None = None


class EventParticipantResponse(BaseModel):
    humanId: int
    name: str
    role: str | None = None


class EventMediaResponse(BaseModel):
    id: int
    filePath: str
    fileType: str
    originalFilename: str


class EventInfoResponse(BaseModel):
    eventId: int
    eventDate: str
    eventEndDate: str | None = None
    eventDescription: str
    name: str | None = None
    participants: list[EventParticipantResponse] | None = None
    media: list[EventMediaResponse] | None = None
