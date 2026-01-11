'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { PiMapPin, PiCrosshair, PiHouse, PiMagnifyingGlass, PiWarning } from 'react-icons/pi';

interface PropertyInput {
  address: string;
  coordinates: { lat: number; lng: number } | null;
  imageUrl?: string;
  imageMeta?: {
    imageWidthPx: number;
    imageHeightPx: number;
    centerLat: number;
    centerLng: number;
    zoom: number;
    metersPerPixel: number;
  };
}

interface PropertyEntryProps {
  onStartAnalysis: (input: PropertyInput) => void;
}

export default function PropertyEntry({ onStartAnalysis }: PropertyEntryProps) {
  const [inputMode, setInputMode] = useState<'address' | 'coordinates'>('address');
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: '', lng: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const geocoder = useRef<google.maps.Geocoder | null>(null);

  // Initialize Google Maps
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY;
    if (!apiKey) {
      setError('Google Maps API key not configured');
      return;
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geocoding']
    });

    loader.load().then(() => {
      autocompleteService.current = new google.maps.places.AutocompleteService();
      geocoder.current = new google.maps.Geocoder();
      // Create a temporary div for PlacesService
      const div = document.createElement('div');
      placesService.current = new google.maps.places.PlacesService(div);
      setMapsLoaded(true);
    }).catch(err => {
      console.error('Failed to load Google Maps:', err);
      setError('Failed to load Google Maps');
    });
  }, []);

  // Handle address autocomplete
  const handleAddressChange = useCallback((value: string) => {
    setAddress(value);
    setError(null);

    if (!autocompleteService.current || value.length < 3) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    autocompleteService.current.getPlacePredictions(
      {
        input: value,
        types: ['address']
      },
      (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results);
          setShowPredictions(true);
        } else {
          setPredictions([]);
          setShowPredictions(false);
        }
      }
    );
  }, []);

  // Select a prediction
  const selectPrediction = useCallback((prediction: google.maps.places.AutocompletePrediction) => {
    setAddress(prediction.description);
    setPredictions([]);
    setShowPredictions(false);
  }, []);

  // Validate coordinates
  const validateCoordinates = useCallback((lat: string, lng: string): boolean => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    return (
      !isNaN(latNum) &&
      !isNaN(lngNum) &&
      latNum >= -90 &&
      latNum <= 90 &&
      lngNum >= -180 &&
      lngNum <= 180
    );
  }, []);

  // Calculate meters per pixel for Web Mercator
  const calculateMetersPerPixel = (lat: number, zoom: number): number => {
    const latRad = (lat * Math.PI) / 180;
    return (156543.03392 * Math.cos(latRad)) / Math.pow(2, zoom);
  };

  // Handle form submission
  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);

    try {
      let finalCoords: { lat: number; lng: number } | null = null;
      let finalAddress = '';

      if (inputMode === 'address') {
        if (!address.trim()) {
          throw new Error('Please enter an address');
        }

        // Geocode the address
        if (!geocoder.current) {
          throw new Error('Geocoder not initialized');
        }

        const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
          geocoder.current!.geocode({ address }, (results, status) => {
            if (status === google.maps.GeocoderStatus.OK && results) {
              resolve(results);
            } else {
              reject(new Error('Could not find this address'));
            }
          });
        });

        const location = result[0].geometry.location;
        finalCoords = { lat: location.lat(), lng: location.lng() };
        finalAddress = result[0].formatted_address;
      } else {
        if (!validateCoordinates(coordinates.lat, coordinates.lng)) {
          throw new Error('Invalid coordinates. Latitude must be -90 to 90, longitude -180 to 180');
        }

        finalCoords = {
          lat: parseFloat(coordinates.lat),
          lng: parseFloat(coordinates.lng)
        };

        // Reverse geocode to get address
        if (geocoder.current) {
          try {
            const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
              geocoder.current!.geocode({ location: finalCoords! }, (results, status) => {
                if (status === google.maps.GeocoderStatus.OK && results) {
                  resolve(results);
                } else {
                  resolve([]);
                }
              });
            });
            finalAddress = result[0]?.formatted_address || `${finalCoords.lat}, ${finalCoords.lng}`;
          } catch {
            finalAddress = `${finalCoords.lat}, ${finalCoords.lng}`;
          }
        }
      }

      // Set up image metadata
      const zoom = 20; // High zoom for roof detail
      const imageSize = 640; // Max size for static maps
      const metersPerPixel = calculateMetersPerPixel(finalCoords.lat, zoom);

      const input: PropertyInput = {
        address: finalAddress,
        coordinates: finalCoords,
        imageMeta: {
          imageWidthPx: imageSize,
          imageHeightPx: imageSize,
          centerLat: finalCoords.lat,
          centerLng: finalCoords.lng,
          zoom,
          metersPerPixel
        }
      };

      onStartAnalysis(input);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
            <PiHouse className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">RoofScope</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            AI-Powered Roof Measurement & Analysis
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl bg-white p-8 shadow-xl shadow-slate-200/50 dark:bg-slate-800 dark:shadow-none">
          {/* Mode Toggle */}
          <div className="mb-6 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-700">
            <button
              onClick={() => setInputMode('address')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                inputMode === 'address'
                  ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-600 dark:text-white'
                  : 'text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <PiMapPin className="h-4 w-4" />
              Address
            </button>
            <button
              onClick={() => setInputMode('coordinates')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                inputMode === 'coordinates'
                  ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-600 dark:text-white'
                  : 'text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <PiCrosshair className="h-4 w-4" />
              Coordinates
            </button>
          </div>

          {/* Input Fields */}
          {inputMode === 'address' ? (
            <div className="relative mb-6">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Property Address
              </label>
              <div className="relative">
                <PiMagnifyingGlass className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  onFocus={() => predictions.length > 0 && setShowPredictions(true)}
                  onBlur={() => setTimeout(() => setShowPredictions(false), 200)}
                  placeholder="Enter property address..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-slate-800 placeholder-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-400"
                  disabled={!mapsLoaded}
                />
              </div>

              {/* Autocomplete Predictions */}
              {showPredictions && predictions.length > 0 && (
                <div className="absolute z-10 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-700">
                  {predictions.map((prediction) => (
                    <button
                      key={prediction.place_id}
                      onClick={() => selectPrediction(prediction)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl dark:text-slate-300 dark:hover:bg-slate-600"
                    >
                      <PiMapPin className="h-4 w-4 flex-shrink-0 text-slate-400" />
                      <span className="truncate">{prediction.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mb-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Latitude
                </label>
                <input
                  type="text"
                  value={coordinates.lat}
                  onChange={(e) => setCoordinates({ ...coordinates, lat: e.target.value })}
                  placeholder="e.g., 43.6532"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-800 placeholder-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-400"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Longitude
                </label>
                <input
                  type="text"
                  value={coordinates.lng}
                  onChange={(e) => setCoordinates({ ...coordinates, lng: e.target.value })}
                  placeholder="e.g., -79.3832"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-800 placeholder-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-400"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Example: 43.6532, -79.3832 (Toronto, Canada)
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              <PiWarning className="h-5 w-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading || !mapsLoaded}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow-xl hover:shadow-blue-500/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </>
            ) : (
              <>
                <PiHouse className="h-5 w-5" />
                Analyze Roof
              </>
            )}
          </button>

          {/* Loading indicator for Maps API */}
          {!mapsLoaded && !error && (
            <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
              Loading Google Maps...
            </p>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          Powered by Google Maps & Gemini AI
        </p>
      </div>
    </div>
  );
}
