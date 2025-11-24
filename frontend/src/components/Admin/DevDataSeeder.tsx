import React, { useState } from 'react';
import { outingAPI, familyAPI } from '../../services/api';

// Fake data pools
const FIRST_NAMES_MALE = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Christopher"];
const FIRST_NAMES_FEMALE = ["Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen"];
const SCOUT_NAMES_MALE = ["Ethan", "Noah", "Liam", "Mason", "Jacob", "Lucas", "Logan", "Oliver", "Aiden", "Elijah"];
const SCOUT_NAMES_FEMALE = ["Emma", "Olivia", "Ava", "Sophia", "Isabella", "Mia", "Charlotte", "Amelia", "Harper", "Evelyn"];
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
    "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];

const TROOP_NUMBERS = ["123", "456", "789", "234", "567", "890"];
const PATROL_NAMES = ["Eagle Patrol", "Wolf Patrol", "Bear Patrol", "Fox Patrol", "Hawk Patrol", "Lion Patrol",
    "Tiger Patrol", "Panther Patrol", "Cobra Patrol", "Dragon Patrol"];

const DIETARY_PREFERENCES = ["vegetarian", "vegan", "gluten-free", "dairy-free", "kosher", "halal", "pescatarian"];
const ALLERGIES = [
    { allergy: "peanuts", severity: "severe" },
    { allergy: "tree nuts", severity: "severe" },
    { allergy: "shellfish", severity: "moderate" },
    { allergy: "dairy", severity: "mild" },
    { allergy: "eggs", severity: "mild" },
    { allergy: "soy", severity: "moderate" },
    { allergy: "wheat", severity: "moderate" },
    { allergy: "fish", severity: "severe" },
];

const MEDICAL_NOTES = [
    "Asthma - carries inhaler",
    "Type 1 Diabetes - requires insulin",
    "ADHD - takes medication daily",
    "Seasonal allergies",
    "Motion sickness - needs medication for long drives",
    "Bee sting allergy - carries EpiPen",
    null,
    null,
    null,
];

const TRIP_NAMES = [
    "Weekend Camping at Pine Lake",
    "Day Hike - Eagle Peak Trail",
    "Kayaking Adventure",
    "Rock Climbing Workshop",
    "Backpacking Outing - Mountain Ridge",
    "Service Project - Trail Maintenance",
    "Fishing Derby",
    "Winter Camping Experience",
    "Canoeing on River Rapids",
    "Orienteering Competition",
];

const LOCATIONS = [
    "Pine Lake Campground",
    "Eagle Peak Trailhead",
    "Blue River Recreation Area",
    "Summit Rock Climbing Center",
    "Mountain Ridge Wilderness",
    "Forest Trail System",
    "Lake Vista",
    "Snow Peak Campground",
    "Rapids River Park",
    "Compass Point Park",
];

const TRIP_DESCRIPTIONS = [
    "Join us for an exciting outdoor adventure! This is a great opportunity for scouts to develop outdoor skills and build teamwork.",
    "Come experience the great outdoors! All skill levels welcome. Bring your enthusiasm and sense of adventure.",
    "A fantastic adventure awaits! Don't miss this opportunity to explore nature and make lasting memories.",
    "This outing will challenge and inspire our scouts. Sign up today and be part of something special!",
    "Experience the thrill of outdoor adventure while learning valuable scouting skills in a safe, supervised environment.",
];

const randomChoice = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

const randomDateOfBirth = (minAge: number, maxAge: number): string => {
    const today = new Date();
    const age = randomInt(minAge, maxAge);
    const birthYear = today.getFullYear() - age;
    const birthMonth = randomInt(1, 12);
    const birthDay = randomInt(1, 28);
    return `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;
};

const randomYouthProtectionExpiration = (hasTraining: boolean): string | undefined => {
    if (!hasTraining) {
        return undefined;
    }

    const today = new Date();

    // 85% have valid (future) expiration dates
    // 15% have expired certificates
    if (Math.random() < 0.85) {
        // Valid certificate: expires 1-24 months in the future
        const monthsUntilExpiry = randomInt(1, 24);
        const expiryDate = new Date(today);
        expiryDate.setMonth(today.getMonth() + monthsUntilExpiry);
        return expiryDate.toISOString().split('T')[0];
    } else {
        // Expired certificate: expired 1-6 months ago
        const monthsSinceExpiry = randomInt(1, 6);
        const expiryDate = new Date(today);
        expiryDate.setMonth(today.getMonth() - monthsSinceExpiry);
        return expiryDate.toISOString().split('T')[0];
    }
};

const DevDataSeeder: React.FC = () => {
    const [isSeeding, setIsSeeding] = useState(false);
    const [progress, setProgress] = useState<string>('');
    const [seedMessage, setSeedMessage] = useState<string | null>(null);
    const [seedError, setSeedError] = useState<string | null>(null);

    const createOuting = async (
        name: string,
        location: string,
        daysFromNow: number,
        isOvernight: boolean,
        capacityType: 'fixed' | 'vehicle',
        maxParticipants: number,
        icon?: string
    ) => {
        const today = new Date();
        const outingDate = new Date(today);
        outingDate.setDate(today.getDate() + daysFromNow);

        const endDate = isOvernight ? new Date(outingDate) : null;
        if (endDate) {
            endDate.setDate(outingDate.getDate() + randomInt(1, 3));
        }

        const formatDate = (date: Date) => date.toISOString().split('T')[0];

        const outingData: any = {
            name,
            outing_date: formatDate(outingDate),
            location,
            description: randomChoice(TRIP_DESCRIPTIONS),
            max_participants: maxParticipants,
            capacity_type: capacityType,
            is_overnight: isOvernight,
            icon: icon,
            outing_lead_name: `${randomChoice(FIRST_NAMES_MALE)} ${randomChoice(LAST_NAMES)}`,
            outing_lead_email: `leader${randomInt(1, 100)}@example.com`,
            outing_lead_phone: `555-${randomInt(100, 999)}-${randomInt(1000, 9999)}`,
        };

        // Only include end_date if it's an overnight outing
        if (endDate) {
            outingData.end_date = formatDate(endDate);
        }

        await outingAPI.create(outingData);
    };

    const createFamily = async (lastName: string, numScouts: number) => {
        const members = [];

        // Create primary adult
        const parent1First = randomChoice(Math.random() > 0.5 ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE);
        const parent1Name = `${parent1First} ${lastName}`;

        const hasVehicle = Math.random() < 0.7;
        const vehicleCapacity = hasVehicle ? randomChoice([0, 4, 5, 6, 7]) : 0;

        const hasYouthProtection = true; // All adults must have YPT for outings
        const youthProtectionExpiration = randomYouthProtectionExpiration(hasYouthProtection);

        const parentMember = await familyAPI.create({
            name: parent1Name,
            member_type: 'adult',
            date_of_birth: randomDateOfBirth(30, 55),
            has_youth_protection: hasYouthProtection,
            youth_protection_expiration: youthProtectionExpiration,
            vehicle_capacity: vehicleCapacity,
            medical_notes: randomChoice(MEDICAL_NOTES) || undefined,
            dietary_preferences: Math.random() < 0.3 ? [randomChoice(DIETARY_PREFERENCES)] : [],
            allergies: Math.random() < 0.2 ? [randomChoice(ALLERGIES)] : [],
        });
        members.push(parentMember);

        // Create scouts
        const troop = randomChoice(TROOP_NUMBERS);
        const patrol = randomChoice(PATROL_NAMES);

        for (let i = 0; i < numScouts; i++) {
            const scoutFirst = randomChoice(Math.random() > 0.3 ? SCOUT_NAMES_MALE : SCOUT_NAMES_FEMALE);
            const scoutName = `${scoutFirst} ${lastName}`;

            const scoutMember = await familyAPI.create({
                name: scoutName,
                member_type: 'scout',
                date_of_birth: randomDateOfBirth(11, 17),
                troop_number: troop,
                patrol_name: patrol,
                has_youth_protection: false,
                vehicle_capacity: 0,
                medical_notes: randomChoice(MEDICAL_NOTES) || undefined,
                dietary_preferences: Math.random() < 0.25 ? [randomChoice(DIETARY_PREFERENCES)] : [],
                allergies: Math.random() < 0.15 ? [randomChoice(ALLERGIES)] : [],
            });
            members.push(scoutMember);
        }

        return members;
    };

    const handleSeedData = async () => {
        if (!window.confirm('This will create sample outings and family data. Continue?')) {
            return;
        }

        setIsSeeding(true);
        setProgress('');
        setSeedMessage(null);
        setSeedError(null);

        let outingsCreated = 0;
        let familiesCreated = 0;
        let totalMembers = 0;

        try {
            // Create outings
            setProgress('Creating outings...');
            const outingConfigs: [string, string, number, boolean, 'fixed' | 'vehicle', number, string][] = [
                [TRIP_NAMES[0], LOCATIONS[0], 7, true, 'fixed', 25, 'Camping'],
                [TRIP_NAMES[1], LOCATIONS[1], 14, false, 'fixed', 30, 'Hiking'],
                [TRIP_NAMES[2], LOCATIONS[2], 21, false, 'vehicle', 40, 'Canoeing'],
                [TRIP_NAMES[3], LOCATIONS[3], 28, false, 'fixed', 20, 'Rock Climbing'],
                [TRIP_NAMES[4], LOCATIONS[4], 35, true, 'vehicle', 35, 'Backpacking'],
                [TRIP_NAMES[5], LOCATIONS[5], 45, false, 'fixed', 25, 'Service Project'],
                [TRIP_NAMES[6], LOCATIONS[6], 60, false, 'fixed', 30, 'Fishing'],
                [TRIP_NAMES[7], LOCATIONS[7], 75, true, 'vehicle', 20, 'Camping'],
                [TRIP_NAMES[8], LOCATIONS[8], 90, false, 'vehicle', 35, 'Canoeing'],
                [TRIP_NAMES[9], LOCATIONS[9], 105, false, 'fixed', 40, 'Navigation'],
            ];

            for (const [name, location, days, overnight, capType, maxPart, icon] of outingConfigs) {
                try {
                    await createOuting(name, location, days, overnight, capType, maxPart, icon);
                    outingsCreated++;
                    setProgress(`Created ${outingsCreated}/${outingConfigs.length} outings...`);
                } catch (error) {
                    console.error(`Error creating outing ${name}:`, error);
                }
            }

            // Create families
            setProgress('Creating families...');
            for (let i = 0; i < 5; i++) {
                const lastName = LAST_NAMES[i];
                try {
                    const numScouts = randomChoice([1, 1, 1, 1, 1, 1, 2, 2, 2, 3]); // Weighted: 60% 1, 30% 2, 10% 3
                    const members = await createFamily(lastName, numScouts);
                    familiesCreated++;
                    totalMembers += members.length;
                    setProgress(`Created ${familiesCreated}/5 families (${totalMembers} members)...`);
                } catch (error) {
                    console.error(`Error creating family ${lastName}:`, error);
                }
            }

            setSeedMessage(
                `✅ Successfully seeded database!\n\n` +
                `• Outings created: ${outingsCreated}\n` +
                `• Families created: ${familiesCreated}\n` +
                `• Total members: ${totalMembers}\n\n` +
                `Note: All family members were created under your account.`
            );
        } catch (error) {
            console.error('Error seeding data:', error);
            setSeedError(error instanceof Error ? error.message : 'Failed to seed data');
        } finally {
            setIsSeeding(false);
            setProgress('');
        }
    };

    return (
        <div style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--card-border)',
            borderRadius: '0.5rem',
            boxShadow: 'var(--card-shadow)'
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                    <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        color: 'var(--text-primary)',
                        marginBottom: '0.5rem',
                        marginTop: 0
                    }}>
                        🌱 Development Data Seeding
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        Quickly populate the database with sample outings and family data for testing and development.
                        This will create 10 outings and 5 families with realistic test data.
                    </p>
                    {progress && (
                        <div style={{
                            marginBottom: '1rem',
                            padding: '1rem',
                            backgroundColor: 'var(--alert-info-bg)',
                            border: '1px solid var(--alert-info-border)',
                            color: 'var(--alert-info-text)',
                            borderRadius: '0.25rem',
                            fontSize: '0.875rem'
                        }}>
                            {progress}
                        </div>
                    )}
                    {seedMessage && (
                        <div style={{
                            marginBottom: '1rem',
                            padding: '1rem',
                            backgroundColor: 'var(--alert-success-bg)',
                            border: '1px solid var(--alert-success-border)',
                            color: 'var(--alert-success-text)',
                            borderRadius: '0.25rem',
                            whiteSpace: 'pre-line',
                            fontSize: '0.875rem'
                        }}>
                            {seedMessage}
                        </div>
                    )}
                    {seedError && (
                        <div style={{
                            marginBottom: '1rem',
                            padding: '1rem',
                            backgroundColor: 'var(--alert-error-bg)',
                            border: '1px solid var(--alert-error-border)',
                            color: 'var(--alert-error-text)',
                            borderRadius: '0.25rem',
                            fontSize: '0.875rem'
                        }}>
                            {seedError}
                        </div>
                    )}
                </div>
                <button
                    onClick={handleSeedData}
                    disabled={isSeeding}
                    style={{
                        marginLeft: '1rem',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '0.5rem',
                        fontWeight: 'bold',
                        color: isSeeding ? 'var(--btn-disabled-text)' : 'var(--btn-primary-text)',
                        backgroundColor: isSeeding ? 'var(--btn-disabled-bg)' : 'var(--btn-primary-bg)',
                        border: 'none',
                        cursor: isSeeding ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.2s',
                        whiteSpace: 'nowrap'
                    }}
                    onMouseOver={(e) => {
                        if (!isSeeding) e.currentTarget.style.backgroundColor = 'var(--btn-primary-hover)';
                    }}
                    onMouseOut={(e) => {
                        if (!isSeeding) e.currentTarget.style.backgroundColor = 'var(--btn-primary-bg)';
                    }}
                >
                    {isSeeding ? '⏳ Seeding...' : '🌱 Seed Data'}
                </button>
            </div>
        </div>
    );
};

export default DevDataSeeder;