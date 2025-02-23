// import { NextResponse } from 'next/server'
// import { prisma } from '@/lib/prisma'
// import { writeFile, mkdir } from "fs/promises"
// import { join } from "path"
// import { existsSync } from "fs"

// export async function GET(
//   request: Request,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const fotka = await prisma.fotka.findUnique({
//       where: { id: params.id }
//     })

//     if (!fotka) {
//       return NextResponse.json({ error: 'Fotka nenalezena' }, { status: 404 })
//     }

//     // Převedení Base64 zpět na buffer
//     const buffer = Buffer.from(fotka.data, 'base64')

//     return new NextResponse(buffer, {
//       headers: {
//         'Content-Type': fotka.mimeType,
//         'Cache-Control': 'public, max-age=31536000',
//       },
//     })
//   } catch (error) {
//     console.error('Chyba při načítání fotky:', error)
//     return NextResponse.json({ error: 'Chyba při načítání fotky' }, { status: 500 })
//   }
// }

// export async function POST(
//   request: Request,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const formData = await request.formData()
//     const file = formData.get("file") as File
    
//     if (!file) {
//       return NextResponse.json(
//         { error: "No file provided" },
//         { status: 400 }
//       )
//     }

//     // Ensure uploads directory exists
//     const uploadDir = join(process.cwd(), "public", "uploads")
//     if (!existsSync(uploadDir)) {
//       await mkdir(uploadDir, { recursive: true })
//     }

//     const bytes = await file.arrayBuffer()
//     const buffer = Buffer.from(bytes)
    
//     // Create unique filename
//     const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
//     const extension = file.name.split('.').pop()
//     const fileName = `${uniqueSuffix}.${extension}`
//     const path = join(uploadDir, fileName)
    
//     // Save file
//     await writeFile(path, buffer)
    
//     // Save to database with string ID
//     const photo = await prisma.fotka.create({
//       data: {
//         url: `/uploads/${fileName}`,
//         autoId: params.id // Now this matches the string type
//       }
//     })

//     return NextResponse.json(photo)
//   } catch (error) {
//     console.error("Upload error:", error)
//     return NextResponse.json(
//       { error: "Upload failed" },
//       { status: 500 }
//     )
//   }
// }