from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.common import DataResponse
from app.services.album_service import AlbumService

router = APIRouter(tags=["Albums"])


class AlbumCreateRequest(BaseModel):
    name: str
    description: str | None = None


class AlbumUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None


class AlbumMediaRequest(BaseModel):
    mediaId: int


@router.get("/humans/{human_id}/albums", response_model=DataResponse[dict])
def get_albums(
    human_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AlbumService(db)
    items = service.get_albums(human_id, user)
    return DataResponse(data={"items": items})


@router.post("/humans/{human_id}/albums", response_model=DataResponse[dict])
def create_album(
    human_id: int,
    request: AlbumCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AlbumService(db)
    result = service.create_album(human_id, user, request.name, request.description)
    return DataResponse(data=result)


@router.patch("/albums/{album_id}", response_model=DataResponse[dict])
def update_album(
    album_id: int,
    request: AlbumUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AlbumService(db)
    result = service.update_album(album_id, user, request.name, request.description)
    return DataResponse(data=result)


@router.delete("/albums/{album_id}", response_model=DataResponse[dict])
def delete_album(
    album_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AlbumService(db)
    result = service.delete_album(album_id, user)
    return DataResponse(data=result)


@router.get("/albums/{album_id}/media", response_model=DataResponse[dict])
def get_album_media(
    album_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AlbumService(db)
    items = service.get_album_media(album_id, user)
    return DataResponse(data={"items": items})


@router.post("/albums/{album_id}/media", response_model=DataResponse[dict])
def add_media_to_album(
    album_id: int,
    request: AlbumMediaRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AlbumService(db)
    result = service.add_media_to_album(album_id, request.mediaId, user)
    return DataResponse(data=result)


@router.delete("/albums/{album_id}/media/{media_id}", response_model=DataResponse[dict])
def remove_media_from_album(
    album_id: int,
    media_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AlbumService(db)
    result = service.remove_media_from_album(album_id, media_id, user)
    return DataResponse(data=result)
