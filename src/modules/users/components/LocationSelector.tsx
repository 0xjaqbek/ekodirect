// src/modules/users/components/LocationSelector.tsx
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useGeolocation } from '../../../shared/hooks';
import classNames from 'classnames';
import { icon } from 'leaflet';

// Poprawka dla domyślnych ikon Leaflet
const defaultIcon = icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface LocationSelectorProps {
  initialCoordinates?: [number, number];
  initialAddress?: string;
  onLocationSelected: (coordinates: [number, number], address: string) => void;
  error?: string;
  className?: string;
}

// Komponent do interakcji z mapą
const MapSelector = ({ 
  onLocationSelected 
}: { 
  onLocationSelected: (coordinates: [number, number]) => void 
}) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelected([lng, lat]);
    }
  });
  return null;
};

const LocationSelector: React.FC<LocationSelectorProps> = ({
  initialCoordinates = [21.0118, 52.2298], // Warszawa
  initialAddress = '',
  onLocationSelected,
  error,
  className = ''
}) => {
  const [coordinates, setCoordinates] = useState<[number, number]>(initialCoordinates);
  const [address, setAddress] = useState(initialAddress);
  const [mapCenter, setMapCenter] = useState<[number, number]>([initialCoordinates[1], initialCoordinates[0]]);
  const { location, getLocation, loading } = useGeolocation();
  const [fetchingAddress, setFetchingAddress] = useState(false);

  // Efekt dla inicjalizacji
  useEffect(() => {
    if (initialCoordinates && initialCoordinates[0] !== 0 && initialCoordinates[1] !== 0) {
      setCoordinates(initialCoordinates);
      setMapCenter([initialCoordinates[1], initialCoordinates[0]]);
    }
    if (initialAddress) {
      setAddress(initialAddress);
    }
  }, [initialCoordinates, initialAddress]);

  // Pobierz adres na podstawie współrzędnych
  const fetchAddress = async (coords: [number, number]) => {
    setFetchingAddress(true);
    try {
      // Pobierz adres przez Nominatim API (OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[1]}&lon=${coords[0]}`
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        setAddress(data.display_name);
        onLocationSelected(coords, data.display_name);
      }
    } catch (error) {
      console.error('Błąd podczas pobierania adresu', error);
    } finally {
      setFetchingAddress(false);
    }
  };

  // Obsługa wykrycia lokalizacji
  const handleDetectLocation = () => {
    getLocation();
  };

  // Zaktualizuj stan po wykryciu lokalizacji
  useEffect(() => {
    if (location && !location.error && location.latitude && location.longitude) {
      const newCoords: [number, number] = [location.longitude, location.latitude];
      setCoordinates(newCoords);
      setMapCenter([location.latitude, location.longitude]);
      fetchAddress(newCoords);
    }
  }, [location]);

  // Obsługa wyboru lokalizacji na mapie
  const handleLocationSelect = (newCoords: [number, number]) => {
    setCoordinates(newCoords);
    fetchAddress(newCoords);
  };

  // Obsługa zmiany adresu ręcznie
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
    onLocationSelected(coordinates, e.target.value);
  };

  return (
    <div className={classNames("space-y-4", className)}>
      <div className="flex flex-col space-y-2">
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Adres
        </label>
        <input
          id="address"
          type="text"
          value={address}
          onChange={handleAddressChange}
          disabled={fetchingAddress}
          className={classNames(
            "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary",
            error ? "border-red-300" : "border-gray-300",
            (fetchingAddress || loading) ? "bg-gray-100" : ""
          )}
          placeholder="Wprowadź adres"
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>

      <div className="h-64 w-full rounded-md overflow-hidden border border-gray-300">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker 
            position={[coordinates[1], coordinates[0]]} 
            icon={defaultIcon} 
          />
          <MapSelector onLocationSelected={handleLocationSelect} />
        </MapContainer>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={handleDetectLocation}
          disabled={loading}
          className={classNames(
            "px-4 py-2 border border-primary rounded-md text-primary hover:bg-primary-light/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
            loading ? "opacity-50 cursor-not-allowed" : ""
          )}
        >
          {loading ? "Wykrywanie..." : "Wykryj moją lokalizację"}
        </button>
        <div className="text-sm text-gray-500">
          Kliknij na mapie, aby wybrać lokalizację
        </div>
      </div>
    </div>
  );
};

export default LocationSelector;