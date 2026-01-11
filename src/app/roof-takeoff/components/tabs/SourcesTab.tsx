'use client';

import { PiLink, PiImage, PiInfo, PiShieldCheck } from 'react-icons/pi';
import { RoofAnalysisResult } from '../../types';

interface SourcesTabProps {
  result: RoofAnalysisResult;
}

export default function SourcesTab({ result }: SourcesTabProps) {
  const { overlay, analysis } = result;
  const imageMeta = overlay.imageMetaUsed;

  return (
    <div className="space-y-4">
      {/* Confidence Breakdown */}
      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
        <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-white">
          Confidence Breakdown
        </h3>
        <div className="space-y-3">
          <ConfidenceRow
            label="Geometry Detection"
            value={overlay.roofOutline.confidence}
          />
          <ConfidenceRow
            label="Linear Measurements"
            value={analysis.linear.confidence}
          />
          <ConfidenceRow
            label="Penetration Detection"
            value={analysis.penetrations.confidence}
          />
          <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
            <ConfidenceRow
              label="Overall Confidence"
              value={result.confidenceOverall}
              bold
            />
          </div>
        </div>
      </div>

      {/* Image Metadata */}
      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
        <div className="mb-4 flex items-center gap-2">
          <PiImage className="h-5 w-5 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Image Metadata</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <MetadataItem
            label="Dimensions"
            value={
              imageMeta.imageWidthPx && imageMeta.imageHeightPx
                ? `${imageMeta.imageWidthPx} × ${imageMeta.imageHeightPx} px`
                : '—'
            }
          />
          <MetadataItem
            label="Ground Resolution"
            value={
              imageMeta.metersPerPixel
                ? `${imageMeta.metersPerPixel.toFixed(4)} m/px`
                : '—'
            }
          />
          <MetadataItem
            label="Center Coordinates"
            value={
              imageMeta.centerLat && imageMeta.centerLng
                ? `${imageMeta.centerLat.toFixed(6)}, ${imageMeta.centerLng.toFixed(6)}`
                : '—'
            }
          />
          <MetadataItem
            label="Zoom Level"
            value={imageMeta.zoom?.toString() || '—'}
          />
          <MetadataItem
            label="Capture Date"
            value={imageMeta.captureDate || 'Unknown'}
          />
          <MetadataItem
            label="Bearing"
            value={
              imageMeta.bearingDegrees !== null
                ? `${imageMeta.bearingDegrees}°`
                : 'North (0°)'
            }
          />
        </div>
        {imageMeta.notes && (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{imageMeta.notes}</p>
        )}
      </div>

      {/* Limitations */}
      <div className="rounded-xl bg-amber-50 p-6 dark:bg-amber-900/20">
        <div className="mb-4 flex items-center gap-2">
          <PiInfo className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            Analysis Limitations
          </h3>
        </div>
        <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-300">
          {analysis.conditions.limitations.map((limitation, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
              {limitation}
            </li>
          ))}
          {analysis.conditions.limitations.length === 0 && (
            <li>No specific limitations noted</li>
          )}
        </ul>
      </div>

      {/* Data Sources */}
      {analysis.sources.length > 0 && (
        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
          <div className="mb-4 flex items-center gap-2">
            <PiLink className="h-5 w-5 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Data Sources</h3>
          </div>
          <div className="space-y-3">
            {analysis.sources.map((source, index) => (
              <a
                key={index}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 transition-colors hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700"
              >
                <PiLink className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {source.note}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{source.url}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="rounded-xl bg-slate-100 p-6 dark:bg-slate-700/50">
        <div className="mb-3 flex items-center gap-2">
          <PiShieldCheck className="h-5 w-5 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Disclaimer</h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          This analysis is based on satellite imagery and AI-powered detection. Measurements and
          condition assessments are estimates and should be verified by a licensed roofing
          professional before making purchasing decisions. Actual conditions may vary from what is
          visible in aerial imagery. This report does not constitute a professional roof inspection.
        </p>
      </div>
    </div>
  );
}

function ConfidenceRow({
  label,
  value,
  bold
}: {
  label: string;
  value: number;
  bold?: boolean;
}) {
  const percentage = Math.round(value * 100);
  const colorClass =
    percentage >= 80
      ? 'bg-green-500'
      : percentage >= 50
        ? 'bg-yellow-500'
        : 'bg-red-500';

  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span
          className={`${bold ? 'font-semibold' : ''} text-slate-600 dark:text-slate-400`}
        >
          {label}
        </span>
        <span
          className={`${bold ? 'font-semibold' : 'font-medium'} text-slate-800 dark:text-white`}
        >
          {percentage}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className={`h-full rounded-full ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="font-medium text-slate-800 dark:text-white">{value}</p>
    </div>
  );
}
