/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for creating a new outing
 */
export type OutingCreate = {
    /**
     * Outing name
     */
    name: string;
    /**
     * Start date of the outing
     */
    outing_date: string;
    /**
     * End date for overnight outings
     */
    end_date?: (string | null);
    /**
     * Outing location
     */
    location: string;
    /**
     * Detailed outing description
     */
    description?: (string | null);
    /**
     * Maximum number of participants
     */
    max_participants: number;
    /**
     * Capacity type: 'fixed' or 'vehicle'
     */
    capacity_type?: string;
    /**
     * Whether outing requires overnight stay
     */
    is_overnight?: boolean;
    /**
     * Outing lead name
     */
    outing_lead_name?: (string | null);
    /**
     * Outing lead email
     */
    outing_lead_email?: (string | null);
    /**
     * Outing lead phone
     */
    outing_lead_phone?: (string | null);
    /**
     * Drop-off time
     */
    drop_off_time?: (string | null);
    /**
     * Drop-off location
     */
    drop_off_location?: (string | null);
    /**
     * Pickup time
     */
    pickup_time?: (string | null);
    /**
     * Pickup location
     */
    pickup_location?: (string | null);
    /**
     * Cost of the outing in dollars
     */
    cost?: (number | string | null);
    /**
     * Suggested gear list for participants
     */
    gear_list?: (string | null);
    /**
     * Automatic signup closure date/time
     */
    signups_close_at?: (string | null);
    /**
     * Date after which users cannot cancel
     */
    cancellation_deadline?: (string | null);
    /**
     * Manual signup closure flag
     */
    signups_closed?: boolean;
    /**
     * Outing icon (Bootstrap icon name or emoji)
     */
    icon?: (string | null);
    /**
     * Per-person food budget in dollars
     */
    food_budget_per_person?: (number | string | null);
    /**
     * Number of meals for the outing
     */
    meal_count?: (number | null);
    /**
     * Budget type: 'total' (flat per person) or 'per_meal' (per person per meal)
     */
    budget_type?: (string | null);
    /**
     * Full address of outing location
     */
    outing_address?: (string | null);
    /**
     * Reference to saved place for outing location
     */
    outing_place_id?: (string | null);
    /**
     * Full address for pickup location
     */
    pickup_address?: (string | null);
    /**
     * Reference to saved place for pickup
     */
    pickup_place_id?: (string | null);
    /**
     * Full address for drop-off location
     */
    dropoff_address?: (string | null);
    /**
     * Reference to saved place for drop-off
     */
    dropoff_place_id?: (string | null);
};

