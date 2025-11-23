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
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id)
);
CREATE INDEX ix_outings_id ON outings (id);
CREATE INDEX ix_outings_outing_date ON outings (outing_date);
CREATE INDEX ix_outings_end_date ON outings (end_date);
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
