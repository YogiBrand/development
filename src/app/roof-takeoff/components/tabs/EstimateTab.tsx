'use client';

import { useState } from 'react';
import { PiCheck, PiInfo } from 'react-icons/pi';
import { RoofAnalysisResult, EstimateOption } from '../../types';

interface EstimateTabProps {
  result: RoofAnalysisResult;
}

export default function EstimateTab({ result }: EstimateTabProps) {
  const { estimateOptions } = result.analysis;
  const [selectedOption, setSelectedOption] = useState(0);

  if (estimateOptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl bg-white p-12 shadow-sm dark:bg-slate-800">
        <PiInfo className="mb-4 h-12 w-12 text-slate-400" />
        <h3 className="mb-2 text-lg font-semibold text-slate-800 dark:text-white">
          Estimates Unavailable
        </h3>
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Unable to generate pricing estimates due to insufficient measurement data.
        </p>
      </div>
    );
  }

  const selected = estimateOptions[selectedOption];

  return (
    <div className="space-y-4">
      {/* System Options */}
      <div className="grid gap-3 sm:grid-cols-2">
        {estimateOptions.map((option, index) => (
          <button
            key={option.optionName}
            onClick={() => setSelectedOption(index)}
            className={`relative rounded-xl p-4 text-left transition-all ${
              selectedOption === index
                ? 'bg-blue-50 ring-2 ring-blue-500 dark:bg-blue-900/30'
                : 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700'
            }`}
          >
            {selectedOption === index && (
              <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
                <PiCheck className="h-4 w-4" />
              </div>
            )}
            <p className="font-semibold text-slate-800 dark:text-white">{option.optionName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{option.systemType}</p>
            <p className="mt-2 text-lg font-bold text-slate-800 dark:text-white">
              ${option.totalTypical?.toLocaleString() || '—'}
              {option.totalLow && option.totalHigh && (
                <span className="ml-2 text-xs font-normal text-slate-400">
                  (${option.totalLow.toLocaleString()} – ${option.totalHigh.toLocaleString()})
                </span>
              )}
            </p>
          </button>
        ))}
      </div>

      {/* Quantity Summary */}
      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
        <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-white">
          Material Quantities
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <QuantityCard
            label="Roofing Squares"
            value={selected.quantitySummary.squares}
            tooltip="1 square = 100 sq ft"
          />
          <QuantityCard
            label="Bundles"
            value={selected.quantitySummary.bundles}
            tooltip="3-tab shingle equivalent"
          />
          <QuantityCard label="Ridge Cap" value={selected.quantitySummary.ridgeCapFt} suffix="ft" />
          <QuantityCard label="Starter Strip" value={selected.quantitySummary.starterFt} suffix="ft" />
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
        <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-white">Cost Breakdown</h3>
        <div className="space-y-3">
          <CostRow
            label="Materials"
            low={selected.costBreakdown.materialsLow}
            typical={selected.costBreakdown.materialsTypical}
            high={selected.costBreakdown.materialsHigh}
            color="blue"
          />
          <CostRow
            label="Labor"
            low={selected.costBreakdown.laborLow}
            typical={selected.costBreakdown.laborTypical}
            high={selected.costBreakdown.laborHigh}
            color="green"
          />
          <CostRow
            label="Tear-off & Disposal"
            typical={selected.costBreakdown.tearOffAndDisposal}
            color="amber"
          />
          <CostRow
            label="Permits"
            typical={selected.costBreakdown.permitAllowance}
            color="purple"
          />
          <CostRow
            label="Overhead & Profit"
            typical={selected.costBreakdown.overheadAndProfit}
            color="slate"
          />
        </div>

        <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800 dark:text-white">Total Estimate</span>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-800 dark:text-white">
                ${selected.totalTypical?.toLocaleString() || '—'}
              </p>
              {selected.totalLow && selected.totalHigh && (
                <p className="text-xs text-slate-500">
                  Range: ${selected.totalLow.toLocaleString()} – $
                  {selected.totalHigh.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assumptions */}
      <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-700/50">
        <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Estimate Assumptions
        </h4>
        <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
          {selected.assumptions.map((assumption, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400" />
              {assumption}
            </li>
          ))}
        </ul>
      </div>

      {/* Sources */}
      {selected.sources.length > 0 && (
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800">
          <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Pricing Sources
          </h4>
          <div className="space-y-2">
            {selected.sources.map((source, index) => (
              <a
                key={index}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                {source.note}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QuantityCard({
  label,
  value,
  suffix,
  tooltip
}: {
  label: string;
  value: number | null;
  suffix?: string;
  tooltip?: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50" title={tooltip}>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-lg font-bold text-slate-800 dark:text-white">
        {value !== null ? value.toLocaleString() : '—'}
        {value !== null && suffix && (
          <span className="ml-1 text-xs font-normal text-slate-400">{suffix}</span>
        )}
      </p>
    </div>
  );
}

function CostRow({
  label,
  low,
  typical,
  high,
  color
}: {
  label: string;
  low?: number | null;
  typical?: number | null;
  high?: number | null;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    amber: 'bg-amber-500',
    purple: 'bg-purple-500',
    slate: 'bg-slate-500'
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`h-3 w-3 rounded ${colorClasses[color]}`} />
        <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      </div>
      <div className="text-right">
        <span className="font-medium text-slate-800 dark:text-white">
          ${typical?.toLocaleString() || '—'}
        </span>
        {low && high && (
          <span className="ml-2 text-xs text-slate-400">
            (${low.toLocaleString()} – ${high.toLocaleString()})
          </span>
        )}
      </div>
    </div>
  );
}
