from sqlalchemy.orm import Session

from app.models.human_address import HumanAddress


class HumanAddressRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_human(self, human_id: int) -> list[HumanAddress]:
        return (
            self.db.query(HumanAddress)
            .filter(HumanAddress.human_id == human_id, HumanAddress.is_deleted == False)
            .order_by(HumanAddress.period_start.desc().nullslast())
            .all()
        )

    def get_by_id(self, address_id: int) -> HumanAddress | None:
        return (
            self.db.query(HumanAddress)
            .filter(HumanAddress.id == address_id, HumanAddress.is_deleted == False)
            .first()
        )

    def create(self, human_id: int, **kwargs) -> HumanAddress:
        address = HumanAddress(human_id=human_id, **kwargs)
        self.db.add(address)
        self.db.commit()
        self.db.refresh(address)
        return address

    def update(self, address: HumanAddress, **kwargs) -> HumanAddress:
        for key, value in kwargs.items():
            if value is not None:
                setattr(address, key, value)
        self.db.commit()
        self.db.refresh(address)
        return address

    def soft_delete(self, address: HumanAddress) -> HumanAddress:
        address.is_deleted = True
        self.db.commit()
        return address
