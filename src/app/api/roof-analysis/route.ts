import { NextRequest, NextResponse } from 'next/server';
import {
  generateWeatherRiskAnalysis,
  generateInsuranceRiskModel,
  generateSolarAnalysis,
  generateEnergyEfficiency,
  generateDrainageAnalysis,
  generateComplianceAnalysis,
  generateMaterialRecommendations,
  generatePropertyIntelligence,
  determineClimateZone,
  determineWindZone,
} from '../../roof-takeoff/services/analytics-engine';

interface AdditionalImage {
  url: string;
  type: string;
  heading?: number;
  pitch?: number;
  description: string;
}

interface RequestBody {
  address: string;
  coordinates: { lat: number; lng: number };
  imageMeta: {
    imageWidthPx: number;
    imageHeightPx: number;
    centerLat: number;
    centerLng: number;
    zoom: number;
    metersPerPixel: number;
  };
  satelliteImageUrl: string;
  additionalImages?: AdditionalImage[];
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RequestBody;
    const { address, coordinates, imageMeta, satelliteImageUrl, additionalImages } = body;

    if (!coordinates?.lat || !coordinates?.lng) {
      return NextResponse.json({ error: 'Coordinates required' }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    // Fetch the main satellite image
    const imageResponse = await fetch(satelliteImageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch satellite image');
    }
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64SatelliteImage = Buffer.from(imageBuffer).toString('base64');

    // Fetch additional images (street views, etc.) in parallel - increased to 6 images
    const additionalImageData: { base64: string; description: string; heading?: number; pitch?: number }[] = [];
    if (additionalImages && additionalImages.length > 0) {
      const fetchPromises = additionalImages.slice(0, 6).map(async (img) => {
        try {
          const response = await fetch(img.url);
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            return {
              base64: Buffer.from(buffer).toString('base64'),
              description: img.description,
              heading: img.heading,
              pitch: img.pitch
            };
          }
        } catch (e) {
          console.warn('Failed to fetch additional image:', img.description);
        }
        return null;
      });

      const results = await Promise.all(fetchPromises);
      results.forEach((result) => {
        if (result) additionalImageData.push(result);
      });
    }

    // Create the comprehensive prompt for Gemini
    const prompt = createWorldClassRoofAnalysisPrompt(address, coordinates, imageMeta, additionalImageData);

    // Build the content parts with all images
    const contentParts: Array<{ inlineData?: { mimeType: string; data: string }; text?: string }> = [
      {
        inlineData: {
          mimeType: 'image/png',
          data: base64SatelliteImage,
        },
      },
    ];

    // Add additional images with descriptions
    additionalImageData.forEach((imgData) => {
      contentParts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: imgData.base64,
        },
      });
    });

    // Add the prompt at the end
    contentParts.push({ text: prompt });

    // Call Gemini API with vision (multi-image)
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: contentParts,
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 16384,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = (await geminiResponse.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error('No response from Gemini');
    }

    // Parse the JSON from Gemini's response
    let baseAnalysis: Record<string, unknown>;
    try {
      const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
                        responseText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
      baseAnalysis = JSON.parse(jsonStr) as Record<string, unknown>;
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText);
      baseAnalysis = generateFallbackAnalysis(address, coordinates, imageMeta);
    }

    // Now enhance with comprehensive analytics
    const enhancedResult = await enhanceWithAdvancedAnalytics(
      baseAnalysis,
      address,
      coordinates,
      imageMeta
    );

    return NextResponse.json(enhancedResult);
  } catch (error) {
    console.error('Roof analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}

// World-class comprehensive analysis prompt
function createWorldClassRoofAnalysisPrompt(
  address: string,
  coordinates: { lat: number; lng: number },
  imageMeta: { imageWidthPx: number; imageHeightPx: number; metersPerPixel: number; zoom: number },
  additionalImages: { description: string; heading?: number; pitch?: number }[]
): string {
  const imageDescriptions = additionalImages.map((img, i) =>
    `- Image ${i + 2}: ${img.description}${img.heading !== undefined ? ` (heading: ${img.heading}°)` : ''}`
  ).join('\n');

  return `You are an EXPERT roof analysis AI system providing PROFESSIONAL-GRADE roof assessments that SURPASS industry standards. Your analysis will be used for:
- Insurance claims and underwriting
- Real estate valuations
- Solar installation feasibility
- Contractor bidding and estimation
- Home inspection reports

PROPERTY INFORMATION:
====================
Address: ${address}
Coordinates: ${coordinates.lat}, ${coordinates.lng}
Analysis Resolution: ${imageMeta.metersPerPixel.toFixed(4)} meters/pixel (${(imageMeta.metersPerPixel * 3.28084).toFixed(4)} feet/pixel)
Image Dimensions: ${imageMeta.imageWidthPx}x${imageMeta.imageHeightPx} pixels
Zoom Level: ${imageMeta.zoom}

IMAGES PROVIDED:
===============
- Image 1: Primary satellite/aerial orthographic view (USE FOR ALL MEASUREMENTS)
${imageDescriptions}

CRITICAL ANALYSIS REQUIREMENTS:
==============================

1. GEOMETRY ANALYSIS (use Image 1 ONLY for coordinates):
   - Identify roof shape (GABLE, HIP, L-SHAPE, COMPLEX, FLAT, MIXED, GAMBREL, MANSARD, SHED, DUTCH_HIP, BUTTERFLY, SAWTOOTH)
   - Count all roof facets/planes precisely
   - Estimate pitch for each facet (use shadow analysis and known object references)
   - Calculate areas using: Area = pixels × (${imageMeta.metersPerPixel} m/px)² × 10.764 sq ft/m²
   - All coordinates MUST be normalized (0-1) relative to Image 1 dimensions
   - Trace the EXACT roof perimeter - accuracy is critical

2. MATERIAL IDENTIFICATION (use ALL images):
   - Primary material type (ASPHALT_3TAB, ASPHALT_ARCHITECTURAL, ASPHALT_LUXURY, METAL_STANDING_SEAM, METAL_CORRUGATED, METAL_STONE_COATED, TILE_CLAY, TILE_CONCRETE, SLATE_NATURAL, SLATE_SYNTHETIC, WOOD_SHAKE, WOOD_SHINGLE, etc.)
   - Color and style observations
   - Brand identification if visible
   - Age estimation based on wear patterns
   - Remaining useful life estimate

3. CONDITION ASSESSMENT (use ALL images - street views are CRITICAL):
   - Overall condition: EXCELLENT, GOOD, FAIR, POOR, or CRITICAL
   - Condition score (0-100)
   - Document ALL visible deficiencies with:
     * Category: STRUCTURAL, SURFACE, FLASHING, PENETRATION, DRAINAGE, VENTILATION, DEBRIS, BIOLOGICAL, WEATHERING
     * Severity: LOW, MED, HIGH, CRITICAL
     * Urgency: IMMEDIATE, SOON, MONITOR, INFORMATIONAL
     * Precise location description
     * Visual evidence observed
     * Repair cost estimate range
   - Look specifically for:
     * Missing/damaged/curling shingles
     * Exposed nail heads
     * Flashing deterioration
     * Gutter/fascia condition
     * Moss, algae, lichen growth
     * Debris accumulation
     * Ponding water evidence
     * Chimney/vent flashing issues
     * Storm damage indicators

4. LINEAR MEASUREMENTS:
   - Eaves length (total linear feet)
   - Rake edges length
   - Ridge length
   - Hip lengths (if applicable)
   - Valley lengths (if applicable)
   - Step flashing runs
   - Drip edge perimeter

5. PENETRATIONS INVENTORY:
   - Count all vents (plumbing, HVAC, attic)
   - Skylights (count, type, condition)
   - Chimneys (count, condition, flashing condition)
   - Satellite dishes
   - Any other roof penetrations

6. OVERLAY GENERATION:
   - roofOutline: Complete perimeter polygon (normalized 0-1 coordinates)
   - facetOverlays: Individual plane polygons with facetId labels
   - segments: All linear elements (ridge, hip, valley, eave, rake) with start/end coordinates
   - Finding highlights: Polygons around identified deficiencies

OUTPUT FORMAT:
=============
Return ONLY a valid JSON object (no markdown, no explanation) with this structure:

{
  "analysisId": "<generate unique id>",
  "timestamp": "<ISO timestamp>",
  "status": "ENHANCED",

  "property": {
    "address": "${address}",
    "coordinates": { "lat": ${coordinates.lat}, "lng": ${coordinates.lng} },
    "parcelNumber": null,
    "subdivision": null,
    "zoning": null
  },

  "analysis": {
    "geometry": {
      "roofShape": "<detected shape>",
      "facets": <count>,
      "pitchRange": "<min>:12 to <max>:12",
      "predominantPitch": "<pitch>:12",
      "totalPlanAreaSqFt": <calculated>,
      "totalSurfaceAreaSqFt": <pitch-adjusted>,
      "netAreaSqFt": <after penetration deductions>,
      "wasteFactor": 0.15,
      "complexityIndex": <1-10>,
      "planes": [
        { "facetId": "A", "areaSqFt": <area>, "pitch": "6:12", "pitchDegrees": 26.57, "azimuth": 180, "aspectDirection": "S", "confidence": 0.85 }
      ],
      "dominantOrientation": "N-S",
      "symmetryScore": <0-1>
    },

    "linear": {
      "eavesFt": <total>,
      "rakesFt": <total>,
      "ridgesFt": <total>,
      "hipsFt": <total or null>,
      "valleysFt": <total or null>,
      "wallFlashingFt": <if visible>,
      "stepFlashingFt": <if visible>,
      "dripEdgeFt": <perimeter>,
      "gutterFt": <if visible>,
      "fasciaFt": <if visible>,
      "soffitSqFt": null,
      "confidence": 0.8,
      "rangesFt": {
        "eavesFt": [<low>, <high>],
        "rakesFt": [<low>, <high>],
        "ridgesFt": [<low>, <high>],
        "hipsFt": null,
        "valleysFt": null
      }
    },

    "penetrations": {
      "totalCount": <count>,
      "items": [
        { "type": "Plumbing Vent", "count": 2, "flashingCondition": "GOOD", "notes": null }
      ],
      "skylights": { "count": 0, "condition": "GOOD" },
      "chimneys": { "count": 1, "condition": "FAIR", "flashingCondition": "FAIR" },
      "vents": { "count": 4, "types": ["Plumbing", "Ridge", "Turbine"] },
      "confidence": 0.75
    },

    "conditions": {
      "overallCondition": "<EXCELLENT|GOOD|FAIR|POOR|CRITICAL>",
      "conditionScore": <0-100>,
      "estimatedAge": "<X> years",
      "estimatedAgeYears": <number>,
      "remainingLifeYears": <estimated>,
      "layers": 1,
      "riskFactors": ["<any identified risks>"],
      "findings": [
        {
          "id": "F1",
          "type": "Shingle Wear",
          "severity": "LOW",
          "facetId": "A",
          "locationNotes": "Southeast corner",
          "evidence": "Visible granule loss",
          "recommendedAction": "Monitor during next inspection",
          "estimatedRepairCost": { "low": 150, "high": 400 },
          "confidence": 0.8
        }
      ],
      "detailedFindings": [
        {
          "id": "DF1",
          "category": "SURFACE",
          "type": "Granule Loss",
          "severity": "MED",
          "urgency": "MONITOR",
          "location": {
            "facetId": "A",
            "description": "Southeast section, near gutter line",
            "normalizedBounds": { "x": 0.6, "y": 0.7, "width": 0.1, "height": 0.1 }
          },
          "evidence": {
            "description": "Visible dark patches indicating granule loss, typical of 12-15 year old shingles",
            "sourceImage": "satellite",
            "visualIndicators": ["Dark discoloration", "Inconsistent texture"],
            "confidenceScore": 0.75
          },
          "impact": {
            "leakRisk": "MODERATE",
            "structuralRisk": "LOW",
            "energyImpact": "Minor heat absorption increase",
            "aestheticImpact": "Visible from ground level"
          },
          "repair": {
            "recommendedAction": "Replace affected shingles or plan for full replacement within 3-5 years",
            "diyPossible": true,
            "estimatedCostLow": 200,
            "estimatedCostHigh": 600,
            "timeframe": "Within 1-2 years",
            "preventsFutureDamage": ["Water infiltration", "Deck damage", "Interior water damage"]
          }
        }
      ],
      "limitations": [
        "Analysis based on available satellite and street view imagery",
        "Pitch estimated from shadow analysis - may vary",
        "Hidden damage beneath surface not detectable",
        "Interior conditions unknown"
      ],
      "maintenanceHistory": null,
      "lastInspection": null
    },

    "material": {
      "primaryMaterial": "<MATERIAL_TYPE>",
      "materialConfidence": 0.8,
      "brand": null,
      "color": "<observed color>",
      "style": "<observed style>",
      "characteristics": {
        "estimatedAge": 12,
        "expectedLifespan": 25,
        "remainingLifespan": 13,
        "warrantyStatus": "UNKNOWN",
        "warrantyExpiration": null
      },
      "performance": {
        "fireRating": "Class A",
        "windRating": "110 mph estimated",
        "impactRating": "Class 2 estimated",
        "energyStarRated": false,
        "coolRoofRated": false
      },
      "evidenceFromImages": ["<observations from satellite>", "<observations from street views>"]
    },

    "estimateOptions": [
      {
        "optionName": "Standard Architectural Shingles",
        "systemType": "Asphalt Shingle - Architectural",
        "material": "ASPHALT_ARCHITECTURAL",
        "tier": "MID_RANGE",
        "quantitySummary": {
          "squares": <area/100>,
          "bundles": <squares * 3>,
          "ridgeCapFt": <ridge + hip>,
          "starterFt": <eaves + rakes>,
          "underlaymentSqFt": <surface area>,
          "iceWaterShieldSqFt": <eaves area>,
          "flashingLf": <total flashing>,
          "ventCount": <calculated>,
          "nailsPounds": <estimated>
        },
        "costBreakdown": {
          "materialsLow": <$2.50 * area>,
          "materialsTypical": <$3.50 * area>,
          "materialsHigh": <$4.50 * area>,
          "laborLow": <$2.50 * area>,
          "laborTypical": <$3.50 * area>,
          "laborHigh": <$4.50 * area>,
          "tearOffAndDisposal": <$1.25 * area>,
          "permitAllowance": 500,
          "dumpsterFees": 600,
          "overheadAndProfit": <15% of subtotal>,
          "contingency": <5% of subtotal>
        },
        "totalLow": <sum>,
        "totalTypical": <sum>,
        "totalHigh": <sum>,
        "pricePerSqFt": <totalTypical / area>,
        "assumptions": [
          "Single layer tear-off",
          "Standard roof access (no steep charges)",
          "Standard deck in good condition",
          "Code-compliant ventilation exists",
          "No structural repairs needed"
        ],
        "warranty": {
          "material": "Lifetime Limited",
          "labor": "10 years",
          "total": "Lifetime Limited with workmanship"
        },
        "timeline": {
          "estimatedDays": 2,
          "bestSeason": "Spring or Fall"
        },
        "sources": []
      },
      {
        "optionName": "Premium Designer Shingles",
        "systemType": "Asphalt Shingle - Luxury",
        "material": "ASPHALT_LUXURY",
        "tier": "PREMIUM",
        "quantitySummary": { "squares": null, "bundles": null, "ridgeCapFt": null, "starterFt": null, "underlaymentSqFt": null, "iceWaterShieldSqFt": null, "flashingLf": null, "ventCount": null, "nailsPounds": null },
        "costBreakdown": {
          "materialsLow": null, "materialsTypical": null, "materialsHigh": null,
          "laborLow": null, "laborTypical": null, "laborHigh": null,
          "tearOffAndDisposal": null, "permitAllowance": null, "dumpsterFees": null,
          "overheadAndProfit": null, "contingency": null
        },
        "totalLow": <standard * 1.5>,
        "totalTypical": <standard * 1.6>,
        "totalHigh": <standard * 1.8>,
        "pricePerSqFt": null,
        "assumptions": ["Premium materials", "Enhanced warranty", "Professional installation only"],
        "warranty": { "material": "Lifetime", "labor": "25 years", "total": "Lifetime Plus" },
        "timeline": { "estimatedDays": 3, "bestSeason": "Spring or Fall" },
        "sources": []
      },
      {
        "optionName": "Standing Seam Metal",
        "systemType": "Metal - Standing Seam",
        "material": "METAL_STANDING_SEAM",
        "tier": "LUXURY",
        "quantitySummary": { "squares": null, "bundles": null, "ridgeCapFt": null, "starterFt": null, "underlaymentSqFt": null, "iceWaterShieldSqFt": null, "flashingLf": null, "ventCount": null, "nailsPounds": null },
        "costBreakdown": {
          "materialsLow": null, "materialsTypical": null, "materialsHigh": null,
          "laborLow": null, "laborTypical": null, "laborHigh": null,
          "tearOffAndDisposal": null, "permitAllowance": null, "dumpsterFees": null,
          "overheadAndProfit": null, "contingency": null
        },
        "totalLow": <standard * 2.0>,
        "totalTypical": <standard * 2.4>,
        "totalHigh": <standard * 3.0>,
        "pricePerSqFt": null,
        "assumptions": ["50+ year lifespan", "Maximum durability", "Energy efficient"],
        "warranty": { "material": "40-year paint finish", "labor": "20 years", "total": "Lifetime substrate" },
        "timeline": { "estimatedDays": 4, "bestSeason": "Any - weather permitting" },
        "sources": []
      }
    ],

    "materialRecommendations": [],

    "opportunities": [
      { "name": "Impact-Resistant Upgrade", "category": "UPGRADE", "why": "May qualify for insurance discount in hail-prone areas", "roughRange": "$500-$1,500 additional", "roi": "2-3 year payback via insurance savings", "priority": "HIGH" },
      { "name": "Ridge Vent Installation", "category": "ENERGY", "why": "Improves attic ventilation, extends roof life, reduces cooling costs", "roughRange": "$400-$800", "roi": "Energy savings 10-15%", "priority": "MEDIUM" },
      { "name": "Gutter Replacement", "category": "MAINTENANCE", "why": "Proper drainage protects foundation and fascia", "roughRange": "$1,200-$2,500", "roi": "Prevents costly water damage", "priority": "MEDIUM" },
      { "name": "Solar Panel Installation", "category": "ENERGY", "why": "South-facing orientation is ideal for solar production", "roughRange": "See solar analysis", "roi": "6-8 year payback typical", "priority": "LOW" }
    ],

    "sources": []
  },

  "overlay": {
    "imageMetaUsed": {
      "imageWidthPx": ${imageMeta.imageWidthPx},
      "imageHeightPx": ${imageMeta.imageHeightPx},
      "centerLat": ${coordinates.lat},
      "centerLng": ${coordinates.lng},
      "zoom": ${imageMeta.zoom},
      "metersPerPixel": ${imageMeta.metersPerPixel},
      "bearingDegrees": 0,
      "captureDate": null,
      "provider": "Google Maps",
      "resolution": "High",
      "notes": "Orthographic satellite view"
    },
    "roofOutline": {
      "normalizedPolygon": [
        { "x": 0.3, "y": 0.35 },
        { "x": 0.7, "y": 0.35 },
        { "x": 0.7, "y": 0.65 },
        { "x": 0.3, "y": 0.65 }
      ],
      "confidence": 0.85,
      "perimeterFt": <calculated>,
      "notes": null
    },
    "facetOverlays": [
      {
        "facetId": "A",
        "normalizedPolygon": [{ "x": 0.3, "y": 0.35 }, { "x": 0.5, "y": 0.35 }, { "x": 0.5, "y": 0.65 }, { "x": 0.3, "y": 0.65 }],
        "labelPoint": { "x": 0.4, "y": 0.5 },
        "areaSqFt": <calculated>,
        "pitch": "6:12",
        "confidence": 0.85
      }
    ],
    "segments": [
      { "id": "S1", "type": "RIDGE", "label": "Main Ridge", "start": { "x": 0.5, "y": 0.35 }, "end": { "x": 0.5, "y": 0.65 }, "lengthFt": <calculated>, "lengthFtRange": null, "condition": "GOOD", "confidence": 0.85 },
      { "id": "S2", "type": "EAVE", "label": "North Eave", "start": { "x": 0.3, "y": 0.35 }, "end": { "x": 0.7, "y": 0.35 }, "lengthFt": <calculated>, "lengthFtRange": null, "condition": "GOOD", "confidence": 0.85 }
    ],
    "jumpTo": {
      "findingsToOverlay": []
    },
    "exports": {
      "geojson": null,
      "svgPath": null,
      "pdfReportUrl": null,
      "excelUrl": null,
      "cadUrl": null
    }
  },

  "summary": "<2-3 sentence professional summary of findings, condition, and recommended actions>",

  "executiveSummary": {
    "headline": "<One impactful sentence summarizing roof status>",
    "keyFindings": [
      "<Most important finding 1>",
      "<Most important finding 2>",
      "<Most important finding 3>"
    ],
    "immediateActions": [
      "<Any urgent items requiring attention>"
    ],
    "investmentPriorities": [
      "<Prioritized investment recommendation>"
    ]
  },

  "scores": {
    "overall": <0-100 weighted score>,
    "condition": <0-100>,
    "risk": <0-100 inverse of risk>,
    "solarPotential": null,
    "investmentValue": <0-100 value for money>
  },

  "confidenceOverall": 0.8,

  "dataQuality": {
    "imageryQuality": "GOOD",
    "measurementAccuracy": "MODERATE",
    "analysisDepth": "COMPREHENSIVE",
    "limitations": [
      "Satellite imagery analysis only",
      "Pitch estimated from shadows",
      "Interior conditions unknown"
    ]
  }
}

IMPORTANT:
- Be PRECISE with polygon coordinates - trace actual roof edges visible in Image 1
- Use ALL street view images to assess condition - they show details not visible from above
- Calculate measurements using the provided ground resolution
- Provide detailed, professional findings that would be useful for insurance and contractor purposes
- When in doubt about specific measurements, provide confidence-adjusted ranges
- The analysis should be thorough enough to serve as a preliminary scope for roofing contractors`;
}

// Enhanced analysis with all advanced analytics
async function enhanceWithAdvancedAnalytics(
  baseAnalysis: Record<string, unknown>,
  address: string,
  coordinates: { lat: number; lng: number },
  imageMeta: { imageWidthPx: number; imageHeightPx: number; metersPerPixel: number; zoom: number }
) {
  // Extract values from base analysis safely
  const analysis = (baseAnalysis.analysis || {}) as Record<string, unknown>;
  const geometry = (analysis.geometry || {}) as Record<string, unknown>;
  const conditions = (analysis.conditions || {}) as Record<string, unknown>;
  const material = (analysis.material || {}) as Record<string, unknown>;

  const roofArea = (geometry.totalSurfaceAreaSqFt as number) || estimateRoofArea(imageMeta);
  const roofShape = (geometry.roofShape as string) || 'GABLE';
  const predominantPitch = (geometry.predominantPitch as string) || '6:12';
  const dominantOrientation = (geometry.dominantOrientation as string) || null;
  const condition = (conditions.overallCondition as string) || 'FAIR';
  const ageYears = (conditions.estimatedAgeYears as number) || null;
  const materialType = (material.primaryMaterial as string) || 'ASPHALT_ARCHITECTURAL';

  // Generate all advanced analytics
  const climateZone = determineClimateZone(coordinates.lat);
  const windZone = determineWindZone(coordinates.lat, coordinates.lng);

  const weatherRisk = generateWeatherRiskAnalysis(
    coordinates.lat,
    coordinates.lng,
    ageYears,
    materialType as Parameters<typeof generateWeatherRiskAnalysis>[3]
  );

  const insuranceRisk = generateInsuranceRiskModel(
    roofArea,
    condition as Parameters<typeof generateInsuranceRiskModel>[1],
    ageYears,
    materialType as Parameters<typeof generateInsuranceRiskModel>[3],
    weatherRisk
  );

  const solarAnalysis = generateSolarAnalysis(
    coordinates.lat,
    coordinates.lng,
    roofArea,
    ageYears,
    predominantPitch,
    dominantOrientation
  );

  const energyEfficiency = generateEnergyEfficiency(
    materialType as Parameters<typeof generateEnergyEfficiency>[0],
    condition as Parameters<typeof generateEnergyEfficiency>[1],
    climateZone
  );

  const drainage = generateDrainageAnalysis(
    roofShape,
    roofArea,
    predominantPitch,
    climateZone
  );

  const compliance = generateComplianceAnalysis(
    coordinates.lat,
    coordinates.lng,
    roofArea,
    windZone
  );

  const materialRecommendations = generateMaterialRecommendations(
    materialType as Parameters<typeof generateMaterialRecommendations>[0],
    roofArea,
    condition as Parameters<typeof generateMaterialRecommendations>[2],
    climateZone,
    windZone
  );

  const propertyIntelligence = generatePropertyIntelligence(
    address,
    coordinates,
    roofArea
  );

  // Merge base analysis with advanced analytics
  const enhancedResult = {
    ...ensureCompleteResult(baseAnalysis, address, coordinates, imageMeta),
    propertyIntelligence,
    weatherRisk,
    insuranceRisk,
    solarAnalysis,
    energyEfficiency,
    drainage,
    compliance,
    model3d: null, // Would require specialized processing
    contractorLeads: null, // Would require marketplace integration
  };

  // Add material recommendations to analysis
  if (enhancedResult.analysis) {
    enhancedResult.analysis.materialRecommendations = materialRecommendations;
  }

  // Update scores with advanced analytics
  enhancedResult.scores = {
    overall: Math.round(
      ((conditions.conditionScore as number) || 70) * 0.4 +
      insuranceRisk.overallInsurabilityScore * 0.3 +
      (100 - weatherRisk.riskScores.overallWeatherRisk) * 0.2 +
      solarAnalysis.suitabilityScore * 0.1
    ),
    condition: (conditions.conditionScore as number) || 70,
    risk: 100 - weatherRisk.riskScores.overallWeatherRisk,
    solarPotential: solarAnalysis.suitabilityScore,
    investmentValue: Math.round(
      insuranceRisk.overallInsurabilityScore * 0.5 +
      ((conditions.conditionScore as number) || 70) * 0.3 +
      solarAnalysis.suitabilityScore * 0.2
    ),
  };

  return enhancedResult;
}

function estimateRoofArea(imageMeta: { imageWidthPx: number; imageHeightPx: number; metersPerPixel: number }): number {
  // Estimate roof covers about 30% of image area
  const imageAreaSqM = imageMeta.imageWidthPx * imageMeta.imageHeightPx * Math.pow(imageMeta.metersPerPixel, 2);
  const roofAreaSqM = imageAreaSqM * 0.3;
  return Math.round(roofAreaSqM * 10.764); // Convert to sq ft
}

function generateFallbackAnalysis(
  address: string,
  coordinates: { lat: number; lng: number },
  imageMeta: { imageWidthPx: number; imageHeightPx: number; metersPerPixel: number; zoom: number }
) {
  const pixelsPerFoot = 1 / (imageMeta.metersPerPixel * 3.28084);
  const estimatedRoofWidthPx = imageMeta.imageWidthPx * 0.4;
  const estimatedRoofHeightPx = imageMeta.imageHeightPx * 0.3;
  const estimatedAreaSqFt = (estimatedRoofWidthPx / pixelsPerFoot) * (estimatedRoofHeightPx / pixelsPerFoot);

  return {
    status: 'LOW_CONFIDENCE',
    analysisId: `fallback-${Date.now()}`,
    timestamp: new Date().toISOString(),
    property: { address, coordinates, parcelNumber: null, subdivision: null, zoning: null },
    analysis: {
      geometry: {
        roofShape: 'GABLE',
        facets: 2,
        pitchRange: '4:12 to 8:12',
        predominantPitch: '6:12',
        totalPlanAreaSqFt: Math.round(estimatedAreaSqFt),
        totalSurfaceAreaSqFt: Math.round(estimatedAreaSqFt * 1.12),
        netAreaSqFt: Math.round(estimatedAreaSqFt * 1.1),
        wasteFactor: 0.15,
        complexityIndex: 3,
        planes: [
          { facetId: 'A', areaSqFt: Math.round(estimatedAreaSqFt * 0.55), pitch: '6:12', pitchDegrees: 26.57, azimuth: 180, aspectDirection: 'S', confidence: 0.5 },
          { facetId: 'B', areaSqFt: Math.round(estimatedAreaSqFt * 0.45), pitch: '6:12', pitchDegrees: 26.57, azimuth: 0, aspectDirection: 'N', confidence: 0.5 }
        ],
        dominantOrientation: 'N-S',
        symmetryScore: 0.8
      },
      linear: {
        eavesFt: null,
        rakesFt: null,
        ridgesFt: null,
        hipsFt: null,
        valleysFt: null,
        wallFlashingFt: null,
        stepFlashingFt: null,
        dripEdgeFt: null,
        gutterFt: null,
        fasciaFt: null,
        soffitSqFt: null,
        confidence: 0.5,
        rangesFt: {
          eavesFt: [40, 80],
          rakesFt: [30, 60],
          ridgesFt: [20, 40],
          hipsFt: null,
          valleysFt: null
        }
      },
      penetrations: {
        totalCount: 3,
        items: [{ type: 'Vent Pipe', count: 2, flashingCondition: 'UNKNOWN', notes: null }],
        skylights: null,
        chimneys: null,
        vents: { count: 3, types: ['Plumbing'] },
        confidence: 0.4
      },
      conditions: {
        overallCondition: 'UNKNOWN',
        conditionScore: 50,
        estimatedAge: null,
        estimatedAgeYears: null,
        remainingLifeYears: null,
        layers: null,
        riskFactors: [],
        findings: [],
        detailedFindings: [],
        limitations: [
          'Analysis confidence is low',
          'Manual verification recommended',
          'Some roof features may not be visible in imagery'
        ],
        maintenanceHistory: null,
        lastInspection: null
      },
      material: {
        primaryMaterial: 'ASPHALT_ARCHITECTURAL',
        materialConfidence: 0.4,
        brand: null,
        color: null,
        style: null,
        characteristics: {
          estimatedAge: null,
          expectedLifespan: 25,
          remainingLifespan: null,
          warrantyStatus: 'UNKNOWN',
          warrantyExpiration: null
        },
        performance: {
          fireRating: 'Class A',
          windRating: 'Unknown',
          impactRating: 'Unknown',
          energyStarRated: false,
          coolRoofRated: false
        },
        evidenceFromImages: []
      },
      estimateOptions: generateEstimateOptions(estimatedAreaSqFt * 1.1),
      materialRecommendations: [],
      opportunities: [
        { name: 'Professional Inspection', category: 'MAINTENANCE', why: 'Recommended to verify measurements and condition', roughRange: '$200-$500', roi: null, priority: 'HIGH' }
      ],
      sources: []
    },
    overlay: generateFallbackOverlay(imageMeta, coordinates),
    summary: `Preliminary roof analysis for ${address}. Estimated roof area of approximately ${Math.round(estimatedAreaSqFt).toLocaleString()} sq ft. Manual verification recommended due to analysis confidence limitations.`,
    executiveSummary: {
      headline: 'Preliminary analysis completed - professional verification recommended',
      keyFindings: [
        `Estimated roof area: ${Math.round(estimatedAreaSqFt).toLocaleString()} sq ft`,
        'Standard gable roof configuration detected',
        'Unable to assess condition from available imagery'
      ],
      immediateActions: ['Schedule professional roof inspection'],
      investmentPriorities: ['Obtain accurate measurements before planning any work']
    },
    scores: {
      overall: 50,
      condition: 50,
      risk: 50,
      solarPotential: null,
      investmentValue: 50
    },
    confidenceOverall: 0.4,
    dataQuality: {
      imageryQuality: 'FAIR',
      measurementAccuracy: 'LOW',
      analysisDepth: 'BASIC',
      limitations: [
        'Unable to detect roof edges clearly',
        'Condition assessment not possible',
        'Measurements are rough estimates'
      ]
    }
  };
}

function generateEstimateOptions(areaSqFt: number) {
  const squares = Math.ceil(areaSqFt / 100);
  const perimeter = Math.sqrt(areaSqFt) * 4;

  const baseLabor = areaSqFt * 3.5;
  const baseMaterials = areaSqFt * 3.5;
  const tearOff = areaSqFt * 1.25;
  const permit = 500;
  const dumpster = 600;
  const overhead = (baseLabor + baseMaterials + tearOff) * 0.15;
  const contingency = (baseLabor + baseMaterials + tearOff) * 0.05;

  return [
    {
      optionName: 'Standard Architectural Shingles',
      systemType: 'Asphalt Shingle - Architectural',
      material: 'ASPHALT_ARCHITECTURAL',
      tier: 'MID_RANGE',
      quantitySummary: {
        squares,
        bundles: squares * 3,
        ridgeCapFt: Math.round(Math.sqrt(areaSqFt) * 0.8),
        starterFt: Math.round(perimeter),
        underlaymentSqFt: Math.round(areaSqFt),
        iceWaterShieldSqFt: Math.round(perimeter * 3),
        flashingLf: Math.round(perimeter * 0.3),
        ventCount: Math.ceil(areaSqFt / 300),
        nailsPounds: Math.ceil(squares * 2.5)
      },
      costBreakdown: {
        materialsLow: Math.round(areaSqFt * 2.5),
        materialsTypical: Math.round(baseMaterials),
        materialsHigh: Math.round(areaSqFt * 4.5),
        laborLow: Math.round(areaSqFt * 2.5),
        laborTypical: Math.round(baseLabor),
        laborHigh: Math.round(areaSqFt * 4.5),
        tearOffAndDisposal: Math.round(tearOff),
        permitAllowance: permit,
        dumpsterFees: dumpster,
        overheadAndProfit: Math.round(overhead),
        contingency: Math.round(contingency)
      },
      totalLow: Math.round((areaSqFt * 5 + tearOff + permit + dumpster) * 1.15),
      totalTypical: Math.round(baseMaterials + baseLabor + tearOff + permit + dumpster + overhead + contingency),
      totalHigh: Math.round((areaSqFt * 9 + tearOff + permit + dumpster) * 1.25),
      pricePerSqFt: Math.round((baseMaterials + baseLabor + tearOff + permit + dumpster + overhead) / areaSqFt * 100) / 100,
      assumptions: [
        'Single layer tear-off',
        'Standard roof access',
        'No structural repairs needed',
        'Pricing based on regional averages'
      ],
      warranty: {
        material: 'Lifetime Limited',
        labor: '10 years',
        total: 'Lifetime Limited with workmanship'
      },
      timeline: {
        estimatedDays: 2,
        bestSeason: 'Spring or Fall'
      },
      sources: []
    },
    {
      optionName: 'Premium Designer Shingles',
      systemType: 'Asphalt Shingle - Luxury',
      material: 'ASPHALT_LUXURY',
      tier: 'PREMIUM',
      quantitySummary: {
        squares,
        bundles: squares * 3,
        ridgeCapFt: Math.round(Math.sqrt(areaSqFt) * 0.8),
        starterFt: Math.round(perimeter),
        underlaymentSqFt: Math.round(areaSqFt),
        iceWaterShieldSqFt: Math.round(perimeter * 3),
        flashingLf: Math.round(perimeter * 0.3),
        ventCount: Math.ceil(areaSqFt / 300),
        nailsPounds: Math.ceil(squares * 3)
      },
      costBreakdown: {
        materialsLow: Math.round(areaSqFt * 4),
        materialsTypical: Math.round(areaSqFt * 5.5),
        materialsHigh: Math.round(areaSqFt * 7),
        laborLow: Math.round(areaSqFt * 3.5),
        laborTypical: Math.round(areaSqFt * 4.5),
        laborHigh: Math.round(areaSqFt * 5.5),
        tearOffAndDisposal: Math.round(tearOff),
        permitAllowance: permit,
        dumpsterFees: dumpster,
        overheadAndProfit: Math.round(overhead * 1.3),
        contingency: Math.round(contingency * 1.3)
      },
      totalLow: Math.round((areaSqFt * 7.5 + tearOff + permit + dumpster) * 1.2),
      totalTypical: Math.round((areaSqFt * 10 + tearOff + permit + dumpster + overhead * 1.3)),
      totalHigh: Math.round((areaSqFt * 12.5 + tearOff + permit + dumpster) * 1.3),
      pricePerSqFt: Math.round((areaSqFt * 10 + tearOff + permit + dumpster + overhead * 1.3) / areaSqFt * 100) / 100,
      assumptions: [
        'Premium dimensional shingles',
        '30-50 year warranty',
        'Enhanced aesthetic appeal'
      ],
      warranty: {
        material: 'Lifetime',
        labor: '25 years',
        total: 'Lifetime Plus'
      },
      timeline: {
        estimatedDays: 3,
        bestSeason: 'Spring or Fall'
      },
      sources: []
    },
    {
      optionName: 'Standing Seam Metal',
      systemType: 'Metal - Standing Seam',
      material: 'METAL_STANDING_SEAM',
      tier: 'LUXURY',
      quantitySummary: {
        squares,
        bundles: null,
        ridgeCapFt: Math.round(Math.sqrt(areaSqFt) * 0.8),
        starterFt: null,
        underlaymentSqFt: Math.round(areaSqFt),
        iceWaterShieldSqFt: Math.round(perimeter * 3),
        flashingLf: Math.round(perimeter * 0.5),
        ventCount: Math.ceil(areaSqFt / 300),
        nailsPounds: null
      },
      costBreakdown: {
        materialsLow: Math.round(areaSqFt * 6),
        materialsTypical: Math.round(areaSqFt * 8),
        materialsHigh: Math.round(areaSqFt * 11),
        laborLow: Math.round(areaSqFt * 5),
        laborTypical: Math.round(areaSqFt * 7),
        laborHigh: Math.round(areaSqFt * 9),
        tearOffAndDisposal: Math.round(tearOff),
        permitAllowance: permit,
        dumpsterFees: dumpster,
        overheadAndProfit: Math.round(overhead * 1.5),
        contingency: Math.round(contingency * 1.5)
      },
      totalLow: Math.round((areaSqFt * 11 + tearOff + permit + dumpster) * 1.2),
      totalTypical: Math.round((areaSqFt * 15 + tearOff + permit + dumpster + overhead * 1.5)),
      totalHigh: Math.round((areaSqFt * 20 + tearOff + permit + dumpster) * 1.3),
      pricePerSqFt: Math.round((areaSqFt * 15 + tearOff + permit + dumpster + overhead * 1.5) / areaSqFt * 100) / 100,
      assumptions: [
        '50+ year lifespan',
        'Maximum durability',
        'Energy efficient',
        'Specialized installation required'
      ],
      warranty: {
        material: '40-year paint finish',
        labor: '20 years',
        total: 'Lifetime substrate'
      },
      timeline: {
        estimatedDays: 4,
        bestSeason: 'Any - weather permitting'
      },
      sources: []
    }
  ];
}

function generateFallbackOverlay(
  imageMeta: { imageWidthPx: number; imageHeightPx: number; metersPerPixel: number; zoom: number },
  coordinates: { lat: number; lng: number }
) {
  const roofOutline = [
    { x: 0.3, y: 0.35 },
    { x: 0.7, y: 0.35 },
    { x: 0.7, y: 0.65 },
    { x: 0.3, y: 0.65 }
  ];

  return {
    imageMetaUsed: {
      imageWidthPx: imageMeta.imageWidthPx,
      imageHeightPx: imageMeta.imageHeightPx,
      centerLat: coordinates.lat,
      centerLng: coordinates.lng,
      zoom: imageMeta.zoom,
      metersPerPixel: imageMeta.metersPerPixel,
      bearingDegrees: 0,
      captureDate: null,
      provider: 'Google Maps',
      resolution: 'Standard',
      notes: 'Fallback overlay - manual adjustment recommended'
    },
    roofOutline: {
      normalizedPolygon: roofOutline,
      confidence: 0.5,
      perimeterFt: null,
      notes: 'Estimated outline - please verify'
    },
    facetOverlays: [
      {
        facetId: 'A',
        normalizedPolygon: [
          { x: 0.3, y: 0.35 },
          { x: 0.5, y: 0.35 },
          { x: 0.5, y: 0.65 },
          { x: 0.3, y: 0.65 }
        ],
        labelPoint: { x: 0.4, y: 0.5 },
        areaSqFt: null,
        pitch: '6:12',
        confidence: 0.5
      },
      {
        facetId: 'B',
        normalizedPolygon: [
          { x: 0.5, y: 0.35 },
          { x: 0.7, y: 0.35 },
          { x: 0.7, y: 0.65 },
          { x: 0.5, y: 0.65 }
        ],
        labelPoint: { x: 0.6, y: 0.5 },
        areaSqFt: null,
        pitch: '6:12',
        confidence: 0.5
      }
    ],
    segments: [
      { id: 'S1', type: 'RIDGE', label: 'Ridge', start: { x: 0.5, y: 0.35 }, end: { x: 0.5, y: 0.65 }, lengthFt: null, lengthFtRange: [20, 40], condition: null, confidence: 0.5 },
      { id: 'S2', type: 'EAVE', label: 'Eave N', start: { x: 0.3, y: 0.35 }, end: { x: 0.7, y: 0.35 }, lengthFt: null, lengthFtRange: [30, 60], condition: null, confidence: 0.5 },
      { id: 'S3', type: 'EAVE', label: 'Eave S', start: { x: 0.3, y: 0.65 }, end: { x: 0.7, y: 0.65 }, lengthFt: null, lengthFtRange: [30, 60], condition: null, confidence: 0.5 },
      { id: 'S4', type: 'RAKE', label: 'Rake W', start: { x: 0.3, y: 0.35 }, end: { x: 0.3, y: 0.65 }, lengthFt: null, lengthFtRange: [20, 40], condition: null, confidence: 0.5 },
      { id: 'S5', type: 'RAKE', label: 'Rake E', start: { x: 0.7, y: 0.35 }, end: { x: 0.7, y: 0.65 }, lengthFt: null, lengthFtRange: [20, 40], condition: null, confidence: 0.5 }
    ],
    jumpTo: { findingsToOverlay: [] },
    exports: { geojson: null, svgPath: null, pdfReportUrl: null, excelUrl: null, cadUrl: null }
  };
}

function ensureCompleteResult(
  result: Record<string, unknown>,
  address: string,
  coordinates: { lat: number; lng: number },
  imageMeta: { imageWidthPx: number; imageHeightPx: number; metersPerPixel: number; zoom: number }
) {
  const analysis = (result.analysis || {}) as Record<string, unknown>;
  const geometry = (analysis.geometry || {}) as Record<string, unknown>;
  const linear = (analysis.linear || {}) as Record<string, unknown>;
  const penetrations = (analysis.penetrations || {}) as Record<string, unknown>;
  const conditions = (analysis.conditions || {}) as Record<string, unknown>;
  const material = (analysis.material || {}) as Record<string, unknown>;
  const overlay = (result.overlay || {}) as Record<string, unknown>;

  return {
    status: result.status || 'OK',
    analysisId: result.analysisId || `analysis-${Date.now()}`,
    timestamp: result.timestamp || new Date().toISOString(),
    property: {
      address: (result.property as Record<string, unknown>)?.address || address,
      coordinates: (result.property as Record<string, unknown>)?.coordinates || coordinates,
      parcelNumber: (result.property as Record<string, unknown>)?.parcelNumber || null,
      subdivision: (result.property as Record<string, unknown>)?.subdivision || null,
      zoning: (result.property as Record<string, unknown>)?.zoning || null
    },
    propertyIntelligence: null,
    analysis: {
      geometry: {
        roofShape: geometry.roofShape || 'UNKNOWN',
        facets: geometry.facets || null,
        pitchRange: geometry.pitchRange || null,
        predominantPitch: geometry.predominantPitch || null,
        totalPlanAreaSqFt: geometry.totalPlanAreaSqFt || null,
        totalSurfaceAreaSqFt: geometry.totalSurfaceAreaSqFt || null,
        netAreaSqFt: geometry.netAreaSqFt || null,
        wasteFactor: geometry.wasteFactor || 0.15,
        complexityIndex: geometry.complexityIndex || null,
        planes: (geometry.planes as unknown[]) || [],
        dominantOrientation: geometry.dominantOrientation || null,
        symmetryScore: geometry.symmetryScore || null
      },
      linear: {
        eavesFt: linear.eavesFt || null,
        rakesFt: linear.rakesFt || null,
        ridgesFt: linear.ridgesFt || null,
        hipsFt: linear.hipsFt || null,
        valleysFt: linear.valleysFt || null,
        wallFlashingFt: linear.wallFlashingFt || null,
        stepFlashingFt: linear.stepFlashingFt || null,
        dripEdgeFt: linear.dripEdgeFt || null,
        gutterFt: linear.gutterFt || null,
        fasciaFt: linear.fasciaFt || null,
        soffitSqFt: linear.soffitSqFt || null,
        confidence: linear.confidence || 0.5,
        rangesFt: {
          eavesFt: (linear.rangesFt as Record<string, unknown>)?.eavesFt || null,
          rakesFt: (linear.rangesFt as Record<string, unknown>)?.rakesFt || null,
          ridgesFt: (linear.rangesFt as Record<string, unknown>)?.ridgesFt || null,
          hipsFt: (linear.rangesFt as Record<string, unknown>)?.hipsFt || null,
          valleysFt: (linear.rangesFt as Record<string, unknown>)?.valleysFt || null
        }
      },
      penetrations: {
        totalCount: penetrations.totalCount || 0,
        items: (penetrations.items as unknown[]) || [],
        skylights: penetrations.skylights || null,
        chimneys: penetrations.chimneys || null,
        vents: penetrations.vents || null,
        confidence: penetrations.confidence || 0.5
      },
      conditions: {
        overallCondition: conditions.overallCondition || 'UNKNOWN',
        conditionScore: conditions.conditionScore || null,
        estimatedAge: conditions.estimatedAge || null,
        estimatedAgeYears: conditions.estimatedAgeYears || null,
        remainingLifeYears: conditions.remainingLifeYears || null,
        layers: conditions.layers || null,
        riskFactors: (conditions.riskFactors as string[]) || [],
        findings: (conditions.findings as unknown[]) || [],
        detailedFindings: (conditions.detailedFindings as unknown[]) || [],
        limitations: (conditions.limitations as string[]) || [
          'Analysis based on satellite imagery',
          'Some conditions may not be visible from above'
        ],
        maintenanceHistory: conditions.maintenanceHistory || null,
        lastInspection: conditions.lastInspection || null
      },
      material: {
        primaryMaterial: material.primaryMaterial || 'UNKNOWN',
        materialConfidence: material.materialConfidence || 0.5,
        brand: material.brand || null,
        color: material.color || null,
        style: material.style || null,
        characteristics: (material.characteristics as Record<string, unknown>) || {
          estimatedAge: null,
          expectedLifespan: 25,
          remainingLifespan: null,
          warrantyStatus: 'UNKNOWN',
          warrantyExpiration: null
        },
        performance: (material.performance as Record<string, unknown>) || {
          fireRating: 'Unknown',
          windRating: 'Unknown',
          impactRating: 'Unknown',
          energyStarRated: false,
          coolRoofRated: false
        },
        evidenceFromImages: (material.evidenceFromImages as string[]) || []
      },
      estimateOptions: (analysis.estimateOptions as unknown[]) || [],
      materialRecommendations: (analysis.materialRecommendations as unknown[]) || [],
      opportunities: (analysis.opportunities as unknown[]) || [],
      sources: (analysis.sources as unknown[]) || []
    },
    weatherRisk: null,
    insuranceRisk: null,
    solarAnalysis: null,
    energyEfficiency: null,
    drainage: null,
    compliance: null,
    model3d: null,
    overlay: {
      imageMetaUsed: {
        imageWidthPx: imageMeta.imageWidthPx,
        imageHeightPx: imageMeta.imageHeightPx,
        centerLat: coordinates.lat,
        centerLng: coordinates.lng,
        zoom: imageMeta.zoom,
        metersPerPixel: imageMeta.metersPerPixel,
        bearingDegrees: (overlay.imageMetaUsed as Record<string, unknown>)?.bearingDegrees || 0,
        captureDate: (overlay.imageMetaUsed as Record<string, unknown>)?.captureDate || null,
        provider: (overlay.imageMetaUsed as Record<string, unknown>)?.provider || 'Google Maps',
        resolution: (overlay.imageMetaUsed as Record<string, unknown>)?.resolution || null,
        notes: (overlay.imageMetaUsed as Record<string, unknown>)?.notes || null
      },
      roofOutline: overlay.roofOutline || {
        normalizedPolygon: [],
        confidence: 0,
        perimeterFt: null,
        notes: 'Unable to detect roof outline'
      },
      facetOverlays: (overlay.facetOverlays as unknown[]) || [],
      segments: (overlay.segments as unknown[]) || [],
      jumpTo: {
        findingsToOverlay: ((overlay.jumpTo as Record<string, unknown>)?.findingsToOverlay as unknown[]) || []
      },
      exports: {
        geojson: (overlay.exports as Record<string, unknown>)?.geojson || null,
        svgPath: (overlay.exports as Record<string, unknown>)?.svgPath || null,
        pdfReportUrl: (overlay.exports as Record<string, unknown>)?.pdfReportUrl || null,
        excelUrl: (overlay.exports as Record<string, unknown>)?.excelUrl || null,
        cadUrl: (overlay.exports as Record<string, unknown>)?.cadUrl || null
      }
    },
    contractorLeads: null,
    summary: result.summary || `Roof analysis completed for ${address}.`,
    executiveSummary: result.executiveSummary || null,
    scores: result.scores || null,
    confidenceOverall: result.confidenceOverall || 0.5,
    dataQuality: result.dataQuality || null
  };
}
