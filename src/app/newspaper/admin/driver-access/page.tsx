import type { Metadata } from 'next';
import { Lock } from 'lucide-react';
import DriverLoginControl from '@/components/newspaper/DriverLoginControl';

export const metadata: Metadata = {
  title: 'Kontrola přístupu řidičů | Distribuce novin',
  description: 'Správa přístupu řidičů k přihlašovacímu systému',
};

export default function DriverAccessControlPage() {
  return (
    <div className="space-y-6">
      <div className="unified-section-header">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <Lock className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h1 className="unified-section-title">Kontrola přístupu řidičů</h1>
            <p className="unified-section-description">
              Spravujte přístup řidičů k přihlašovacímu systému distribuce novin
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <DriverLoginControl />
        
        {/* Additional security information */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="unified-card p-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Bezpečnostní funkce</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                Okamžité uzamčení přihlášení
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                Kontrola přístupu v reálném čase
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                Protokolování všech změn
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                Omezení pouze pro administrátory
              </li>
            </ul>
          </div>
          
          <div className="unified-card p-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Použití</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                Uzamčení při mimořádných událostech
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                Údržba systému
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                Bezpečnostní incidenty
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                Plánované odstávky
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
