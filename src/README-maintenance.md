# Car Maintenance Database System

## Data Flow

Here's how maintenance data is stored in the database:

1. **User Input**: User fills out the MaintenanceForm with:
   - Maintenance type (typ)
   - Description (popis)
   - Completion date (datumProvedeni)
   - Next scheduled date (datumPristi) - optional
   - Vehicle mileage (najezdKm)
   - Total cost (nakladyCelkem)
   - Completion status (provedeno)
   - Documents link (dokumenty) - optional
   - Notes (poznamka) - optional

2. **Form Validation**: The form uses Zod schema validation to ensure all data is valid.

3. **API Request**: Data is sent to `/api/auta/[id]/udrzba` endpoint with:
   ```typescript
   fetch(`/api/auta/${autoId}/udrzba`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(formData)
   })
   ```

4. **Database Storage**: The API endpoint processes the request and stores it in the Prisma `Udrzba` model:
   ```typescript
   prisma.udrzba.create({
     data: {
       autoId,
       typ,
       popis,
       datumProvedeni: new Date(datumProvedeni),
       datumPristi: datumPristi ? new Date(datumPristi) : null,
       najezdKm,
       nakladyCelkem,
       provedeno,
       dokumenty,
       poznamka
     }
   })
   ```

5. **Response**: The created record is returned to the client.

## Database Schema

The maintenance data is stored in the `Udrzba` table with the following structure:

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

## Troubleshooting

If maintenance records aren't being stored correctly:

1. Check the browser console for error messages
2. Verify the API response status (should be 201 if successful)
3. Make sure all required fields are provided (typ, popis, datumProvedeni, nakladyCelkem)
4. Check database connection in the `.env` file 