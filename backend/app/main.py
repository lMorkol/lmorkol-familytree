from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.api import auth, trees, humans, relations, events, media, albums, documents, addresses
from app.database import SessionLocal
from app.models.relation import RelationshipType
from app.models.role import Role

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(title="FamilyTree API", version="1.0")

cors_origins = os.environ.get("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/v1")
app.include_router(trees.router, prefix="/v1")
app.include_router(humans.router, prefix="/v1")
app.include_router(relations.router, prefix="/v1")
app.include_router(events.router, prefix="/v1")
app.include_router(media.router, prefix="/v1")
app.include_router(albums.router, prefix="/v1")
app.include_router(documents.router, prefix="/v1")
app.include_router(addresses.router, prefix="/v1")

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.on_event("startup")
def seed_defaults():
    db = SessionLocal()
    try:
        # Add photo column if missing
        from sqlalchemy import text
        try:
            db.execute(text("ALTER TABLE humans ADD COLUMN photo text"))
            db.commit()
        except Exception:
            db.rollback()

        try:
            db.execute(text("ALTER TABLE trees ADD COLUMN created_by int8"))
            db.commit()
        except Exception:
            db.rollback()

        try:
            db.execute(text("ALTER TABLE users ADD COLUMN human_id int8"))
            db.commit()
        except Exception:
            db.rollback()

        try:
            db.execute(text("ALTER TABLE users ADD COLUMN human_tree_id int8"))
            db.commit()
        except Exception:
            db.rollback()

        try:
            db.execute(text("ALTER TABLE trees ADD COLUMN IF NOT EXISTS photo TEXT"))
            db.commit()
        except Exception:
            db.rollback()

        try:
            db.execute(text("ALTER TABLE tree_users ADD COLUMN human_id int8"))
            db.commit()
        except Exception:
            db.rollback()

        try:
            db.execute(text("ALTER TABLE human_relationship ADD COLUMN start_date DATE"))
            db.commit()
        except Exception:
            db.rollback()

        try:
            db.execute(text("ALTER TABLE human_relationship ADD COLUMN end_date DATE"))
            db.commit()
        except Exception:
            db.rollback()

        try:
            db.execute(text("""CREATE TABLE IF NOT EXISTS human_media (
                id SERIAL PRIMARY KEY,
                human_id INTEGER NOT NULL,
                file_path TEXT NOT NULL,
                file_type TEXT NOT NULL,
                original_filename TEXT NOT NULL,
                mime_type TEXT,
                title TEXT,
                description TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )"""))
            db.commit()
        except Exception:
            db.rollback()

        try:
            db.execute(text("""CREATE TABLE IF NOT EXISTS event_media (
                id SERIAL PRIMARY KEY,
                event_id INTEGER NOT NULL,
                file_path TEXT NOT NULL,
                file_type TEXT NOT NULL,
                original_filename TEXT NOT NULL,
                mime_type TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )"""))
            db.commit()
        except Exception:
            db.rollback()

        try:
            db.execute(text("ALTER TABLE human_events ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'participant'"))
            db.commit()
        except Exception:
            db.rollback()

        try:
            db.execute(text("""CREATE TABLE IF NOT EXISTS albums (
                id SERIAL PRIMARY KEY,
                human_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )"""))
            db.commit()
        except Exception:
            db.rollback()

        try:
            db.execute(text("""CREATE TABLE IF NOT EXISTS album_media (
                id SERIAL PRIMARY KEY,
                album_id INTEGER NOT NULL,
                media_id INTEGER NOT NULL,
                UNIQUE(album_id, media_id)
            )"""))
            db.commit()
        except Exception:
            db.rollback()

        try:
            db.execute(text("""CREATE TABLE IF NOT EXISTS documents (
                id SERIAL PRIMARY KEY,
                human_id INTEGER NOT NULL,
                doc_type TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                file_path TEXT,
                issue_date DATE,
                expiry_date DATE,
                created_at TIMESTAMP DEFAULT NOW()
            )"""))
            db.commit()
        except Exception:
            db.rollback()

        try:
            db.execute(text("""CREATE TABLE IF NOT EXISTS document_media (
                id SERIAL PRIMARY KEY,
                document_id INTEGER NOT NULL,
                file_path TEXT NOT NULL,
                original_filename TEXT NOT NULL,
                mime_type TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )"""))
            db.commit()
        except Exception:
            db.rollback()

        try:
            db.execute(text("""CREATE TABLE IF NOT EXISTS human_addresses (
                id SERIAL PRIMARY KEY,
                human_id INTEGER NOT NULL,
                country TEXT,
                city TEXT,
                street TEXT,
                house TEXT,
                apartment TEXT,
                period_start DATE,
                period_end DATE,
                lat DOUBLE PRECISION,
                lng DOUBLE PRECISION,
                is_deleted BOOLEAN DEFAULT FALSE
            )"""))
            db.commit()
        except Exception:
            db.rollback()

        try:
            db.execute(text("ALTER TABLE human_addresses ADD COLUMN IF NOT EXISTS street TEXT"))
            db.commit()
        except Exception:
            db.rollback()

        try:
            db.execute(text("ALTER TABLE human_addresses ADD COLUMN IF NOT EXISTS address_type TEXT"))
            db.commit()
        except Exception:
            db.rollback()

        for name in ["parent", "child", "spouse", "ex_spouse", "adopted", "brother", "sister", "sibling",
                      "grandmother", "grandfather", "grandchild", "stepbrother", "stepsister"]:
            if not db.query(RelationshipType).filter(RelationshipType.name == name).first():
                db.add(RelationshipType(name=name))
        for name, desc in [("admin", "Полный доступ"), ("editor", "Редактирование"), ("reader", "Только просмотр")]:
            if not db.query(Role).filter(Role.name == name).first():
                db.add(Role(name=name, description=desc))
        db.commit()

        for idx_sql in [
            "CREATE INDEX IF NOT EXISTS idx_humans_tree_deleted ON humans(tree_id, is_deleted)",
            "CREATE INDEX IF NOT EXISTS idx_human_rel_from ON human_relationship(from_human_id)",
            "CREATE INDEX IF NOT EXISTS idx_human_rel_to ON human_relationship(to_human_id)",
            "CREATE INDEX IF NOT EXISTS idx_human_events_human ON human_events(human_id)",
            "CREATE INDEX IF NOT EXISTS idx_human_events_event ON human_events(event_id)",
            "CREATE INDEX IF NOT EXISTS idx_human_addresses_human ON human_addresses(human_id)",
            "CREATE INDEX IF NOT EXISTS idx_albums_human ON albums(human_id)",
            "CREATE INDEX IF NOT EXISTS idx_documents_human ON documents(human_id)",
            "CREATE INDEX IF NOT EXISTS idx_human_media_human ON human_media(human_id)",
            "CREATE INDEX IF NOT EXISTS idx_event_media_event ON event_media(event_id)",
            "CREATE INDEX IF NOT EXISTS idx_document_media_document ON document_media(document_id)",
            "CREATE INDEX IF NOT EXISTS idx_album_media_album ON album_media(album_id)",
        ]:
            try:
                db.execute(text(idx_sql))
                db.commit()
            except Exception:
                db.rollback()

    finally:
        db.close()


@app.get("/health")
def health_check():
    return {"status": "ok"}
