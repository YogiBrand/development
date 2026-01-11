'use client';

import { useState } from 'react';
import {
  PiHouse,
  PiArrowLeft,
  PiRuler,
  PiWarning,
  PiCurrencyDollar,
  PiLightbulb,
  PiInfo,
  PiDownload,
  PiChartBar,
  PiCamera
} from 'react-icons/pi';
import EnhancedImageryViewer from './EnhancedImageryViewer';
import OverviewTab from './tabs/OverviewTab';
import MeasurementsTab from './tabs/MeasurementsTab';
import DeficienciesTab from './tabs/DeficienciesTab';
import EstimateTab from './tabs/EstimateTab';
import OpportunitiesTab from './tabs/OpportunitiesTab';
import SourcesTab from './tabs/SourcesTab';
import ExportTab from './tabs/ExportTab';
import { RoofAnalysisResult } from '../types';
import { CapturedImage } from './MultiAngleCapture';

interface ResultsPageProps {
  result: RoofAnalysisResult;
  images: CapturedImage[];
  onReset: () => void;
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: PiChartBar },
  { id: 'measurements', label: 'Measurements', icon: PiRuler },
  { id: 'deficiencies', label: 'Deficiencies', icon: PiWarning },
  { id: 'estimate', label: 'Estimate', icon: PiCurrencyDollar },
  { id: 'opportunities', label: 'Opportunities', icon: PiLightbulb },
  { id: 'sources', label: 'Sources', icon: PiInfo },
  { id: 'export', label: 'Export', icon: PiDownload }
];

export default function ResultsPage({ result, images, onReset }: ResultsPageProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [highlightedFindingId, setHighlightedFindingId] = useState<string | null>(null);
  const [overlayLayers, setOverlayLayers] = useState({
    roofOutline: true,
    facets: true,
    segments: true,
    findings: false
  });

  const handleFindingClick = (findingId: string) => {
    setHighlightedFindingId(findingId);
    setOverlayLayers((prev) => ({ ...prev, findings: true }));
  };

  // Get main satellite URL for export
  const mainSatelliteUrl = images.find((img) => img.id === 'satellite-main')?.url || '';

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab result={result} />;
      case 'measurements':
        return <MeasurementsTab result={result} />;
      case 'deficiencies':
        return <DeficienciesTab result={result} onFindingClick={handleFindingClick} />;
      case 'estimate':
        return <EstimateTab result={result} />;
      case 'opportunities':
        return <OpportunitiesTab result={result} />;
      case 'sources':
        return <SourcesTab result={result} />;
      case 'export':
        return <ExportTab result={result} satelliteImageUrl={mainSatelliteUrl} />;
      default:
        return <OverviewTab result={result} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onReset}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              <PiArrowLeft className="h-4 w-4" />
              New Analysis
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white">
                <PiHouse className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-slate-800 dark:text-white">
                  Roof Report
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {result.property.address || 'Unknown Address'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Image count badge */}
            <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-400">
              <PiCamera className="h-3.5 w-3.5" />
              {images.length} views
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                result.status === 'OK'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : result.status === 'LOW_CONFIDENCE'
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              {result.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content - Two Pane Layout */}
      <div className="flex h-[calc(100vh-65px)]">
        {/* Left Pane - Enhanced Imagery Viewer with Multi-Angle Support */}
        <div className="w-1/2 border-r border-slate-200 dark:border-slate-700">
          <EnhancedImageryViewer
            images={images}
            overlay={result.overlay}
            overlayLayers={overlayLayers}
            onToggleLayer={(layer) =>
              setOverlayLayers((prev) => ({ ...prev, [layer]: !prev[layer] }))
            }
            highlightedFindingId={highlightedFindingId}
          />
        </div>

        {/* Right Pane - Dashboard */}
        <div className="flex w-1/2 flex-col">
          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-800">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const deficiencyCount =
                tab.id === 'deficiencies' ? result.analysis.conditions.findings.length : 0;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {deficiencyCount > 0 && tab.id === 'deficiencies' && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                      {deficiencyCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto bg-slate-50 p-4 dark:bg-slate-900">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
