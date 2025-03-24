import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const spz = url.searchParams.get("spz");
  const excludeId = url.searchParams.get("excludeId");
  
  if (!spz) {
    return NextResponse.json({ exists: false });
  }

  try {
    const whereClause: any = { spz };
    
    // If we're excluding an ID (for updates), add it to the where clause
    if (excludeId) {
      whereClause.id = { not: excludeId };
    }

    const existingAuto = await prisma.auto.findFirst({
      where: whereClause,
    });

    return NextResponse.json({ exists: !!existingAuto });
  } catch (error) {
    console.error("Error checking SPZ:", error);
    return NextResponse.json({ exists: false });
  }
} 