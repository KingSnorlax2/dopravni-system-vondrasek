import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import cs from 'date-fns/locale/cs';

interface Udrzba {
  id: number;
  typ: string;
  popis: string;
  datumProvedeni: string;
  datumPristi: string | null;
  najezdKm: number;
  nakladyCelkem: number;
  provedeno: boolean;
  dokumenty?: string;
  poznamka?: string;
}

interface SpravaUdrzbyProps {
  autoId: number;
}

export const SpravaUdrzby = ({ autoId }: SpravaUdrzbyProps) => {
  const [udrzby, setUdrzby] = useState<Udrzba[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const nactiUdrzby = async () => {
    try {
      const response = await fetch(`/api/auta/${autoId}/udrzba`);
      if (!response.ok) throw new Error('Chyba při načítání údržby');
      const data = await response.json();
      setUdrzby(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neznámá chyba');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    nactiUdrzby();
  }, [autoId]);

  if (loading) return <div>Načítání...</div>;
  if (error) return <div>Chyba: {error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Správa údržby</h2>
      
      <div className="grid gap-4">
        {udrzby.map((udrzba) => (
          <div key={udrzba.id} className="border p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{udrzba.typ}</h3>
                <p className="text-sm text-gray-600">{udrzba.popis}</p>
              </div>
              <span className={`px-2 py-1 rounded text-sm ${
                udrzba.provedeno ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {udrzba.provedeno ? 'Provedeno' : 'Naplánováno'}
              </span>
            </div>
            
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Datum provedení:</span>
                <br />
                {format(new Date(udrzba.datumProvedeni), 'PPP', { locale: cs })}
              </div>
              {udrzba.datumPristi && (
                <div>
                  <span className="text-gray-500">Příští údržba:</span>
                  <br />
                  {format(new Date(udrzba.datumPristi), 'PPP', { locale: cs })}
                </div>
              )}
              <div>
                <span className="text-gray-500">Nájezd:</span>
                <br />
                {udrzba.najezdKm.toLocaleString()} km
              </div>
              <div>
                <span className="text-gray-500">Náklady:</span>
                <br />
                {udrzba.nakladyCelkem.toLocaleString()} Kč
              </div>
            </div>
            
            {udrzba.poznamka && (
              <div className="mt-2 text-sm text-gray-600">
                <span className="text-gray-500">Poznámka:</span>
                <br />
                {udrzba.poznamka}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};