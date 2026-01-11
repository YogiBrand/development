'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PiCamera,
  PiCompass,
  PiMapPin,
  PiEye,
  PiCaretUp,
  PiCaretDown,
  PiCaretLeft,
  PiCaretRight
} from 'react-icons/pi';

export interface CapturedImage {
  id: string;
  type: 'satellite' | 'oblique' | 'streetview';
  url: string;
  label: string;
  heading?: number;
  pitch?: number;
  zoom?: number;
  description: string;
}

interface MultiAngleCaptureProps {
  coordinates: { lat: number; lng: number };
  onImagesReady: (images: CapturedImage[]) => void;
}

export default function MultiAngleCapture({ coordinates, onImagesReady }: MultiAngleCaptureProps) {
  const [images, setImages] = useState<CapturedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY;

  const captureAllAngles = useCallback(async () => {
    if (!apiKey || !coordinates.lat || !coordinates.lng) return;

    setLoading(true);
    const capturedImages: CapturedImage[] = [];
    const { lat, lng } = coordinates;

    // 1. Satellite (nadir) view - highest zoom
    setProgress(10);
    capturedImages.push({
      id: 'satellite-main',
      type: 'satellite',
      url: `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=20&size=640x640&maptype=satellite&key=${apiKey}`,
      label: 'Satellite',
      zoom: 20,
      description: 'Top-down satellite view for measurements'
    });

    // 2. Satellite wider context
    setProgress(20);
    capturedImages.push({
      id: 'satellite-context',
      type: 'satellite',
      url: `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=18&size=640x640&maptype=satellite&key=${apiKey}`,
      label: 'Context',
      zoom: 18,
      description: 'Wider satellite view showing property context'
    });

    // 3. Street View from 4 cardinal directions
    const streetViewHeadings = [
      { heading: 0, label: 'North', icon: 'N', description: 'Street view facing north' },
      { heading: 90, label: 'East', icon: 'E', description: 'Street view facing east' },
      { heading: 180, label: 'South', icon: 'S', description: 'Street view facing south' },
      { heading: 270, label: 'West', icon: 'W', description: 'Street view facing west' }
    ];

    for (let i = 0; i < streetViewHeadings.length; i++) {
      const sv = streetViewHeadings[i];
      setProgress(30 + i * 15);

      // Street View looking at the property from nearby road
      capturedImages.push({
        id: `streetview-${sv.label.toLowerCase()}`,
        type: 'streetview',
        url: `https://maps.googleapis.com/maps/api/streetview?size=640x480&location=${lat},${lng}&heading=${sv.heading}&pitch=15&fov=90&key=${apiKey}`,
        label: `Street ${sv.icon}`,
        heading: sv.heading,
        pitch: 15,
        description: sv.description
      });
    }

    // 4. Street View looking up at roof (higher pitch)
    setProgress(90);
    capturedImages.push({
      id: 'streetview-roof',
      type: 'streetview',
      url: `https://maps.googleapis.com/maps/api/streetview?size=640x480&location=${lat},${lng}&heading=0&pitch=45&fov=100&key=${apiKey}`,
      label: 'Roof View',
      heading: 0,
      pitch: 45,
      description: 'Street view angled up toward roof'
    });

    setProgress(100);
    setImages(capturedImages);
    setLoading(false);
    onImagesReady(capturedImages);
  }, [apiKey, coordinates, onImagesReady]);

  useEffect(() => {
    captureAllAngles();
  }, [captureAllAngles]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
          <PiCamera className="h-8 w-8 animate-pulse text-blue-600 dark:text-blue-400" />
        </div>
        <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          Capturing multiple angles...
        </p>
        <div className="h-2 w-48 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {progress < 30 ? 'Satellite imagery...' : progress < 90 ? 'Street views...' : 'Finalizing...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        <PiCamera className="h-4 w-4" />
        {images.length} views captured
      </div>

      <div className="grid grid-cols-4 gap-2">
        {images.map((img) => (
          <div
            key={img.id}
            className="group relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
          >
            <img
              src={img.url}
              alt={img.label}
              className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
              <p className="text-xs font-medium text-white">{img.label}</p>
            </div>
            <div className="absolute right-1 top-1">
              {img.type === 'satellite' && (
                <span className="rounded bg-blue-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  SAT
                </span>
              )}
              {img.type === 'streetview' && (
                <span className="rounded bg-green-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  SV
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Thumbnail gallery component for results page
export function ImageThumbnailGallery({
  images,
  selectedId,
  onSelect
}: {
  images: CapturedImage[];
  selectedId: string;
  onSelect: (image: CapturedImage) => void;
}) {
  const groupedImages = {
    satellite: images.filter((img) => img.type === 'satellite'),
    streetview: images.filter((img) => img.type === 'streetview')
  };

  return (
    <div className="space-y-3">
      {/* Satellite Views */}
      {groupedImages.satellite.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Aerial Views
          </p>
          <div className="flex gap-2">
            {groupedImages.satellite.map((img) => (
              <button
                key={img.id}
                onClick={() => onSelect(img)}
                className={`relative overflow-hidden rounded-lg transition-all ${
                  selectedId === img.id
                    ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={img.url}
                  alt={img.label}
                  className="h-16 w-16 object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5">
                  <p className="text-[9px] font-medium text-white">{img.label}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Street Views */}
      {groupedImages.streetview.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Street Views
          </p>
          <div className="flex flex-wrap gap-2">
            {groupedImages.streetview.map((img) => (
              <button
                key={img.id}
                onClick={() => onSelect(img)}
                className={`relative overflow-hidden rounded-lg transition-all ${
                  selectedId === img.id
                    ? 'ring-2 ring-green-500 ring-offset-2 dark:ring-offset-slate-900'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={img.url}
                  alt={img.label}
                  className="h-16 w-16 object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5">
                  <p className="text-[9px] font-medium text-white">{img.label}</p>
                </div>
                {img.heading !== undefined && (
                  <div className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/90 text-[8px] font-bold text-slate-700">
                    {img.heading === 0 && 'N'}
                    {img.heading === 90 && 'E'}
                    {img.heading === 180 && 'S'}
                    {img.heading === 270 && 'W'}
                    {img.heading !== 0 && img.heading !== 90 && img.heading !== 180 && img.heading !== 270 && '↑'}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Direction indicator component
export function DirectionCompass({ heading }: { heading: number }) {
  return (
    <div className="relative h-12 w-12">
      <div className="absolute inset-0 rounded-full border-2 border-slate-300 dark:border-slate-600" />
      <div
        className="absolute inset-2 flex items-center justify-center"
        style={{ transform: `rotate(${heading}deg)` }}
      >
        <PiCaretUp className="h-6 w-6 text-red-500" />
      </div>
      <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-500">
        N
      </span>
      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-500">
        S
      </span>
      <span className="absolute -right-1 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-500">
        E
      </span>
      <span className="absolute -left-1 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-500">
        W
      </span>
    </div>
  );
}
