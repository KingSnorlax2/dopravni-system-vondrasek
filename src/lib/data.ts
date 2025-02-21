import { prisma } from "@/lib/prisma"

export async function fetchAutoById(id: string) {
  const auto = await prisma.auto.findUnique({
    where: { id: parseInt(id) },
    include: {
      fotky: true,
      poznatky: true,
    },
  })
  
  return auto
} 