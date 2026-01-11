// Roof Takeoff Analysis Types

export type RoofShape = 'GABLE' | 'HIP' | 'L-SHAPE' | 'COMPLEX' | 'FLAT' | 'MIXED';
export type ConditionRating = 'POOR' | 'FAIR' | 'GOOD' | 'UNKNOWN';
export type Severity = 'LOW' | 'MED' | 'HIGH';
export type SegmentType = 'EAVE' | 'RAKE' | 'RIDGE' | 'HIP' | 'VALLEY' | 'WALL_FLASHING' | 'STEP_FLASHING' | 'DRIP_EDGE';
export type AnalysisStatus = 'OK' | 'LOW_CONFIDENCE' | 'NEEDS_SCALE' | 'NEEDS_IMAGERY';

export interface Coordinates {
  lat: number | null;
  lng: number | null;
}

export interface NormalizedPoint {
  x: number;
  y: number;
}

export interface Property {
  address: string | null;
  coordinates: Coordinates;
}

export interface RoofPlane {
  facetId: string;
  areaSqFt: number | null;
  pitch: string | null;
  confidence: number;
}

export interface Geometry {
  roofShape: RoofShape | null;
  facets: number | null;
  pitchRange: string | null;
  predominantPitch: string | null;
  totalPlanAreaSqFt: number | null;
  totalSurfaceAreaSqFt: number | null;
  netAreaSqFt: number | null;
  wasteFactor: number | null;
  complexityIndex: number | null;
  planes: RoofPlane[];
}

export interface LinearRanges {
  eavesFt: [number, number] | null;
  rakesFt: [number, number] | null;
  ridgesFt: [number, number] | null;
  hipsFt: [number, number] | null;
  valleysFt: [number, number] | null;
}

export interface Linear {
  eavesFt: number | null;
  rakesFt: number | null;
  ridgesFt: number | null;
  hipsFt: number | null;
  valleysFt: number | null;
  wallFlashingFt: number | null;
  stepFlashingFt: number | null;
  dripEdgeFt: number | null;
  confidence: number;
  rangesFt: LinearRanges;
}

export interface PenetrationItem {
  type: string;
  count: number;
  notes: string | null;
}

export interface Penetrations {
  totalCount: number | null;
  items: PenetrationItem[];
  confidence: number;
}

export interface Finding {
  id: string;
  type: string;
  severity: Severity;
  facetId: string | null;
  locationNotes: string;
  evidence: string;
  recommendedAction: string;
  confidence: number;
}

export interface Conditions {
  overallCondition: ConditionRating;
  estimatedAge: string | null;
  layers: number | null;
  riskFactors: string[];
  findings: Finding[];
  limitations: string[];
}

export interface QuantitySummary {
  squares: number | null;
  bundles: number | null;
  ridgeCapFt: number | null;
  starterFt: number | null;
}

export interface CostBreakdown {
  materialsLow: number | null;
  materialsTypical: number | null;
  materialsHigh: number | null;
  laborLow: number | null;
  laborTypical: number | null;
  laborHigh: number | null;
  tearOffAndDisposal: number | null;
  permitAllowance: number | null;
  overheadAndProfit: number | null;
}

export interface Source {
  url: string;
  note: string;
}

export interface EstimateOption {
  optionName: string;
  systemType: string;
  quantitySummary: QuantitySummary;
  costBreakdown: CostBreakdown;
  totalLow: number | null;
  totalTypical: number | null;
  totalHigh: number | null;
  assumptions: string[];
  sources: Source[];
}

export interface Opportunity {
  name: string;
  why: string;
  roughRange: string | null;
}

export interface Analysis {
  geometry: Geometry;
  linear: Linear;
  penetrations: Penetrations;
  conditions: Conditions;
  estimateOptions: EstimateOption[];
  opportunities: Opportunity[];
  sources: Source[];
}

export interface ImageMetaUsed {
  imageWidthPx: number | null;
  imageHeightPx: number | null;
  centerLat: number | null;
  centerLng: number | null;
  zoom: number | null;
  metersPerPixel: number | null;
  bearingDegrees: number | null;
  captureDate: string | null;
  notes: string | null;
}

export interface RoofOutline {
  normalizedPolygon: NormalizedPoint[];
  confidence: number;
  notes: string | null;
}

export interface FacetOverlay {
  facetId: string;
  normalizedPolygon: NormalizedPoint[];
  labelPoint: NormalizedPoint;
  confidence: number;
}

export interface Segment {
  id: string;
  type: SegmentType;
  label: string;
  start: NormalizedPoint;
  end: NormalizedPoint;
  lengthFt: number | null;
  lengthFtRange: [number, number] | null;
  confidence: number;
}

export interface FindingHighlight {
  findingId: string;
  highlightPolygon: NormalizedPoint[];
}

export interface JumpTo {
  findingsToOverlay: FindingHighlight[];
}

export interface Exports {
  geojson: object | null;
  svgPath: string | null;
}

export interface Overlay {
  imageMetaUsed: ImageMetaUsed;
  roofOutline: RoofOutline;
  facetOverlays: FacetOverlay[];
  segments: Segment[];
  jumpTo: JumpTo;
  exports: Exports;
}

export interface RoofAnalysisResult {
  status: AnalysisStatus;
  property: Property;
  analysis: Analysis;
  overlay: Overlay;
  summary: string;
  confidenceOverall: number;
}

// Progress Events for Loading Screen
export interface ProgressEvent {
  id: string;
  label: string;
  percentStart: number;
  percentEnd: number;
  messages: string[];
}

export const PROGRESS_EVENTS: ProgressEvent[] = [
  {
    id: 'resolve_property',
    label: 'Resolving property location',
    percentStart: 0,
    percentEnd: 10,
    messages: ['Validating input…', 'Locating property…']
  },
  {
    id: 'load_imagery',
    label: 'Loading imagery',
    percentStart: 10,
    percentEnd: 25,
    messages: ['Fetching satellite imagery…', 'Preparing analysis view…']
  },
  {
    id: 'trace_outline',
    label: 'Tracing roof outline',
    percentStart: 25,
    percentEnd: 55,
    messages: ['Detecting roof edges…', 'Mapping facet boundaries…', 'Aligning outline to roof…']
  },
  {
    id: 'compute_takeoff',
    label: 'Computing measurements',
    percentStart: 55,
    percentEnd: 75,
    messages: ['Calculating edges and areas…', 'Estimating complexity…']
  },
  {
    id: 'check_defects',
    label: 'Checking visible issues',
    percentStart: 75,
    percentEnd: 90,
    messages: ['Scanning for deficiencies…', 'Assessing condition…']
  },
  {
    id: 'pricing',
    label: 'Building estimates',
    percentStart: 90,
    percentEnd: 100,
    messages: ['Generating pricing…', 'Finalizing report…']
  }
];

// Segment color mapping
export const SEGMENT_COLORS: Record<SegmentType, string> = {
  EAVE: '#10B981',
  RAKE: '#F59E0B',
  RIDGE: '#EF4444',
  HIP: '#8B5CF6',
  VALLEY: '#06B6D4',
  WALL_FLASHING: '#EC4899',
  STEP_FLASHING: '#F97316',
  DRIP_EDGE: '#84CC16'
};

// Condition colors
export const CONDITION_COLORS: Record<ConditionRating, string> = {
  GOOD: '#10B981',
  FAIR: '#F59E0B',
  POOR: '#EF4444',
  UNKNOWN: '#6B7280'
};

// Severity colors
export const SEVERITY_COLORS: Record<Severity, string> = {
  HIGH: '#DC2626',
  MED: '#F59E0B',
  LOW: '#3B82F6'
};
