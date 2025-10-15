import type { Metadata } from 'next';
import { Newspaper } from 'lucide-react';
import UnifiedLayout from '@/components/layout/UnifiedLayout';

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
    <UnifiedLayout>
      <div className="unified-section-header">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Newspaper className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="unified-section-title">Distribuce novin</h1>
            <p className="unified-section-description">
              Správa a monitorování distribuce novin a časopisů
            </p>
          </div>
        </div>
      </div>
      {children}
    </UnifiedLayout>
  );
} 