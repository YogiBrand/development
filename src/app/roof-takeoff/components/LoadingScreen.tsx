'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PiCheck, PiSpinner, PiHouse } from 'react-icons/pi';
import { PROGRESS_EVENTS, RoofAnalysisResult } from '../types';

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
  onComplete: (result: RoofAnalysisResult, imageUrl: string) => void;
  onError: () => void;
}

export default function LoadingScreen({ propertyInput, onComplete, onError }: LoadingScreenProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const currentStep = PROGRESS_EVENTS[currentStepIndex];

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
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
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

  // Run the analysis
  const runAnalysis = useCallback(async () => {
    try {
      // Step 1: Resolve property
      setCurrentStepIndex(0);
      await new Promise((r) => setTimeout(r, 1500));

      // Step 2: Load imagery
      setCurrentStepIndex(1);
      setCurrentMessageIndex(0);

      const coords = propertyInput.coordinates;
      if (!coords) throw new Error('No coordinates available');

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY;
      const zoom = 20;
      const size = '640x640';
      const satelliteUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${coords.lat},${coords.lng}&zoom=${zoom}&size=${size}&maptype=satellite&key=${apiKey}`;

      // Preload the image
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load satellite image'));
        img.src = satelliteUrl;
      });

      await new Promise((r) => setTimeout(r, 1000));

      // Step 3: Trace outline
      setCurrentStepIndex(2);
      setCurrentMessageIndex(0);
      await new Promise((r) => setTimeout(r, 2000));

      // Step 4: Compute takeoff
      setCurrentStepIndex(3);
      setCurrentMessageIndex(0);
      await new Promise((r) => setTimeout(r, 1500));

      // Step 5: Check defects - Call Gemini API
      setCurrentStepIndex(4);
      setCurrentMessageIndex(0);

      const response = await fetch('/api/roof-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: propertyInput.address,
          coordinates: coords,
          imageMeta: propertyInput.imageMeta,
          satelliteImageUrl: satelliteUrl
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const result: RoofAnalysisResult = await response.json();

      // Step 6: Pricing
      setCurrentStepIndex(5);
      setCurrentMessageIndex(0);
      await new Promise((r) => setTimeout(r, 1500));

      // Complete
      onComplete(result, satelliteUrl);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    }
  }, [propertyInput, onComplete]);

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
            {PROGRESS_EVENTS.map((step, index) => (
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
