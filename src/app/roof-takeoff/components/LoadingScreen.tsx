'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PiCheck, PiSpinner, PiHouse, PiCamera } from 'react-icons/pi';
import { PROGRESS_EVENTS, RoofAnalysisResult } from '../types';
import { CapturedImage } from './MultiAngleCapture';

interface PropertyInput {
  address: string;
  coordinates: { lat: number; lng: number } | null;
  imageMeta?: {
    imageWidthPx: number;
    imageHeightPx: number;
    centerLat: number;
    centerLng: number;
    zoom: number;
    metersPerPixel: number;
  };
}

interface LoadingScreenProps {
  propertyInput: PropertyInput;
  onComplete: (result: RoofAnalysisResult, images: CapturedImage[]) => void;
  onError: () => void;
}

// Extended progress events to include multi-angle capture
const EXTENDED_PROGRESS_EVENTS = [
  ...PROGRESS_EVENTS.slice(0, 2),
  {
    id: 'capture_angles',
    label: 'Capturing multiple views',
    percentStart: 20,
    percentEnd: 35,
    messages: ['Fetching satellite imagery...', 'Capturing street views...', 'Processing angles...']
  },
  ...PROGRESS_EVENTS.slice(2).map(e => ({
    ...e,
    percentStart: e.percentStart + 10,
    percentEnd: e.percentEnd + 5
  }))
];

export default function LoadingScreen({ propertyInput, onComplete, onError }: LoadingScreenProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);

  const currentStep = EXTENDED_PROGRESS_EVENTS[currentStepIndex];

  // Animate progress within current step
  useEffect(() => {
    if (!currentStep) return;

    const targetProgress = currentStep.percentEnd;
    const startProgress = currentStep.percentStart;
    const duration = 1500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const newProgress = startProgress + (targetProgress - startProgress) * eased;
      setProgress(newProgress);

      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [currentStep]);

  // Cycle through messages
  useEffect(() => {
    if (!currentStep) return;

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % currentStep.messages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [currentStep]);

  // Capture multi-angle images
  const captureMultiAngleImages = useCallback(async (
    coords: { lat: number; lng: number },
    apiKey: string
  ): Promise<CapturedImage[]> => {
    const images: CapturedImage[] = [];

    // 1. Main satellite view (high zoom for measurements)
    images.push({
      id: 'satellite-main',
      type: 'satellite',
      url: `https://maps.googleapis.com/maps/api/staticmap?center=${coords.lat},${coords.lng}&zoom=20&size=640x640&maptype=satellite&key=${apiKey}`,
      label: 'Satellite',
      zoom: 20,
      description: 'Top-down satellite view for roof measurements'
    });

    // 2. Context satellite view (wider area)
    images.push({
      id: 'satellite-context',
      type: 'satellite',
      url: `https://maps.googleapis.com/maps/api/staticmap?center=${coords.lat},${coords.lng}&zoom=18&size=640x640&maptype=satellite&key=${apiKey}`,
      label: 'Context',
      zoom: 18,
      description: 'Wider satellite view showing property context'
    });

    // 3. Hybrid view with labels
    images.push({
      id: 'satellite-hybrid',
      type: 'satellite',
      url: `https://maps.googleapis.com/maps/api/staticmap?center=${coords.lat},${coords.lng}&zoom=19&size=640x640&maptype=hybrid&key=${apiKey}`,
      label: 'Hybrid',
      zoom: 19,
      description: 'Satellite with street labels overlay'
    });

    // 4. Street Views from 4 cardinal directions
    const streetViewAngles = [
      { heading: 0, label: 'Street N', description: 'Street view from north' },
      { heading: 90, label: 'Street E', description: 'Street view from east' },
      { heading: 180, label: 'Street S', description: 'Street view from south' },
      { heading: 270, label: 'Street W', description: 'Street view from west' }
    ];

    for (const angle of streetViewAngles) {
      images.push({
        id: `streetview-${angle.heading}`,
        type: 'streetview',
        url: `https://maps.googleapis.com/maps/api/streetview?size=640x480&location=${coords.lat},${coords.lng}&heading=${angle.heading}&pitch=20&fov=90&key=${apiKey}`,
        label: angle.label,
        heading: angle.heading,
        pitch: 20,
        description: angle.description
      });
    }

    // 5. Street View looking up at roof
    images.push({
      id: 'streetview-roof',
      type: 'streetview',
      url: `https://maps.googleapis.com/maps/api/streetview?size=640x480&location=${coords.lat},${coords.lng}&heading=0&pitch=45&fov=100&key=${apiKey}`,
      label: 'Roof View',
      heading: 0,
      pitch: 45,
      description: 'Street view angled up toward roof line'
    });

    // Preload all images
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            const image = new Image();
            image.onload = () => resolve();
            image.onerror = () => resolve(); // Don't fail if street view unavailable
            image.src = img.url;
          })
      )
    );

    return images;
  }, []);

  // Run the analysis
  const runAnalysis = useCallback(async () => {
    try {
      // Step 1: Resolve property
      setCurrentStepIndex(0);
      await new Promise((r) => setTimeout(r, 1500));

      // Step 2: Load imagery setup
      setCurrentStepIndex(1);
      setCurrentMessageIndex(0);

      const coords = propertyInput.coordinates;
      if (!coords) throw new Error('No coordinates available');

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY;
      if (!apiKey) throw new Error('Google Maps API key not configured');

      await new Promise((r) => setTimeout(r, 1000));

      // Step 3: Capture multiple angles
      setCurrentStepIndex(2);
      setCurrentMessageIndex(0);

      const images = await captureMultiAngleImages(coords, apiKey);
      setCapturedImages(images);

      await new Promise((r) => setTimeout(r, 1500));

      // Step 4: Trace outline
      setCurrentStepIndex(3);
      setCurrentMessageIndex(0);
      await new Promise((r) => setTimeout(r, 2000));

      // Step 5: Compute takeoff
      setCurrentStepIndex(4);
      setCurrentMessageIndex(0);
      await new Promise((r) => setTimeout(r, 1500));

      // Step 6: Check defects - Call Gemini API with all images
      setCurrentStepIndex(5);
      setCurrentMessageIndex(0);

      const mainSatellite = images.find((img) => img.id === 'satellite-main');
      const streetViewImages = images.filter((img) => img.type === 'streetview');

      const response = await fetch('/api/roof-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: propertyInput.address,
          coordinates: coords,
          imageMeta: propertyInput.imageMeta,
          satelliteImageUrl: mainSatellite?.url,
          additionalImages: streetViewImages.map((img) => ({
            url: img.url,
            type: img.type,
            heading: img.heading,
            pitch: img.pitch,
            description: img.description
          }))
        })
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || 'Analysis failed');
      }

      const result = (await response.json()) as RoofAnalysisResult;

      // Step 7: Pricing
      setCurrentStepIndex(6);
      setCurrentMessageIndex(0);
      await new Promise((r) => setTimeout(r, 1500));

      // Complete with all captured images
      onComplete(result, images);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    }
  }, [propertyInput, onComplete, captureMultiAngleImages]);

  useEffect(() => {
    runAnalysis();
  }, [runAnalysis]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-slate-800">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="mb-2 text-xl font-bold text-slate-800 dark:text-white">Analysis Error</h2>
          <p className="mb-6 text-slate-600 dark:text-slate-400">{error}</p>
          <button
            onClick={onError}
            className="rounded-xl bg-blue-500 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Animated House Icon */}
        <div className="mb-8 flex justify-center">
          <motion.div
            className="relative"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-2xl shadow-blue-500/40">
              <PiHouse className="h-12 w-12 text-white" />
            </div>
            {/* Scanning effect */}
            <motion.div
              className="absolute inset-0 rounded-3xl border-4 border-blue-400"
              animate={{ scale: [1, 1.3], opacity: [0.8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
            />
          </motion.div>
        </div>

        {/* Title */}
        <h2 className="mb-2 text-center text-2xl font-bold text-slate-800 dark:text-white">
          Analyzing Roof
        </h2>
        <p className="mb-8 text-center text-slate-600 dark:text-slate-400">
          {propertyInput.address}
        </p>

        {/* Captured Images Preview */}
        {capturedImages.length > 0 && (
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <PiCamera className="h-4 w-4" />
              <span>{capturedImages.length} views captured</span>
            </div>
            <div className="flex justify-center gap-1">
              {capturedImages.slice(0, 6).map((img, i) => (
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="h-12 w-12 overflow-hidden rounded-lg border-2 border-white shadow-md dark:border-slate-700"
                >
                  <img src={img.url} alt={img.label} className="h-full w-full object-cover" />
                </motion.div>
              ))}
              {capturedImages.length > 6 && (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-200 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                  +{capturedImages.length - 6}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {currentStep?.label || 'Processing...'}
            </span>
            <span className="text-slate-500 dark:text-slate-400">{Math.round(progress)}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Current Message */}
        <div className="mb-8 flex justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={`${currentStepIndex}-${currentMessageIndex}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center text-slate-600 dark:text-slate-400"
            >
              {currentStep?.messages[currentMessageIndex] || 'Processing...'}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Steps List */}
        <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800">
          <div className="space-y-3">
            {EXTENDED_PROGRESS_EVENTS.map((step, index) => (
              <div key={step.id} className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
                    index < currentStepIndex
                      ? 'bg-green-500 text-white'
                      : index === currentStepIndex
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-200 text-slate-400 dark:bg-slate-700'
                  }`}
                >
                  {index < currentStepIndex ? (
                    <PiCheck className="h-4 w-4" />
                  ) : index === currentStepIndex ? (
                    <PiSpinner className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>
                <span
                  className={`text-sm transition-colors ${
                    index <= currentStepIndex
                      ? 'font-medium text-slate-800 dark:text-white'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
