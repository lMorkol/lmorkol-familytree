from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.human_address_repo import HumanAddressRepository
from app.repositories.human_repo import HumanRepository
from app.dependencies import require_tree_access


class HumanAddressService:
    def __init__(self, db: Session):
        self.db = db
        self.address_repo = HumanAddressRepository(db)
        self.human_repo = HumanRepository(db)

    def _check_access(self, human_id: int, user: User, min_role: str = "reader"):
        human = self.human_repo.get_by_id(human_id)
        if human is None:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Human not found")
        require_tree_access(human.tree_id, user, self.db, min_role=min_role)

    def list_addresses(self, human_id: int, user: User) -> list[dict]:
        self._check_access(human_id, user)
        addresses = self.address_repo.get_by_human(human_id)
        return [self._to_dict(a) for a in addresses]

    def create_address(self, human_id: int, user: User, **kwargs) -> dict:
        self._check_access(human_id, user, min_role="editor")
        from datetime import date
        if "period_start" in kwargs and kwargs["period_start"]:
            kwargs["period_start"] = date.fromisoformat(kwargs["period_start"])
        if "period_end" in kwargs and kwargs["period_end"]:
            kwargs["period_end"] = date.fromisoformat(kwargs["period_end"])
        address = self.address_repo.create(human_id=human_id, **kwargs)
        return self._to_dict(address)

    def update_address(self, address_id: int, user: User, **kwargs) -> dict:
        address = self.address_repo.get_by_id(address_id)
        if address is None:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
        self._check_access(address.human_id, user, min_role="editor")
        from datetime import date
        if "period_start" in kwargs and kwargs["period_start"]:
            kwargs["period_start"] = date.fromisoformat(kwargs["period_start"])
        elif "period_start" in kwargs:
            kwargs["period_start"] = None
        if "period_end" in kwargs and kwargs["period_end"]:
            kwargs["period_end"] = date.fromisoformat(kwargs["period_end"])
        elif "period_end" in kwargs:
            kwargs["period_end"] = None
        updated = self.address_repo.update(address, **kwargs)
        return self._to_dict(updated)

    def delete_address(self, address_id: int, user: User) -> dict:
        address = self.address_repo.get_by_id(address_id)
        if address is None:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
        self._check_access(address.human_id, user, min_role="editor")
        self.address_repo.soft_delete(address)
        return {"id": address.id}

    def _to_dict(self, address) -> dict:
        return {
            "id": address.id,
            "humanId": address.human_id,
            "country": address.country,
            "city": address.city,
            "street": address.street,
            "house": address.house,
            "apartment": address.apartment,
            "addressType": address.address_type,
            "periodStart": str(address.period_start) if address.period_start else None,
            "periodEnd": str(address.period_end) if address.period_end else None,
            "lat": address.lat,
            "lng": address.lng,
        }
