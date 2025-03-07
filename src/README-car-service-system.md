# Comprehensive Car Service & Maintenance System

This document explains how the complete car service and maintenance system works, including both the repair/service records and scheduled maintenance features.

## Overview

The system provides two main types of records:

1. **Service & Repair Records** - For tracking repairs, service visits, and other completed work
2. **Maintenance Records** - For tracking and scheduling regular maintenance tasks

## Data Storage

### Service & Repair Records

Service and repair data is stored in the `Oprava` table with the following structure:

```prisma
model Oprava {
  id          Int       @id @default(autoincrement())
  autoId      Int
  auto        Auto      @relation("AutoOpravy", fields: [autoId], references: [id], onDelete: Cascade)
  datumOpravy DateTime
  popis       String
  cena        Float
  typOpravy   String   
  stav        String    // "dokončeno", "probíhá", "plánováno", "zrušeno"
  servis      String?
  poznamka    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Maintenance Records

Maintenance data is stored in the `Udrzba` table with the following structure:

```prisma
model Udrzba {
  id              Int       @id @default(autoincrement())
  autoId          Int
  auto            Auto      @relation("AutoUdrzba", fields: [autoId], references: [id], onDelete: Cascade)
  typ             String    // e.g., "servis", "STK", "výměna oleje"
  popis           String
  datumProvedeni  DateTime
  datumPristi     DateTime?
  najezdKm        Int
  nakladyCelkem   Float
  provedeno       Boolean   @default(false)
  dokumenty       String?   // URL or path to documents
  poznamka        String?
}
```

## Key Differences

|                    | Service/Repair Records                      | Maintenance Records                         |
|--------------------|---------------------------------------------|---------------------------------------------|
| **Purpose**        | Track completed or in-progress work         | Schedule and track regular maintenance      |
| **Future Planning**| Status-based ("planned", "in progress")     | Has dedicated "next date" field             |
| **Mileage Tracking**| Updates car's mileage field                | Stores mileage locally in record            |
| **Completion Status**| Text-based status field                   | Boolean "completed" field                   |
| **Documentation**  | Not directly supported                      | Has field for document links                |

## Mileage Handling

- **Service Records**: When adding a service record, if a mileage value is provided that's higher than the car's current mileage, the system will update the car's mileage in the `Auto` model.
- **Maintenance Records**: The mileage at the time of maintenance is stored directly in the `Udrzba` record itself.

This approach means that service records help keep the overall vehicle mileage up to date, while maintenance records preserve the historical mileage at which maintenance was performed.

## API Endpoints

### Service/Repair Endpoints

- `GET /api/auta/[id]/opravy` - Get all repair records for a car
- `POST /api/auta/[id]/opravy` - Create a new repair record

### Maintenance Endpoints

- `GET /api/auta/[id]/udrzba` - Get all maintenance records for a car
- `POST /api/auta/[id]/udrzba` - Create a new maintenance record

## User Interface

The system provides multiple ways to add records:

1. **From Car Detail Page** - Direct buttons to add service or maintenance records
2. **From Empty States** - "Add first record" buttons when no records exist
3. **From Service Page** - Dedicated page with tabs for service or maintenance

### Car Detail Page

The car detail page shows:
- Overview tab with upcoming maintenance and recent repairs
- Service tab with a timeline of all repair/service records
- Maintenance tab with completed and planned maintenance records

### Service Page

The dedicated service page allows users to:
- Choose between adding repair/service or maintenance records
- Fill out detailed forms with all necessary information
- Submit new records directly to the database

## Common Use Cases

1. **Recording a Completed Repair**:
   - Use the Service tab
   - Set status to "completed"
   - Enter costs, mileage and other details
   - The car's mileage will be automatically updated if higher than current value

2. **Scheduling Future Maintenance**:
   - Use the Maintenance tab
   - Set the "next date" field
   - Mark as "not completed"

3. **Updating Car Mileage**:
   - Enter the current mileage when adding a service record
   - The system will automatically update the car's mileage if higher than current value

## Troubleshooting

If you encounter issues with the system:

1. Check browser console for error messages
2. Verify API responses (should return 201 on successful creation)
3. Check database connection in .env file
4. Make sure all required fields are completed in forms 