'use client';

import { useState, useCallback } from 'react';
import PropertyEntry from './components/PropertyEntry';
import LoadingScreen from './components/LoadingScreen';
import ResultsPage from './components/ResultsPage';
import { RoofAnalysisResult } from './types';
import { CapturedImage } from './components/MultiAngleCapture';

type AppState = 'entry' | 'loading' | 'results';

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

export default function RoofTakeoffPage() {
  const [appState, setAppState] = useState<AppState>('entry');
  const [propertyInput, setPropertyInput] = useState<PropertyInput | null>(null);
  const [analysisResult, setAnalysisResult] = useState<RoofAnalysisResult | null>(null);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);

  const handleStartAnalysis = useCallback((input: PropertyInput) => {
    setPropertyInput(input);
    setAppState('loading');
  }, []);

  const handleAnalysisComplete = useCallback((result: RoofAnalysisResult, images: CapturedImage[]) => {
    setAnalysisResult(result);
    setCapturedImages(images);
    setAppState('results');
  }, []);

  const handleReset = useCallback(() => {
    setAppState('entry');
    setPropertyInput(null);
    setAnalysisResult(null);
    setCapturedImages([]);
  }, []);

  return (
    <main className="min-h-screen">
      {appState === 'entry' && (
        <PropertyEntry onStartAnalysis={handleStartAnalysis} />
      )}
      {appState === 'loading' && propertyInput && (
        <LoadingScreen
          propertyInput={propertyInput}
          onComplete={handleAnalysisComplete}
          onError={handleReset}
        />
      )}
      {appState === 'results' && analysisResult && (
        <ResultsPage
          result={analysisResult}
          images={capturedImages}
          onReset={handleReset}
        />
      )}
    </main>
  );
}
