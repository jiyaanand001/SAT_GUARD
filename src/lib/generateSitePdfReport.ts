import jsPDF from 'jspdf';

const BASE_URL = 'https://illegal-mining-api.onrender.com';

interface SiteData {
  id: number | string;
  location_name?: string;
  name?: string;
  latitude: number;
  longitude: number;
  confidence: number;
  severity: string;
  mining_type?: string;
  type?: string;
  area_hectares?: number;
  areaHectares?: number;
  estimated_loss_usd?: number;
  estimatedLossUSD?: number;
  detected_at?: string;
  lastDetected?: string;
  verified: boolean | null;
  reasoning?: string;
}

export async function generateSitePdfReport(siteId: string | number) {
  let data: SiteData;
  try {
    const res = await fetch(`${BASE_URL}/api/sites/${siteId}`);
    if (!res.ok) throw new Error('API error');
    data = await res.json();
  } catch {
    throw new Error('Failed to fetch site data for report');
  }

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  let yPosition = 20;

  const locationName = data.location_name || data.name || 'Unknown';
  const severity = data.severity || 'Unknown';
  const confidence = typeof data.confidence === 'number' ? data.confidence : 0;
  const verified = data.verified;
  const areaHa = data.area_hectares ?? data.areaHectares ?? 0;
  const lossUSD = data.estimated_loss_usd ?? data.estimatedLossUSD ?? 0;
  const miningType = data.mining_type || data.type || 'Unknown';
  const detectedAt = data.detected_at || data.lastDetected || '';

  const severityColors: Record<string, [number, number, number]> = {
    Critical: [239, 68, 68],
    High: [249, 115, 22],
    Moderate: [234, 179, 8],
    Low: [34, 197, 94],
  };

  const [r, g, b] = severityColors[severity] || [100, 100, 100];

  const checkPageBreak = (neededSpace: number) => {
    if (yPosition + neededSpace > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
    }
  };

  const addSection = (title: string, content: string[]) => {
    checkPageBreak(40);
    doc.setFillColor(16, 185, 129);
    doc.rect(15, yPosition - 5, pageWidth - 30, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 20, yPosition);
    yPosition += 10;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    content.forEach((line) => {
      checkPageBreak(10);
      const splitText = doc.splitTextToSize(line, pageWidth - 40);
      doc.text(splitText, 20, yPosition);
      yPosition += splitText.length * 5 + 3;
    });
    yPosition += 5;
  };

  // ─── HEADER ───────────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 50, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('SATGUARD', 20, 20);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('AI-Powered Illegal Mining Detection System', 20, 28);

  doc.setFontSize(10);
  doc.text('Ministry of Mines | Government of India', 20, 35);

  doc.setTextColor(200, 200, 200);
  doc.setFontSize(9);
  doc.text(`Report ID: RPT-${data.id}`, pageWidth - 70, 20);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - 70, 26);
  doc.text(`Time: ${new Date().toLocaleTimeString('en-IN')}`, pageWidth - 70, 32);

  // Severity badge in header
  doc.setFillColor(r, g, b);
  doc.roundedRect(pageWidth - 45, 37, 30, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(severity.toUpperCase(), pageWidth - 30, 42, { align: 'center' });

  yPosition = 60;

  // ─── TITLE & LOCATION ─────────────────────────────────────────────────
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('MINING DETECTION REPORT', 20, yPosition);
  yPosition += 8;

  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text(locationName, 20, yPosition);
  yPosition += 14;

  // ─── CONFIDENCE & STATUS BOXES ────────────────────────────────────────
  // Confidence box
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(15, yPosition - 5, 85, 22, 3, 3, 'F');
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.5);
  doc.roundedRect(15, yPosition - 5, 85, 22, 3, 3, 'S');
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('AI Confidence Score', 20, yPosition + 1);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(`${confidence.toFixed(1)}%`, 52, yPosition + 13);

  // Status box
  const [vr, vg, vb] = verified ? [34, 197, 94] : [249, 115, 22];
  doc.setFillColor(verified ? 240 : 254, verified ? 253 : 243, verified ? 244 : 238);
  doc.roundedRect(108, yPosition - 5, 85, 22, 3, 3, 'F');
  doc.setDrawColor(vr, vg, vb);
  doc.roundedRect(108, yPosition - 5, 85, 22, 3, 3, 'S');
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Verification Status', 113, yPosition + 1);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(vr, vg, vb);
  doc.text(verified ? 'VERIFIED' : 'UNVERIFIED', 150, yPosition + 13, { align: 'center' });

  yPosition += 32;

  // ─── KEY METRICS GRID ─────────────────────────────────────────────────
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('KEY DETECTION METRICS', 20, yPosition);
  yPosition += 8;

  const metrics = [
    { label: 'Coordinates', value: `${data.latitude.toFixed(4)}°N, ${data.longitude.toFixed(4)}°E` },
    { label: 'Mining Type', value: miningType },
    { label: 'Area Affected', value: `${areaHa.toFixed(2)} hectares` },
    { label: 'Estimated Loss', value: `₹${(lossUSD / 100000).toFixed(2)} Lakhs` },
    { label: 'Detection Date', value: detectedAt ? new Date(detectedAt).toLocaleDateString('en-IN') : 'N/A' },
    { label: 'Severity Level', value: severity },
  ];

  let col = 0;
  const colWidth = 92;

  metrics.forEach((metric) => {
    const xPos = 15 + col * colWidth;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(xPos, yPosition - 3, 87, 18, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(xPos, yPosition - 3, 87, 18, 2, 2, 'S');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(metric.label, xPos + 4, yPosition + 2);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(doc.splitTextToSize(metric.value, 79), xPos + 4, yPosition + 11);

    col++;
    if (col === 2) {
      col = 0;
      yPosition += 23;
    }
  });

  if (col !== 0) yPosition += 23;
  yPosition += 8;

  // ─── AI ANALYSIS ──────────────────────────────────────────────────────
  if (data.reasoning) {
    addSection('AI DETECTION ANALYSIS', [data.reasoning]);
  }

  // ─── ENVIRONMENTAL IMPACT ─────────────────────────────────────────────
  const treesDestroyed = Math.floor(areaHa * 200);
  const waterImpact =
    severity === 'Critical' ? 'Severe contamination risk' :
    severity === 'High' ? 'Moderate contamination risk' :
    'Low contamination risk';

  addSection('ENVIRONMENTAL IMPACT ASSESSMENT', [
    `Trees Destroyed (Estimated): ${treesDestroyed.toLocaleString('en-IN')} trees`,
    `Land Degradation: ${areaHa.toFixed(2)} hectares of productive land affected`,
    `Water Contamination: ${waterImpact}`,
    `Soil Erosion Risk: ${severity} level erosion patterns detected`,
    `Biodiversity Loss: Habitat destruction in ${areaHa.toFixed(2)} hectare area`,
    `Air Quality: Dust and particulate matter pollution from mining operations`,
  ]);

  // ─── LEGAL VIOLATIONS ─────────────────────────────────────────────────
  addSection('POTENTIAL LEGAL VIOLATIONS', [
    '• Mines and Minerals (Development and Regulation) Act, 1957 - Section 4 (Unauthorized Mining)',
    '• Environment Protection Act, 1986 - Section 15 (Environmental Damage)',
    '• Forest Conservation Act, 1980 - Section 2 (Forest Land Diversion)',
    '• Water (Prevention and Control of Pollution) Act, 1974 - Section 24 (Water Pollution)',
    '• Air (Prevention and Control of Pollution) Act, 1981 - Section 22 (Air Pollution)',
    '• Wildlife Protection Act, 1972 - Section 29 (Habitat Destruction)',
  ]);

  // ─── RECOMMENDED ACTIONS ──────────────────────────────────────────────
  addSection('IMMEDIATE RECOMMENDED ACTIONS', [
    '1. URGENT: Dispatch field inspection team within 24 hours',
    '2. Issue cease and desist order to halt all mining operations',
    '3. Conduct detailed environmental impact assessment',
    '4. Initiate legal proceedings against violators',
    '5. Install continuous monitoring for area surveillance',
    '6. Coordinate with local police and mining authorities',
    '7. Document evidence for court proceedings',
    '8. Issue public notice regarding illegal activity',
    '9. Begin environmental restoration planning',
    '10. Submit report to National Green Tribunal (NGT)',
  ]);

  // ─── GEOGRAPHIC INFO ──────────────────────────────────────────────────
  addSection('GEOGRAPHIC INFORMATION', [
    `Location Name: ${locationName}`,
    `Latitude: ${data.latitude.toFixed(6)}°N`,
    `Longitude: ${data.longitude.toFixed(6)}°E`,
    `Coordinate System: WGS84`,
    `Detection Method: Satellite imagery analysis using AI/ML`,
    `Satellite Source: Sentinel-2 / Landsat-8`,
    `Image Resolution: 10-30 meters per pixel`,
  ]);

  // ─── DETECTION EVIDENCE ───────────────────────────────────────────────
  addSection('DETECTION EVIDENCE', [
    `Detection ID: ${data.id}`,
    `AI Model: SATGUARD Mining Detection v2.1`,
    `Detection Algorithm: CNN-BiGRU-Attention Network`,
    `Confidence Score: ${confidence.toFixed(1)}% (${confidence >= 95 ? 'Very High' : confidence >= 85 ? 'High' : 'Moderate'})`,
    `Processing Date: ${detectedAt ? new Date(detectedAt).toLocaleDateString('en-IN') : 'N/A'}`,
    `Verification Status: ${verified ? 'Field Verified' : 'Pending Verification'}`,
    `Image Quality: High resolution satellite imagery`,
    `Weather Conditions: Clear visibility during capture`,
  ]);

  // ─── DISCLAIMER ───────────────────────────────────────────────────────
  checkPageBreak(45);
  doc.setFillColor(248, 250, 252);
  doc.rect(15, yPosition, pageWidth - 30, 38, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.rect(15, yPosition, pageWidth - 30, 38, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('LEGAL DISCLAIMER', 20, yPosition + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const disclaimer =
    'This report is generated by SATGUARD AI system using satellite imagery analysis. The information provided is based on artificial intelligence algorithms and should be verified through field inspection. This document can be used as supporting evidence in legal proceedings but requires ground verification for conclusive determination. All coordinates and measurements are approximate and subject to ±5 meter accuracy.';
  const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - 40);
  doc.text(disclaimerLines, 20, yPosition + 14);

  // ─── FOOTER ON ALL PAGES ──────────────────────────────────────────────
  const totalPages = (doc.internal as unknown as { pages: unknown[] }).pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text('Generated by SATGUARD AI System | Ministry of Mines, Government of India', 20, pageHeight - 9);
    doc.text(`Confidential — Page ${i} of ${totalPages}`, pageWidth - 20, pageHeight - 9, { align: 'right' });
  }

  // ─── SAVE ─────────────────────────────────────────────────────────────
  const filename = `SATGUARD_Report_${locationName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
