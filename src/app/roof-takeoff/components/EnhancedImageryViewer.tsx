'use client';

import { useState, useRef, useCallback } from 'react';
import {
  PiMagnifyingGlassPlus,
  PiMagnifyingGlassMinus,
  PiArrowsOut,
  PiStack,
  PiEye,
  PiEyeSlash,
  PiMapPin,
  PiCamera
} from 'react-icons/pi';
import { Overlay, SEGMENT_COLORS, SEVERITY_COLORS, SegmentType } from '../types';
import { CapturedImage, ImageThumbnailGallery, DirectionCompass } from './MultiAngleCapture';

interface OverlayLayers {
  roofOutline: boolean;
  facets: boolean;
  segments: boolean;
  findings: boolean;
}

interface EnhancedImageryViewerProps {
  images: CapturedImage[];
  overlay: Overlay;
  overlayLayers: OverlayLayers;
  onToggleLayer: (layer: keyof OverlayLayers) => void;
  highlightedFindingId: string | null;
}

const FACET_COLORS = [
  'rgba(59, 130, 246, 0.2)',
  'rgba(16, 185, 129, 0.2)',
  'rgba(245, 158, 11, 0.2)',
  'rgba(139, 92, 246, 0.2)',
  'rgba(236, 72, 153, 0.2)',
  'rgba(6, 182, 212, 0.2)'
];

export default function EnhancedImageryViewer({
  images,
  overlay,
  overlayLayers,
  onToggleLayer,
  highlightedFindingId
}: EnhancedImageryViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedImage, setSelectedImage] = useState<CapturedImage>(
    images.find((img) => img.id === 'satellite-main') || images[0]
  );
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [opacity, setOpacity] = useState(0.8);
  const [showThumbnails, setShowThumbnails] = useState(true);

  const imageSize = { width: 640, height: selectedImage.type === 'streetview' ? 480 : 640 };

  // Only show overlays on satellite images
  const showOverlays = selectedImage.type === 'satellite' && selectedImage.id === 'satellite-main';

  // Handle zoom
  const handleZoom = useCallback((delta: number) => {
    setZoom((prev) => Math.max(0.5, Math.min(4, prev + delta)));
  }, []);

  // Handle wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      handleZoom(delta);
    },
    [handleZoom]
  );

  // Handle drag
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    },
    [pan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Reset view
  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Convert normalized coords to pixel coords
  const toPixel = useCallback(
    (point: { x: number; y: number }) => ({
      x: point.x * imageSize.width,
      y: point.y * imageSize.height
    }),
    [imageSize]
  );

  // Generate polygon path
  const polygonToPath = useCallback(
    (points: { x: number; y: number }[]) => {
      if (points.length === 0) return '';
      const pixelPoints = points.map(toPixel);
      return `M ${pixelPoints.map((p) => `${p.x} ${p.y}`).join(' L ')} Z`;
    },
    [toPixel]
  );

  const handleImageSelect = useCallback((img: CapturedImage) => {
    setSelectedImage(img);
    resetView();
  }, [resetView]);

  return (
    <div className="flex h-full flex-col bg-slate-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-700 bg-slate-800 px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleZoom(0.2)}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
            title="Zoom In"
          >
            <PiMagnifyingGlassPlus className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleZoom(-0.2)}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
            title="Zoom Out"
          >
            <PiMagnifyingGlassMinus className="h-5 w-5" />
          </button>
          <button
            onClick={resetView}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
            title="Fit to View"
          >
            <PiArrowsOut className="h-5 w-5" />
          </button>
          <span className="ml-2 text-sm text-slate-400">{Math.round(zoom * 100)}%</span>

          <div className="ml-4 h-6 w-px bg-slate-700" />

          {/* Current view indicator */}
          <div className="ml-2 flex items-center gap-2">
            <span
              className={`rounded px-2 py-0.5 text-xs font-medium ${
                selectedImage.type === 'satellite'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-green-500/20 text-green-400'
              }`}
            >
              {selectedImage.type === 'satellite' ? 'AERIAL' : 'STREET'}
            </span>
            <span className="text-sm text-slate-300">{selectedImage.label}</span>
            {selectedImage.heading !== undefined && selectedImage.type === 'streetview' && (
              <DirectionCompass heading={selectedImage.heading} />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              showThumbnails
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <PiCamera className="h-4 w-4" />
            Views
          </button>
          {showOverlays && (
            <button
              onClick={() => setShowLayerPanel(!showLayerPanel)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                showLayerPanel
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <PiStack className="h-4 w-4" />
              Layers
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative flex-1 overflow-hidden">
        {/* Thumbnail Panel */}
        {showThumbnails && (
          <div className="absolute left-4 top-4 z-20 w-44 rounded-xl bg-slate-800/95 p-3 shadow-xl backdrop-blur">
            <ImageThumbnailGallery
              images={images}
              selectedId={selectedImage.id}
              onSelect={handleImageSelect}
            />
          </div>
        )}

        {/* Layer Panel */}
        {showLayerPanel && showOverlays && (
          <div className="absolute right-4 top-4 z-20 w-56 rounded-xl bg-slate-800/95 p-4 shadow-xl backdrop-blur">
            <h3 className="mb-3 text-sm font-semibold text-white">Overlay Layers</h3>

            <div className="space-y-2">
              {[
                { key: 'roofOutline', label: 'Roof Outline', color: '#2563EB' },
                { key: 'facets', label: 'Facets', color: '#3B82F6' },
                { key: 'segments', label: 'Edges & Labels', color: '#10B981' },
                { key: 'findings', label: 'Issues', color: '#EF4444' }
              ].map((layer) => (
                <button
                  key={layer.key}
                  onClick={() => onToggleLayer(layer.key as keyof OverlayLayers)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-slate-700"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: layer.color }}
                    />
                    <span className="text-sm text-slate-300">{layer.label}</span>
                  </div>
                  {overlayLayers[layer.key as keyof OverlayLayers] ? (
                    <PiEye className="h-4 w-4 text-blue-400" />
                  ) : (
                    <PiEyeSlash className="h-4 w-4 text-slate-500" />
                  )}
                </button>
              ))}
            </div>

            <div className="mt-4 border-t border-slate-700 pt-4">
              <label className="mb-2 block text-xs text-slate-400">Opacity</label>
              <input
                type="range"
                min="0"
                max="100"
                value={opacity * 100}
                onChange={(e) => setOpacity(parseInt(e.target.value) / 100)}
                className="w-full accent-blue-500"
              />
            </div>
          </div>
        )}

        {/* Image Container */}
        <div
          ref={containerRef}
          className="flex h-full cursor-grab items-center justify-center active:cursor-grabbing"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
          >
            <div className="relative">
              {/* Image */}
              <img
                src={selectedImage.url}
                alt={selectedImage.label}
                className="max-w-none"
                style={{ width: imageSize.width, height: imageSize.height }}
                draggable={false}
              />

              {/* SVG Overlay - Only on main satellite image */}
              {showOverlays && (
                <svg
                  className="pointer-events-none absolute left-0 top-0"
                  width={imageSize.width}
                  height={imageSize.height}
                  style={{ opacity }}
                >
                  {/* Facet Overlays */}
                  {overlayLayers.facets &&
                    overlay.facetOverlays.map((facet, index) => (
                      <g key={facet.facetId}>
                        <path
                          d={polygonToPath(facet.normalizedPolygon)}
                          fill={FACET_COLORS[index % FACET_COLORS.length]}
                          stroke={FACET_COLORS[index % FACET_COLORS.length].replace('0.2', '0.8')}
                          strokeWidth="1"
                        />
                        <text
                          x={facet.labelPoint.x * imageSize.width}
                          y={facet.labelPoint.y * imageSize.height}
                          fill="white"
                          fontSize="12"
                          fontWeight="bold"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                        >
                          {facet.facetId}
                        </text>
                      </g>
                    ))}

                  {/* Roof Outline */}
                  {overlayLayers.roofOutline && overlay.roofOutline.normalizedPolygon.length > 0 && (
                    <path
                      d={polygonToPath(overlay.roofOutline.normalizedPolygon)}
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="3"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Segments */}
                  {overlayLayers.segments &&
                    overlay.segments.map((segment) => {
                      const start = toPixel(segment.start);
                      const end = toPixel(segment.end);
                      const color = SEGMENT_COLORS[segment.type as SegmentType] || '#FFFFFF';
                      const midX = (start.x + end.x) / 2;
                      const midY = (start.y + end.y) / 2;

                      return (
                        <g key={segment.id}>
                          <line
                            x1={start.x}
                            y1={start.y}
                            x2={end.x}
                            y2={end.y}
                            stroke={color}
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          {segment.lengthFt && (
                            <text
                              x={midX}
                              y={midY - 8}
                              fill="white"
                              fontSize="10"
                              textAnchor="middle"
                              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                            >
                              {segment.lengthFt.toFixed(1)} ft
                            </text>
                          )}
                        </g>
                      );
                    })}

                  {/* Finding Highlights */}
                  {overlayLayers.findings &&
                    overlay.jumpTo.findingsToOverlay.map((finding) => {
                      const isHighlighted = highlightedFindingId === finding.findingId;
                      const color = SEVERITY_COLORS.HIGH;

                      return (
                        <path
                          key={finding.findingId}
                          d={polygonToPath(finding.highlightPolygon)}
                          fill={isHighlighted ? `${color}40` : `${color}20`}
                          stroke={color}
                          strokeWidth={isHighlighted ? '3' : '2'}
                          strokeDasharray={isHighlighted ? 'none' : '4,2'}
                          className={isHighlighted ? 'animate-pulse' : ''}
                        />
                      );
                    })}
                </svg>
              )}

              {/* Street View Info Overlay */}
              {selectedImage.type === 'streetview' && (
                <div className="absolute bottom-4 left-4 rounded-lg bg-black/70 px-3 py-2 backdrop-blur">
                  <p className="text-xs text-white">{selectedImage.description}</p>
                  {selectedImage.heading !== undefined && (
                    <p className="mt-1 text-[10px] text-slate-400">
                      Heading: {selectedImage.heading}° | Pitch: {selectedImage.pitch}°
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Legend */}
        {showOverlays && overlayLayers.segments && (
          <div className="absolute bottom-4 left-4 rounded-lg bg-slate-800/90 p-3">
            <h4 className="mb-2 text-xs font-semibold text-slate-400">Edge Types</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {Object.entries(SEGMENT_COLORS).map(([type, color]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className="h-0.5 w-4" style={{ backgroundColor: color }} />
                  <span className="text-xs text-slate-300">{type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View Description */}
        <div className="absolute bottom-4 right-4 max-w-xs rounded-lg bg-slate-800/90 p-3">
          <p className="text-xs text-slate-300">{selectedImage.description}</p>
        </div>
      </div>
    </div>
  );
}
