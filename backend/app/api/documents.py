from fastapi import APIRouter, Depends, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.common import DataResponse
from app.services.document_service import DocumentService

router = APIRouter(tags=["Documents"])


class DocumentCreateRequest(BaseModel):
    docType: str
    title: str
    description: str | None = None
    issueDate: str | None = None
    expiryDate: str | None = None


class DocumentUpdateRequest(BaseModel):
    docType: str | None = None
    title: str | None = None
    description: str | None = None
    issueDate: str | None = None
    expiryDate: str | None = None


@router.get("/humans/{human_id}/documents", response_model=DataResponse[dict])
def get_documents(
    human_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DocumentService(db)
    items = service.get_documents(human_id, user)
    return DataResponse(data={"items": items})


@router.post("/humans/{human_id}/documents", response_model=DataResponse[dict])
def create_document(
    human_id: int,
    request: DocumentCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DocumentService(db)
    result = service.create_document(
        human_id=human_id,
        user=user,
        doc_type=request.docType,
        title=request.title,
        description=request.description,
        issue_date=request.issueDate,
        expiry_date=request.expiryDate,
    )
    return DataResponse(data=result)


@router.patch("/documents/{doc_id}", response_model=DataResponse[dict])
def update_document(
    doc_id: int,
    request: DocumentUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DocumentService(db)
    result = service.update_document(
        doc_id=doc_id,
        user=user,
        doc_type=request.docType,
        title=request.title,
        description=request.description,
        issue_date=request.issueDate,
        expiry_date=request.expiryDate,
    )
    return DataResponse(data=result)


@router.delete("/documents/{doc_id}", response_model=DataResponse[dict])
def delete_document(
    doc_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DocumentService(db)
    result = service.delete_document(doc_id, user)
    return DataResponse(data=result)


@router.post("/documents/{doc_id}/file", response_model=DataResponse[dict])
async def upload_document_file(
    doc_id: int,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DocumentService(db)
    content = await file.read()
    result = await service.upload_document_file(
        doc_id=doc_id,
        user=user,
        filename=file.filename or "unknown",
        file_content=content,
        mime_type=file.content_type,
    )
    return DataResponse(data=result)


@router.post("/documents/{doc_id}/media", response_model=DataResponse[dict])
async def upload_doc_media(
    doc_id: int,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DocumentService(db)
    content = await file.read()
    result = service.upload_doc_media(
        doc_id=doc_id,
        user=user,
        filename=file.filename or "unknown",
        file_content=content,
        mime_type=file.content_type,
    )
    return DataResponse(data=result)


@router.delete("/documents/media/{media_id}", response_model=DataResponse[dict])
def delete_doc_media(
    media_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DocumentService(db)
    result = service.delete_doc_media(media_id, user)
    return DataResponse(data=result)
