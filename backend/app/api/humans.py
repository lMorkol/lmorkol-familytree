from fastapi import APIRouter, Depends, UploadFile, File, Query
from sqlalchemy.orm import Session
import os

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.human import (
    HumanCreateRequest, HumanCreateResponse,
    HumanInfoResponse, HumanEditRequest,
    HumanDeleteResponse,
)
from app.schemas.common import DataResponse
from app.services.human_service import HumanService

router = APIRouter(prefix="/humans", tags=["Humans"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/search", response_model=DataResponse[dict])
def search_humans(
    q: str = Query(..., min_length=1),
    tree_id: int | None = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = HumanService(db)
    results = service.search_humans(q, user, tree_id)
    return DataResponse(data={"items": results})


@router.post("", response_model=DataResponse[HumanCreateResponse])
def create_human(request: HumanCreateRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = HumanService(db)
    result = service.create_human(
        tree_id=request.treeId,
        user=user,
        first_name=request.firstName,
        second_name=request.secondName,
        patronymic=request.patronymic,
        gender=request.gender,
        birth_date=request.birthDate,
        death_date=request.deathDate,
        place_of_birth=request.placeOfBirth,
        country=request.country,
    )
    return DataResponse(data=HumanCreateResponse(humanId=result["humanId"]))


@router.get("/{human_id}", response_model=DataResponse[HumanInfoResponse])
def get_human(human_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = HumanService(db)
    result = service.get_human(human_id, user)
    return DataResponse(data=HumanInfoResponse(**result))


@router.patch("/{human_id}", response_model=DataResponse[HumanInfoResponse])
def update_human(human_id: int, request: HumanEditRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = HumanService(db)
    result = service.update_human(
        human_id=human_id,
        user=user,
        first_name=request.firstName,
        second_name=request.secondName,
        patronymic=request.patronymic,
        gender=request.gender,
        birth_date=request.birthDate,
        death_date=request.deathDate,
        place_of_birth=request.placeOfBirth,
        country=request.country,
    )
    return DataResponse(data=HumanInfoResponse(**result))


@router.delete("/{human_id}", response_model=DataResponse[HumanDeleteResponse])
def delete_human(human_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = HumanService(db)
    result = service.delete_human(human_id, user)
    return DataResponse(data=HumanDeleteResponse(humanId=result["humanId"]))


@router.post("/{human_id}/photo", response_model=DataResponse[dict])
async def upload_photo(
    human_id: int,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    import uuid
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"human_{human_id}_{uuid.uuid4().hex[:12]}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    service = HumanService(db)
    result = service.update_human(human_id, user, photo=filename)
    return DataResponse(data={"photo": filename})
