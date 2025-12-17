'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeGeneratorProps {
  auto: {
    id: number;
    spz: string;
    znacka: string;
    model: string;
  };
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ auto }) => {
  const [autoUrl, setAutoUrl] = useState<string>('');

  useEffect(() => {
    const baseUrl = window.location.origin;
    setAutoUrl(`${baseUrl}/dashboard/auta/${auto.id}`);
  }, [auto.id]);

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            .print-qr-container {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
              page-break-inside: avoid;
            }
            .print-spz-label {
              display: block !important;
              font-size: 18px;
              font-weight: bold;
              text-align: center;
              margin-top: 10px;
            }
            .screen-only {
              display: none !important;
            }
          }
          .print-spz-label {
            display: none;
          }
        `
      }} />
      <div className="bg-white shadow-md rounded-lg p-6 print-qr-container">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 screen-only">QR kód vozidla</h2>
        <div className="flex flex-col items-center">
          {autoUrl && (
            <QRCodeSVG
              value={autoUrl}
              size={200}
              level="H"
              includeMargin={true}
            />
          )}
          <div className="print-spz-label">
            {auto.spz}
          </div>
          <p className="mt-4 text-sm text-gray-600 screen-only">
            Naskenujte pro přístup k detailu vozidla
          </p>
          <p className="mt-2 text-xs text-gray-500 break-all text-center screen-only">
            {autoUrl}
          </p>
        </div>
      </div>
    </>
  );
};
