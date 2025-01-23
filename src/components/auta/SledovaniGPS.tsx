import { useState, useEffect } from 'react';
import { MapaVozidla } from './MapaVozidla';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

interface GPSZaznam {
  id: number;
  latitude: number;
  longitude: number;
  rychlost: number | null;
  cas: string;
  stav: string | null;
}

interface SledovaniGPSProps {
  autoId: number;
}

export const SledovaniGPS = ({ autoId }: SledovaniGPSProps) => {
  const [zaznamy, setZaznamy] = useState<GPSZaznam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const nactiGPSZaznamy = async () => {
    try {
      const response = await fetch(`/api/auta/${autoId}/gps`);
      if (!response.ok) throw new Error('Chyba při načítání GPS záznamů');
      const data = await response.json();
      setZaznamy(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neznámá chyba');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    nactiGPSZaznamy();
    const interval = setInterval(nactiGPSZaznamy, 30000); // Aktualizace každých 30 sekund
    return () => clearInterval(interval);
  }, [autoId]);

  if (loading) return <div>Načítání...</div>;
  if (error) return <div>Chyba: {error}</div>;

  const posledniZaznam = zaznamy[0];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Sledování GPS</h2>

      {posledniZaznam && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-500">Poslední aktualizace</h3>
            <p className="text-lg font-semibold">
              {format(new Date(posledniZaznam.cas), 'PPp', { locale: cs })}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-500">Aktuální rychlost</h3>
            <p className="text-lg font-semibold">
              {posledniZaznam.rychlost ? `${Math.round(posledniZaznam.rychlost)} km/h` : 'N/A'}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-500">Stav</h3>
            <p className="text-lg font-semibold">
              {posledniZaznam.stav || 'N/A'}
            </p>
          </div>
        </div>
      )}

      <div className="h-[600px] rounded-lg overflow-hidden shadow-lg">
        <MapaVozidla
          autoId={autoId}
          center={posledniZaznam ? {
            lat: posledniZaznam.latitude,
            lng: posledniZaznam.longitude
          } : undefined}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Historie pohybu</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Čas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rychlost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stav
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Souřadnice
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {zaznamy.map((zaznam) => (
                <tr key={zaznam.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(zaznam.cas), 'PPp', { locale: cs })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {zaznam.rychlost ? `${Math.round(zaznam.rychlost)} km/h` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {zaznam.stav || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {zaznam.latitude.toFixed(6)}, {zaznam.longitude.toFixed(6)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};