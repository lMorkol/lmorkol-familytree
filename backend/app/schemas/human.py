from pydantic import BaseModel


class HumanCreateRequest(BaseModel):
    treeId: int
    firstName: str | None = None
    secondName: str | None = None
    patronymic: str | None = None
    gender: str
    birthDate: str | None = None
    deathDate: str | None = None
    placeOfBirth: str | None = None
    country: str | None = None


class HumanCreateResponse(BaseModel):
    humanId: int


class HumanInfoResponse(BaseModel):
    humanId: int
    firstName: str | None = None
    secondName: str | None = None
    patronymic: str | None = None
    gender: str
    birthDate: str | None = None
    deathDate: str | None = None
    placeOfBirth: str | None = None
    country: str | None = None
    treeId: int
    photo: str | None = None


class HumanEditRequest(BaseModel):
    firstName: str | None = None
    secondName: str | None = None
    patronymic: str | None = None
    gender: str | None = None
    birthDate: str | None = None
    deathDate: str | None = None
    placeOfBirth: str | None = None
    country: str | None = None


class HumanDeleteResponse(BaseModel):
    humanId: int


class HumanAddressCreateRequest(BaseModel):
    country: str | None = None
    city: str | None = None
    street: str | None = None
    house: str | None = None
    apartment: str | None = None
    addressType: str | None = None
    periodStart: str | None = None
    periodEnd: str | None = None
    lat: float | None = None
    lng: float | None = None


class HumanAddressEditRequest(BaseModel):
    country: str | None = None
    city: str | None = None
    street: str | None = None
    house: str | None = None
    apartment: str | None = None
    addressType: str | None = None
    periodStart: str | None = None
    periodEnd: str | None = None
    lat: float | None = None
    lng: float | None = None


class HumanAddressResponse(BaseModel):
    id: int
    humanId: int
    country: str | None = None
    city: str | None = None
    street: str | None = None
    house: str | None = None
    apartment: str | None = None
    addressType: str | None = None
    periodStart: str | None = None
    periodEnd: str | None = None
    lat: float | None = None
    lng: float | None = None


class HumanAddressDeleteResponse(BaseModel):
    id: int
