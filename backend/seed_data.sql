-- Migration: add gender/email/phone to users
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN gender text NOT NULL DEFAULT 'male';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN email text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN phone text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
UPDATE users SET gender = 'male' WHERE gender IS NULL;

-- Seed roles
INSERT INTO roles (name, description) VALUES
    ('admin', 'Полный доступ к дереву'),
    ('editor', 'Создание и редактирование людей и событий'),
    ('reader', 'Только просмотр')
ON CONFLICT DO NOTHING;

-- Seed permissions
INSERT INTO permissions (name, description) VALUES
    ('create_human', 'Создание людей'),
    ('edit_human', 'Редактирование людей'),
    ('delete_human', 'Удаление людей'),
    ('create_event', 'Создание событий'),
    ('edit_event', 'Редактирование событий'),
    ('delete_event', 'Удаление событий'),
    ('manage_members', 'Управление участниками дерева'),
    ('view_tree', 'Просмотр дерева')
ON CONFLICT DO NOTHING;

-- Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Editor permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.name = 'editor' AND p.name IN ('create_human', 'edit_human', 'create_event', 'edit_event', 'view_tree')
ON CONFLICT DO NOTHING;

-- Reader permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.name = 'reader' AND p.name = 'view_tree'
ON CONFLICT DO NOTHING;

-- Seed relationship types
INSERT INTO relationship_types (name) VALUES
    ('parent'),
    ('child'),
    ('spouse'),
    ('ex_spouse'),
    ('adopted'),
    ('brother'),
    ('sister'),
    ('grandmother'),
    ('grandfather'),
    ('grandchild'),
    ('stepbrother'),
    ('stepsister')
ON CONFLICT DO NOTHING;

-- Migration: add event_media table
CREATE TABLE IF NOT EXISTS event_media (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    mime_type TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Migration: add role to human_events
DO $$ BEGIN
    ALTER TABLE human_events ADD COLUMN role TEXT DEFAULT 'participant';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Migration: add title/description to human_media
DO $$ BEGIN
    ALTER TABLE human_media ADD COLUMN title TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
    ALTER TABLE human_media ADD COLUMN description TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Migration: add albums table
CREATE TABLE IF NOT EXISTS albums (
    id SERIAL PRIMARY KEY,
    human_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Migration: add album_media table
CREATE TABLE IF NOT EXISTS album_media (
    id SERIAL PRIMARY KEY,
    album_id INTEGER NOT NULL,
    media_id INTEGER NOT NULL,
    UNIQUE(album_id, media_id)
);

-- Migration: add documents table
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    human_id INTEGER NOT NULL,
    doc_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    file_path TEXT,
    issue_date DATE,
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Migration: add document_media table
CREATE TABLE IF NOT EXISTS document_media (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    mime_type TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Migration: add human_tree_id to users
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN human_tree_id int8;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Migration: add human_id to tree_users
DO $$ BEGIN
    ALTER TABLE tree_users ADD COLUMN human_id int8;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Migration: copy human_id from users to tree_users (only if human exists in that tree)
UPDATE tree_users tu
SET human_id = u.human_id
FROM users u
JOIN humans h ON h.human_id = u.human_id AND h.tree_id = tu.tree_id
WHERE tu.user_id = u.user_id
  AND u.human_id IS NOT NULL;
