from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.relation import HumanRelationCreateRequest, HumanRelationResponse
from app.schemas.common import DataResponse
from app.services.relation_service import RelationService

router = APIRouter(tags=["Relations"])


class HumanRelationUpdateRequest(BaseModel):
    startDate: str | None = None
    endDate: str | None = None


@router.get("/humans/{human_id}/relations", response_model=DataResponse[dict])
def get_relations(
    human_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = RelationService(db)
    relations = service.get_relations_by_human(human_id, user)
    return DataResponse(data={"items": relations})


@router.post("/humans/{human_id}/relations", response_model=DataResponse[HumanRelationResponse])
def add_relation(
    human_id: int,
    request: HumanRelationCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = RelationService(db)
    result = service.add_relation(
        human_id=human_id,
        user=user,
        relative_id=request.relativeId,
        relation_type=request.relationType,
        start_date=request.startDate,
        end_date=request.endDate,
    )
    return DataResponse(data=HumanRelationResponse(**result))


@router.delete("/relations/{relation_id}", response_model=DataResponse[dict])
def delete_relation(
    relation_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = RelationService(db)
    result = service.delete_relation(relation_id, user)
    return DataResponse(data=result)


@router.patch("/relations/{relation_id}", response_model=DataResponse[HumanRelationResponse])
def update_relation(
    relation_id: int,
    request: HumanRelationUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = RelationService(db)
    result = service.update_relation(
        relation_id=relation_id,
        user=user,
        start_date=request.startDate,
        end_date=request.endDate,
    )
    return DataResponse(data=HumanRelationResponse(**result))
