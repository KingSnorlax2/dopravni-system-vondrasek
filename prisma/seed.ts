import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Add some sample data
  const auto = await prisma.auto.create({
    data: {
      spz: 'ABC1234',
      znacka: 'Škoda',
      model: 'Octavia',
      rokVyroby: 2020,
      stav: 'dobrý', // Added required 'stav' field
      najezd: 50000,
    },
  })

  await prisma.transakce.create({
    data: {
      nazev: 'Test Transaction',
      castka: 1000,
      datum: new Date(),
      typ: 'příjem',
      popis: 'Test description',
      // Remove 'kategorie' as it doesn't exist in the TransakceCreateInput type
      autoId: auto.id,
    },
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 