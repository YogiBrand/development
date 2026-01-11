'use client';

import { RoofAnalysisResult, SEGMENT_COLORS } from '../../types';

interface MeasurementsTabProps {
  result: RoofAnalysisResult;
}

export default function MeasurementsTab({ result }: MeasurementsTabProps) {
  const { geometry, linear } = result.analysis;

  return (
    <div className="space-y-4">
      {/* Area Totals */}
      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
        <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-white">Area Summary</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <AreaCard
            label="Plan Area"
            value={geometry.totalPlanAreaSqFt}
            tooltip="Horizontal projection area"
          />
          <AreaCard
            label="Surface Area"
            value={geometry.totalSurfaceAreaSqFt}
            tooltip="Actual roof surface area including pitch"
          />
          <AreaCard
            label="Net Area"
            value={geometry.netAreaSqFt}
            tooltip="After penetration deductions"
          />
          <AreaCard
            label="Waste Factor"
            value={geometry.wasteFactor ? geometry.wasteFactor * 100 : null}
            suffix="%"
            tooltip="Material waste allowance"
          />
        </div>
      </div>

      {/* Facet Table */}
      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
        <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-white">
          Facet Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="pb-3 text-left font-medium text-slate-600 dark:text-slate-400">
                  Facet
                </th>
                <th className="pb-3 text-right font-medium text-slate-600 dark:text-slate-400">
                  Area (sq ft)
                </th>
                <th className="pb-3 text-right font-medium text-slate-600 dark:text-slate-400">
                  Pitch
                </th>
                <th className="pb-3 text-right font-medium text-slate-600 dark:text-slate-400">
                  Confidence
                </th>
              </tr>
            </thead>
            <tbody>
              {geometry.planes.map((plane, index) => (
                <tr
                  key={plane.facetId}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-700/50"
                >
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor: `hsl(${(index * 60) % 360}, 70%, 60%)`
                        }}
                      />
                      <span className="font-medium text-slate-800 dark:text-white">
                        {plane.facetId}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-right text-slate-600 dark:text-slate-400">
                    {plane.areaSqFt?.toLocaleString() || '—'}
                  </td>
                  <td className="py-3 text-right text-slate-600 dark:text-slate-400">
                    {plane.pitch || '—'}
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        plane.confidence >= 0.8
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : plane.confidence >= 0.5
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {Math.round(plane.confidence * 100)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Linear Takeoff */}
      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
        <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-white">
          Linear Takeoff
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <LinearRow
            label="Eaves"
            value={linear.eavesFt}
            range={linear.rangesFt.eavesFt}
            color={SEGMENT_COLORS.EAVE}
          />
          <LinearRow
            label="Rakes"
            value={linear.rakesFt}
            range={linear.rangesFt.rakesFt}
            color={SEGMENT_COLORS.RAKE}
          />
          <LinearRow
            label="Ridges"
            value={linear.ridgesFt}
            range={linear.rangesFt.ridgesFt}
            color={SEGMENT_COLORS.RIDGE}
          />
          <LinearRow
            label="Hips"
            value={linear.hipsFt}
            range={linear.rangesFt.hipsFt}
            color={SEGMENT_COLORS.HIP}
          />
          <LinearRow
            label="Valleys"
            value={linear.valleysFt}
            range={linear.rangesFt.valleysFt}
            color={SEGMENT_COLORS.VALLEY}
          />
          <LinearRow label="Wall Flashing" value={linear.wallFlashingFt} color={SEGMENT_COLORS.WALL_FLASHING} />
          <LinearRow label="Step Flashing" value={linear.stepFlashingFt} color={SEGMENT_COLORS.STEP_FLASHING} />
          <LinearRow label="Drip Edge" value={linear.dripEdgeFt} color={SEGMENT_COLORS.DRIP_EDGE} />
        </div>
        <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">Linear Confidence</span>
            <span
              className={`font-medium ${
                linear.confidence >= 0.8
                  ? 'text-green-600 dark:text-green-400'
                  : linear.confidence >= 0.5
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
              }`}
            >
              {Math.round(linear.confidence * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Penetrations */}
      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
        <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-white">Penetrations</h3>
        {result.analysis.penetrations.items.length > 0 ? (
          <div className="space-y-2">
            {result.analysis.penetrations.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-700/50"
              >
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">{item.type}</p>
                  {item.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.notes}</p>
                  )}
                </div>
                <span className="text-lg font-bold text-slate-800 dark:text-white">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">No penetrations detected</p>
        )}
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">Total Count</span>
          <span className="font-bold text-slate-800 dark:text-white">
            {result.analysis.penetrations.totalCount || 0}
          </span>
        </div>
      </div>
    </div>
  );
}

function AreaCard({
  label,
  value,
  suffix = 'sq ft',
  tooltip
}: {
  label: string;
  value: number | null;
  suffix?: string;
  tooltip?: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50" title={tooltip}>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-lg font-bold text-slate-800 dark:text-white">
        {value !== null ? value.toLocaleString() : '—'}
        {value !== null && (
          <span className="ml-1 text-xs font-normal text-slate-400">{suffix}</span>
        )}
      </p>
    </div>
  );
}

function LinearRow({
  label,
  value,
  range,
  color
}: {
  label: string;
  value: number | null;
  range?: [number, number] | null;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-700/50">
      <div className="flex items-center gap-2">
        <div className="h-0.5 w-4" style={{ backgroundColor: color }} />
        <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      </div>
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
