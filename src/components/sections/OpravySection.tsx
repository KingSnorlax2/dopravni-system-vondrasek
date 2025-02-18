'use client';

import { useState, useEffect } from 'react';
import { OpravaForm } from '@/components/forms/OpravaForm';
import { Oprava } from '@/types/oprava';

interface OpravySectionProps {
  autoId: number;
}

export function OpravySection({ autoId }: OpravySectionProps) {
  const [showOpravaForm, setShowOpravaForm] = useState(false);
  const [opravy, setOpravy] = useState<Oprava[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOpravy = async () => {
    try {
      const response = await fetch(`/api/auta/${autoId}/opravy`);
      if (!response.ok) throw new Error('Nepodařilo se načíst opravy');
      const data = await response.json();
      setOpravy(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nastala chyba při načítání oprav');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOpravy();
  }, [autoId]);

  const handleOpravaSuccess = (newOprava: Oprava) => {
    setOpravy(prev => [newOprava, ...prev]);
    setShowOpravaForm(false);
  };

  if (isLoading) {
    return <div className="mt-6 bg-white rounded-lg shadow p-6">Načítání oprav...</div>;
  }

  return (
    <div className="mt-6 bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Opravy a servis</h2>
        <button
          onClick={() => setShowOpravaForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Přidat opravu
        </button>
      </div>

      {error && (
        <div className="mb-4 text-red-600 text-sm">{error}</div>
      )}

      {showOpravaForm ? (
        <div className="mb-6">
          <OpravaForm
            autoId={autoId}
            onSuccess={handleOpravaSuccess}
            onCancel={() => setShowOpravaForm(false)}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {opravy.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Žádné opravy nebyly nalezeny</p>
          ) : (
            opravy.map((oprava) => (
              <div
                key={oprava.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{oprava.popis}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(oprava.datumOpravy).toLocaleDateString('cs-CZ')}
                    </p>
                    {oprava.servis && (
                      <p className="text-sm text-gray-600 mt-1">
                        Servis: {oprava.servis}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {oprava.cena.toLocaleString('cs-CZ')} Kč
                    </p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      oprava.stav === 'dokončená' ? 'bg-green-100 text-green-800' :
                      oprava.stav === 'probíhá' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {oprava.stav}
                    </span>
                  </div>
                </div>
                {oprava.poznamka && (
                  <p className="mt-2 text-sm text-gray-500">{oprava.poznamka}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
} 