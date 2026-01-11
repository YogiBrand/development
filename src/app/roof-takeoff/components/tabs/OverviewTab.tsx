'use client';

import { PiHouse, PiRuler, PiStack, PiChartLine, PiWarning, PiCheckCircle } from 'react-icons/pi';
import { RoofAnalysisResult, CONDITION_COLORS } from '../../types';

interface OverviewTabProps {
  result: RoofAnalysisResult;
}

export default function OverviewTab({ result }: OverviewTabProps) {
  const { geometry, conditions, linear } = result.analysis;
  const condition = conditions.overallCondition;
  const conditionColor = CONDITION_COLORS[condition];

  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          icon={PiRuler}
          label="Total Area"
          value={geometry.totalSurfaceAreaSqFt?.toLocaleString() || '—'}
          unit="sq ft"
          color="blue"
        />
        <MetricCard
          icon={PiStack}
          label="Facets"
          value={geometry.facets?.toString() || '—'}
          color="purple"
        />
        <MetricCard
          icon={PiChartLine}
          label="Complexity"
          value={geometry.complexityIndex?.toFixed(1) || '—'}
          unit="/ 10"
          color="amber"
        />
        <MetricCard
          icon={PiHouse}
          label="Pitch"
          value={geometry.predominantPitch || '—'}
          color="green"
        />
      </div>

      {/* Condition Badge */}
      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
        <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-white">
          Roof Condition
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: `${conditionColor}20` }}
            >
              {condition === 'GOOD' ? (
                <PiCheckCircle className="h-6 w-6" style={{ color: conditionColor }} />
              ) : (
                <PiWarning className="h-6 w-6" style={{ color: conditionColor }} />
              )}
            </div>
            <div>
              <p
                className="text-lg font-bold capitalize"
                style={{ color: conditionColor }}
              >
                {condition.toLowerCase()}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {conditions.findings.length} issue{conditions.findings.length !== 1 ? 's' : ''}{' '}
                detected
              </p>
            </div>
          </div>
          {conditions.estimatedAge && (
            <div className="text-right">
              <p className="text-sm text-slate-500 dark:text-slate-400">Est. Age</p>
              <p className="font-semibold text-slate-800 dark:text-white">
                {conditions.estimatedAge}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confidence Meter */}
      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
        <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-white">
          Analysis Confidence
        </h3>
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">Overall Confidence</span>
          <span className="font-medium text-slate-800 dark:text-white">
            {Math.round(result.confidenceOverall * 100)}%
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className={`h-full rounded-full ${
              result.confidenceOverall >= 0.8
                ? 'bg-green-500'
                : result.confidenceOverall >= 0.5
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            }`}
            style={{ width: `${result.confidenceOverall * 100}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {result.confidenceOverall >= 0.8
            ? 'High confidence - measurements are reliable'
            : result.confidenceOverall >= 0.5
              ? 'Moderate confidence - verify critical measurements'
              : 'Low confidence - consider manual verification'}
        </p>
      </div>

      {/* Quick Summary */}
      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
        <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-white">Summary</h3>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {result.summary}
        </p>
      </div>

      {/* Linear Summary */}
      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
        <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-white">
          Linear Measurements
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <LinearItem label="Eaves" value={linear.eavesFt} range={linear.rangesFt.eavesFt} />
          <LinearItem label="Rakes" value={linear.rakesFt} range={linear.rangesFt.rakesFt} />
          <LinearItem label="Ridges" value={linear.ridgesFt} range={linear.rangesFt.ridgesFt} />
          <LinearItem label="Hips" value={linear.hipsFt} range={linear.rangesFt.hipsFt} />
          <LinearItem label="Valleys" value={linear.valleysFt} range={linear.rangesFt.valleysFt} />
          <LinearItem label="Drip Edge" value={linear.dripEdgeFt} />
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  color
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit?: string;
  color: 'blue' | 'purple' | 'amber' | 'green';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
  };

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${colorClasses[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-xl font-bold text-slate-800 dark:text-white">
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-slate-400">{unit}</span>}
      </p>
    </div>
  );
}

function LinearItem({
  label,
  value,
  range
}: {
  label: string;
  value: number | null;
  range?: [number, number] | null;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-600 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-800 dark:text-white">
        {value !== null
          ? `${value.toFixed(1)} ft`
          : range
            ? `${range[0].toFixed(0)}–${range[1].toFixed(0)} ft`
            : '—'}
      </span>
    </div>
  );
}
