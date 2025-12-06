import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  // Use public/uploads directory for file management
  // If you want to list project root files, use process.cwd() directly
  const directoryPath = path.join(process.cwd(), 'public', 'uploads');

  try {
    // Check if directory exists, if not, use project root
    if (!fs.existsSync(directoryPath)) {
      // Fallback to project root
      const rootPath = process.cwd();
      const files = fs.readdirSync(rootPath).filter(file => {
        // Filter out sensitive/system files
        return !file.startsWith('.') && 
               file !== 'node_modules' && 
               file !== '.next' &&
               file !== '.git';
      });
      
      const fileDetails = files.map(file => {
        const filePath = path.join(rootPath, file);
        try {
          const isDirectory = fs.statSync(filePath).isDirectory();
          return {
            name: file,
            isDirectory,
          };
        } catch {
          return {
            name: file,
            isDirectory: false,
          };
        }
      });

      return NextResponse.json(fileDetails);
    }

    // Read from public/uploads if it exists
    const files = fs.readdirSync(directoryPath);
    const fileDetails = files.map(file => {
      const filePath = path.join(directoryPath, file);
      try {
        const isDirectory = fs.statSync(filePath).isDirectory();
        return {
          name: file,
          isDirectory,
        };
      } catch {
        return {
          name: file,
          isDirectory: false,
        };
      }
    });

    return NextResponse.json(fileDetails);
  } catch (error) {
    console.error('Chyba při čtení složek:', error);
    return NextResponse.json({ 
      error: 'Nastala chyba při načítání souborů',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
