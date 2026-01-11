// Roof Takeoff Analysis Types - World-Class Analytics Suite

export type RoofShape = 'GABLE' | 'HIP' | 'L-SHAPE' | 'COMPLEX' | 'FLAT' | 'MIXED' | 'GAMBREL' | 'MANSARD' | 'SHED' | 'DUTCH_HIP' | 'BUTTERFLY' | 'SAWTOOTH';
export type ConditionRating = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL' | 'UNKNOWN';
export type Severity = 'LOW' | 'MED' | 'HIGH' | 'CRITICAL';
export type SegmentType = 'EAVE' | 'RAKE' | 'RIDGE' | 'HIP' | 'VALLEY' | 'WALL_FLASHING' | 'STEP_FLASHING' | 'DRIP_EDGE' | 'GUTTER' | 'DOWNSPOUT' | 'FASCIA' | 'SOFFIT';
export type AnalysisStatus = 'OK' | 'LOW_CONFIDENCE' | 'NEEDS_SCALE' | 'NEEDS_IMAGERY' | 'PARTIAL' | 'ENHANCED';
export type MaterialType = 'ASPHALT_3TAB' | 'ASPHALT_ARCHITECTURAL' | 'ASPHALT_LUXURY' | 'METAL_STANDING_SEAM' | 'METAL_CORRUGATED' | 'METAL_STONE_COATED' | 'TILE_CLAY' | 'TILE_CONCRETE' | 'SLATE_NATURAL' | 'SLATE_SYNTHETIC' | 'WOOD_SHAKE' | 'WOOD_SHINGLE' | 'TPO' | 'EPDM' | 'BUILT_UP' | 'MODIFIED_BITUMEN' | 'PVC' | 'SPRAY_FOAM' | 'GREEN_ROOF' | 'SOLAR_SHINGLE' | 'UNKNOWN';
export type ClimateZone = 'ZONE_1' | 'ZONE_2' | 'ZONE_3' | 'ZONE_4' | 'ZONE_5' | 'ZONE_6' | 'ZONE_7' | 'ZONE_8';
export type WindZone = 'BASIC' | 'MODERATE' | 'HIGH' | 'VERY_HIGH' | 'HURRICANE';
export type DrainagePattern = 'EXCELLENT' | 'GOOD' | 'ADEQUATE' | 'POOR' | 'CRITICAL';

export interface Coordinates {
  lat: number | null;
  lng: number | null;
}

export interface NormalizedPoint {
  x: number;
  y: number;
}

// ============== PROPERTY INTELLIGENCE ==============
export interface PropertyOwnership {
  ownerName: string | null;
  ownerType: 'INDIVIDUAL' | 'CORPORATION' | 'TRUST' | 'GOVERNMENT' | 'UNKNOWN';
  mailingAddress: string | null;
  purchaseDate: string | null;
  purchasePrice: number | null;
  ownershipLength: string | null;
}

export interface PropertyTax {
  assessedValue: number | null;
  landValue: number | null;
  improvementValue: number | null;
  annualTax: number | null;
  taxYear: number | null;
  taxExemptions: string[];
}

export interface BuildingCharacteristics {
  yearBuilt: number | null;
  buildingSqFt: number | null;
  stories: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  lotSizeSqFt: number | null;
  lotSizeAcres: number | null;
  constructionType: string | null;
  foundationType: string | null;
  heatingType: string | null;
  coolingType: string | null;
  exteriorWall: string | null;
  garageType: string | null;
  garageSqFt: number | null;
  pool: boolean;
  fireplace: boolean;
}

export interface PermitHistory {
  permitNumber: string;
  permitType: string;
  issueDate: string;
  status: string;
  description: string;
  contractor: string | null;
  estimatedCost: number | null;
}

export interface PropertyIntelligence {
  ownership: PropertyOwnership;
  tax: PropertyTax;
  building: BuildingCharacteristics;
  permits: PermitHistory[];
  lastRoofPermit: PermitHistory | null;
  estimatedRoofAge: number | null;
  roofAgeConfidence: number;
  neighborhoodData: {
    medianHomeValue: number | null;
    avgRoofAge: number | null;
    recentRoofReplacements: number | null;
  };
}

// ============== WEATHER & CLIMATE ANALYSIS ==============
export interface StormEvent {
  date: string;
  type: 'HAIL' | 'WIND' | 'TORNADO' | 'HURRICANE' | 'ICE_STORM' | 'FLOODING' | 'LIGHTNING';
  severity: string;
  hailSizeInches: number | null;
  windSpeedMph: number | null;
  damageReported: boolean;
  distanceMiles: number;
}

export interface ClimateData {
  climateZone: ClimateZone;
  windZone: WindZone;
  avgAnnualRainfallInches: number;
  avgAnnualSnowfallInches: number;
  freezeThawCycles: number;
  avgSummerHighF: number;
  avgWinterLowF: number;
  uvIndex: number;
  humidityAvg: number;
  coastalProximityMiles: number | null;
}

export interface WeatherRiskAnalysis {
  climate: ClimateData;
  stormHistory: {
    last5Years: StormEvent[];
    significantEvents: StormEvent[];
    hailEventsCount: number;
    windEventsCount: number;
    totalStormEvents: number;
  };
  riskScores: {
    hailRisk: number; // 0-100
    windRisk: number;
    iceRisk: number;
    uvDegradation: number;
    moistureRisk: number;
    overallWeatherRisk: number;
  };
  recommendations: string[];
}

// ============== INSURANCE & RISK SCORING ==============
export interface InsuranceRiskModel {
  roofConditionScore: number; // 0-100
  ageDepreciationFactor: number; // 0-1
  materialDurabilityScore: number;
  stormSusceptibilityScore: number;
  maintenanceHistoryScore: number;
  overallInsurabilityScore: number;

  estimatedReplacementCost: {
    actualCashValue: number | null;
    replacementCostValue: number | null;
    depreciatedValue: number | null;
  };

  claimProbability: {
    next1Year: number;
    next5Years: number;
    primaryRiskFactors: string[];
  };

  insuranceRecommendations: {
    suggestedDeductible: number | null;
    windMitigationCredits: string[];
    requiredInspections: string[];
    policyConsiderations: string[];
  };
}

// ============== SOLAR & ENERGY ANALYSIS ==============
export interface SolarAnalysis {
  suitabilityScore: number; // 0-100
  usableAreaSqFt: number;
  estimatedPanelCount: number;
  systemSizeKw: number;

  sunExposure: {
    avgPeakSunHours: number;
    annualIrradianceKwh: number;
    shadingFactor: number;
    optimalTilt: number;
    optimalAzimuth: number;
  };

  production: {
    yearOneKwh: number;
    year25Kwh: number;
    degradationRate: number;
    performanceRatio: number;
  };

  financial: {
    systemCostLow: number;
    systemCostHigh: number;
    federalTaxCredit: number;
    stateTaxCredit: number | null;
    utilityRebate: number | null;
    netCost: number;
    annualSavings: number;
    paybackYears: number;
    lifetimeSavings: number;
    roi: number;
  };

  compatibility: {
    structuralAdequacy: 'YES' | 'LIKELY' | 'INSPECTION_NEEDED' | 'NO';
    roofAgeCompatibility: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
    orientationRating: 'OPTIMAL' | 'GOOD' | 'ACCEPTABLE' | 'SUBOPTIMAL';
    notes: string[];
  };
}

export interface EnergyEfficiency {
  estimatedRValue: number | null;
  ventilationAdequacy: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'UNKNOWN';
  estimatedCoolingImpact: string;
  estimatedHeatingImpact: string;
  coolRoofPotential: boolean;
  radianceBarrierRecommended: boolean;
  atticInsulationNotes: string | null;
}

// ============== MATERIAL ANALYSIS ==============
export interface MaterialIdentification {
  primaryMaterial: MaterialType;
  materialConfidence: number;
  brand: string | null;
  color: string | null;
  style: string | null;

  characteristics: {
    estimatedAge: number | null;
    expectedLifespan: number;
    remainingLifespan: number | null;
    warrantyStatus: 'ACTIVE' | 'EXPIRED' | 'UNKNOWN';
    warrantyExpiration: string | null;
  };

  performance: {
    fireRating: string;
    windRating: string;
    impactRating: string;
    energyStarRated: boolean;
    coolRoofRated: boolean;
  };

  evidenceFromImages: string[];
}

export interface MaterialRecommendation {
  material: MaterialType;
  productName: string;
  manufacturer: string;
  tier: 'BUDGET' | 'MID_RANGE' | 'PREMIUM' | 'LUXURY';

  whyRecommended: string[];

  specifications: {
    warranty: string;
    fireRating: string;
    windRating: string;
    impactRating: string;
    colors: number;
    styles: string[];
  };

  pricing: {
    materialCostPerSqFt: number;
    laborCostPerSqFt: number;
    totalCostLow: number;
    totalCostTypical: number;
    totalCostHigh: number;
  };

  pros: string[];
  cons: string[];

  localAvailability: 'IN_STOCK' | 'SPECIAL_ORDER' | 'UNKNOWN';
  installationComplexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX';
  maintenanceRequirements: string;
}

// ============== 3D MODELING & GEOMETRY ==============
export interface Vertex3D {
  x: number;
  y: number;
  z: number;
}

export interface RoofPlane3D {
  facetId: string;
  vertices: Vertex3D[];
  normal: Vertex3D;
  areaSqFt: number;
  pitchDegrees: number;
  pitchRatio: string;
  azimuthDegrees: number;
  aspectDirection: string;
  centroid: Vertex3D;
}

export interface Model3D {
  vertices: Vertex3D[];
  faces: number[][];
  planes: RoofPlane3D[];

  dimensions: {
    lengthFt: number;
    widthFt: number;
    maxHeightFt: number;
    ridgeHeightFt: number;
    eaveHeightFt: number;
  };

  volumetrics: {
    atticVolumeCuFt: number | null;
    roofVolumeCuFt: number | null;
  };

  exportFormats: {
    objUrl: string | null;
    stlUrl: string | null;
    dxfUrl: string | null;
    idfcUrl: string | null;
  };
}

// ============== DRAINAGE ANALYSIS ==============
export interface DrainageAnalysis {
  overallPattern: DrainagePattern;

  gutterSystem: {
    present: boolean;
    type: string | null;
    condition: ConditionRating;
    linearFt: number | null;
    downspoutCount: number | null;
    adequacy: 'OVERSIZED' | 'ADEQUATE' | 'UNDERSIZED' | 'SEVERELY_UNDERSIZED';
  };

  pondingRisk: {
    areas: { location: string; severity: Severity }[];
    overallRisk: 'LOW' | 'MODERATE' | 'HIGH';
  };

  iceDamRisk: {
    score: number;
    vulnerableAreas: string[];
    mitigations: string[];
  };

  recommendations: string[];
}

// ============== COMPLIANCE & PERMITS ==============
export interface ComplianceAnalysis {
  buildingCode: {
    jurisdiction: string;
    codeYear: string;
    requiresPermit: boolean;
    permitCost: number | null;
    inspectionRequired: boolean;
  };

  hoaRestrictions: {
    hasHoa: boolean | null;
    materialRestrictions: string[];
    colorRestrictions: string[];
    approvalRequired: boolean;
    estimatedApprovalTime: string | null;
  };

  historicDistrict: {
    isHistoric: boolean;
    restrictions: string[];
    approvalProcess: string | null;
  };

  windMitigation: {
    currentRating: string | null;
    upgradePotential: string[];
    insuranceImpact: string | null;
  };

  solarReady: {
    structuralReady: boolean;
    electricalReady: boolean;
    permitRequired: boolean;
  };
}

// ============== DEFICIENCY CATEGORIZATION ==============
export interface DetailedFinding {
  id: string;
  category: 'STRUCTURAL' | 'SURFACE' | 'FLASHING' | 'PENETRATION' | 'DRAINAGE' | 'VENTILATION' | 'DEBRIS' | 'BIOLOGICAL' | 'WEATHERING';
  type: string;
  severity: Severity;
  urgency: 'IMMEDIATE' | 'SOON' | 'MONITOR' | 'INFORMATIONAL';

  location: {
    facetId: string | null;
    description: string;
    normalizedBounds: { x: number; y: number; width: number; height: number } | null;
  };

  evidence: {
    description: string;
    sourceImage: string | null;
    visualIndicators: string[];
    confidenceScore: number;
  };

  impact: {
    leakRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'IMMINENT';
    structuralRisk: 'LOW' | 'MODERATE' | 'HIGH';
    energyImpact: string | null;
    aestheticImpact: string | null;
  };

  repair: {
    recommendedAction: string;
    diyPossible: boolean;
    estimatedCostLow: number | null;
    estimatedCostHigh: number | null;
    timeframe: string;
    preventsFutureDamage: string[];
  };
}

// ============== CONTRACTOR MARKETPLACE ==============
export interface ContractorLead {
  companyName: string;
  rating: number;
  reviewCount: number;
  yearsInBusiness: number;
  licensed: boolean;
  insured: boolean;
  certifications: string[];
  specializations: string[];
  distanceMiles: number;
  estimateRange: { low: number; high: number } | null;
}

// ============== ENHANCED ORIGINAL TYPES ==============
export interface Property {
  address: string | null;
  coordinates: Coordinates;
  parcelNumber: string | null;
  subdivision: string | null;
  zoning: string | null;
}

export interface RoofPlane {
  facetId: string;
  areaSqFt: number | null;
  pitch: string | null;
  pitchDegrees: number | null;
  azimuth: number | null;
  aspectDirection: string | null;
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
  dominantOrientation: string | null;
  symmetryScore: number | null;
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
  gutterFt: number | null;
  fasciaFt: number | null;
  soffitSqFt: number | null;
  confidence: number;
  rangesFt: LinearRanges;
}

export interface PenetrationItem {
  type: string;
  count: number;
  flashingCondition: ConditionRating | null;
  notes: string | null;
}

export interface Penetrations {
  totalCount: number | null;
  items: PenetrationItem[];
  skylights: { count: number; condition: ConditionRating } | null;
  chimneys: { count: number; condition: ConditionRating; flashingCondition: ConditionRating } | null;
  vents: { count: number; types: string[] } | null;
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
  estimatedRepairCost: { low: number; high: number } | null;
  confidence: number;
}

export interface Conditions {
  overallCondition: ConditionRating;
  conditionScore: number | null; // 0-100
  estimatedAge: string | null;
  estimatedAgeYears: number | null;
  remainingLifeYears: number | null;
  layers: number | null;
  riskFactors: string[];
  findings: Finding[];
  detailedFindings: DetailedFinding[];
  limitations: string[];
  maintenanceHistory: string | null;
  lastInspection: string | null;
}

export interface QuantitySummary {
  squares: number | null;
  bundles: number | null;
  ridgeCapFt: number | null;
  starterFt: number | null;
  underlaymentSqFt: number | null;
  iceWaterShieldSqFt: number | null;
  flashingLf: number | null;
  ventCount: number | null;
  nailsPounds: number | null;
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
  dumpsterFees: number | null;
  overheadAndProfit: number | null;
  contingency: number | null;
}

export interface Source {
  url: string;
  note: string;
  type: 'PRICING' | 'REGULATION' | 'WEATHER' | 'PROPERTY' | 'TECHNICAL' | 'OTHER';
}

export interface EstimateOption {
  optionName: string;
  systemType: string;
  material: MaterialType;
  tier: 'BUDGET' | 'MID_RANGE' | 'PREMIUM' | 'LUXURY';
  quantitySummary: QuantitySummary;
  costBreakdown: CostBreakdown;
  totalLow: number | null;
  totalTypical: number | null;
  totalHigh: number | null;
  pricePerSqFt: number | null;
  assumptions: string[];
  warranty: {
    material: string;
    labor: string;
    total: string;
  };
  timeline: {
    estimatedDays: number;
    bestSeason: string;
  };
  sources: Source[];
}

export interface Opportunity {
  name: string;
  category: 'UPGRADE' | 'MAINTENANCE' | 'ENERGY' | 'SAFETY' | 'VALUE_ADD';
  why: string;
  roughRange: string | null;
  roi: string | null;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface Analysis {
  geometry: Geometry;
  linear: Linear;
  penetrations: Penetrations;
  conditions: Conditions;
  material: MaterialIdentification;
  estimateOptions: EstimateOption[];
  materialRecommendations: MaterialRecommendation[];
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
  provider: string | null;
  resolution: string | null;
  notes: string | null;
}

export interface RoofOutline {
  normalizedPolygon: NormalizedPoint[];
  confidence: number;
  perimeterFt: number | null;
  notes: string | null;
}

export interface FacetOverlay {
  facetId: string;
  normalizedPolygon: NormalizedPoint[];
  labelPoint: NormalizedPoint;
  areaSqFt: number | null;
  pitch: string | null;
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
  condition: ConditionRating | null;
  confidence: number;
}

export interface FindingHighlight {
  findingId: string;
  highlightPolygon: NormalizedPoint[];
  markerPoint: NormalizedPoint | null;
}

export interface JumpTo {
  findingsToOverlay: FindingHighlight[];
}

export interface Exports {
  geojson: object | null;
  svgPath: string | null;
  pdfReportUrl: string | null;
  excelUrl: string | null;
  cadUrl: string | null;
}

export interface Overlay {
  imageMetaUsed: ImageMetaUsed;
  roofOutline: RoofOutline;
  facetOverlays: FacetOverlay[];
  segments: Segment[];
  jumpTo: JumpTo;
  exports: Exports;
}

// ============== MAIN ANALYSIS RESULT ==============
export interface RoofAnalysisResult {
  status: AnalysisStatus;
  analysisId: string | null;
  timestamp: string;

  property: Property;
  propertyIntelligence: PropertyIntelligence | null;

  analysis: Analysis;

  // Advanced Analytics
  weatherRisk: WeatherRiskAnalysis | null;
  insuranceRisk: InsuranceRiskModel | null;
  solarAnalysis: SolarAnalysis | null;
  energyEfficiency: EnergyEfficiency | null;
  drainage: DrainageAnalysis | null;
  compliance: ComplianceAnalysis | null;
  model3d: Model3D | null;

  overlay: Overlay;

  // Marketplace
  contractorLeads: ContractorLead[] | null;

  // Summary & Scores
  summary: string;
  executiveSummary: {
    headline: string;
    keyFindings: string[];
    immediateActions: string[];
    investmentPriorities: string[];
  } | null;

  scores: {
    overall: number; // 0-100
    condition: number;
    risk: number;
    solarPotential: number | null;
    investmentValue: number;
  } | null;

  confidenceOverall: number;
  dataQuality: {
    imageryQuality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
    measurementAccuracy: 'HIGH' | 'MODERATE' | 'LOW';
    analysisDepth: 'COMPREHENSIVE' | 'STANDARD' | 'BASIC';
    limitations: string[];
  } | null;
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
    label: 'Resolving property',
    percentStart: 0,
    percentEnd: 8,
    messages: ['Validating input…', 'Locating property…', 'Fetching property records…']
  },
  {
    id: 'property_intel',
    label: 'Gathering property intelligence',
    percentStart: 8,
    percentEnd: 18,
    messages: ['Retrieving ownership data…', 'Loading permit history…', 'Analyzing building characteristics…']
  },
  {
    id: 'load_imagery',
    label: 'Capturing multi-angle imagery',
    percentStart: 18,
    percentEnd: 30,
    messages: ['Fetching satellite imagery…', 'Loading street views…', 'Capturing oblique angles…']
  },
  {
    id: 'trace_outline',
    label: 'AI roof detection',
    percentStart: 30,
    percentEnd: 48,
    messages: ['Detecting roof edges…', 'Mapping facet boundaries…', 'Building 3D model…', 'Calculating precise geometry…']
  },
  {
    id: 'material_analysis',
    label: 'Material identification',
    percentStart: 48,
    percentEnd: 58,
    messages: ['Analyzing roofing material…', 'Estimating material age…', 'Assessing condition…']
  },
  {
    id: 'compute_takeoff',
    label: 'Computing measurements',
    percentStart: 58,
    percentEnd: 68,
    messages: ['Calculating areas…', 'Measuring linear components…', 'Computing waste factors…']
  },
  {
    id: 'check_defects',
    label: 'Deficiency detection',
    percentStart: 68,
    percentEnd: 78,
    messages: ['Scanning for damage…', 'Analyzing drainage patterns…', 'Checking penetrations…', 'Assessing overall condition…']
  },
  {
    id: 'weather_analysis',
    label: 'Weather risk analysis',
    percentStart: 78,
    percentEnd: 85,
    messages: ['Loading storm history…', 'Calculating risk scores…', 'Analyzing climate factors…']
  },
  {
    id: 'pricing',
    label: 'Building comprehensive estimates',
    percentStart: 85,
    percentEnd: 95,
    messages: ['Researching material costs…', 'Calculating labor rates…', 'Generating multi-tier estimates…', 'Computing ROI projections…']
  },
  {
    id: 'finalize',
    label: 'Finalizing report',
    percentStart: 95,
    percentEnd: 100,
    messages: ['Compiling analytics…', 'Generating insights…', 'Preparing dashboard…']
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
  DRIP_EDGE: '#84CC16',
  GUTTER: '#3B82F6',
  DOWNSPOUT: '#6366F1',
  FASCIA: '#A855F7',
  SOFFIT: '#14B8A6'
};

// Condition colors
export const CONDITION_COLORS: Record<ConditionRating, string> = {
  EXCELLENT: '#059669',
  GOOD: '#10B981',
  FAIR: '#F59E0B',
  POOR: '#EF4444',
  CRITICAL: '#991B1B',
  UNKNOWN: '#6B7280'
};

// Severity colors
export const SEVERITY_COLORS: Record<Severity, string> = {
  CRITICAL: '#7F1D1D',
  HIGH: '#DC2626',
  MED: '#F59E0B',
  LOW: '#3B82F6'
};

// Material display names
export const MATERIAL_NAMES: Record<MaterialType, string> = {
  ASPHALT_3TAB: '3-Tab Asphalt Shingles',
  ASPHALT_ARCHITECTURAL: 'Architectural Shingles',
  ASPHALT_LUXURY: 'Luxury/Designer Shingles',
  METAL_STANDING_SEAM: 'Standing Seam Metal',
  METAL_CORRUGATED: 'Corrugated Metal',
  METAL_STONE_COATED: 'Stone-Coated Metal',
  TILE_CLAY: 'Clay Tile',
  TILE_CONCRETE: 'Concrete Tile',
  SLATE_NATURAL: 'Natural Slate',
  SLATE_SYNTHETIC: 'Synthetic Slate',
  WOOD_SHAKE: 'Wood Shake',
  WOOD_SHINGLE: 'Wood Shingle',
  TPO: 'TPO Membrane',
  EPDM: 'EPDM Rubber',
  BUILT_UP: 'Built-Up Roofing',
  MODIFIED_BITUMEN: 'Modified Bitumen',
  PVC: 'PVC Membrane',
  SPRAY_FOAM: 'Spray Foam',
  GREEN_ROOF: 'Green/Living Roof',
  SOLAR_SHINGLE: 'Solar Shingles',
  UNKNOWN: 'Unknown Material'
};
