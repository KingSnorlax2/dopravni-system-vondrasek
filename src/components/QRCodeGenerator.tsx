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
  const baseUrl = window.location.origin;
  const autoUrl = `${baseUrl}/dashboard/auta/${auto.id}`;

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">QR kód vozidla</h2>
      <div className="flex flex-col items-center">
        <QRCodeSVG
          value={autoUrl}
          size={200}
          level="H"
          includeMargin={true}
        />
        <p className="mt-4 text-sm text-gray-600">
          Naskenujte pro přístup k detailu vozidla
        </p>
        <p className="mt-2 text-xs text-gray-500 break-all text-center">
          {autoUrl}
        </p>
      </div>
    </div>
  );
};
