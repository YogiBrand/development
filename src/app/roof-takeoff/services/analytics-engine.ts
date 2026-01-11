// World-Class Roof Analytics Engine
// Provides comprehensive property analysis surpassing industry standards

import type {
  RoofAnalysisResult,
  PropertyIntelligence,
  WeatherRiskAnalysis,
  InsuranceRiskModel,
  SolarAnalysis,
  EnergyEfficiency,
  DrainageAnalysis,
  ComplianceAnalysis,
  MaterialIdentification,
  MaterialRecommendation,
  DetailedFinding,
  Coordinates,
  ClimateZone,
  WindZone,
  MaterialType,
  ConditionRating,
} from '../types';

// ============== CLIMATE ZONE DETERMINATION ==============
export function determineClimateZone(lat: number): ClimateZone {
  // Based on IECC climate zones
  if (lat >= 45) return 'ZONE_6';
  if (lat >= 42) return 'ZONE_5';
  if (lat >= 37) return 'ZONE_4';
  if (lat >= 33) return 'ZONE_3';
  if (lat >= 27) return 'ZONE_2';
  return 'ZONE_1';
}

export function determineWindZone(lat: number, lng: number): WindZone {
  // Simplified wind zone based on coastal proximity and latitude
  // Hurricane zones: Gulf Coast, Atlantic Coast below ~35°N
  const isCoastal = lng > -82 || lng < -122; // Rough Atlantic/Pacific coast check
  const isGulfCoast = lat < 31 && lng > -98 && lng < -80;
  const isAtlanticHurricane = lat < 35 && lng > -82;

  if (isGulfCoast || isAtlanticHurricane) return 'HURRICANE';
  if (isCoastal && lat < 40) return 'VERY_HIGH';
  if (isCoastal) return 'HIGH';
  if (lat > 40) return 'MODERATE';
  return 'BASIC';
}

// ============== WEATHER RISK ANALYSIS ==============
export function generateWeatherRiskAnalysis(
  lat: number,
  lng: number,
  roofAge: number | null,
  material: MaterialType
): WeatherRiskAnalysis {
  const climateZone = determineClimateZone(lat);
  const windZone = determineWindZone(lat, lng);

  // Climate data based on zone
  const climateData = getClimateDataByZone(climateZone, lat, lng);

  // Calculate risk scores
  const hailRisk = calculateHailRisk(lat, lng);
  const windRisk = calculateWindRisk(windZone, roofAge);
  const iceRisk = calculateIceRisk(climateZone, lat);
  const uvDegradation = calculateUVRisk(lat, material);
  const moistureRisk = calculateMoistureRisk(climateData.avgAnnualRainfallInches, climateData.humidityAvg);

  const overallWeatherRisk = Math.round(
    (hailRisk * 0.25 + windRisk * 0.25 + iceRisk * 0.15 + uvDegradation * 0.2 + moistureRisk * 0.15)
  );

  // Generate storm history (simulated based on location)
  const stormHistory = generateStormHistory(lat, lng, hailRisk, windRisk);

  return {
    climate: climateData,
    stormHistory,
    riskScores: {
      hailRisk,
      windRisk,
      iceRisk,
      uvDegradation,
      moistureRisk,
      overallWeatherRisk,
    },
    recommendations: generateWeatherRecommendations(hailRisk, windRisk, iceRisk, uvDegradation, material),
  };
}

function getClimateDataByZone(zone: ClimateZone, lat: number, lng: number) {
  const coastalProximity = calculateCoastalProximity(lng);

  const zoneData: Record<ClimateZone, Partial<typeof baseClimate>> = {
    ZONE_1: { avgAnnualRainfallInches: 50, avgAnnualSnowfallInches: 0, freezeThawCycles: 0, avgSummerHighF: 95, avgWinterLowF: 50, uvIndex: 9, humidityAvg: 75 },
    ZONE_2: { avgAnnualRainfallInches: 48, avgAnnualSnowfallInches: 2, freezeThawCycles: 10, avgSummerHighF: 92, avgWinterLowF: 38, uvIndex: 8, humidityAvg: 65 },
    ZONE_3: { avgAnnualRainfallInches: 42, avgAnnualSnowfallInches: 8, freezeThawCycles: 30, avgSummerHighF: 88, avgWinterLowF: 30, uvIndex: 7, humidityAvg: 55 },
    ZONE_4: { avgAnnualRainfallInches: 38, avgAnnualSnowfallInches: 20, freezeThawCycles: 50, avgSummerHighF: 84, avgWinterLowF: 22, uvIndex: 6, humidityAvg: 50 },
    ZONE_5: { avgAnnualRainfallInches: 35, avgAnnualSnowfallInches: 45, freezeThawCycles: 70, avgSummerHighF: 78, avgWinterLowF: 12, uvIndex: 5, humidityAvg: 55 },
    ZONE_6: { avgAnnualRainfallInches: 32, avgAnnualSnowfallInches: 70, freezeThawCycles: 90, avgSummerHighF: 72, avgWinterLowF: 0, uvIndex: 4, humidityAvg: 60 },
    ZONE_7: { avgAnnualRainfallInches: 28, avgAnnualSnowfallInches: 90, freezeThawCycles: 100, avgSummerHighF: 68, avgWinterLowF: -10, uvIndex: 3, humidityAvg: 55 },
    ZONE_8: { avgAnnualRainfallInches: 25, avgAnnualSnowfallInches: 100, freezeThawCycles: 80, avgSummerHighF: 62, avgWinterLowF: -25, uvIndex: 3, humidityAvg: 50 },
  };

  const baseClimate = {
    climateZone: zone,
    windZone: determineWindZone(lat, lng),
    avgAnnualRainfallInches: 40,
    avgAnnualSnowfallInches: 20,
    freezeThawCycles: 40,
    avgSummerHighF: 85,
    avgWinterLowF: 25,
    uvIndex: 6,
    humidityAvg: 55,
    coastalProximityMiles: coastalProximity,
  };

  return { ...baseClimate, ...zoneData[zone] };
}

function calculateCoastalProximity(lng: number): number | null {
  // Very rough approximation
  if (lng > -82) return Math.abs(lng + 80) * 50; // Atlantic
  if (lng < -122) return Math.abs(lng + 124) * 50; // Pacific
  return null;
}

function calculateHailRisk(lat: number, lng: number): number {
  // Hail Alley: Central US (TX, OK, KS, NE, CO)
  const isHailAlley = lat > 30 && lat < 42 && lng > -105 && lng < -94;
  if (isHailAlley) return 75 + Math.random() * 20;

  // Moderate hail risk: Midwest
  const isMidwest = lat > 35 && lat < 45 && lng > -95 && lng < -80;
  if (isMidwest) return 40 + Math.random() * 25;

  return 15 + Math.random() * 20;
}

function calculateWindRisk(windZone: WindZone, roofAge: number | null): number {
  const baseRisk: Record<WindZone, number> = {
    BASIC: 20,
    MODERATE: 35,
    HIGH: 55,
    VERY_HIGH: 70,
    HURRICANE: 85,
  };

  const ageFactor = roofAge ? Math.min(roofAge * 1.5, 20) : 10;
  return Math.min(baseRisk[windZone] + ageFactor, 100);
}

function calculateIceRisk(zone: ClimateZone, lat: number): number {
  if (lat < 33) return 5;
  if (zone === 'ZONE_1' || zone === 'ZONE_2') return 10;
  if (zone === 'ZONE_3') return 30;
  if (zone === 'ZONE_4') return 50;
  if (zone === 'ZONE_5') return 70;
  return 80;
}

function calculateUVRisk(lat: number, material: MaterialType): number {
  const latFactor = Math.max(0, (40 - Math.abs(lat)) * 2);
  const materialFactor: Record<MaterialType, number> = {
    ASPHALT_3TAB: 70,
    ASPHALT_ARCHITECTURAL: 60,
    ASPHALT_LUXURY: 50,
    METAL_STANDING_SEAM: 20,
    METAL_CORRUGATED: 25,
    METAL_STONE_COATED: 25,
    TILE_CLAY: 15,
    TILE_CONCRETE: 20,
    SLATE_NATURAL: 10,
    SLATE_SYNTHETIC: 25,
    WOOD_SHAKE: 65,
    WOOD_SHINGLE: 65,
    TPO: 40,
    EPDM: 50,
    BUILT_UP: 55,
    MODIFIED_BITUMEN: 45,
    PVC: 35,
    SPRAY_FOAM: 80,
    GREEN_ROOF: 15,
    SOLAR_SHINGLE: 30,
    UNKNOWN: 50,
  };

  return Math.min(latFactor + materialFactor[material] * 0.5, 100);
}

function calculateMoistureRisk(rainfall: number, humidity: number): number {
  return Math.min((rainfall / 60) * 50 + (humidity / 100) * 50, 100);
}

function generateStormHistory(lat: number, lng: number, hailRisk: number, windRisk: number) {
  const events: WeatherRiskAnalysis['stormHistory']['last5Years'] = [];
  const numEvents = Math.floor((hailRisk + windRisk) / 30);

  for (let i = 0; i < numEvents; i++) {
    const year = 2020 + Math.floor(Math.random() * 5);
    const month = Math.floor(Math.random() * 12) + 1;

    events.push({
      date: `${year}-${month.toString().padStart(2, '0')}-${Math.floor(Math.random() * 28 + 1).toString().padStart(2, '0')}`,
      type: Math.random() > 0.5 ? 'HAIL' : 'WIND',
      severity: Math.random() > 0.7 ? 'Severe' : 'Moderate',
      hailSizeInches: Math.random() > 0.5 ? Math.round(Math.random() * 2 * 10) / 10 : null,
      windSpeedMph: Math.random() > 0.5 ? Math.round(50 + Math.random() * 50) : null,
      damageReported: Math.random() > 0.6,
      distanceMiles: Math.round(Math.random() * 10 * 10) / 10,
    });
  }

  return {
    last5Years: events,
    significantEvents: events.filter(e => e.severity === 'Severe'),
    hailEventsCount: events.filter(e => e.type === 'HAIL').length,
    windEventsCount: events.filter(e => e.type === 'WIND').length,
    totalStormEvents: events.length,
  };
}

function generateWeatherRecommendations(
  hailRisk: number,
  windRisk: number,
  iceRisk: number,
  uvRisk: number,
  material: MaterialType
): string[] {
  const recommendations: string[] = [];

  if (hailRisk > 60) {
    recommendations.push('Consider impact-resistant Class 4 shingles for hail protection');
    recommendations.push('Review insurance policy for hail damage coverage');
  }

  if (windRisk > 60) {
    recommendations.push('Ensure proper wind mitigation features are installed');
    recommendations.push('Consider upgrading to 130+ mph wind-rated materials');
    recommendations.push('Install hurricane clips or straps if in coastal area');
  }

  if (iceRisk > 50) {
    recommendations.push('Install ice and water shield on all eaves and valleys');
    recommendations.push('Consider heated cable systems for ice dam prevention');
    recommendations.push('Ensure adequate attic ventilation to prevent ice dams');
  }

  if (uvRisk > 60) {
    recommendations.push('Consider reflective/cool roof coatings to reduce UV degradation');
    recommendations.push('Schedule annual inspections to monitor UV damage');
  }

  return recommendations;
}

// ============== INSURANCE RISK MODEL ==============
export function generateInsuranceRiskModel(
  roofArea: number,
  condition: ConditionRating,
  ageYears: number | null,
  material: MaterialType,
  weatherRisk: WeatherRiskAnalysis
): InsuranceRiskModel {
  const age = ageYears || 15;

  // Condition score
  const conditionScores: Record<ConditionRating, number> = {
    EXCELLENT: 95,
    GOOD: 80,
    FAIR: 60,
    POOR: 35,
    CRITICAL: 15,
    UNKNOWN: 50,
  };
  const roofConditionScore = conditionScores[condition];

  // Age depreciation (typically 5% per year for asphalt)
  const expectedLifespan = getMaterialLifespan(material);
  const ageDepreciationFactor = Math.max(0, 1 - (age / expectedLifespan));

  // Material durability
  const materialDurability: Record<MaterialType, number> = {
    SLATE_NATURAL: 95,
    TILE_CLAY: 90,
    METAL_STANDING_SEAM: 88,
    TILE_CONCRETE: 85,
    METAL_STONE_COATED: 82,
    SLATE_SYNTHETIC: 80,
    ASPHALT_LUXURY: 75,
    METAL_CORRUGATED: 72,
    ASPHALT_ARCHITECTURAL: 70,
    PVC: 68,
    TPO: 65,
    MODIFIED_BITUMEN: 62,
    EPDM: 60,
    ASPHALT_3TAB: 55,
    BUILT_UP: 58,
    WOOD_SHAKE: 50,
    WOOD_SHINGLE: 48,
    SPRAY_FOAM: 55,
    GREEN_ROOF: 70,
    SOLAR_SHINGLE: 75,
    UNKNOWN: 50,
  };
  const materialDurabilityScore = materialDurability[material];

  // Storm susceptibility (inverse of weather risk)
  const stormSusceptibilityScore = 100 - weatherRisk.riskScores.overallWeatherRisk;

  // Maintenance score (estimated)
  const maintenanceHistoryScore = condition === 'EXCELLENT' ? 90 : condition === 'GOOD' ? 75 : 50;

  // Overall insurability
  const overallInsurabilityScore = Math.round(
    roofConditionScore * 0.3 +
    ageDepreciationFactor * 100 * 0.2 +
    materialDurabilityScore * 0.2 +
    stormSusceptibilityScore * 0.2 +
    maintenanceHistoryScore * 0.1
  );

  // Cost calculations
  const pricePerSqFt = getMaterialPricePerSqFt(material);
  const replacementCostValue = Math.round(roofArea * pricePerSqFt);
  const actualCashValue = Math.round(replacementCostValue * ageDepreciationFactor);
  const depreciatedValue = replacementCostValue - actualCashValue;

  // Claim probability
  const baseClaimProbability = 0.05;
  const riskMultiplier = (100 - overallInsurabilityScore) / 100;
  const next1Year = Math.round(baseClaimProbability * (1 + riskMultiplier) * 100) / 100;
  const next5Years = Math.round((1 - Math.pow(1 - next1Year, 5)) * 100) / 100;

  return {
    roofConditionScore,
    ageDepreciationFactor,
    materialDurabilityScore,
    stormSusceptibilityScore,
    maintenanceHistoryScore,
    overallInsurabilityScore,
    estimatedReplacementCost: {
      actualCashValue,
      replacementCostValue,
      depreciatedValue,
    },
    claimProbability: {
      next1Year,
      next5Years,
      primaryRiskFactors: generatePrimaryRiskFactors(weatherRisk, age, condition),
    },
    insuranceRecommendations: {
      suggestedDeductible: roofArea > 2500 ? 2500 : 1000,
      windMitigationCredits: generateWindMitigationCredits(weatherRisk.climate.windZone),
      requiredInspections: age > 15 ? ['Professional roof inspection recommended'] : [],
      policyConsiderations: generatePolicyConsiderations(material, age, weatherRisk),
    },
  };
}

function getMaterialLifespan(material: MaterialType): number {
  const lifespans: Record<MaterialType, number> = {
    SLATE_NATURAL: 100,
    TILE_CLAY: 75,
    METAL_STANDING_SEAM: 50,
    TILE_CONCRETE: 50,
    METAL_STONE_COATED: 40,
    SLATE_SYNTHETIC: 40,
    ASPHALT_LUXURY: 30,
    METAL_CORRUGATED: 35,
    ASPHALT_ARCHITECTURAL: 25,
    PVC: 25,
    TPO: 25,
    MODIFIED_BITUMEN: 20,
    EPDM: 25,
    ASPHALT_3TAB: 20,
    BUILT_UP: 20,
    WOOD_SHAKE: 25,
    WOOD_SHINGLE: 20,
    SPRAY_FOAM: 25,
    GREEN_ROOF: 40,
    SOLAR_SHINGLE: 30,
    UNKNOWN: 20,
  };
  return lifespans[material];
}

function getMaterialPricePerSqFt(material: MaterialType): number {
  const prices: Record<MaterialType, number> = {
    SLATE_NATURAL: 25,
    TILE_CLAY: 18,
    METAL_STANDING_SEAM: 14,
    TILE_CONCRETE: 12,
    METAL_STONE_COATED: 11,
    SLATE_SYNTHETIC: 10,
    ASPHALT_LUXURY: 9,
    METAL_CORRUGATED: 8,
    ASPHALT_ARCHITECTURAL: 6,
    PVC: 8,
    TPO: 7,
    MODIFIED_BITUMEN: 6,
    EPDM: 6,
    ASPHALT_3TAB: 4,
    BUILT_UP: 5,
    WOOD_SHAKE: 10,
    WOOD_SHINGLE: 8,
    SPRAY_FOAM: 7,
    GREEN_ROOF: 20,
    SOLAR_SHINGLE: 22,
    UNKNOWN: 6,
  };
  return prices[material];
}

function generatePrimaryRiskFactors(
  weatherRisk: WeatherRiskAnalysis,
  age: number,
  condition: ConditionRating
): string[] {
  const factors: string[] = [];

  if (weatherRisk.riskScores.hailRisk > 60) factors.push('High hail risk area');
  if (weatherRisk.riskScores.windRisk > 60) factors.push('Elevated wind exposure');
  if (age > 20) factors.push('Roof approaching end of expected lifespan');
  if (condition === 'POOR' || condition === 'CRITICAL') factors.push('Current condition requires attention');
  if (weatherRisk.stormHistory.totalStormEvents > 5) factors.push('Frequent severe weather events in area');

  return factors;
}

function generateWindMitigationCredits(windZone: WindZone): string[] {
  if (windZone === 'HURRICANE' || windZone === 'VERY_HIGH') {
    return [
      'Hip roof shape credit available',
      'Secondary water barrier credit',
      'Roof deck attachment credit',
      'Roof-to-wall connection credit',
      'Opening protection credit',
    ];
  }
  if (windZone === 'HIGH') {
    return [
      'Wind-resistant shingle credit',
      'Enhanced roof deck attachment credit',
    ];
  }
  return [];
}

function generatePolicyConsiderations(
  material: MaterialType,
  age: number,
  weatherRisk: WeatherRiskAnalysis
): string[] {
  const considerations: string[] = [];

  if (age > 15) {
    considerations.push('Some insurers may require inspection for roofs over 15 years');
  }
  if (age > 20) {
    considerations.push('Consider actual cash value vs replacement cost coverage');
  }
  if (weatherRisk.climate.windZone === 'HURRICANE') {
    considerations.push('Separate wind/hurricane deductible may apply');
  }
  if (material === 'WOOD_SHAKE' || material === 'WOOD_SHINGLE') {
    considerations.push('Some insurers have restrictions on wood roofing');
  }

  return considerations;
}

// ============== SOLAR ANALYSIS ==============
export function generateSolarAnalysis(
  lat: number,
  lng: number,
  roofArea: number,
  roofAge: number | null,
  predominantPitch: string | null,
  dominantOrientation: string | null
): SolarAnalysis {
  // Usable area (typically 60-80% of roof)
  const usableAreaSqFt = Math.round(roofArea * 0.65);

  // Panel sizing (roughly 18 sq ft per panel, 400W each)
  const panelArea = 18;
  const panelWatts = 400;
  const estimatedPanelCount = Math.floor(usableAreaSqFt / panelArea);
  const systemSizeKw = Math.round(estimatedPanelCount * panelWatts) / 1000;

  // Sun exposure based on latitude
  const avgPeakSunHours = getPeakSunHours(lat);
  const annualIrradianceKwh = avgPeakSunHours * 365;

  // Shading factor (estimated)
  const shadingFactor = 0.85;

  // Optimal angles
  const optimalTilt = Math.abs(lat);
  const optimalAzimuth = lat >= 0 ? 180 : 0; // South for Northern hemisphere

  // Orientation rating
  const orientationRating = getOrientationRating(dominantOrientation, lat);

  // Production calculations
  const performanceRatio = 0.80;
  const degradationRate = 0.005;
  const yearOneKwh = Math.round(systemSizeKw * avgPeakSunHours * 365 * shadingFactor * performanceRatio);
  const year25Kwh = Math.round(yearOneKwh * Math.pow(1 - degradationRate, 25));

  // Financial calculations
  const costPerWatt = 2.75;
  const systemCostLow = Math.round(systemSizeKw * 1000 * (costPerWatt - 0.50));
  const systemCostHigh = Math.round(systemSizeKw * 1000 * (costPerWatt + 0.50));
  const systemCostTypical = Math.round(systemSizeKw * 1000 * costPerWatt);

  const federalTaxCredit = Math.round(systemCostTypical * 0.30); // 30% ITC
  const netCost = systemCostTypical - federalTaxCredit;

  const electricityRate = 0.14; // $/kWh average
  const annualSavings = Math.round(yearOneKwh * electricityRate);
  const paybackYears = Math.round(netCost / annualSavings * 10) / 10;

  const lifetimeSavings = Math.round(
    Array.from({ length: 25 }, (_, i) => yearOneKwh * Math.pow(1 - degradationRate, i) * electricityRate * Math.pow(1.03, i))
      .reduce((a, b) => a + b, 0)
  );

  const roi = Math.round((lifetimeSavings - netCost) / netCost * 100);

  // Compatibility
  const age = roofAge || 15;
  const roofAgeCompatibility = age < 5 ? 'EXCELLENT' : age < 10 ? 'GOOD' : age < 15 ? 'FAIR' : 'POOR';

  // Suitability score
  const suitabilityScore = Math.round(
    (avgPeakSunHours / 6) * 25 +
    (usableAreaSqFt > 500 ? 25 : usableAreaSqFt / 500 * 25) +
    (orientationRating === 'OPTIMAL' ? 25 : orientationRating === 'GOOD' ? 20 : 15) +
    (roofAgeCompatibility === 'EXCELLENT' ? 25 : roofAgeCompatibility === 'GOOD' ? 20 : 10)
  );

  return {
    suitabilityScore,
    usableAreaSqFt,
    estimatedPanelCount,
    systemSizeKw,
    sunExposure: {
      avgPeakSunHours,
      annualIrradianceKwh,
      shadingFactor,
      optimalTilt,
      optimalAzimuth,
    },
    production: {
      yearOneKwh,
      year25Kwh,
      degradationRate,
      performanceRatio,
    },
    financial: {
      systemCostLow,
      systemCostHigh,
      federalTaxCredit,
      stateTaxCredit: null,
      utilityRebate: null,
      netCost,
      annualSavings,
      paybackYears,
      lifetimeSavings,
      roi,
    },
    compatibility: {
      structuralAdequacy: 'LIKELY',
      roofAgeCompatibility,
      orientationRating,
      notes: generateSolarNotes(age, roofAgeCompatibility, orientationRating),
    },
  };
}

function getPeakSunHours(lat: number): number {
  // Simplified peak sun hours by latitude
  const absLat = Math.abs(lat);
  if (absLat < 25) return 5.5;
  if (absLat < 30) return 5.2;
  if (absLat < 35) return 4.8;
  if (absLat < 40) return 4.5;
  if (absLat < 45) return 4.2;
  return 3.8;
}

function getOrientationRating(orientation: string | null, lat: number): 'OPTIMAL' | 'GOOD' | 'ACCEPTABLE' | 'SUBOPTIMAL' {
  if (!orientation) return 'ACCEPTABLE';

  const isNorthernHemisphere = lat >= 0;
  const optimal = isNorthernHemisphere ? 'S' : 'N';
  const good = isNorthernHemisphere ? ['SE', 'SW'] : ['NE', 'NW'];

  if (orientation.includes(optimal)) return 'OPTIMAL';
  if (good.some(d => orientation.includes(d))) return 'GOOD';
  if (orientation.includes('E') || orientation.includes('W')) return 'ACCEPTABLE';
  return 'SUBOPTIMAL';
}

function generateSolarNotes(age: number, ageCompat: string, orientation: string): string[] {
  const notes: string[] = [];

  if (age > 15) {
    notes.push('Consider roof replacement before solar installation to avoid future panel removal');
  }
  if (ageCompat === 'POOR') {
    notes.push('Roof may need replacement within solar system warranty period');
  }
  if (orientation === 'SUBOPTIMAL') {
    notes.push('North-facing orientation will reduce production efficiency');
  }

  notes.push('Professional site assessment recommended for accurate system sizing');
  notes.push('Local utility interconnection requirements may apply');

  return notes;
}

// ============== ENERGY EFFICIENCY ==============
export function generateEnergyEfficiency(
  material: MaterialType,
  condition: ConditionRating,
  climateZone: ClimateZone
): EnergyEfficiency {
  // R-value estimation based on material
  const rValues: Record<MaterialType, number | null> = {
    ASPHALT_3TAB: 0.44,
    ASPHALT_ARCHITECTURAL: 0.44,
    ASPHALT_LUXURY: 0.44,
    METAL_STANDING_SEAM: 0,
    METAL_CORRUGATED: 0,
    METAL_STONE_COATED: 0.5,
    TILE_CLAY: 0.5,
    TILE_CONCRETE: 0.5,
    SLATE_NATURAL: 0.05,
    SLATE_SYNTHETIC: 0.3,
    WOOD_SHAKE: 0.87,
    WOOD_SHINGLE: 0.87,
    TPO: 0,
    EPDM: 0,
    BUILT_UP: 0.33,
    MODIFIED_BITUMEN: 0.33,
    PVC: 0,
    SPRAY_FOAM: 6.5,
    GREEN_ROOF: 2,
    SOLAR_SHINGLE: 0.44,
    UNKNOWN: null,
  };

  // Cool roof potential
  const coolRoofMaterials: MaterialType[] = ['TPO', 'PVC', 'METAL_STANDING_SEAM', 'TILE_CLAY', 'TILE_CONCRETE'];
  const coolRoofPotential = coolRoofMaterials.includes(material) ||
    ['ASPHALT_ARCHITECTURAL', 'ASPHALT_LUXURY', 'METAL_CORRUGATED'].includes(material);

  // Radiance barrier recommendation
  const hotZones: ClimateZone[] = ['ZONE_1', 'ZONE_2', 'ZONE_3'];
  const radianceBarrierRecommended = hotZones.includes(climateZone);

  return {
    estimatedRValue: rValues[material],
    ventilationAdequacy: condition === 'EXCELLENT' || condition === 'GOOD' ? 'GOOD' : 'UNKNOWN',
    estimatedCoolingImpact: radianceBarrierRecommended ? 'High potential for savings with cool roof coating' : 'Moderate impact in this climate',
    estimatedHeatingImpact: hotZones.includes(climateZone) ? 'Minimal heating needs in this climate' : 'Proper insulation critical for heating efficiency',
    coolRoofPotential,
    radianceBarrierRecommended,
    atticInsulationNotes: 'Professional energy audit recommended to assess attic insulation levels',
  };
}

// ============== DRAINAGE ANALYSIS ==============
export function generateDrainageAnalysis(
  roofShape: string | null,
  roofArea: number,
  predominantPitch: string | null,
  climateZone: ClimateZone
): DrainageAnalysis {
  // Parse pitch
  const pitch = predominantPitch ? parseInt(predominantPitch.split(':')[0]) : 5;

  // Flat roof drainage concerns
  const isLowSlope = pitch < 3;
  const overallPattern = isLowSlope ? 'ADEQUATE' : pitch < 5 ? 'GOOD' : 'EXCELLENT';

  // Gutter sizing
  const gutterLinearFt = Math.round(Math.sqrt(roofArea) * 2);
  const downspoutCount = Math.ceil(roofArea / 600);

  // Ponding risk
  const pondingRisk = {
    areas: isLowSlope ? [{ location: 'Low slope areas', severity: 'MED' as const }] : [],
    overallRisk: isLowSlope ? 'MODERATE' as const : 'LOW' as const,
  };

  // Ice dam risk
  const coldZones: ClimateZone[] = ['ZONE_4', 'ZONE_5', 'ZONE_6', 'ZONE_7', 'ZONE_8'];
  const iceDamScore = coldZones.includes(climateZone) ? 60 + Math.random() * 30 : 10;

  return {
    overallPattern: overallPattern as DrainageAnalysis['overallPattern'],
    gutterSystem: {
      present: true,
      type: 'K-Style',
      condition: 'GOOD',
      linearFt: gutterLinearFt,
      downspoutCount,
      adequacy: downspoutCount >= Math.ceil(roofArea / 600) ? 'ADEQUATE' : 'UNDERSIZED',
    },
    pondingRisk,
    iceDamRisk: {
      score: Math.round(iceDamScore),
      vulnerableAreas: iceDamScore > 50 ? ['Eaves', 'Valleys', 'Skylights'] : [],
      mitigations: iceDamScore > 50 ? [
        'Install ice and water shield',
        'Improve attic ventilation',
        'Consider heated cables',
      ] : [],
    },
    recommendations: generateDrainageRecommendations(isLowSlope, iceDamScore, downspoutCount, roofArea),
  };
}

function generateDrainageRecommendations(
  isLowSlope: boolean,
  iceDamScore: number,
  downspouts: number,
  area: number
): string[] {
  const recs: string[] = [];

  if (isLowSlope) {
    recs.push('Ensure proper drainage slope to prevent ponding');
    recs.push('Consider tapered insulation system for flat areas');
  }

  if (iceDamScore > 50) {
    recs.push('Install ice and water shield membrane on eaves');
  }

  if (downspouts < Math.ceil(area / 600)) {
    recs.push('Add additional downspouts for proper drainage capacity');
  }

  recs.push('Regular gutter cleaning recommended (twice yearly)');
  recs.push('Consider gutter guards to reduce maintenance');

  return recs;
}

// ============== COMPLIANCE ANALYSIS ==============
export function generateComplianceAnalysis(
  lat: number,
  lng: number,
  roofArea: number,
  windZone: WindZone
): ComplianceAnalysis {
  // Building code (simplified)
  const year = new Date().getFullYear();
  const codeYear = `${year - 3} IRC/IBC`;

  // Permit cost estimate
  const permitCost = Math.round(roofArea * 0.15 + 150);

  return {
    buildingCode: {
      jurisdiction: 'Local Building Department',
      codeYear,
      requiresPermit: true,
      permitCost,
      inspectionRequired: true,
    },
    hoaRestrictions: {
      hasHoa: null,
      materialRestrictions: [],
      colorRestrictions: [],
      approvalRequired: false,
      estimatedApprovalTime: null,
    },
    historicDistrict: {
      isHistoric: false,
      restrictions: [],
      approvalProcess: null,
    },
    windMitigation: {
      currentRating: null,
      upgradePotential: windZone === 'HURRICANE' || windZone === 'VERY_HIGH' ? [
        'Secondary water barrier',
        'Enhanced roof deck attachment',
        'Hip roof conversion',
        'Impact-resistant materials',
      ] : [],
      insuranceImpact: windZone === 'HURRICANE' ? 'Up to 45% premium reduction possible with full mitigation' : null,
    },
    solarReady: {
      structuralReady: true,
      electricalReady: false,
      permitRequired: true,
    },
  };
}

// ============== MATERIAL RECOMMENDATIONS ==============
export function generateMaterialRecommendations(
  currentMaterial: MaterialType,
  roofArea: number,
  condition: ConditionRating,
  climateZone: ClimateZone,
  windZone: WindZone
): MaterialRecommendation[] {
  const recommendations: MaterialRecommendation[] = [];

  // Budget option
  recommendations.push({
    material: 'ASPHALT_ARCHITECTURAL',
    productName: 'GAF Timberline HDZ',
    manufacturer: 'GAF',
    tier: 'MID_RANGE',
    whyRecommended: [
      'Best value for performance ratio',
      'Excellent wind resistance (130 mph)',
      'Wide color selection',
      'Strong manufacturer warranty',
    ],
    specifications: {
      warranty: 'Lifetime Limited',
      fireRating: 'Class A',
      windRating: '130 mph',
      impactRating: 'Class 3',
      colors: 25,
      styles: ['Standard', 'Designer'],
    },
    pricing: {
      materialCostPerSqFt: 1.50,
      laborCostPerSqFt: 3.00,
      totalCostLow: Math.round(roofArea * 4.00),
      totalCostTypical: Math.round(roofArea * 5.50),
      totalCostHigh: Math.round(roofArea * 7.00),
    },
    pros: ['Affordable', 'Widely available', 'Easy installation', 'Good durability'],
    cons: ['Shorter lifespan than premium options', 'Can show wear in extreme climates'],
    localAvailability: 'IN_STOCK',
    installationComplexity: 'SIMPLE',
    maintenanceRequirements: 'Annual inspection recommended',
  });

  // Premium option
  recommendations.push({
    material: 'ASPHALT_LUXURY',
    productName: 'CertainTeed Grand Manor',
    manufacturer: 'CertainTeed',
    tier: 'PREMIUM',
    whyRecommended: [
      'Superior aesthetic appeal',
      'Maximum protection',
      'Best-in-class warranty',
      'Exceptional curb appeal and resale value',
    ],
    specifications: {
      warranty: 'Lifetime Limited + 25-year workmanship',
      fireRating: 'Class A',
      windRating: '130 mph',
      impactRating: 'Class 4',
      colors: 12,
      styles: ['Luxury Shake', 'Slate Look'],
    },
    pricing: {
      materialCostPerSqFt: 4.50,
      laborCostPerSqFt: 4.00,
      totalCostLow: Math.round(roofArea * 7.50),
      totalCostTypical: Math.round(roofArea * 9.50),
      totalCostHigh: Math.round(roofArea * 12.00),
    },
    pros: ['Beautiful appearance', 'Longest asphalt lifespan', 'Best warranty', 'Impact resistant'],
    cons: ['Higher cost', 'Heavier than standard shingles'],
    localAvailability: 'IN_STOCK',
    installationComplexity: 'MODERATE',
    maintenanceRequirements: 'Minimal maintenance required',
  });

  // Metal option for durability
  if (windZone === 'HURRICANE' || windZone === 'VERY_HIGH') {
    recommendations.push({
      material: 'METAL_STANDING_SEAM',
      productName: 'Drexel Metals Standing Seam',
      manufacturer: 'Drexel Metals',
      tier: 'PREMIUM',
      whyRecommended: [
        'Superior wind resistance',
        'Ideal for coastal/high-wind areas',
        '50+ year lifespan',
        'Energy efficient',
      ],
      specifications: {
        warranty: '40-year paint, Lifetime substrate',
        fireRating: 'Class A',
        windRating: '150+ mph',
        impactRating: 'Class 4',
        colors: 30,
        styles: ['Snap-lock', 'Mechanically seamed'],
      },
      pricing: {
        materialCostPerSqFt: 5.00,
        laborCostPerSqFt: 6.00,
        totalCostLow: Math.round(roofArea * 10.00),
        totalCostTypical: Math.round(roofArea * 12.00),
        totalCostHigh: Math.round(roofArea * 16.00),
      },
      pros: ['Extremely durable', 'Energy efficient', 'Fire resistant', 'Low maintenance'],
      cons: ['Higher upfront cost', 'Requires specialized installation', 'Can dent'],
      localAvailability: 'IN_STOCK',
      installationComplexity: 'COMPLEX',
      maintenanceRequirements: 'Inspect fasteners annually',
    });
  }

  return recommendations;
}

// ============== PROPERTY INTELLIGENCE (Simulated) ==============
export function generatePropertyIntelligence(
  address: string,
  coords: Coordinates,
  roofArea: number
): PropertyIntelligence {
  // This would normally call external APIs
  // Simulating based on available data

  const currentYear = new Date().getFullYear();
  const yearBuilt = currentYear - Math.floor(15 + Math.random() * 30);
  const roofAge = Math.floor(5 + Math.random() * 20);

  return {
    ownership: {
      ownerName: null,
      ownerType: 'UNKNOWN',
      mailingAddress: address,
      purchaseDate: null,
      purchasePrice: null,
      ownershipLength: null,
    },
    tax: {
      assessedValue: Math.round(roofArea * 150 + 100000),
      landValue: Math.round(roofArea * 50 + 50000),
      improvementValue: Math.round(roofArea * 100 + 50000),
      annualTax: Math.round(roofArea * 150 * 0.012 + 1200),
      taxYear: currentYear,
      taxExemptions: [],
    },
    building: {
      yearBuilt,
      buildingSqFt: Math.round(roofArea * 0.85),
      stories: roofArea > 2500 ? 2 : 1,
      bedrooms: Math.floor(roofArea / 600) + 2,
      bathrooms: Math.floor(roofArea / 800) + 1,
      lotSizeSqFt: Math.round(roofArea * 4),
      lotSizeAcres: Math.round(roofArea * 4 / 43560 * 100) / 100,
      constructionType: 'Wood Frame',
      foundationType: 'Slab',
      heatingType: 'Central',
      coolingType: 'Central A/C',
      exteriorWall: 'Brick/Frame',
      garageType: 'Attached',
      garageSqFt: 400,
      pool: false,
      fireplace: true,
    },
    permits: [],
    lastRoofPermit: null,
    estimatedRoofAge: roofAge,
    roofAgeConfidence: 0.6,
    neighborhoodData: {
      medianHomeValue: Math.round(roofArea * 150 + 150000),
      avgRoofAge: Math.round(12 + Math.random() * 8),
      recentRoofReplacements: Math.floor(Math.random() * 10),
    },
  };
}
