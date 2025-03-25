import type { Metadata } from 'next';
import { Newspaper } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';

export const metadata: Metadata = {
  title: 'Distribuce novin | Vozový park',
  description: 'Správa a monitorování distribuce novin a časopisů',
};

export default function NewspaperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="min-h-screen bg-gray-50">
          <div className="py-2 px-4 bg-blue-600 text-white flex items-center">
            <Newspaper className="h-4 w-4 mr-2" />
            <span className="font-medium">Noční distribuce novin</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
} 