from sqlalchemy.orm import Session

from app.models.document import Document


class DocumentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_human(self, human_id: int) -> list[Document]:
        return self.db.query(Document).filter(Document.human_id == human_id).all()

    def get_by_id(self, doc_id: int) -> Document | None:
        return self.db.query(Document).filter(Document.id == doc_id).first()

    def create(self, human_id: int, doc_type: str, title: str, description: str | None = None,
               file_path: str | None = None, issue_date=None, expiry_date=None) -> Document:
        doc = Document(
            human_id=human_id,
            doc_type=doc_type,
            title=title,
            description=description,
            file_path=file_path,
            issue_date=issue_date,
            expiry_date=expiry_date,
        )
        self.db.add(doc)
        self.db.commit()
        self.db.refresh(doc)
        return doc

    def update(self, doc: Document, **kwargs) -> Document:
        for key, value in kwargs.items():
            if value is not None:
                setattr(doc, key, value)
        self.db.commit()
        self.db.refresh(doc)
        return doc

    def delete(self, doc: Document) -> None:
        self.db.delete(doc)
        self.db.commit()
