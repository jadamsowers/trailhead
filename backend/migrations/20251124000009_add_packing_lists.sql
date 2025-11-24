-- Add packing list templates and outing packing lists
-- Migration: 20251124000009_add_packing_lists.sql

-- Packing list templates (e.g., "Backpacking", "Camping", "Cold-Weather Camping")
CREATE TABLE packing_list_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE INDEX ix_packing_list_templates_id ON packing_list_templates (id);
CREATE INDEX ix_packing_list_templates_name ON packing_list_templates (name);

-- Items within each template
CREATE TABLE packing_list_template_items (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY(template_id) REFERENCES packing_list_templates (id) ON DELETE CASCADE
);

CREATE INDEX ix_packing_list_template_items_id ON packing_list_template_items (id);
CREATE INDEX ix_packing_list_template_items_template_id ON packing_list_template_items (template_id);

-- Association between outings and packing list templates
CREATE TABLE outing_packing_lists (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    outing_id UUID NOT NULL,
    template_id UUID,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY(outing_id) REFERENCES outings (id) ON DELETE CASCADE,
    FOREIGN KEY(template_id) REFERENCES packing_list_templates (id) ON DELETE SET NULL
);

CREATE INDEX ix_outing_packing_lists_id ON outing_packing_lists (id);
CREATE INDEX ix_outing_packing_lists_outing_id ON outing_packing_lists (outing_id);
CREATE INDEX ix_outing_packing_lists_template_id ON outing_packing_lists (template_id);

-- Custom/modified items for specific outings
CREATE TABLE outing_packing_list_items (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    outing_packing_list_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    checked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY(outing_packing_list_id) REFERENCES outing_packing_lists (id) ON DELETE CASCADE
);

CREATE INDEX ix_outing_packing_list_items_id ON outing_packing_list_items (id);
CREATE INDEX ix_outing_packing_list_items_outing_packing_list_id ON outing_packing_list_items (outing_packing_list_id);
