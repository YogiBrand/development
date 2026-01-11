'use client';

import { PiLightbulb, PiArrowRight } from 'react-icons/pi';
import { RoofAnalysisResult } from '../../types';

interface OpportunitiesTabProps {
  result: RoofAnalysisResult;
}

export default function OpportunitiesTab({ result }: OpportunitiesTabProps) {
  const { opportunities } = result.analysis;

  if (opportunities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl bg-white p-12 shadow-sm dark:bg-slate-800">
        <PiLightbulb className="mb-4 h-12 w-12 text-slate-400" />
        <h3 className="mb-2 text-lg font-semibold text-slate-800 dark:text-white">
          No Additional Opportunities Identified
        </h3>
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          The current roofing system appears to be standard. Ask your contractor about upgrade
          options.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Based on your roof analysis, consider these improvements for better performance and value.
      </p>

      <div className="grid gap-4">
        {opportunities.map((opportunity, index) => (
          <div
            key={index}
            className="rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:bg-slate-800"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                  <PiLightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-white">{opportunity.name}</h3>
              </div>
              {opportunity.roughRange && (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  {opportunity.roughRange}
                </span>
              )}
            </div>

            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">{opportunity.why}</p>

            <button className="flex items-center gap-2 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              Learn More
              <PiArrowRight className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* General Tips */}
      <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-6 dark:from-blue-900/20 dark:to-indigo-900/20">
        <h4 className="mb-3 font-semibold text-slate-800 dark:text-white">
          Maximize Your Roof Investment
        </h4>
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
            Consider upgrading to impact-resistant shingles if you're in a hail-prone area
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
            Proper attic ventilation can extend roof life by 20% or more
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
            Adding a roof ridge vent improves energy efficiency year-round
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
            Gutter guards reduce maintenance and protect fascia boards
          </li>
        </ul>
      </div>
    </div>
  );
}
