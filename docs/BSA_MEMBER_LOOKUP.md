# BSA Member ID Lookup Feature

## Overview

When adding family members, users can now look up members by their BSA Member ID to auto-fill basic information from the imported roster. This streamlines the process of adding scouts and adults who are already in your my.scouting.org roster.

## How It Works

### Backend

1. **Roster Import**: When you import a CSV roster from my.scouting.org, member data is stored in the `roster_members` table
2. **Lookup Endpoint**: `GET /api/roster/lookup/{bsa_member_id}` searches the roster and returns member details
3. **Data Returned**: Name, contact info, position, and YPT information (if applicable)

### Frontend

1. **Lookup Field**: When adding a new family member, a "BSA Member ID Lookup" field appears at the top of the form
2. **Auto-Fill**: Enter a BSA Member ID and click "Lookup" to pre-fill:
   - Full name (from roster)
   - YPT status and expiration (for adults)
   - Member type (inferred from position/YPT)
3. **Editable**: All pre-filled information can be edited
4. **Additional Details**: Users must still add:
   - Date of birth (not in roster export)
   - Dietary preferences
   - Allergies
   - Troop/patrol assignment
   - Medical notes
   - Vehicle capacity (for adults)

## User Flow

1. Go to Family Setup
2. Click "Add Family Member"
3. (Optional) Enter BSA Member ID and click "Lookup"
4. If found, name and YPT info auto-fill
5. Add remaining required information:
   - Date of birth
   - Troop/patrol assignment
   - Dietary preferences and allergies
6. Save

## Benefits

- **Faster Data Entry**: No need to retype names and basic info
- **Accuracy**: Reduces typos in names
- **YPT Tracking**: Auto-imports YPT expiration dates for adults
- **Flexible**: Works with or without roster import

## API Reference

### Lookup Member

```http
GET /api/roster/lookup/{bsa_member_id}
```

**Authentication**: Required (any authenticated user)

**Response**: 200 OK

```json
{
  "bsa_member_id": "12345678",
  "full_name": "John Smith",
  "first_name": "John",
  "middle_name": null,
  "last_name": "Smith",
  "suffix": null,
  "email": "john.smith@example.com",
  "mobile_phone": "555-1234",
  "city": "Anytown",
  "state": "VA",
  "zip_code": "12345",
  "position": "Adult Leader",
  "ypt_date": "2024-01-15",
  "ypt_expiration": "2026-01-15"
}
```

**Error**: 404 Not Found

```json
{
  "detail": "BSA member ID not found in roster"
}
```

## Database Schema

### roster_members Table

| Column         | Type           | Description         |
| -------------- | -------------- | ------------------- |
| bsa_member_id  | VARCHAR(50) PK | BSA Member ID       |
| full_name      | VARCHAR(255)   | Full name           |
| first_name     | VARCHAR(100)   | First name          |
| middle_name    | VARCHAR(100)   | Middle name         |
| last_name      | VARCHAR(100)   | Last name           |
| suffix         | VARCHAR(20)    | Name suffix         |
| email          | VARCHAR(255)   | Email address       |
| mobile_phone   | VARCHAR(50)    | Mobile phone        |
| city           | VARCHAR(100)   | City                |
| state          | VARCHAR(50)    | State               |
| zip_code       | VARCHAR(20)    | ZIP code            |
| position       | VARCHAR(100)   | Position/role       |
| ypt_date       | DATE           | YPT completion date |
| ypt_expiration | DATE           | YPT expiration date |
| created_at     | TIMESTAMP      | Record created      |
| updated_at     | TIMESTAMP      | Record updated      |

## Notes

- Roster must be imported first for lookup to work
- Lookup only pre-fills basic info; user must complete the form
- BSA Member IDs are unique per person across all units
- YPT information is automatically detected for adults
- The lookup is optional - users can still manually enter all information
