// import { NextResponse } from 'next/server'
// import prisma from '@/lib/prisma'

// export const config = {
//   api: {
//     bodyParser: {
//       sizeLimit: '10mb'
//     }
//   }
// }

// export async function POST(request: Request) {
//   try {
//     const formData = await request.formData()
//     const file = formData.get('file') as File
//     const autoId = formData.get('autoId') as string | null

//     if (!file) {
//       return NextResponse.json(
//         { error: 'Soubor nebyl nahrán' },
//         { status: 400 }
//       )
//     }

//     const buffer = Buffer.from(await file.arrayBuffer())
//     const base64Data = buffer.toString('base64')

//     const fotka = await prisma.fotka.create({
//       data: {
//         data: base64Data,
//         mimeType: file.type,
//         autoId: autoId || undefined
//       }
//     })

//     return NextResponse.json({ 
//       success: true, 
//       id: fotka.id 
//     })
//   } catch (error) {
//     console.error('Chyba při nahrávání:', error)
//     return NextResponse.json(
//       { error: 'Chyba při nahrávání souboru' },
//       { status: 500 }
//     )
//   }
// }