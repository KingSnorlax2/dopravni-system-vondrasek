import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const directoryPath = path.join(process.cwd(), 'dopravni-system-vondrasek'); // Změňte na správnou cestu

  try {
    const files = fs.readdirSync(directoryPath);
    const fileDetails = files.map(file => {
      const filePath = path.join(directoryPath, file);
      const isDirectory = fs.statSync(filePath).isDirectory();
      return {
        name: file,
        isDirectory,
      };
    });

    return NextResponse.json(fileDetails);
  } catch (error) {
    console.error('Chyba při čtení složek:', error);
    return NextResponse.json({ error: 'Nastala chyba při načítání souborů' }, { status: 500 });
  }
}
