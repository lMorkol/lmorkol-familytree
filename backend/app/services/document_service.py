import os
from datetime import date

from sqlalchemy.orm import Session

from app.models.user import User
from app.models.document_media import DocumentMedia
from app.repositories.document_repo import DocumentRepository
from app.repositories.human_repo import HumanRepository
from app.dependencies import require_tree_access

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
MAX_DOC_MEDIA = 40


class DocumentService:
    def __init__(self, db: Session):
        self.db = db
        self.doc_repo = DocumentRepository(db)
        self.human_repo = HumanRepository(db)

    def _check_human_access(self, human_id: int, user: User, min_role: str = "editor"):
        human = self.human_repo.get_by_id(human_id)
        if human is None:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Human not found")
        require_tree_access(human.tree_id, user, self.db, min_role=min_role)
        return human

    def get_documents(self, human_id: int, user: User) -> list[dict]:
        self._check_human_access(human_id, user, min_role="reader")
        docs = self.doc_repo.get_by_human(human_id)
        doc_ids = [d.id for d in docs]
        all_media = self.db.query(DocumentMedia).filter(DocumentMedia.document_id.in_(doc_ids)).all() if doc_ids else []
        media_by_doc: dict[int, list] = {did: [] for did in doc_ids}
        for m in all_media:
            media_by_doc[m.document_id].append({
                "id": m.id,
                "filePath": m.file_path,
                "originalFilename": m.original_filename,
                "mimeType": m.mime_type,
            })
        result = []
        for d in docs:
            result.append({**self._doc_to_dict(d), "media": media_by_doc.get(d.id, [])})
        return result

    def create_document(self, human_id: int, user: User, doc_type: str, title: str,
                        description: str | None = None, issue_date: str | None = None,
                        expiry_date: str | None = None) -> dict:
        self._check_human_access(human_id, user)
        parsed_issue = date.fromisoformat(issue_date) if issue_date else None
        parsed_expiry = date.fromisoformat(expiry_date) if expiry_date else None
        doc = self.doc_repo.create(
            human_id=human_id,
            doc_type=doc_type,
            title=title,
            description=description,
            issue_date=parsed_issue,
            expiry_date=parsed_expiry,
        )
        return {**self._doc_to_dict(doc), "media": []}

    def update_document(self, doc_id: int, user: User, doc_type: str | None = None,
                        title: str | None = None, description: str | None = None,
                        issue_date: str | None = None, expiry_date: str | None = None) -> dict:
        doc = self.doc_repo.get_by_id(doc_id)
        if doc is None:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        self._check_human_access(doc.human_id, user)
        kwargs = {}
        if doc_type is not None:
            kwargs["doc_type"] = doc_type
        if title is not None:
            kwargs["title"] = title
        if description is not None:
            kwargs["description"] = description
        if issue_date is not None:
            kwargs["issue_date"] = date.fromisoformat(issue_date) if issue_date else None
        if expiry_date is not None:
            kwargs["expiry_date"] = date.fromisoformat(expiry_date) if expiry_date else None
        updated = self.doc_repo.update(doc, **kwargs)
        media = self._get_doc_media(updated.id)
        return {**self._doc_to_dict(updated), "media": media}

    def delete_document(self, doc_id: int, user: User) -> dict:
        doc = self.doc_repo.get_by_id(doc_id)
        if doc is None:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        self._check_human_access(doc.human_id, user)
        # Delete associated media files
        media_items = self.db.query(DocumentMedia).filter(DocumentMedia.document_id == doc_id).all()
        for m in media_items:
            fp = os.path.join(UPLOAD_DIR, m.file_path)
            if os.path.exists(fp):
                os.remove(fp)
            self.db.delete(m)
        if doc.file_path:
            file_path = os.path.join(UPLOAD_DIR, doc.file_path)
            if os.path.exists(file_path):
                os.remove(file_path)
        self.db.commit()
        self.doc_repo.delete(doc)
        return {"id": doc_id}

    async def upload_document_file(self, doc_id: int, user: User, filename: str,
                                   file_content: bytes, mime_type: str | None = None) -> dict:
        doc = self.doc_repo.get_by_id(doc_id)
        if doc is None:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        self._check_human_access(doc.human_id, user)
        import uuid
        ext = os.path.splitext(filename)[1] or ".bin"
        safe_name = f"doc_{doc_id}_{uuid.uuid4().hex[:12]}{ext}"
        file_path = os.path.join(UPLOAD_DIR, safe_name)
        with open(file_path, "wb") as f:
            f.write(file_content)
        updated = self.doc_repo.update(doc, file_path=safe_name)
        return self._doc_to_dict(updated)

    def upload_doc_media(self, doc_id: int, user: User, filename: str,
                         file_content: bytes, mime_type: str | None = None) -> dict:
        from fastapi import HTTPException, status

        doc = self.doc_repo.get_by_id(doc_id)
        if doc is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        self._check_human_access(doc.human_id, user)

        count = self.db.query(DocumentMedia).filter(DocumentMedia.document_id == doc_id).count()
        if count >= MAX_DOC_MEDIA:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"Максимум {MAX_DOC_MEDIA} изображений на документ")

        import uuid
        ext = os.path.splitext(filename)[1] or ".jpg"
        safe_name = f"docmedia_{doc_id}_{uuid.uuid4().hex[:12]}{ext}"
        file_path = os.path.join(UPLOAD_DIR, safe_name)
        with open(file_path, "wb") as f:
            f.write(file_content)

        dm = DocumentMedia(
            document_id=doc_id,
            file_path=safe_name,
            original_filename=filename,
            mime_type=mime_type,
        )
        self.db.add(dm)
        self.db.commit()
        self.db.refresh(dm)

        return {
            "id": dm.id,
            "filePath": dm.file_path,
            "originalFilename": dm.original_filename,
            "mimeType": dm.mime_type,
        }

    def delete_doc_media(self, media_id: int, user: User) -> dict:
        from fastapi import HTTPException, status

        dm = self.db.query(DocumentMedia).filter(DocumentMedia.id == media_id).first()
        if dm is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")

        doc = self.doc_repo.get_by_id(dm.document_id)
        if doc:
            self._check_human_access(doc.human_id, user)

        fp = os.path.join(UPLOAD_DIR, dm.file_path)
        if os.path.exists(fp):
            os.remove(fp)
        self.db.delete(dm)
        self.db.commit()
        return {"id": media_id}

    def _get_doc_media(self, doc_id: int) -> list[dict]:
        items = self.db.query(DocumentMedia).filter(DocumentMedia.document_id == doc_id).all()
        return [
            {
                "id": m.id,
                "filePath": m.file_path,
                "originalFilename": m.original_filename,
                "mimeType": m.mime_type,
            }
            for m in items
        ]

    def _doc_to_dict(self, doc) -> dict:
        return {
            "id": doc.id,
            "humanId": doc.human_id,
            "docType": doc.doc_type,
            "title": doc.title,
            "description": doc.description,
            "filePath": doc.file_path,
            "issueDate": str(doc.issue_date) if doc.issue_date else None,
            "expiryDate": str(doc.expiry_date) if doc.expiry_date else None,
            "createdAt": str(doc.created_at) if doc.created_at else None,
        }
