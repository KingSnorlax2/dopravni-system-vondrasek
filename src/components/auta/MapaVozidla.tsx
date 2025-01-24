import React from 'react';

interface MapaVozidlaProps {
  autoId?: number;
  center?: { lat: number; lng: number };
  latitude?: number;
  longitude?: number;
}

export const MapaVozidla: React.FC<MapaVozidlaProps> = ({ 
  autoId, 
  center, 
  latitude, 
  longitude 
}) => {
  const displayLat = center?.lat ?? latitude;
  const displayLng = center?.lng ?? longitude;

  return (
    <div>
      <h2>Mapa Vozidla</h2>
      {displayLat !== undefined && displayLng !== undefined ? (
        <>
          <p>Latitude: {displayLat}</p>
          <p>Longitude: {displayLng}</p>
        </>
      ) : (
        <p>Souřadnice nejsou k dispozici</p>
      )}
    </div>
  );
};