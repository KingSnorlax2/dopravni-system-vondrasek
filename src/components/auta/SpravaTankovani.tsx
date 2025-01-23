import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface Tankovani {
  id: number;
  datum: string;
  mnozstviLitru: number;
  cenaZaLitr: number;
  celkovaCena: number;
  typPaliva: string;
  najezdKm: number;
  mistoTankovani?: string;
  plnaNadrz: boolean;
  poznamka?: string;
}

interface Statistiky {
  celkovaVzdalenost: number;
  celkovaSpotrebaLitru: number;
  prumernaSpotrebaNa100km: number;
}

interface SpravaTankovaniProps {
  autoId: number;
}

export const SpravaTankovani = ({ autoId }: SpravaTankovaniProps) => {
  const [tankovani, setTankovani] = useState<Tankovani[]>([]);
  const [statistiky, setStatistiky] = useState<Statistiky | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const nactiTankovani = async () => {
    try {
      const response = await fetch(`/api/auta/${autoId}/tankovani`);
      if (!response.ok) throw new Error('Chyba při načítání tankování');
      const data = await response.json();
      setTankovani(data.tankovani);
      setStatistiky(data.statistiky);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neznámá chyba');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    nactiTankovani();
  }, [autoId]);

  if (loading) return <div>Načítání...</div>;
  if (error) return <div>Chyba: {error}</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Správa tankování</h2>

      {statistiky && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-500">Celková vzdálenost</h3>
            <p className="text-2xl font-semibold">{Math.round(statistiky.celkovaVzdalenost).toLocaleString()} km</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-500">Celková spotřeba</h3>
            <p className="text-2xl font-semibold">{statistiky.celkovaSpotrebaLitru.toFixed(1)} l</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-500">Průměrná spotřeba</h3>
            <p className="text-2xl font-semibold">{statistiky.prumernaSpotrebaNa100km.toFixed(1)} l/100km</p>
          </div>
        </div>
      )}

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={tankovani.map(t => ({
              datum: format(new Date(t.datum), 'P', { locale: cs }),
              spotrebaNa100km: t.mnozstviLitru / (t.najezdKm / 100),
              cenaZaLitr: t.cenaZaLitr
            }))}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="datum" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="spotrebaNa100km"
              stroke="#8884d8"
              name="Spotřeba (l/100km)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cenaZaLitr"
              stroke="#82ca9d"
              name="Cena za litr (Kč)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-4">
        {tankovani.map((t) => (
          <div key={t.id} className="border p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">
                  {format(new Date(t.datum), 'PPP', { locale: cs })}
                </h3>
                <p className="text-sm text-gray-600">{t.typPaliva}</p>
              </div>
              <span className="text-lg font-semibold">
                {t.celkovaCena.toLocaleString()} Kč
              </span>
            </div>
            
            <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Množství:</span>
                <br />
                {t.mnozstviLitru.toFixed(2)} l
              </div>
              <div>
                <span className="text-gray-500">Cena za litr:</span>
                <br />
                {t.cenaZaLitr.toFixed(2)} Kč/l
              </div>
              <div>
                <span className="text-gray-500">Nájezd:</span>
                <br />
                {t.najezdKm.toLocaleString()} km
              </div>
            </div>
            
            {t.mistoTankovani && (
              <div className="mt-2 text-sm">
                <span className="text-gray-500">Místo tankování:</span>
                <br />
                {t.mistoTankovani}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};