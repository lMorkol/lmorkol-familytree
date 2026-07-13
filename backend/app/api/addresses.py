from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.human import (
    HumanAddressCreateRequest, HumanAddressEditRequest,
    HumanAddressResponse, HumanAddressDeleteResponse,
)
from app.schemas.common import DataResponse
from app.services.human_address_service import HumanAddressService

router = APIRouter(tags=["Human Addresses"])


@router.get("/humans/{human_id}/addresses", response_model=DataResponse[list[HumanAddressResponse]])
def list_addresses(human_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = HumanAddressService(db)
    items = service.list_addresses(human_id, user)
    return DataResponse(data=[HumanAddressResponse(**a) for a in items])


@router.post("/humans/{human_id}/addresses", response_model=DataResponse[HumanAddressResponse])
def create_address(human_id: int, request: HumanAddressCreateRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = HumanAddressService(db)
    result = service.create_address(
        human_id=human_id,
        user=user,
        country=request.country,
        city=request.city,
        street=request.street,
        house=request.house,
        apartment=request.apartment,
        address_type=request.addressType,
        period_start=request.periodStart,
        period_end=request.periodEnd,
        lat=request.lat,
        lng=request.lng,
    )
    return DataResponse(data=HumanAddressResponse(**result))


@router.patch("/addresses/{address_id}", response_model=DataResponse[HumanAddressResponse])
def update_address(address_id: int, request: HumanAddressEditRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = HumanAddressService(db)
    result = service.update_address(
        address_id=address_id,
        user=user,
        country=request.country,
        city=request.city,
        street=request.street,
        house=request.house,
        apartment=request.apartment,
        address_type=request.addressType,
        period_start=request.periodStart,
        period_end=request.periodEnd,
        lat=request.lat,
        lng=request.lng,
    )
    return DataResponse(data=HumanAddressResponse(**result))


@router.delete("/addresses/{address_id}", response_model=DataResponse[HumanAddressDeleteResponse])
def delete_address(address_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = HumanAddressService(db)
    result = service.delete_address(address_id, user)
    return DataResponse(data=HumanAddressDeleteResponse(**result["id"]))
