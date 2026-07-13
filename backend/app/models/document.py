from sqlalchemy import Column, Integer, Text, Date, DateTime, func

from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    human_id = Column(Integer, nullable=False)
    doc_type = Column(Text, nullable=False)  # passport, birth_certificate, marriage_certificate, vehicle_rights
    title = Column(Text, nullable=False)
    description = Column(Text)
    file_path = Column(Text)
    issue_date = Column(Date)
    expiry_date = Column(Date)
    created_at = Column(DateTime, server_default=func.now())
