from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.event import HumanEventCreateRequest, EventUpdateRequest, EventInfoResponse
from app.schemas.common import DataResponse
from app.services.event_service import EventService

router = APIRouter(tags=["Events"])


@router.get("/humans/{human_id}/events", response_model=DataResponse[dict])
def get_events(
    human_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = EventService(db)
    events = service.get_events_by_human(human_id, user)
    return DataResponse(data={"items": events})


@router.post("/humans/{human_id}/events", response_model=DataResponse[EventInfoResponse])
def add_event(
    human_id: int,
    request: HumanEventCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = EventService(db)
    result = service.add_event(
        human_id=human_id,
        user=user,
        event_date=request.eventDate,
        event_description=request.eventDescription,
        event_end_date=request.eventEndDate,
        name=request.name,
        participants=request.participants,
    )
    return DataResponse(data=EventInfoResponse(**result))


@router.patch("/events/{event_id}", response_model=DataResponse[EventInfoResponse])
def update_event(
    event_id: int,
    request: EventUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = EventService(db)
    result = service.update_event(
        event_id=event_id,
        user=user,
        event_date=request.eventDate,
        event_description=request.eventDescription,
    )
    return DataResponse(data=EventInfoResponse(**result))


@router.delete("/events/{event_id}", response_model=DataResponse[dict])
def delete_event(
    event_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = EventService(db)
    result = service.delete_event(event_id, user)
    return DataResponse(data=result)


@router.post("/events/{event_id}/media", response_model=DataResponse[dict])
async def upload_event_media(
    event_id: int,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = EventService(db)
    content = await file.read()
    result = service.upload_event_media(
        event_id=event_id,
        user=user,
        filename=file.filename or "unknown",
        file_content=content,
        mime_type=file.content_type,
    )
    return DataResponse(data=result)
