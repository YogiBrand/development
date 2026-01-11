'use client';

import { useState } from 'react';
import {
  PiFilePdf,
  PiFileCode,
  PiFileImage,
  PiTable,
  PiDownload,
  PiCheck,
  PiSpinner
} from 'react-icons/pi';
import { RoofAnalysisResult } from '../../types';

interface ExportTabProps {
  result: RoofAnalysisResult;
  satelliteImageUrl: string;
}

type ExportFormat = 'pdf' | 'geojson' | 'svg' | 'csv' | 'json';

export default function ExportTab({ result, satelliteImageUrl }: ExportTabProps) {
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
  const [exportedFormats, setExportedFormats] = useState<ExportFormat[]>([]);

  const handleExport = async (format: ExportFormat) => {
    setExportingFormat(format);

    try {
      let content: string;
      let filename: string;
      let mimeType: string;

      switch (format) {
        case 'json':
          content = JSON.stringify(result, null, 2);
          filename = 'roof-analysis.json';
          mimeType = 'application/json';
          break;

        case 'csv':
          content = generateCSV(result);
          filename = 'roof-measurements.csv';
          mimeType = 'text/csv';
          break;

        case 'geojson':
          content = JSON.stringify(generateGeoJSON(result), null, 2);
          filename = 'roof-geometry.geojson';
          mimeType = 'application/geo+json';
          break;

        case 'svg':
          content = generateSVG(result);
          filename = 'roof-overlay.svg';
          mimeType = 'image/svg+xml';
          break;

        case 'pdf':
          // For PDF, we'd normally use a library, but for now we'll generate HTML
          content = generatePDFHTML(result, satelliteImageUrl);
          filename = 'roof-report.html';
          mimeType = 'text/html';
          break;

        default:
          return;
      }

      // Create and trigger download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportedFormats((prev) => [...prev, format]);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExportingFormat(null);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Export your roof analysis data in various formats for documentation, integration, or
        sharing.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <ExportButton
          format="pdf"
          icon={PiFilePdf}
          label="Download PDF Report"
          description="Full report with imagery and overlay"
          primary
          isExporting={exportingFormat === 'pdf'}
          isExported={exportedFormats.includes('pdf')}
          onExport={() => handleExport('pdf')}
        />
        <ExportButton
          format="geojson"
          icon={PiFileCode}
          label="Export GeoJSON"
          description="Roof geometry for GIS applications"
          isExporting={exportingFormat === 'geojson'}
          isExported={exportedFormats.includes('geojson')}
          onExport={() => handleExport('geojson')}
        />
        <ExportButton
          format="svg"
          icon={PiFileImage}
          label="Export SVG Overlay"
          description="Vector overlay for design tools"
          isExporting={exportingFormat === 'svg'}
          isExported={exportedFormats.includes('svg')}
          onExport={() => handleExport('svg')}
        />
        <ExportButton
          format="csv"
          icon={PiTable}
          label="Export Measurements CSV"
          description="Tabular data for spreadsheets"
          isExporting={exportingFormat === 'csv'}
          isExported={exportedFormats.includes('csv')}
          onExport={() => handleExport('csv')}
        />
        <ExportButton
          format="json"
          icon={PiFileCode}
          label="Export Full JSON"
          description="Complete analysis data"
          isExporting={exportingFormat === 'json'}
          isExported={exportedFormats.includes('json')}
          onExport={() => handleExport('json')}
        />
      </div>

      {/* Share Options */}
      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
        <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-white">Share</h3>
        <div className="flex gap-3">
          <button
            onClick={() => {
              const url = window.location.href;
              navigator.clipboard.writeText(url);
            }}
            className="flex-1 rounded-lg bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
          >
            Copy Shareable Link
          </button>
          <button
            onClick={() => {
              const subject = encodeURIComponent('Roof Analysis Report');
              const body = encodeURIComponent(
                `Here is the roof analysis report for ${result.property.address || 'the property'}:\n\n${result.summary}`
              );
              window.open(`mailto:?subject=${subject}&body=${body}`);
            }}
            className="flex-1 rounded-lg bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
          >
            Email Report
          </button>
        </div>
      </div>
    </div>
  );
}

function ExportButton({
  format,
  icon: Icon,
  label,
  description,
  primary,
  isExporting,
  isExported,
  onExport
}: {
  format: ExportFormat;
  icon: React.ElementType;
  label: string;
  description: string;
  primary?: boolean;
  isExporting: boolean;
  isExported: boolean;
  onExport: () => void;
}) {
  return (
    <button
      onClick={onExport}
      disabled={isExporting}
      className={`flex items-start gap-4 rounded-xl p-4 text-left transition-all ${
        primary
          ? 'bg-blue-500 text-white hover:bg-blue-600'
          : 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700'
      } ${isExporting ? 'opacity-50' : ''}`}
    >
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
          primary
            ? 'bg-white/20'
            : 'bg-slate-100 dark:bg-slate-700'
        }`}
      >
        {isExporting ? (
          <PiSpinner
            className={`h-5 w-5 animate-spin ${primary ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}
          />
        ) : isExported ? (
          <PiCheck
            className={`h-5 w-5 ${primary ? 'text-white' : 'text-green-500'}`}
          />
        ) : (
          <Icon
            className={`h-5 w-5 ${primary ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}
          />
        )}
      </div>
      <div className="flex-1">
        <p
          className={`font-medium ${
            primary ? 'text-white' : 'text-slate-800 dark:text-white'
          }`}
        >
          {label}
        </p>
        <p
          className={`text-xs ${
            primary ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {description}
        </p>
      </div>
      <PiDownload
        className={`h-5 w-5 flex-shrink-0 ${
          primary ? 'text-white/70' : 'text-slate-400'
        }`}
      />
    </button>
  );
}

// Helper functions for export generation
function generateCSV(result: RoofAnalysisResult): string {
  const lines: string[] = [];

  // Header
  lines.push('Roof Analysis Report');
  lines.push(`Address,${result.property.address || ''}`);
  lines.push(`Coordinates,"${result.property.coordinates.lat}, ${result.property.coordinates.lng}"`);
  lines.push('');

  // Geometry
  lines.push('GEOMETRY');
  lines.push('Metric,Value');
  lines.push(`Roof Shape,${result.analysis.geometry.roofShape || ''}`);
  lines.push(`Total Plan Area (sq ft),${result.analysis.geometry.totalPlanAreaSqFt || ''}`);
  lines.push(`Total Surface Area (sq ft),${result.analysis.geometry.totalSurfaceAreaSqFt || ''}`);
  lines.push(`Facets,${result.analysis.geometry.facets || ''}`);
  lines.push(`Predominant Pitch,${result.analysis.geometry.predominantPitch || ''}`);
  lines.push('');

  // Linear
  lines.push('LINEAR MEASUREMENTS');
  lines.push('Type,Length (ft)');
  lines.push(`Eaves,${result.analysis.linear.eavesFt || ''}`);
  lines.push(`Rakes,${result.analysis.linear.rakesFt || ''}`);
  lines.push(`Ridges,${result.analysis.linear.ridgesFt || ''}`);
  lines.push(`Hips,${result.analysis.linear.hipsFt || ''}`);
  lines.push(`Valleys,${result.analysis.linear.valleysFt || ''}`);
  lines.push('');

  // Facets
  lines.push('FACET BREAKDOWN');
  lines.push('Facet ID,Area (sq ft),Pitch,Confidence');
  result.analysis.geometry.planes.forEach((plane) => {
    lines.push(`${plane.facetId},${plane.areaSqFt || ''},${plane.pitch || ''},${plane.confidence}`);
  });

  return lines.join('\n');
}

function generateGeoJSON(result: RoofAnalysisResult): object {
  const coords = result.property.coordinates;

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          type: 'roof_outline',
          address: result.property.address,
          totalArea: result.analysis.geometry.totalSurfaceAreaSqFt
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            result.overlay.roofOutline.normalizedPolygon.map((p) => [
              coords.lng! + (p.x - 0.5) * 0.001,
              coords.lat! + (0.5 - p.y) * 0.001
            ])
          ]
        }
      },
      ...result.overlay.facetOverlays.map((facet) => ({
        type: 'Feature',
        properties: {
          type: 'facet',
          facetId: facet.facetId
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            facet.normalizedPolygon.map((p) => [
              coords.lng! + (p.x - 0.5) * 0.001,
              coords.lat! + (0.5 - p.y) * 0.001
            ])
          ]
        }
      }))
    ]
  };
}

function generateSVG(result: RoofAnalysisResult): string {
  const width = 640;
  const height = 640;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;

  // Roof outline
  if (result.overlay.roofOutline.normalizedPolygon.length > 0) {
    const points = result.overlay.roofOutline.normalizedPolygon
      .map((p) => `${p.x * width},${p.y * height}`)
      .join(' ');
    svg += `<polygon points="${points}" fill="none" stroke="#2563EB" stroke-width="3"/>`;
  }

  // Facets
  result.overlay.facetOverlays.forEach((facet, index) => {
    const points = facet.normalizedPolygon
      .map((p) => `${p.x * width},${p.y * height}`)
      .join(' ');
    const hue = (index * 60) % 360;
    svg += `<polygon points="${points}" fill="hsla(${hue}, 70%, 60%, 0.2)" stroke="hsla(${hue}, 70%, 60%, 0.8)" stroke-width="1"/>`;
  });

  // Segments
  result.overlay.segments.forEach((segment) => {
    const x1 = segment.start.x * width;
    const y1 = segment.start.y * height;
    const x2 = segment.end.x * width;
    const y2 = segment.end.y * height;
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#10B981" stroke-width="2"/>`;
  });

  svg += '</svg>';
  return svg;
}

function generatePDFHTML(result: RoofAnalysisResult, imageUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Roof Analysis Report</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #1e40af; }
    h2 { color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
    .metric { display: inline-block; background: #f3f4f6; padding: 12px 20px; margin: 8px; border-radius: 8px; }
    .metric-label { font-size: 12px; color: #6b7280; }
    .metric-value { font-size: 24px; font-weight: bold; color: #111827; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; }
    .finding { background: #fef2f2; padding: 16px; margin: 12px 0; border-radius: 8px; border-left: 4px solid #ef4444; }
    .summary { background: #eff6ff; padding: 16px; border-radius: 8px; margin: 16px 0; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  <h1>Roof Analysis Report</h1>
  <p><strong>Address:</strong> ${result.property.address || 'N/A'}</p>
  <p><strong>Status:</strong> ${result.status}</p>
  <p><strong>Confidence:</strong> ${Math.round(result.confidenceOverall * 100)}%</p>

  <div class="summary">
    <h3>Summary</h3>
    <p>${result.summary}</p>
  </div>

  <h2>Key Metrics</h2>
  <div class="metric">
    <div class="metric-label">Total Area</div>
    <div class="metric-value">${result.analysis.geometry.totalSurfaceAreaSqFt?.toLocaleString() || '—'} sq ft</div>
  </div>
  <div class="metric">
    <div class="metric-label">Facets</div>
    <div class="metric-value">${result.analysis.geometry.facets || '—'}</div>
  </div>
  <div class="metric">
    <div class="metric-label">Roof Shape</div>
    <div class="metric-value">${result.analysis.geometry.roofShape || '—'}</div>
  </div>
  <div class="metric">
    <div class="metric-label">Condition</div>
    <div class="metric-value">${result.analysis.conditions.overallCondition}</div>
  </div>

  <h2>Linear Measurements</h2>
  <table>
    <tr><th>Type</th><th>Length (ft)</th></tr>
    <tr><td>Eaves</td><td>${result.analysis.linear.eavesFt?.toFixed(1) || '—'}</td></tr>
    <tr><td>Rakes</td><td>${result.analysis.linear.rakesFt?.toFixed(1) || '—'}</td></tr>
    <tr><td>Ridges</td><td>${result.analysis.linear.ridgesFt?.toFixed(1) || '—'}</td></tr>
    <tr><td>Hips</td><td>${result.analysis.linear.hipsFt?.toFixed(1) || '—'}</td></tr>
    <tr><td>Valleys</td><td>${result.analysis.linear.valleysFt?.toFixed(1) || '—'}</td></tr>
  </table>

  <h2>Facet Breakdown</h2>
  <table>
    <tr><th>Facet</th><th>Area (sq ft)</th><th>Pitch</th></tr>
    ${result.analysis.geometry.planes.map((p) => `<tr><td>${p.facetId}</td><td>${p.areaSqFt?.toLocaleString() || '—'}</td><td>${p.pitch || '—'}</td></tr>`).join('')}
  </table>

  ${result.analysis.conditions.findings.length > 0 ? `
  <h2>Deficiencies</h2>
  ${result.analysis.conditions.findings.map((f) => `
    <div class="finding">
      <strong>${f.type}</strong> (${f.severity})<br>
      <p>${f.evidence}</p>
      <p><em>Recommendation: ${f.recommendedAction}</em></p>
    </div>
  `).join('')}
  ` : ''}

  <h2>Estimate Options</h2>
  ${result.analysis.estimateOptions.map((opt) => `
    <div style="background: #f9fafb; padding: 16px; margin: 12px 0; border-radius: 8px;">
      <h3>${opt.optionName}</h3>
      <p>${opt.systemType}</p>
      <p><strong>Estimated Total: $${opt.totalTypical?.toLocaleString() || '—'}</strong></p>
      <p style="font-size: 12px; color: #6b7280;">Range: $${opt.totalLow?.toLocaleString() || '—'} – $${opt.totalHigh?.toLocaleString() || '—'}</p>
    </div>
  `).join('')}

  <p style="margin-top: 40px; font-size: 12px; color: #6b7280; text-align: center;">
    Generated by RoofScope • This report is for estimation purposes only and does not replace a professional inspection.
  </p>
</body>
</html>
  `;
}
