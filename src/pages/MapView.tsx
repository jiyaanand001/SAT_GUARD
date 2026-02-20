import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function MapView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const lat = parseFloat(searchParams.get('lat') || '28.6139');
  const lng = parseFloat(searchParams.get('lng') || '77.2090');
  const name = searchParams.get('name') || 'Detection Site';
  const severity = searchParams.get('severity') || 'High';
  const confidence = searchParams.get('confidence') || '0';
  const detectionId = searchParams.get('detection_id') || '';

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const severityColor =
      severity === 'Critical' ? 'red' : severity === 'High' ? 'orange' : 'yellow';

    const mapInstance = L.map(mapContainerRef.current).setView([lat, lng], 13);
    mapRef.current = mapInstance;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapInstance);

    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color:${severityColor};width:40px;height:40px;border-radius:50%;border:4px solid white;box-shadow:0 4px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
      </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(mapInstance);

    marker.bindPopup(`
      <div style="padding:8px;min-width:200px;">
        <h3 style="margin:0 0 8px;font-size:16px;font-weight:bold;color:#1e293b;">${name}</h3>
        <div style="margin-bottom:4px;"><b>Confidence:</b> ${confidence}%</div>
        <div style="margin-bottom:4px;"><b>Severity:</b> <span style="color:${severityColor};font-weight:bold">${severity}</span></div>
        <div><b>Coords:</b> ${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
        <div style="margin-top:8px;font-size:11px;color:#64748b;">Detection ID: ${detectionId}</div>
      </div>
    `).openPopup();

    const radius = severity === 'Critical' ? 500 : severity === 'High' ? 300 : 200;
    L.circle([lat, lng], {
      color: severityColor,
      fillColor: severityColor,
      fillOpacity: 0.2,
      radius,
    }).addTo(mapInstance);

    return () => {
      mapInstance.remove();
      mapRef.current = null;
    };
  }, [lat, lng, name, severity, confidence, detectionId]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Detection Location
              </h1>
              <p className="text-sm text-muted-foreground">{name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-secondary rounded-lg text-sm">
              <span className="text-muted-foreground">Confidence: </span>
              <span className="text-foreground font-semibold">{confidence}%</span>
            </div>
            <div className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              severity === 'Critical' ? 'bg-destructive/20 text-destructive border border-destructive'
              : severity === 'High' ? 'bg-orange-500/20 text-orange-400 border border-orange-500'
              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500'
            }`}>
              {severity} Severity
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="relative">
        <div ref={mapContainerRef} className="w-full" style={{ height: 'calc(100vh - 73px)' }} />

        {/* Info Panel */}
        <div className="absolute bottom-6 left-6 bg-card/95 backdrop-blur rounded-lg shadow-2xl p-6 max-w-md border border-border">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-destructive/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">Mining Activity Detected</h3>
              <p className="text-sm text-muted-foreground">Illegal mining activity has been detected at this location</p>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Location:</span><span className="text-foreground font-semibold">{name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Coordinates:</span><span className="text-foreground font-mono text-xs">{lat.toFixed(6)}, {lng.toFixed(6)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Detection ID:</span><span className="text-foreground font-mono text-xs">{detectionId}</span></div>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute top-6 right-6 bg-card/95 backdrop-blur rounded-lg shadow-2xl p-4 border border-border">
          <h4 className="text-sm font-bold text-foreground mb-3">Severity Levels</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-red-500" /><span className="text-sm text-muted-foreground">Critical</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-orange-500" /><span className="text-sm text-muted-foreground">High</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-yellow-500" /><span className="text-sm text-muted-foreground">Moderate</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
