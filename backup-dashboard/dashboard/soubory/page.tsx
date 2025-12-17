'use client'

import React, { useEffect, useState } from 'react';

interface FileDetail {
  name: string;
  isDirectory: boolean;
}

export default function SouboryPage() {
  const [files, setFiles] = useState<FileDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch('/api/soubory');
        if (!response.ok) {
          throw new Error('Chyba při načítání souborů');
        }
        const data = await response.json();
        setFiles(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Nastala chyba');
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  if (loading) {
    return <div>Načítání souborů...</div>;
  }

  if (error) {
    return <div className="text-red-500">Chyba: {error}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Seznam souborů a složek</h1>
      <ul>
        {files.map(file => (
          <li key={file.name}>
            {file.isDirectory ? '📁' : '📄'} {file.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
