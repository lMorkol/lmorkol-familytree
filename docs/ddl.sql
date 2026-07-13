-- DROP SCHEMA public;

CREATE SCHEMA IF NOT EXISTS public AUTHORIZATION pg_database_owner;

-- DROP SEQUENCE public.events_event_id_seq;

CREATE SEQUENCE public.events_event_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.human_relationship_id_seq;

CREATE SEQUENCE public.human_relationship_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.humans_human_id_seq;

CREATE SEQUENCE public.humans_human_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.permissions_permission_id_seq;

CREATE SEQUENCE public.permissions_permission_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.relationship_types_relation_id_seq;

CREATE SEQUENCE public.relationship_types_relation_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.roles_role_id_seq;

CREATE SEQUENCE public.roles_role_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.trees_tree_id_seq;

CREATE SEQUENCE public.trees_tree_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.users_user_id_seq;

CREATE SEQUENCE public.users_user_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;-- public.events определение

-- Drop table

-- DROP TABLE public.events;

CREATE TABLE public.events (
	event_id serial4 NOT NULL,
	start_date timestamptz NOT NULL,
	end_date timestamptz NULL,
	"name" text NOT NULL,
	description text NOT NULL,
	is_deleted bool DEFAULT false NULL,
	CONSTRAINT events_pkey PRIMARY KEY (event_id)
);


-- public.human_events определение

-- Drop table

-- DROP TABLE public.human_events;

CREATE TABLE public.human_events (
	human_id int8 NOT NULL,
	event_id int8 NOT NULL
);


-- public.human_relationship определение

-- Drop table

-- DROP TABLE public.human_relationship;

CREATE TABLE human_relationship (
    id SERIAL PRIMARY KEY,
    from_human_id INT NOT NULL,
    to_human_id INT NOT NULL,
    relation_id INT NOT NULL,

    UNIQUE(from_human_id, to_human_id, relation_id)
);


-- public.humans определение

-- Drop table

-- DROP TABLE public.humans;

CREATE TABLE public.humans (
	human_id serial4 NOT NULL,
	first_name text NULL,
	second_name text NULL,
	patronymic text NULL,
	birth_date timestamp NULL,
	birth_time time NULL,
	death_date timestamp NULL,
	country text NULL,
	place_of_birth text NULL,
	gender text NOT NULL,
	tree_id int8 NOT NULL,
	photo text NULL,
	is_deleted bool DEFAULT false NULL,
	CONSTRAINT humans_pkey PRIMARY KEY (human_id)
);


-- public.permissions определение

-- Drop table

-- DROP TABLE public.permissions;

CREATE TABLE public.permissions (
	permission_id serial4 NOT NULL,
	"name" text NOT NULL,
	description text NULL,
	CONSTRAINT permissions_pkey PRIMARY KEY (permission_id)
);


-- public.relationship_types определение

-- Drop table

-- DROP TABLE public.relationship_types;

CREATE TABLE public.relationship_types (
	relation_id serial4 NOT NULL,
	"name" varchar(50) NOT NULL,
	CONSTRAINT relationship_types_name_key UNIQUE (name),
	CONSTRAINT relationship_types_pkey PRIMARY KEY (relation_id)
);


-- public.role_permissions определение

-- Drop table

-- DROP TABLE public.role_permissions;

CREATE TABLE public.role_permissions (
	role_id int8 NOT NULL,
	permission_id int8 NOT NULL,
	CONSTRAINT role_permissions_role_id_permission_id_key UNIQUE (role_id, permission_id)
);


-- public.roles определение

-- Drop table

-- DROP TABLE public.roles;

CREATE TABLE public.roles (
	role_id serial4 NOT NULL,
	"name" varchar(50) NOT NULL,
	description text NULL,
	CONSTRAINT roles_pkey PRIMARY KEY (role_id)
);


-- public.tree_users определение

-- Drop table

-- DROP TABLE public.tree_users;

CREATE TABLE public.tree_users (
	tree_id int8 NOT NULL,
	user_id int8 NOT NULL,
	role_id int8 NOT NULL,
	is_active bool DEFAULT true NULL,
	CONSTRAINT tree_users_tree_id_user_id_key UNIQUE (tree_id, user_id)
);


-- public.trees определение

-- Drop table

-- DROP TABLE public.trees;

CREATE TABLE public.trees (
	tree_id serial4 NOT NULL,
	"name" varchar(50) NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	photo text NULL,
	is_deleted bool DEFAULT false NULL,
	CONSTRAINT trees_pkey PRIMARY KEY (tree_id)
);


-- public.human_addresses определение

CREATE TABLE public.human_addresses (
	id serial4 NOT NULL,
	human_id int8 NOT NULL,
	country text NULL,
	city text NULL,
	street text NULL,
	house text NULL,
	apartment text NULL,
	address_type text NULL,
	period_start date NULL,
	period_end date NULL,
	lat float8 NULL,
	lng float8 NULL,
	is_deleted bool DEFAULT false NULL,
	CONSTRAINT human_addresses_pkey PRIMARY KEY (id)
);


-- public.users определение

-- Drop table

-- DROP TABLE public.users;

CREATE TABLE public.users (
	user_id serial4 NOT NULL,
	first_name text NOT NULL,
	second_name text NOT NULL,
	login text NOT NULL,
	"password" text NOT NULL,
	gender text NOT NULL DEFAULT 'male',
	email text NULL,
	phone text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	is_deleted bool DEFAULT false NULL,
	CONSTRAINT users_login_key UNIQUE (login),
	CONSTRAINT users_pkey PRIMARY KEY (user_id)
);


-- Индексы для производительности

CREATE INDEX IF NOT EXISTS idx_humans_tree_deleted ON humans(tree_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_human_rel_from ON human_relationship(from_human_id);
CREATE INDEX IF NOT EXISTS idx_human_rel_to ON human_relationship(to_human_id);
CREATE INDEX IF NOT EXISTS idx_human_events_human ON human_events(human_id);
CREATE INDEX IF NOT EXISTS idx_human_events_event ON human_events(event_id);
CREATE INDEX IF NOT EXISTS idx_human_addresses_human ON human_addresses(human_id);
CREATE INDEX IF NOT EXISTS idx_albums_human ON albums(human_id);
CREATE INDEX IF NOT EXISTS idx_documents_human ON documents(human_id);
CREATE INDEX IF NOT EXISTS idx_human_media_human ON human_media(human_id);
CREATE INDEX IF NOT EXISTS idx_event_media_event ON event_media(event_id);
CREATE INDEX IF NOT EXISTS idx_document_media_document ON document_media(document_id);
CREATE INDEX IF NOT EXISTS idx_album_media_album ON album_media(album_id);