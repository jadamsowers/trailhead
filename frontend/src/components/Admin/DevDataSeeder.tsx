import React, { useState } from "react";
import {
  outingAPI,
  familyAPI,
  troopAPI,
  patrolAPI,
  requirementsAPI,
} from "../../services/api";

// Fake data pools
const FIRST_NAMES_MALE = [
  "Ethan",
  "Noah",
  "Liam",
  "Mason",
  "Jacob",
  "Lucas",
  "Logan",
  "Oliver",
  "Aiden",
  "Elijah",
  "Benjamin",
  "Carter",
  "Wyatt",
  "Dylan",
  "Nathan",
  "Samuel",
  "Henry",
  "Owen",
  "Sebastian",
  "Jackson",
];
const FIRST_NAMES_FEMALE = [
  "Emma",
  "Olivia",
  "Ava",
  "Sophia",
  "Isabella",
  "Mia",
  "Charlotte",
  "Amelia",
  "Harper",
  "Evelyn",
  "Abigail",
  "Emily",
  "Elizabeth",
  "Sofia",
  "Avery",
  "Ella",
  "Scarlett",
  "Grace",
  "Chloe",
  "Victoria",
];
const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Walker",
  "Hall",
  "Allen",
  "Young",
  "King",
  "Wright",
  "Scott",
  "Green",
  "Baker",
];
const PATROL_NAMES = [
  "Eagle Patrol",
  "Wolf Patrol",
  "Bear Patrol",
  "Fox Patrol",
  "Hawk Patrol",
  "Lion Patrol",
  "Tiger Patrol",
  "Panther Patrol",
  "Cobra Patrol",
  "Dragon Patrol",
  "Falcon Patrol",
  "Raven Patrol",
];

const TROOP_CONFIGS = [
  {
    number: "123",
    charterOrg: "First United Methodist Church",
    meetingLocation: "Church Fellowship Hall",
    meetingDay: "Monday",
  },
  {
    number: "456",
    charterOrg: "Rotary Club",
    meetingLocation: "Community Center",
    meetingDay: "Tuesday",
  },
  {
    number: "789",
    charterOrg: "VFW Post 1234",
    meetingLocation: "VFW Hall",
    meetingDay: "Wednesday",
  },
];

const DIETARY_PREFERENCES = [
  "vegetarian",
  "vegan",
  "gluten-free",
  "dairy-free",
  "kosher",
  "halal",
  "pescatarian",
];
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

const CAMPING_GEAR_LIST = `Essential Camping Gear:
• Tent (if not provided)
• Sleeping bag rated for season
• Sleeping pad or air mattress
• Pillow
• Flashlight or headlamp with extra batteries
• Water bottle (at least 1 liter)
• Personal first aid kit
• Sunscreen and insect repellent
• Rain gear (jacket and pants)
• Warm layers (fleece or jacket)
• Extra socks and underwear
• Toiletries and towel
• Mess kit (plate, bowl, cup, utensils)
• Pocket knife (if trained)
• Matches or lighter in waterproof container
• Backpack or duffel bag
• Hat and sunglasses
• Personal medications
• Scout handbook`;

const DROP_OFF_LOCATIONS = [
  "Troop Meeting Place Parking Lot",
  "Scout Hall Parking Area",
  "Community Center Parking Lot",
  "Church Parking Lot (Main Entrance)",
];

const PICKUP_LOCATIONS = [
  "Lincoln Elementary School Parking Lot",
  "Washington Middle School Parking Lot",
  "Jefferson High School Parking Lot",
  "Roosevelt Elementary School Parking Lot",
];

const randomChoice = <T,>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomDateOfBirth = (minAge: number, maxAge: number): string => {
  const today = new Date();
  const age = randomInt(minAge, maxAge);
  const birthYear = today.getFullYear() - age;
  const birthMonth = randomInt(1, 12);
  const birthDay = randomInt(1, 28);
  return `${birthYear}-${String(birthMonth).padStart(2, "0")}-${String(
    birthDay
  ).padStart(2, "0")}`;
};

const DevDataSeeder: React.FC = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  const [seedError, setSeedError] = useState<string | null>(null);

  const createOuting = async (
    name: string,
    location: string,
    daysFromNow: number,
    isOvernight: boolean,
    capacityType: "fixed" | "vehicle",
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

    const formatDate = (date: Date) => date.toISOString().split("T")[0];

    // Generate drop-off time around 5:30pm (17:30) with some variation
    const dropOffHour = 17;
    const dropOffMinute = randomChoice([15, 30, 45]);
    const dropOffTime = `${String(dropOffHour).padStart(2, "0")}:${String(
      dropOffMinute
    ).padStart(2, "0")}:00`;

    // Generate pickup time around 11am with some variation
    const pickupHour = 11;
    const pickupMinute = randomChoice([0, 15, 30]);
    const pickupTime = `${String(pickupHour).padStart(2, "0")}:${String(
      pickupMinute
    ).padStart(2, "0")}:00`;

    // Generate cost between $20-$60
    const cost = randomInt(20, 60);

    const outingData: any = {
      name,
      outing_date: formatDate(outingDate),
      location,
      description: randomChoice(TRIP_DESCRIPTIONS),
      max_participants: maxParticipants,
      capacity_type: capacityType,
      is_overnight: isOvernight,
      icon: icon,
      outing_lead_name: `${randomChoice(FIRST_NAMES_MALE)} ${randomChoice(
        LAST_NAMES
      )}`,
      outing_lead_email: `leader${randomInt(1, 100)}@example.com`,
      outing_lead_phone: `555-${randomInt(100, 999)}-${randomInt(1000, 9999)}`,
      drop_off_time: dropOffTime,
      drop_off_location: randomChoice(DROP_OFF_LOCATIONS),
      pickup_time: pickupTime,
      pickup_location: randomChoice(PICKUP_LOCATIONS),
      cost: cost,
      gear_list: CAMPING_GEAR_LIST,
    };

    // Only include end_date if it's an overnight outing
    if (endDate) {
      outingData.end_date = formatDate(endDate);
    }

    console.log("🌱 Seeding outing with logistics:", {
      name,
      drop_off_time: dropOffTime,
      drop_off_location: outingData.drop_off_location,
      pickup_time: pickupTime,
      pickup_location: outingData.pickup_location,
      cost,
      gear_list_length: CAMPING_GEAR_LIST.length,
    });

    return await outingAPI.create(outingData);
  };

  const handleSeedData = async () => {
    if (
      !window.confirm(
        "This will create sample troops, scouts, and outings with requirements/merit badges. This may take a minute. Continue?"
      )
    ) {
      return;
    }

    setIsSeeding(true);
    setProgress("");
    setSeedMessage(null);
    setSeedError(null);

    let troopsCreated = 0;
    let patrolsCreated = 0;
    let scoutsCreated = 0;
    let outingsCreated = 0;
    let requirementsAdded = 0;
    let meritBadgesAdded = 0;

    try {
      // STEP 1: Create troops with patrols
      setProgress("Step 1/3: Creating troops with patrols...");
      const createdTroops = [];

      for (const config of TROOP_CONFIGS) {
        try {
          const troop = await troopAPI.create({
            number: config.number,
            charter_org: config.charterOrg,
            meeting_location: config.meetingLocation,
            meeting_day: config.meetingDay,
            notes: `Sample troop ${config.number} for development testing`,
          });
          troopsCreated++;
          createdTroops.push(troop);
          setProgress(
            `Step 1/3: Created ${troopsCreated}/${TROOP_CONFIGS.length} troops...`
          );

          // Create 3-4 patrols for each troop
          const numPatrols = Math.floor(Math.random() * 2) + 3;
          const usedPatrolNames = new Set<string>();

          for (let i = 0; i < numPatrols; i++) {
            let patrolName: string;
            do {
              patrolName = randomChoice(PATROL_NAMES);
            } while (usedPatrolNames.has(patrolName));
            usedPatrolNames.add(patrolName);

            await patrolAPI.create({
              troop_id: troop.id,
              name: patrolName,
            });
            patrolsCreated++;
          }

          setProgress(
            `Step 1/3: Created ${troopsCreated} troops with ${patrolsCreated} patrols...`
          );
        } catch (error) {
          console.error(`Error creating troop ${config.number}:`, error);
        }
      }

      // STEP 2: Create scouts and assign to patrols
      setProgress("Step 2/3: Creating scouts and assigning to patrols...");

      // Fetch all troops with patrols to get updated data
      const allTroops = await troopAPI.getAll();
      const allPatrols: Array<{ troopNumber: string; patrolName: string }> = [];

      for (const troop of allTroops) {
        if (troop.patrols && troop.patrols.length > 0) {
          for (const patrol of troop.patrols) {
            allPatrols.push({
              troopNumber: troop.number,
              patrolName: patrol.name,
            });
          }
        }
      }

      const targetScouts = 25;
      for (let i = 0; i < targetScouts; i++) {
        try {
          const isMale = Math.random() > 0.3;
          const scoutFirst = randomChoice(
            isMale ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE
          );
          const scoutLast = randomChoice(LAST_NAMES);
          const scoutName = `${scoutFirst} ${scoutLast}`;
          const patrol = randomChoice(allPatrols);

          await familyAPI.create({
            name: scoutName,
            member_type: "scout",
            date_of_birth: randomDateOfBirth(11, 17),
            troop_number: patrol.troopNumber,
            patrol_name: patrol.patrolName,
            has_youth_protection: false,
            vehicle_capacity: 0,
            medical_notes: randomChoice(MEDICAL_NOTES) || undefined,
            dietary_preferences:
              Math.random() < 0.25 ? [randomChoice(DIETARY_PREFERENCES)] : [],
            allergies: Math.random() < 0.15 ? [randomChoice(ALLERGIES)] : [],
          });

          scoutsCreated++;
          setProgress(
            `Step 2/3: Created ${scoutsCreated}/${targetScouts} scouts...`
          );
        } catch (error) {
          console.error(`Error creating scout ${i + 1}:`, error);
        }
      }

      // STEP 3: Create outings with suggested requirements
      setProgress("Step 3/3: Creating outings with requirements...");
      const outingConfigs: [
        string,
        string,
        number,
        boolean,
        "fixed" | "vehicle",
        number,
        string
      ][] = [
        [TRIP_NAMES[0], LOCATIONS[0], 7, true, "fixed", 25, "Camping"],
        [TRIP_NAMES[1], LOCATIONS[1], 14, false, "fixed", 30, "Hiking"],
        [TRIP_NAMES[2], LOCATIONS[2], 21, false, "vehicle", 40, "Canoeing"],
        [TRIP_NAMES[3], LOCATIONS[3], 28, false, "fixed", 20, "Rock Climbing"],
        [TRIP_NAMES[4], LOCATIONS[4], 35, true, "vehicle", 35, "Backpacking"],
        [
          TRIP_NAMES[5],
          LOCATIONS[5],
          45,
          false,
          "fixed",
          25,
          "Service Project",
        ],
        [TRIP_NAMES[6], LOCATIONS[6], 60, false, "fixed", 30, "Fishing"],
        [TRIP_NAMES[7], LOCATIONS[7], 75, true, "vehicle", 20, "Camping"],
        [TRIP_NAMES[8], LOCATIONS[8], 90, false, "vehicle", 35, "Canoeing"],
        [TRIP_NAMES[9], LOCATIONS[9], 105, false, "fixed", 40, "Navigation"],
      ];

      for (const [
        name,
        location,
        days,
        overnight,
        capType,
        maxPart,
        icon,
      ] of outingConfigs) {
        try {
          const outing = await createOuting(
            name,
            location,
            days,
            overnight,
            capType,
            maxPart,
            icon
          );
          outingsCreated++;
          setProgress(
            `Step 3/3: Created ${outingsCreated}/${outingConfigs.length} outings...`
          );

          // Get suggestions and add to outing
          try {
            const suggestions = await requirementsAPI.getSuggestions(
              outing.id,
              0.1,
              5,
              5
            );
            console.log(`Suggestions for outing '${name}':`, suggestions);

            // Add top 3 rank requirements
            const topRequirements = suggestions.requirements.slice(0, 3);
            for (const req of topRequirements) {
              try {
                await requirementsAPI.addRequirementToOuting(outing.id, {
                  rank_requirement_id: req.id,
                  notes: `Matched keywords: ${req.matched_keywords.join(", ")}`,
                });
                requirementsAdded++;
              } catch (error) {
                console.error(
                  `Error adding requirement to outing '${name}' (requirement id: ${req.id}):`,
                  error,
                  req
                );
              }
            }

            // Add top 2 merit badges
            const topBadges = suggestions.merit_badges.slice(0, 2);
            for (const badge of topBadges) {
              try {
                await requirementsAPI.addMeritBadgeToOuting(outing.id, {
                  merit_badge_id: badge.id,
                  notes: `Matched keywords: ${badge.matched_keywords.join(
                    ", "
                  )}`,
                });
                meritBadgesAdded++;
              } catch (error) {
                console.error(
                  `Error adding merit badge to outing '${name}' (badge id: ${badge.id}):`,
                  error,
                  badge
                );
              }
            }
          } catch (error) {
            console.error(
              `Error getting suggestions for outing '${name}':`,
              error
            );
          }
        } catch (error) {
          console.error(`Error creating outing '${name}':`, error);
        }
      }

      setSeedMessage(
        `✅ Successfully seeded database!\n\n` +
          `Step 1 - Troops & Patrols:\n` +
          `• Troops created: ${troopsCreated}\n` +
          `• Patrols created: ${patrolsCreated}\n\n` +
          `Step 2 - Scouts:\n` +
          `• Scouts created: ${scoutsCreated}\n\n` +
          `Step 3 - Outings & Requirements:\n` +
          `• Outings created: ${outingsCreated}\n` +
          `• Rank requirements added: ${requirementsAdded}\n` +
          `• Merit badges added: ${meritBadgesAdded}`
      );
    } catch (error) {
      console.error("Error seeding data:", error);
      setSeedError(
        error instanceof Error ? error.message : "Failed to seed data"
      );
    } finally {
      setIsSeeding(false);
      setProgress("");
    }
  };

  return (
    <div
      style={{
        marginBottom: "2rem",
        padding: "1.5rem",
        backgroundColor: "var(--bg-tertiary)",
        border: "1px solid var(--card-border)",
        borderRadius: "0.5rem",
        boxShadow: "var(--card-shadow)",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: "bold",
              color: "var(--text-primary)",
              marginBottom: "0.5rem",
              marginTop: 0,
            }}
          >
            🌱 Development Data Seeding
          </h3>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
            Quickly populate the database with complete test data. This will
            create troops with patrols, scouts assigned to those patrols, and
            outings with automatically matched rank requirements and merit
            badges. The page will automatically refresh when complete so you can
            see the results.
          </p>
          {progress && (
            <div
              style={{
                marginBottom: "1rem",
                padding: "1rem",
                backgroundColor: "var(--alert-info-bg)",
                border: "1px solid var(--alert-info-border)",
                color: "var(--alert-info-text)",
                borderRadius: "0.25rem",
                fontSize: "0.875rem",
              }}
            >
              {progress}
            </div>
          )}
          {seedMessage && (
            <div
              style={{
                marginBottom: "1rem",
                padding: "1rem",
                backgroundColor: "var(--alert-success-bg)",
                border: "1px solid var(--alert-success-border)",
                color: "var(--alert-success-text)",
                borderRadius: "0.25rem",
                whiteSpace: "pre-line",
                fontSize: "0.875rem",
              }}
            >
              {seedMessage}
            </div>
          )}
          {seedError && (
            <div
              style={{
                marginBottom: "1rem",
                padding: "1rem",
                backgroundColor: "var(--alert-error-bg)",
                border: "1px solid var(--alert-error-border)",
                color: "var(--alert-error-text)",
                borderRadius: "0.25rem",
                fontSize: "0.875rem",
              }}
            >
              {seedError}
            </div>
          )}
        </div>
        <button
          onClick={handleSeedData}
          disabled={isSeeding}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "0.5rem",
            fontWeight: "bold",
            color: isSeeding
              ? "var(--btn-disabled-text)"
              : "var(--btn-primary-text)",
            backgroundColor: isSeeding
              ? "var(--btn-disabled-bg)"
              : "var(--btn-primary-bg)",
            border: "none",
            cursor: isSeeding ? "not-allowed" : "pointer",
            transition: "background-color 0.2s",
            whiteSpace: "nowrap",
            alignSelf: "center",
          }}
          onMouseOver={(e) => {
            if (!isSeeding)
              e.currentTarget.style.backgroundColor =
                "var(--btn-primary-hover)";
          }}
          onMouseOut={(e) => {
            if (!isSeeding)
              e.currentTarget.style.backgroundColor = "var(--btn-primary-bg)";
          }}
        >
          {isSeeding ? "⏳ Seeding..." : "🌱 Seed Data"}
        </button>
      </div>
    </div>
  );
};

export default DevDataSeeder;
