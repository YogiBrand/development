'use client';

import { useState } from 'react';
import { PiWarning, PiMapPin, PiCheckCircle } from 'react-icons/pi';
import { RoofAnalysisResult, SEVERITY_COLORS, Severity } from '../../types';

interface DeficienciesTabProps {
  result: RoofAnalysisResult;
  onFindingClick: (findingId: string) => void;
}

export default function DeficienciesTab({ result, onFindingClick }: DeficienciesTabProps) {
  const { conditions } = result.analysis;
  const [severityFilter, setSeverityFilter] = useState<'ALL' | Severity>('ALL');

  const filteredFindings =
    severityFilter === 'ALL'
      ? conditions.findings
      : conditions.findings.filter((f) => f.severity === severityFilter);

  const severityCounts: Record<Severity, number> = {
    CRITICAL: conditions.findings.filter((f) => f.severity === 'CRITICAL').length,
    HIGH: conditions.findings.filter((f) => f.severity === 'HIGH').length,
    MED: conditions.findings.filter((f) => f.severity === 'MED').length,
    LOW: conditions.findings.filter((f) => f.severity === 'LOW').length
  };

  return (
    <div className="space-y-4">
      {/* Severity Filter */}
      <div className="flex gap-2">
        {['ALL', 'CRITICAL', 'HIGH', 'MED', 'LOW'].map((severity) => {
          const isActive = severityFilter === severity;
          const count =
            severity === 'ALL'
              ? conditions.findings.length
              : severityCounts[severity as Severity];
          const color = severity === 'ALL' ? '#6B7280' : SEVERITY_COLORS[severity as Severity];

          return (
            <button
              key={severity}
              onClick={() => setSeverityFilter(severity as 'ALL' | Severity)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
              }`}
              style={isActive ? { backgroundColor: color } : undefined}
            >
              {severity === 'ALL' ? 'All' : severity}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Risk Factors */}
      {conditions.riskFactors.length > 0 && (
        <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-900/20">
          <h4 className="mb-2 text-sm font-semibold text-amber-800 dark:text-amber-400">
            Risk Factors
          </h4>
          <div className="flex flex-wrap gap-2">
            {conditions.riskFactors.map((risk, index) => (
              <span
                key={index}
                className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
              >
                {risk}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Findings List */}
      {filteredFindings.length > 0 ? (
        <div className="space-y-3">
          {filteredFindings.map((finding) => (
            <button
              key={finding.id}
              onClick={() => onFindingClick(finding.id)}
              className="w-full rounded-xl bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md dark:bg-slate-800"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${SEVERITY_COLORS[finding.severity]}20` }}
                  >
                    <PiWarning
                      className="h-4 w-4"
                      style={{ color: SEVERITY_COLORS[finding.severity] }}
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">{finding.type}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {finding.facetId ? `Facet ${finding.facetId}` : 'General'}
                    </p>
                  </div>
                </div>
                <span
                  className="rounded-full px-2 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: `${SEVERITY_COLORS[finding.severity]}20`,
                    color: SEVERITY_COLORS[finding.severity]
                  }}
                >
                  {finding.severity}
                </span>
              </div>

              <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">{finding.evidence}</p>

              <div className="mb-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <PiMapPin className="h-3 w-3" />
                {finding.locationNotes}
              </div>

              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Recommended Action
                </p>
                <p className="mt-1 text-sm text-slate-800 dark:text-white">
                  {finding.recommendedAction}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-blue-600 dark:text-blue-400">Click to highlight on map</span>
                <span className="text-slate-400">
                  Confidence: {Math.round(finding.confidence * 100)}%
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white p-12 shadow-sm dark:bg-slate-800">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <PiCheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-slate-800 dark:text-white">
            No Visible Deficiencies Detected
          </h3>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            This analysis is based on satellite imagery only and does not replace a professional
            on-site inspection.
          </p>
        </div>
      )}

      {/* Limitations */}
      {conditions.limitations.length > 0 && (
        <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-700/50">
          <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Analysis Limitations
          </h4>
          <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
            {conditions.limitations.map((limitation, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400" />
                {limitation}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
