CREATE TABLE users (
	id UUID NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	hashed_password VARCHAR(255) NOT NULL, 
	full_name VARCHAR(255) NOT NULL, 
	role VARCHAR(50) NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	is_initial_admin BOOLEAN NOT NULL, 
	phone VARCHAR(50), 
	emergency_contact_name VARCHAR(255), 
	emergency_contact_phone VARCHAR(50), 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id)
);
CREATE INDEX ix_users_role ON users (role);
CREATE INDEX ix_users_id ON users (id);
CREATE UNIQUE INDEX ix_users_email ON users (email);
CREATE TABLE outings (
	id UUID NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	outing_date DATE NOT NULL, 
	end_date DATE, 
	location VARCHAR(255) NOT NULL, 
	description TEXT, 
	max_participants INTEGER NOT NULL, 
	capacity_type VARCHAR(20) NOT NULL, 
	is_overnight BOOLEAN NOT NULL, 
	outing_lead_name VARCHAR(255), 
	outing_lead_email VARCHAR(255), 
	outing_lead_phone VARCHAR(50), 
	-- Added fields via migrations
	icon VARCHAR(50),
	drop_off_time TIME,
	drop_off_location VARCHAR(255),
	pickup_time TIME,
	pickup_location VARCHAR(255),
	cost NUMERIC(10, 2),
	gear_list TEXT,
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id)
);
CREATE INDEX ix_outings_id ON outings (id);
CREATE INDEX ix_outings_outing_date ON outings (outing_date);
CREATE INDEX ix_outings_end_date ON outings (end_date);
-- Troop restriction (optional)
ALTER TABLE outings ADD COLUMN IF NOT EXISTS restricted_troop_id UUID;
ALTER TABLE outings
	ADD CONSTRAINT IF NOT EXISTS outings_restricted_troop_id_fkey
	FOREIGN KEY (restricted_troop_id) REFERENCES troops(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS ix_outings_restricted_troop_id ON outings (restricted_troop_id);
CREATE TABLE signups (
	id UUID NOT NULL, 
	outing_id UUID NOT NULL, 
	family_contact_name VARCHAR(255) NOT NULL, 
	family_contact_email VARCHAR(255) NOT NULL, 
	family_contact_phone VARCHAR(50), 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(outing_id) REFERENCES outings (id) ON DELETE CASCADE
);
CREATE INDEX ix_signups_outing_id ON signups (outing_id);
CREATE INDEX ix_signups_id ON signups (id);
CREATE TABLE refresh_tokens (
	id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	token VARCHAR(500) NOT NULL, 
	expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	revoked BOOLEAN NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE INDEX ix_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX ix_refresh_tokens_id ON refresh_tokens (id);
CREATE INDEX ix_refresh_tokens_token ON refresh_tokens (token);
CREATE TABLE family_members (
	id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	member_type VARCHAR(50) NOT NULL, 
	date_of_birth DATE, 
	gender VARCHAR(20), 
	troop_number VARCHAR(50), 
	patrol_name VARCHAR(100), 
	has_youth_protection BOOLEAN NOT NULL, 
	youth_protection_expiration DATE, 
	vehicle_capacity INTEGER NOT NULL, 
	medical_notes TEXT, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE INDEX ix_family_members_user_id ON family_members (user_id);
CREATE INDEX ix_family_members_troop_number ON family_members (troop_number);
CREATE INDEX ix_family_members_id ON family_members (id);
CREATE INDEX ix_family_members_member_type ON family_members (member_type);
CREATE INDEX ix_family_members_gender ON family_members (gender);
-- Relational troop/patrol references
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS troop_id UUID;
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS patrol_id UUID;
ALTER TABLE family_members
	ADD CONSTRAINT IF NOT EXISTS family_members_troop_id_fkey
	FOREIGN KEY (troop_id) REFERENCES troops(id) ON DELETE SET NULL;
ALTER TABLE family_members
	ADD CONSTRAINT IF NOT EXISTS family_members_patrol_id_fkey
	FOREIGN KEY (patrol_id) REFERENCES patrols(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS ix_family_members_troop_id ON family_members (troop_id);
CREATE INDEX IF NOT EXISTS ix_family_members_patrol_id ON family_members (patrol_id);
CREATE TABLE participants (
	id UUID NOT NULL, 
	signup_id UUID NOT NULL, 
	family_member_id UUID NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(signup_id) REFERENCES signups (id) ON DELETE CASCADE, 
	FOREIGN KEY(family_member_id) REFERENCES family_members (id) ON DELETE CASCADE
);
CREATE INDEX ix_participants_id ON participants (id);
CREATE INDEX ix_participants_signup_id ON participants (signup_id);
CREATE INDEX ix_participants_family_member_id ON participants (family_member_id);
CREATE TABLE family_member_dietary_preferences (
	id UUID NOT NULL, 
	family_member_id UUID NOT NULL, 
	preference VARCHAR(100) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(family_member_id) REFERENCES family_members (id) ON DELETE CASCADE
);
CREATE INDEX ix_family_member_dietary_preferences_family_member_id ON family_member_dietary_preferences (family_member_id);
CREATE INDEX ix_family_member_dietary_preferences_id ON family_member_dietary_preferences (id);
CREATE TABLE family_member_allergies (
	id UUID NOT NULL, 
	family_member_id UUID NOT NULL, 
	allergy VARCHAR(100) NOT NULL, 
	severity VARCHAR(50), 
	PRIMARY KEY (id), 
	FOREIGN KEY(family_member_id) REFERENCES family_members (id) ON DELETE CASCADE
);
CREATE INDEX ix_family_member_allergies_id ON family_member_allergies (id);
CREATE INDEX ix_family_member_allergies_family_member_id ON family_member_allergies (family_member_id);
CREATE TABLE checkins (
	id UUID NOT NULL, 
	outing_id UUID NOT NULL, 
	signup_id UUID NOT NULL, 
	participant_id UUID NOT NULL, 
	checked_in_by VARCHAR(255) NOT NULL, 
	checked_in_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_checkin_outing_participant UNIQUE (outing_id, participant_id), 
	FOREIGN KEY(outing_id) REFERENCES outings (id) ON DELETE CASCADE, 
	FOREIGN KEY(signup_id) REFERENCES signups (id) ON DELETE CASCADE, 
	FOREIGN KEY(participant_id) REFERENCES participants (id) ON DELETE CASCADE
);
CREATE INDEX ix_checkins_id ON checkins (id);
CREATE INDEX ix_checkins_outing_id ON checkins (outing_id);
CREATE INDEX ix_checkins_signup_id ON checkins (signup_id);
CREATE INDEX ix_checkins_participant_id ON checkins (participant_id);

-- Places (reusable addresses with optional Google Maps URL)
CREATE TABLE IF NOT EXISTS places (
	id UUID PRIMARY KEY,
	name VARCHAR(255) NOT NULL,
	address TEXT NOT NULL,
	google_maps_url TEXT,
	created_at TIMESTAMP NOT NULL,
	updated_at TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_places_name ON places(name);

-- Address and place references on outings
ALTER TABLE outings
	ADD COLUMN IF NOT EXISTS outing_address TEXT,
	ADD COLUMN IF NOT EXISTS outing_place_id UUID,
	ADD COLUMN IF NOT EXISTS pickup_address TEXT,
	ADD COLUMN IF NOT EXISTS pickup_place_id UUID,
	ADD COLUMN IF NOT EXISTS dropoff_address TEXT,
	ADD COLUMN IF NOT EXISTS dropoff_place_id UUID;
ALTER TABLE outings
	ADD CONSTRAINT IF NOT EXISTS outings_outing_place_id_fkey
	FOREIGN KEY (outing_place_id) REFERENCES places(id) ON DELETE SET NULL;
ALTER TABLE outings
	ADD CONSTRAINT IF NOT EXISTS outings_pickup_place_id_fkey
	FOREIGN KEY (pickup_place_id) REFERENCES places(id) ON DELETE SET NULL;
ALTER TABLE outings
	ADD CONSTRAINT IF NOT EXISTS outings_dropoff_place_id_fkey
	FOREIGN KEY (dropoff_place_id) REFERENCES places(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_outings_outing_place_id ON outings(outing_place_id);
CREATE INDEX IF NOT EXISTS idx_outings_pickup_place_id ON outings(pickup_place_id);
CREATE INDEX IF NOT EXISTS idx_outings_dropoff_place_id ON outings(dropoff_place_id);

-- Scout rank requirements
CREATE TABLE rank_requirements (
	id UUID NOT NULL,
	rank VARCHAR(50) NOT NULL,
	requirement_number VARCHAR(20) NOT NULL,
	requirement_text TEXT NOT NULL,
	keywords TEXT[],
	category VARCHAR(100),
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	PRIMARY KEY (id)
);
CREATE INDEX ix_rank_requirements_rank ON rank_requirements (rank);
CREATE INDEX ix_rank_requirements_category ON rank_requirements (category);
CREATE INDEX ix_rank_requirements_id ON rank_requirements (id);

-- Merit badges
CREATE TABLE merit_badges (
	id UUID NOT NULL,
	name VARCHAR(100) NOT NULL,
	description TEXT,
	keywords TEXT[],
	eagle_required BOOLEAN NOT NULL DEFAULT FALSE,
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	PRIMARY KEY (id)
);
CREATE UNIQUE INDEX uq_merit_badges_name ON merit_badges (name);
CREATE INDEX ix_merit_badges_name ON merit_badges (name);
CREATE INDEX ix_merit_badges_id ON merit_badges (id);

-- Junction table: outings to rank requirements
CREATE TABLE outing_requirements (
	id UUID NOT NULL,
	outing_id UUID NOT NULL,
	rank_requirement_id UUID NOT NULL,
	notes TEXT,
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY(outing_id) REFERENCES outings (id) ON DELETE CASCADE,
	FOREIGN KEY(rank_requirement_id) REFERENCES rank_requirements (id) ON DELETE CASCADE
);
CREATE INDEX ix_outing_requirements_outing_id ON outing_requirements (outing_id);
CREATE INDEX ix_outing_requirements_rank_requirement_id ON outing_requirements (rank_requirement_id);
CREATE INDEX ix_outing_requirements_id ON outing_requirements (id);

-- Junction table: outings to merit badges
CREATE TABLE outing_merit_badges (
	id UUID NOT NULL,
	outing_id UUID NOT NULL,
	merit_badge_id UUID NOT NULL,
	notes TEXT,
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY(outing_id) REFERENCES outings (id) ON DELETE CASCADE,
	FOREIGN KEY(merit_badge_id) REFERENCES merit_badges (id) ON DELETE CASCADE
);
CREATE INDEX ix_outing_merit_badges_outing_id ON outing_merit_badges (outing_id);
CREATE INDEX ix_outing_merit_badges_merit_badge_id ON outing_merit_badges (merit_badge_id);
CREATE INDEX ix_outing_merit_badges_id ON outing_merit_badges (id);

-- Packing list templates and outing packing lists
CREATE TABLE IF NOT EXISTS packing_list_templates (
		id UUID NOT NULL,
		name VARCHAR(255) NOT NULL,
		description TEXT,
		created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
		updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
		PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS ix_packing_list_templates_id ON packing_list_templates (id);
CREATE INDEX IF NOT EXISTS ix_packing_list_templates_name ON packing_list_templates (name);

CREATE TABLE IF NOT EXISTS packing_list_template_items (
		id UUID NOT NULL,
		template_id UUID NOT NULL,
		name VARCHAR(255) NOT NULL,
		quantity INTEGER NOT NULL,
		sort_order INTEGER NOT NULL,
		created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
		updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
		PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS ix_packing_list_template_items_id ON packing_list_template_items (id);
CREATE INDEX IF NOT EXISTS ix_packing_list_template_items_template_id ON packing_list_template_items (template_id);

CREATE TABLE IF NOT EXISTS outing_packing_lists (
		id UUID NOT NULL,
		outing_id UUID NOT NULL,
		template_id UUID,
		created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
		PRIMARY KEY (id)
);
	ALTER TABLE outing_packing_lists
		ADD CONSTRAINT IF NOT EXISTS outing_packing_lists_outing_id_fkey
		FOREIGN KEY (outing_id) REFERENCES outings(id) ON DELETE CASCADE;
	ALTER TABLE outing_packing_lists
		ADD CONSTRAINT IF NOT EXISTS outing_packing_lists_template_id_fkey
		FOREIGN KEY (template_id) REFERENCES packing_list_templates(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS ix_outing_packing_lists_id ON outing_packing_lists (id);
CREATE INDEX IF NOT EXISTS ix_outing_packing_lists_outing_id ON outing_packing_lists (outing_id);
CREATE INDEX IF NOT EXISTS ix_outing_packing_lists_template_id ON outing_packing_lists (template_id);

CREATE TABLE IF NOT EXISTS outing_packing_list_items (
		id UUID NOT NULL,
		outing_packing_list_id UUID NOT NULL,
		name VARCHAR(255) NOT NULL,
		quantity INTEGER NOT NULL,
		checked BOOLEAN NOT NULL,
		created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
		updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
		PRIMARY KEY (id)
);
	ALTER TABLE outing_packing_list_items
		ADD CONSTRAINT IF NOT EXISTS outing_packing_list_items_outing_packing_list_id_fkey
		FOREIGN KEY (outing_packing_list_id) REFERENCES outing_packing_lists(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS ix_outing_packing_list_items_id ON outing_packing_list_items (id);
CREATE INDEX IF NOT EXISTS ix_outing_packing_list_items_outing_packing_list_id ON outing_packing_list_items (outing_packing_list_id);

-- Troops and Patrols
CREATE TABLE IF NOT EXISTS troops (
	id UUID NOT NULL,
	number VARCHAR(50) NOT NULL,
	charter_org VARCHAR(255),
	meeting_location VARCHAR(255),
	meeting_day VARCHAR(20),
	notes TEXT,
	created_at TIMESTAMP NOT NULL,
	updated_at TIMESTAMP NOT NULL,
	PRIMARY KEY (id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_troops_number ON troops (number);
CREATE INDEX IF NOT EXISTS ix_troops_id ON troops (id);

CREATE TABLE IF NOT EXISTS patrols (
	id UUID NOT NULL,
	troop_id UUID NOT NULL,
	name VARCHAR(100) NOT NULL,
	is_active BOOLEAN NOT NULL,
	created_at TIMESTAMP NOT NULL,
	updated_at TIMESTAMP NOT NULL,
	PRIMARY KEY (id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_patrols_troop_id_name ON patrols (troop_id, name);
CREATE INDEX IF NOT EXISTS ix_patrols_id ON patrols (id);
CREATE INDEX IF NOT EXISTS ix_patrols_troop_id ON patrols (troop_id);

-- Add youth protection expiration to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS youth_protection_expiration DATE;
