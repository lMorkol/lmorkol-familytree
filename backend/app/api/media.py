from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.common import DataResponse
from app.services.media_service import MediaService

router = APIRouter(tags=["Media"])


@router.get("/humans/{human_id}/media", response_model=DataResponse[dict])
def get_media(
    human_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = MediaService(db)
    items = service.get_media(human_id, user)
    return DataResponse(data={"items": items})


@router.post("/humans/{human_id}/media", response_model=DataResponse[dict])
async def upload_media(
    human_id: int,
    file: UploadFile = File(...),
    title: str | None = Form(None),
    description: str | None = Form(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = MediaService(db)
    content = await file.read()
    result = service.upload_media(
        human_id=human_id,
        user=user,
        filename=file.filename or "unknown",
        file_content=content,
        mime_type=file.content_type,
        title=title,
        description=description,
    )
    return DataResponse(data=result)


@router.delete("/media/{media_id}", response_model=DataResponse[dict])
def delete_media(
    media_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = MediaService(db)
    result = service.delete_media(media_id, user)
    return DataResponse(data=result)
