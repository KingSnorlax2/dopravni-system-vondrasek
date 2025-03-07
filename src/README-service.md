# Car Service & Repair Records System

## Data Flow

Here's how service and repair data is stored in the database:

1. **User Input**: User fills out the ServiceForm with:
   - Service date (datumOpravy)
   - Service type (typOpravy)
   - Description (popis)
   - Status (stav)
   - Cost (cena)
   - Mileage (najezdKm) - Used to update the car's mileage
   - Service provider (servis) - optional
   - Notes (poznamka) - optional

2. **Form Validation**: The form uses Zod schema validation to ensure all data is valid.

3. **API Request**: Data is sent to `/api/auta/[id]/opravy` endpoint with:
   ```typescript
   fetch(`/api/auta/${autoId}/opravy`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(formData)
   })
   ```

4. **Database Storage**: The API endpoint processes the request and stores it in the Prisma `Oprava` model:
   ```typescript
   // Create the repair record
   const oprava = await prisma.oprava.create({
     data: {
       autoId,
       datumOpravy: new Date(datumOpravy),
       popis,
       cena: parseFloat(cena.toString()),
       typOpravy,
       stav,
       servis,
       poznamka
     }
   });

   // Also update the car's mileage if a new value was provided
   if (najezdKm && najezdKm > car.najezd) {
     await prisma.auto.update({
       where: { id: autoId },
       data: { najezd: najezdKm }
     });
   }
   ```

5. **Response**: The created record is returned to the client.

## Database Schema

The service/repair data is stored in the `Oprava` table with the following structure:

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
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

**Note**: Unlike the `Udrzba` model, the `Oprava` model doesn't store the mileage directly. Instead, when a service record is created with a mileage value, the system updates the car's mileage in the `Auto` model if the provided mileage is higher than the current value.

## UI Implementation

The service records are displayed in a timeline format on the car detail page, with:
- Service type and date as the title
- Status badge showing completion status
- Cost, mileage, and service provider information
- Full description of the work performed
- Optional notes section

When there are no service records, an empty state is shown with a button to add the first record.

## Adding Service Records

Service records can be added in two ways:
1. From the car detail page by clicking the "Přidat opravu" button
2. From the empty state by clicking "Přidat první záznam"
3. From the dedicated service page at `/dashboard/auta/servis/[id]`

## Troubleshooting

If service records aren't being stored correctly:

1. Check the browser console for error messages
2. Verify the API response status (should be 201 if successful)
3. Make sure all required fields are provided (datumOpravy, typOpravy, popis, stav, cena)
4. Check database connection in the `.env` file 