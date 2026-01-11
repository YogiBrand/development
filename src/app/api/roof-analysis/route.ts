import { NextRequest, NextResponse } from 'next/server';

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

    // Fetch additional images (street views, etc.) in parallel
    const additionalImageData: { base64: string; description: string; heading?: number; pitch?: number }[] = [];
    if (additionalImages && additionalImages.length > 0) {
      const fetchPromises = additionalImages.slice(0, 4).map(async (img) => {
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

    // Create the prompt for Gemini with multi-image support
    const prompt = createRoofAnalysisPrompt(address, coordinates, imageMeta, additionalImageData.length);

    // Build the content parts with all images
    const contentParts: Array<{ inlineData?: { mimeType: string; data: string }; text?: string }> = [
      {
        inlineData: {
          mimeType: 'image/png',
          data: base64SatelliteImage,
        },
      },
    ];

    // Add additional images
    additionalImageData.forEach((imgData, idx) => {
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
            maxOutputTokens: 8192,
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
    let analysisResult;
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
                        responseText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
      analysisResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText);
      // Generate fallback result
      analysisResult = generateFallbackResult(address, coordinates, imageMeta);
    }

    // Ensure the result has all required fields
    const finalResult = ensureCompleteResult(analysisResult, address, coordinates, imageMeta);

    return NextResponse.json(finalResult);
  } catch (error) {
    console.error('Roof analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}

function createRoofAnalysisPrompt(
  address: string,
  coordinates: { lat: number; lng: number },
  imageMeta: { imageWidthPx: number; imageHeightPx: number; metersPerPixel: number; zoom: number },
  additionalImageCount: number = 0
): string {
  const multiImageInstructions = additionalImageCount > 0
    ? `

MULTIPLE IMAGES PROVIDED:
- Image 1: Main satellite/aerial view (use for measurements and polygon coordinates)
- Images 2-${additionalImageCount + 1}: Street-level views from different angles (use for condition assessment, deficiency detection, and material identification)

Use the street-level images to:
- Better identify roofing material type and color
- Spot visible damage, staining, or wear from ground level
- Assess gutter and fascia condition
- Identify visible penetrations like vents, pipes, and chimneys
- Note any visible debris or vegetation issues`
    : '';

  return `You are a professional roof measurement and analysis AI. Analyze ${additionalImageCount > 0 ? 'these images' : 'this satellite/aerial image'} of a roof and provide a comprehensive roof takeoff report.

Property: ${address}
Coordinates: ${coordinates.lat}, ${coordinates.lng}
Image Size: ${imageMeta.imageWidthPx}x${imageMeta.imageHeightPx} pixels
Ground Resolution: ${imageMeta.metersPerPixel.toFixed(4)} meters/pixel (${(imageMeta.metersPerPixel * 3.28084).toFixed(4)} feet/pixel)
Zoom Level: ${imageMeta.zoom}${multiImageInstructions}

IMPORTANT INSTRUCTIONS:
1. Trace the roof outline by identifying the visible roof edges in the FIRST (satellite) image
2. All polygon coordinates must be NORMALIZED (0 to 1) representing position in the first satellite image only
3. Calculate real measurements using the ground resolution provided
4. Identify all roof facets/planes, ridges, hips, valleys, eaves, and rakes
5. Look for visible deficiencies: damaged shingles, staining, debris, etc.${additionalImageCount > 0 ? ' (use street views for better deficiency detection)' : ''}
6. Estimate the roof condition based on visible evidence from all images

Output ONLY a valid JSON object with this exact structure (no markdown, no explanation):

{
  "status": "OK",
  "property": {
    "address": "${address}",
    "coordinates": { "lat": ${coordinates.lat}, "lng": ${coordinates.lng} }
  },
  "analysis": {
    "geometry": {
      "roofShape": "GABLE|HIP|COMPLEX|FLAT|MIXED",
      "facets": <number of roof planes>,
      "pitchRange": "<min>:12 to <max>:12",
      "predominantPitch": "<pitch>:12",
      "totalPlanAreaSqFt": <calculated area>,
      "totalSurfaceAreaSqFt": <area adjusted for pitch>,
      "netAreaSqFt": <after deductions>,
      "wasteFactor": 0.15,
      "complexityIndex": <1-10>,
      "planes": [
        { "facetId": "A", "areaSqFt": <area>, "pitch": "6:12", "confidence": 0.8 }
      ]
    },
    "linear": {
      "eavesFt": <total eave length>,
      "rakesFt": <total rake length>,
      "ridgesFt": <total ridge length>,
      "hipsFt": <total hip length>,
      "valleysFt": <total valley length>,
      "wallFlashingFt": null,
      "stepFlashingFt": null,
      "dripEdgeFt": <perimeter>,
      "confidence": 0.75,
      "rangesFt": {
        "eavesFt": [<low>, <high>],
        "rakesFt": [<low>, <high>],
        "ridgesFt": [<low>, <high>],
        "hipsFt": [<low>, <high>],
        "valleysFt": [<low>, <high>]
      }
    },
    "penetrations": {
      "totalCount": <count>,
      "items": [{ "type": "Chimney|Vent|Skylight|Pipe", "count": 1, "notes": null }],
      "confidence": 0.7
    },
    "conditions": {
      "overallCondition": "GOOD|FAIR|POOR|UNKNOWN",
      "estimatedAge": "<years> years",
      "layers": 1,
      "riskFactors": ["<any risk factors identified>"],
      "findings": [
        {
          "id": "F1",
          "type": "<issue type>",
          "severity": "LOW|MED|HIGH",
          "facetId": "A",
          "locationNotes": "<location description>",
          "evidence": "<what you observed>",
          "recommendedAction": "<recommendation>",
          "confidence": 0.7
        }
      ],
      "limitations": [
        "Analysis based on satellite imagery only",
        "Cannot detect issues not visible from above"
      ]
    },
    "estimateOptions": [
      {
        "optionName": "Standard Asphalt Shingles",
        "systemType": "3-Tab Asphalt",
        "quantitySummary": {
          "squares": <area/100>,
          "bundles": <squares * 3>,
          "ridgeCapFt": <ridge + hip length>,
          "starterFt": <perimeter>
        },
        "costBreakdown": {
          "materialsLow": <$2.50/sqft * area>,
          "materialsTypical": <$3.50/sqft * area>,
          "materialsHigh": <$4.50/sqft * area>,
          "laborLow": <$2.00/sqft * area>,
          "laborTypical": <$3.00/sqft * area>,
          "laborHigh": <$4.00/sqft * area>,
          "tearOffAndDisposal": <$1.00/sqft * area>,
          "permitAllowance": 500,
          "overheadAndProfit": <15% of above>
        },
        "totalLow": <sum of lows>,
        "totalTypical": <sum of typicals>,
        "totalHigh": <sum of highs>,
        "assumptions": [
          "Single layer tear-off",
          "Standard roof access",
          "No structural repairs"
        ],
        "sources": []
      },
      {
        "optionName": "Architectural Shingles",
        "systemType": "Dimensional Asphalt",
        "quantitySummary": { "squares": null, "bundles": null, "ridgeCapFt": null, "starterFt": null },
        "costBreakdown": {
          "materialsLow": null, "materialsTypical": null, "materialsHigh": null,
          "laborLow": null, "laborTypical": null, "laborHigh": null,
          "tearOffAndDisposal": null, "permitAllowance": null, "overheadAndProfit": null
        },
        "totalLow": <low total * 1.2>,
        "totalTypical": <typical * 1.2>,
        "totalHigh": <high * 1.2>,
        "assumptions": ["Premium materials", "Enhanced warranty"],
        "sources": []
      }
    ],
    "opportunities": [
      { "name": "Attic Ventilation", "why": "Improves roof longevity and energy efficiency", "roughRange": "$500-$1,500" },
      { "name": "Gutter Guards", "why": "Reduces maintenance and protects fascia", "roughRange": "$1,000-$2,500" }
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
      "notes": "Google Maps satellite imagery"
    },
    "roofOutline": {
      "normalizedPolygon": [
        { "x": <0-1>, "y": <0-1> }
      ],
      "confidence": 0.8,
      "notes": null
    },
    "facetOverlays": [
      {
        "facetId": "A",
        "normalizedPolygon": [{ "x": <0-1>, "y": <0-1> }],
        "labelPoint": { "x": <center x>, "y": <center y> },
        "confidence": 0.8
      }
    ],
    "segments": [
      {
        "id": "S1",
        "type": "EAVE|RAKE|RIDGE|HIP|VALLEY",
        "label": "Eave 1",
        "start": { "x": <0-1>, "y": <0-1> },
        "end": { "x": <0-1>, "y": <0-1> },
        "lengthFt": <calculated length>,
        "lengthFtRange": null,
        "confidence": 0.8
      }
    ],
    "jumpTo": {
      "findingsToOverlay": []
    },
    "exports": {
      "geojson": null,
      "svgPath": null
    }
  },
  "summary": "<2-3 sentence summary of the roof analysis>",
  "confidenceOverall": 0.75
}

Be precise with the normalized polygon coordinates - trace the actual visible roof edges. Calculate all measurements based on the provided ground resolution.`;
}

function generateFallbackResult(
  address: string,
  coordinates: { lat: number; lng: number },
  imageMeta: { imageWidthPx: number; imageHeightPx: number; metersPerPixel: number; zoom: number }
) {
  // Generate a reasonable fallback when Gemini can't parse properly
  const pixelsPerFoot = 1 / (imageMeta.metersPerPixel * 3.28084);
  const estimatedRoofWidthPx = imageMeta.imageWidthPx * 0.4;
  const estimatedRoofHeightPx = imageMeta.imageHeightPx * 0.3;
  const estimatedAreaSqFt = (estimatedRoofWidthPx / pixelsPerFoot) * (estimatedRoofHeightPx / pixelsPerFoot);

  return {
    status: 'LOW_CONFIDENCE',
    property: { address, coordinates },
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
          { facetId: 'A', areaSqFt: Math.round(estimatedAreaSqFt * 0.55), pitch: '6:12', confidence: 0.6 },
          { facetId: 'B', areaSqFt: Math.round(estimatedAreaSqFt * 0.45), pitch: '6:12', confidence: 0.6 }
        ]
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
        confidence: 0.5,
        rangesFt: {
          eavesFt: [40, 80],
          rakesFt: [30, 60],
          ridgesFt: [20, 40],
          hipsFt: null,
          valleysFt: null
        }
      },
      penetrations: { totalCount: 2, items: [{ type: 'Vent Pipe', count: 2, notes: null }], confidence: 0.5 },
      conditions: {
        overallCondition: 'UNKNOWN',
        estimatedAge: null,
        layers: null,
        riskFactors: [],
        findings: [],
        limitations: [
          'Analysis confidence is low',
          'Manual verification recommended',
          'Some roof features may not be visible in imagery'
        ]
      },
      estimateOptions: generateEstimateOptions(estimatedAreaSqFt * 1.1),
      opportunities: [
        { name: 'Professional Inspection', why: 'Recommended to verify measurements and condition', roughRange: '$200-$500' }
      ],
      sources: []
    },
    overlay: generateFallbackOverlay(imageMeta, coordinates),
    summary: `Preliminary roof analysis for ${address}. Estimated roof area of approximately ${Math.round(estimatedAreaSqFt).toLocaleString()} sq ft. Manual verification recommended due to analysis confidence limitations.`,
    confidenceOverall: 0.5
  };
}

function generateEstimateOptions(areaSqFt: number) {
  const squares = Math.ceil(areaSqFt / 100);
  const perimeter = Math.sqrt(areaSqFt) * 4;

  const baseLabor = areaSqFt * 3;
  const baseMaterials = areaSqFt * 3.5;
  const tearOff = areaSqFt * 1;
  const permit = 500;
  const overhead = (baseLabor + baseMaterials + tearOff) * 0.15;

  return [
    {
      optionName: 'Standard Asphalt Shingles',
      systemType: '3-Tab Asphalt',
      quantitySummary: {
        squares,
        bundles: squares * 3,
        ridgeCapFt: Math.round(Math.sqrt(areaSqFt) * 0.8),
        starterFt: Math.round(perimeter)
      },
      costBreakdown: {
        materialsLow: Math.round(areaSqFt * 2.5),
        materialsTypical: Math.round(baseMaterials),
        materialsHigh: Math.round(areaSqFt * 4.5),
        laborLow: Math.round(areaSqFt * 2),
        laborTypical: Math.round(baseLabor),
        laborHigh: Math.round(areaSqFt * 4),
        tearOffAndDisposal: Math.round(tearOff),
        permitAllowance: permit,
        overheadAndProfit: Math.round(overhead)
      },
      totalLow: Math.round((areaSqFt * 4.5 + tearOff + permit) * 1.15),
      totalTypical: Math.round((baseMaterials + baseLabor + tearOff + permit + overhead)),
      totalHigh: Math.round((areaSqFt * 8.5 + tearOff + permit) * 1.15),
      assumptions: [
        'Single layer tear-off',
        'Standard roof access',
        'No structural repairs needed',
        'Pricing based on regional averages'
      ],
      sources: []
    },
    {
      optionName: 'Architectural Shingles',
      systemType: 'Dimensional Asphalt',
      quantitySummary: {
        squares,
        bundles: squares * 3,
        ridgeCapFt: Math.round(Math.sqrt(areaSqFt) * 0.8),
        starterFt: Math.round(perimeter)
      },
      costBreakdown: {
        materialsLow: Math.round(areaSqFt * 3),
        materialsTypical: Math.round(areaSqFt * 4.5),
        materialsHigh: Math.round(areaSqFt * 6),
        laborLow: Math.round(areaSqFt * 2.5),
        laborTypical: Math.round(areaSqFt * 3.5),
        laborHigh: Math.round(areaSqFt * 4.5),
        tearOffAndDisposal: Math.round(tearOff),
        permitAllowance: permit,
        overheadAndProfit: Math.round(overhead * 1.2)
      },
      totalLow: Math.round((areaSqFt * 5.5 + tearOff + permit) * 1.15),
      totalTypical: Math.round((areaSqFt * 8 + tearOff + permit + overhead * 1.2)),
      totalHigh: Math.round((areaSqFt * 10.5 + tearOff + permit) * 1.15),
      assumptions: [
        'Premium dimensional shingles',
        '30-50 year warranty',
        'Enhanced aesthetic appeal'
      ],
      sources: []
    }
  ];
}

function generateFallbackOverlay(
  imageMeta: { imageWidthPx: number; imageHeightPx: number; metersPerPixel: number; zoom: number },
  coordinates: { lat: number; lng: number }
) {
  // Generate a simple rectangular roof outline in the center of the image
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
      notes: 'Fallback overlay - manual adjustment recommended'
    },
    roofOutline: {
      normalizedPolygon: roofOutline,
      confidence: 0.5,
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
        confidence: 0.5
      }
    ],
    segments: [
      { id: 'S1', type: 'RIDGE', label: 'Ridge', start: { x: 0.5, y: 0.35 }, end: { x: 0.5, y: 0.65 }, lengthFt: null, lengthFtRange: [20, 40], confidence: 0.5 },
      { id: 'S2', type: 'EAVE', label: 'Eave N', start: { x: 0.3, y: 0.35 }, end: { x: 0.7, y: 0.35 }, lengthFt: null, lengthFtRange: [30, 60], confidence: 0.5 },
      { id: 'S3', type: 'EAVE', label: 'Eave S', start: { x: 0.3, y: 0.65 }, end: { x: 0.7, y: 0.65 }, lengthFt: null, lengthFtRange: [30, 60], confidence: 0.5 },
      { id: 'S4', type: 'RAKE', label: 'Rake W', start: { x: 0.3, y: 0.35 }, end: { x: 0.3, y: 0.65 }, lengthFt: null, lengthFtRange: [20, 40], confidence: 0.5 },
      { id: 'S5', type: 'RAKE', label: 'Rake E', start: { x: 0.7, y: 0.35 }, end: { x: 0.7, y: 0.65 }, lengthFt: null, lengthFtRange: [20, 40], confidence: 0.5 }
    ],
    jumpTo: { findingsToOverlay: [] },
    exports: { geojson: null, svgPath: null }
  };
}

function ensureCompleteResult(
  result: any,
  address: string,
  coordinates: { lat: number; lng: number },
  imageMeta: { imageWidthPx: number; imageHeightPx: number; metersPerPixel: number; zoom: number }
) {
  // Make sure all required fields exist
  return {
    status: result.status || 'OK',
    property: {
      address: result.property?.address || address,
      coordinates: result.property?.coordinates || coordinates
    },
    analysis: {
      geometry: {
        roofShape: result.analysis?.geometry?.roofShape || 'UNKNOWN',
        facets: result.analysis?.geometry?.facets || null,
        pitchRange: result.analysis?.geometry?.pitchRange || null,
        predominantPitch: result.analysis?.geometry?.predominantPitch || null,
        totalPlanAreaSqFt: result.analysis?.geometry?.totalPlanAreaSqFt || null,
        totalSurfaceAreaSqFt: result.analysis?.geometry?.totalSurfaceAreaSqFt || null,
        netAreaSqFt: result.analysis?.geometry?.netAreaSqFt || null,
        wasteFactor: result.analysis?.geometry?.wasteFactor || 0.15,
        complexityIndex: result.analysis?.geometry?.complexityIndex || null,
        planes: result.analysis?.geometry?.planes || []
      },
      linear: {
        eavesFt: result.analysis?.linear?.eavesFt || null,
        rakesFt: result.analysis?.linear?.rakesFt || null,
        ridgesFt: result.analysis?.linear?.ridgesFt || null,
        hipsFt: result.analysis?.linear?.hipsFt || null,
        valleysFt: result.analysis?.linear?.valleysFt || null,
        wallFlashingFt: result.analysis?.linear?.wallFlashingFt || null,
        stepFlashingFt: result.analysis?.linear?.stepFlashingFt || null,
        dripEdgeFt: result.analysis?.linear?.dripEdgeFt || null,
        confidence: result.analysis?.linear?.confidence || 0.5,
        rangesFt: {
          eavesFt: result.analysis?.linear?.rangesFt?.eavesFt || null,
          rakesFt: result.analysis?.linear?.rangesFt?.rakesFt || null,
          ridgesFt: result.analysis?.linear?.rangesFt?.ridgesFt || null,
          hipsFt: result.analysis?.linear?.rangesFt?.hipsFt || null,
          valleysFt: result.analysis?.linear?.rangesFt?.valleysFt || null
        }
      },
      penetrations: {
        totalCount: result.analysis?.penetrations?.totalCount || 0,
        items: result.analysis?.penetrations?.items || [],
        confidence: result.analysis?.penetrations?.confidence || 0.5
      },
      conditions: {
        overallCondition: result.analysis?.conditions?.overallCondition || 'UNKNOWN',
        estimatedAge: result.analysis?.conditions?.estimatedAge || null,
        layers: result.analysis?.conditions?.layers || null,
        riskFactors: result.analysis?.conditions?.riskFactors || [],
        findings: result.analysis?.conditions?.findings || [],
        limitations: result.analysis?.conditions?.limitations || [
          'Analysis based on satellite imagery',
          'Some conditions may not be visible from above'
        ]
      },
      estimateOptions: result.analysis?.estimateOptions || [],
      opportunities: result.analysis?.opportunities || [],
      sources: result.analysis?.sources || []
    },
    overlay: {
      imageMetaUsed: {
        imageWidthPx: imageMeta.imageWidthPx,
        imageHeightPx: imageMeta.imageHeightPx,
        centerLat: coordinates.lat,
        centerLng: coordinates.lng,
        zoom: imageMeta.zoom,
        metersPerPixel: imageMeta.metersPerPixel,
        bearingDegrees: result.overlay?.imageMetaUsed?.bearingDegrees || 0,
        captureDate: result.overlay?.imageMetaUsed?.captureDate || null,
        notes: result.overlay?.imageMetaUsed?.notes || null
      },
      roofOutline: result.overlay?.roofOutline || {
        normalizedPolygon: [],
        confidence: 0,
        notes: 'Unable to detect roof outline'
      },
      facetOverlays: result.overlay?.facetOverlays || [],
      segments: result.overlay?.segments || [],
      jumpTo: {
        findingsToOverlay: result.overlay?.jumpTo?.findingsToOverlay || []
      },
      exports: {
        geojson: result.overlay?.exports?.geojson || null,
        svgPath: result.overlay?.exports?.svgPath || null
      }
    },
    summary: result.summary || `Roof analysis completed for ${address}.`,
    confidenceOverall: result.confidenceOverall || 0.5
  };
}
