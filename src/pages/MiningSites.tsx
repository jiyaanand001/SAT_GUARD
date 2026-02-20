// import { useEffect, useRef, useState, useCallback } from 'react';
// import { Loader2, Filter, Layers, AlertTriangle, TrendingUp, X, MapPin, ShieldCheck, ShieldOff } from 'lucide-react';
// import { Badge } from '@/components/ui/badge';
// import { useSites } from '@/hooks/useApi';
// import { fetchSiteById } from '@/services/api';
// import type { ApiSite } from '@/services/api';

// const SEVERITY_COLORS: Record<string, string> = {
//   Critical: '#ef4444',
//   High: '#f97316',
//   Moderate: '#f59e0b',
//   Low: '#10b981',
// };

// const SEVERITY_OPTIONS = ['All', 'Critical', 'High', 'Moderate', 'Low'];

// function makeMarkerHtml(color: string, size = 18) {
//   return `<div style="
//     width:${size}px;height:${size}px;border-radius:50%;
//     background:${color};border:2.5px solid rgba(255,255,255,0.85);
//     box-shadow:0 0 0 3px ${color}55,0 2px 8px rgba(0,0,0,0.6);
//     cursor:pointer;
//   "></div>`;
// }

// export default function MiningSites() {
//   const [severityFilter, setSeverityFilter] = useState('All');
//   const [selectedSite, setSelectedSite] = useState<ApiSite | null>(null);
//   const [loadingSite, setLoadingSite] = useState(false);

//   const mapContainerRef = useRef<HTMLDivElement>(null);
//   const mapRef = useRef<any>(null);
//   const leafletRef = useRef<any>(null);
//   const markersRef = useRef<any[]>([]);

//   const { data: sites = [], isLoading } = useSites({ limit: 100 });

//   const filtered = severityFilter === 'All' ? sites : sites.filter(s => s.severity === severityFilter);

//   // Init map once (dynamic import)
//   useEffect(() => {
//     if (!mapContainerRef.current || mapRef.current) return;
//     let cancelled = false;

//     const initMap = async () => {
//       const L = (await import('leaflet')).default;
//       await import('leaflet/dist/leaflet.css');
//       if (cancelled || !mapContainerRef.current) return;

//       leafletRef.current = L;

//       const map = L.map(mapContainerRef.current, {
//         center: [22.0, 78.0],
//         zoom: 5,
//         zoomControl: false,
//         attributionControl: false,
//       });

//       L.control.zoom({ position: 'topright' }).addTo(map);

//       L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
//         maxZoom: 19,
//       }).addTo(map);

//       mapRef.current = map;
//     };

//     initMap();

//     return () => {
//       cancelled = true;
//       mapRef.current?.remove();
//       mapRef.current = null;
//       leafletRef.current = null;
//     };
//   }, []);

//   // Place markers whenever filtered list changes
//   const placeMarkers = useCallback(() => {
//     const map = mapRef.current;
//     const L = leafletRef.current;
//     if (!map || !L || filtered.length === 0) return;

//     // Remove old markers
//     for (const m of markersRef.current) map.removeLayer(m);
//     markersRef.current = [];

//     const latLngs: [number, number][] = [];

//     filtered.forEach(site => {
//       const color = SEVERITY_COLORS[site.severity] || '#f97316';

//       const icon = L.divIcon({
//         className: '',
//         html: makeMarkerHtml(color),
//         iconSize: [18, 18],
//         iconAnchor: [9, 9],
//       });

//       const marker = L.marker([site.latitude, site.longitude], { icon }).addTo(map);

//       marker.on('click', async () => {
//         setLoadingSite(true);
//         setSelectedSite(null);
//         try {
//           const full = await fetchSiteById(site.id);
//           setSelectedSite(full);
//         } catch {
//           setSelectedSite(site);
//         } finally {
//           setLoadingSite(false);
//         }
//       });

//       markersRef.current.push(marker);
//       latLngs.push([site.latitude, site.longitude]);
//     });

//     if (latLngs.length > 0) {
//       const bounds = L.latLngBounds(latLngs);
//       map.fitBounds(bounds, { padding: [48, 48], maxZoom: 8 });
//     }
//   }, [filtered]);

//   useEffect(() => {
//     const t = setTimeout(placeMarkers, 300);
//     return () => clearTimeout(t);
//   }, [placeMarkers]);

//   const critCount = sites.filter(s => s.severity === 'Critical').length;
//   const highCount = sites.filter(s => s.severity === 'High').length;

//   const fmt = (n: number | null | undefined, decimals = 1) =>
//     n != null ? n.toFixed(decimals) : 'N/A';

//   const fmtLoss = (n: number | null | undefined) =>
//     n != null ? `₹${(n / 100000).toFixed(2)} L` : 'N/A';

//   const fmtConf = (n: number | null | undefined) =>
//     n != null ? `${n > 1 ? n.toFixed(1) : (n * 100).toFixed(1)}%` : 'N/A';

//   return (
//     <div className="flex flex-col gap-4 fade-in" style={{ height: 'calc(100vh - 56px - 48px)' }}>

//       {/* Top bar */}
//       <div className="flex flex-wrap items-center justify-between gap-3">
//         <div>
//           <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
//             <Layers className="w-6 h-6 text-primary" /> Mining Sites Map
//           </h2>
//           <p className="text-sm text-muted-foreground mt-0.5">
//             {isLoading ? 'Loading...' : `${filtered.length} site${filtered.length !== 1 ? 's' : ''} detected`}
//           </p>
//         </div>

//         <div className="flex items-center gap-2 flex-wrap">
//           <div className="hidden sm:flex items-center gap-2">
//             <Badge className="bg-destructive/15 text-red-400 border-destructive/30 border">
//               <AlertTriangle className="w-3 h-3 mr-1" /> {critCount} Critical
//             </Badge>
//             <Badge className="bg-orange-500/15 text-orange-400 border-orange-500/30 border">
//               <TrendingUp className="w-3 h-3 mr-1" /> {highCount} High
//             </Badge>
//           </div>

//           <div className="flex items-center gap-1 glass-card p-1">
//             <Filter className="w-3.5 h-3.5 text-muted-foreground ml-1" />
//             {SEVERITY_OPTIONS.map(s => (
//               <button
//                 key={s}
//                 onClick={() => setSeverityFilter(s)}
//                 className={`px-3 py-1 rounded text-xs font-medium transition-all ${
//                   severityFilter === s
//                     ? 'bg-primary text-primary-foreground shadow'
//                     : 'text-muted-foreground hover:text-foreground'
//                 }`}
//               >
//                 {s}
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Map + detail panel */}
//       <div className="flex-1 min-h-0 relative glass-card overflow-hidden">
//         {/* Map */}
//         <div ref={mapContainerRef} className="w-full h-full" />

//         {/* Loading overlay */}
//         {isLoading && (
//           <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm z-[999]">
//             <div className="flex items-center gap-3 text-foreground">
//               <Loader2 className="w-6 h-6 animate-spin text-primary" />
//               <span className="text-sm font-medium">Loading mining sites…</span>
//             </div>
//           </div>
//         )}

//         {/* Legend */}
//         <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur rounded-lg p-3 border border-border z-[1000]">
//           <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Severity</p>
//           {Object.entries(SEVERITY_COLORS).map(([sev, color]) => (
//             <div key={sev} className="flex items-center gap-2 mb-1 last:mb-0">
//               <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 5px ${color}88` }} />
//               <span className="text-[11px] text-muted-foreground">{sev}</span>
//             </div>
//           ))}
//         </div>

//         {/* Site detail panel — slides in from right */}
//         {(selectedSite || loadingSite) && (
//           <div className="absolute top-0 right-0 h-full w-72 bg-card/95 backdrop-blur border-l border-border z-[1001] flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
//             {loadingSite ? (
//               <div className="flex-1 flex items-center justify-center">
//                 <Loader2 className="w-6 h-6 animate-spin text-primary" />
//               </div>
//             ) : selectedSite ? (
//               <>
//                 {/* Header */}
//                 <div className="p-4 border-b border-border">
//                   <div className="flex items-start justify-between gap-2">
//                     <div className="min-w-0">
//                       <p className="font-semibold text-sm text-foreground leading-snug truncate">{selectedSite.name}</p>
//                       <div className="flex items-center gap-1 mt-1">
//                         <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
//                         <span className="text-[11px] font-mono text-muted-foreground">
//                           {selectedSite.latitude.toFixed(4)}, {selectedSite.longitude.toFixed(4)}
//                         </span>
//                       </div>
//                     </div>
//                     <button
//                       onClick={() => { setSelectedSite(null); setLoadingSite(false); }}
//                       className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5"
//                       aria-label="Close"
//                     >
//                       <X className="w-4 h-4" />
//                     </button>
//                   </div>
//                 </div>

//                 {/* Body */}
//                 <div className="flex-1 overflow-y-auto p-4 space-y-3">
//                   {/* Severity badge */}
//                   <div className="flex items-center justify-between">
//                     <span className="text-xs text-muted-foreground">Severity</span>
//                     <Badge
//                       className={`text-xs font-semibold border ${
//                         selectedSite.severity === 'Critical' ? 'severity-critical' :
//                         selectedSite.severity === 'High' ? 'severity-high' :
//                         selectedSite.severity === 'Moderate' ? 'severity-moderate' :
//                         'severity-low'
//                       }`}
//                     >
//                       {selectedSite.severity}
//                     </Badge>
//                   </div>

//                   {/* Stats grid */}
//                   <div className="grid grid-cols-2 gap-2">
//                     {[
//                       { label: 'Type', value: selectedSite.type || 'Unknown' },
//                       { label: 'Area', value: `${fmt(selectedSite.areaHectares)} ha`, accent: 'text-accent' },
//                       { label: 'Est. Loss', value: fmtLoss(selectedSite.estimatedLossUSD), accent: 'text-destructive' },
//                       { label: 'Confidence', value: fmtConf(selectedSite.confidence), accent: 'text-primary' },
//                     ].map(({ label, value, accent }) => (
//                       <div key={label} className="bg-background/60 rounded-lg p-2.5">
//                         <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
//                         <p className={`text-xs font-semibold ${accent ?? 'text-foreground'}`}>{value}</p>
//                       </div>
//                     ))}
//                   </div>

//                   {/* Last detected */}
//                   <div className="bg-background/60 rounded-lg p-2.5">
//                     <p className="text-[10px] text-muted-foreground mb-1">Last Detected</p>
//                     <p className="text-xs font-medium text-foreground">
//                       {selectedSite.lastDetected
//                         ? new Date(selectedSite.lastDetected).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
//                         : 'N/A'}
//                     </p>
//                   </div>

//                   {/* Verification status */}
//                   <div className="flex items-center gap-2 bg-background/60 rounded-lg p-2.5">
//                     {selectedSite.verified ? (
//                       <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
//                     ) : (
//                       <ShieldOff className="w-4 h-4 text-muted-foreground flex-shrink-0" />
//                     )}
//                     <div>
//                       <p className="text-[10px] text-muted-foreground">Verification</p>
//                       <p className={`text-xs font-semibold ${selectedSite.verified ? 'text-primary' : 'text-muted-foreground'}`}>
//                         {selectedSite.verified ? 'Verified' : 'Unverified'}
//                       </p>
//                     </div>
//                   </div>

//                   {/* Coordinates */}
//                   <div className="bg-background/60 rounded-lg p-2.5">
//                     <p className="text-[10px] text-muted-foreground mb-1">Coordinates</p>
//                     <p className="text-[11px] font-mono text-foreground">
//                       {selectedSite.latitude.toFixed(6)}, {selectedSite.longitude.toFixed(6)}
//                     </p>
//                   </div>
//                 </div>
//               </>
//             ) : null}
//           </div>
//         )}
//       </div>

//       {/* Leaflet popup style reset */}
//       <style>{`
//         .leaflet-container { background: hsl(222 47% 11%); }
//         .custom-marker { background: transparent !important; border: none !important; }
//       `}</style>
//     </div>
//   );
// }



import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSites } from '@/hooks/useApi';
import type { ApiSite } from '@/services/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertTriangle, Filter, Layers, Loader2, MapPin, RotateCcw, TrendingUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

delete (L.Icon.Default.prototype as any)._getIconUrl;

const severityColor: Record<string, string> = {
    Critical: '#ef4444',
    High: '#f97316',
    Moderate: '#f59e0b',
    Low: '#10b981',
};

const severityGlow: Record<string, string> = {
    Critical: 'rgba(239,68,68,0.55)',
    High: 'rgba(249,115,22,0.5)',
    Moderate: 'rgba(245,158,11,0.45)',
    Low: 'rgba(16,185,129,0.4)',
};

function makeIcon(severity: string, isSelected = false) {
    const color = severityColor[severity] || '#f97316';
    const glow = severityGlow[severity] || 'rgba(249,115,22,0.5)';
    const size = isSelected ? 42 : 30;
    const inner = isSelected ? 18 : 12;
    return L.divIcon({
        className: '',
        html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:3px solid white;
      box-shadow:0 0 0 3px ${glow},0 4px 12px rgba(0,0,0,0.5);
      display:flex;align-items:center;justify-content:center;
      ${isSelected ? 'animation:pulse 1.2s infinite;' : ''}
    ">
      <svg width="${inner}" height="${inner}" viewBox="0 0 24 24" fill="white">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      </svg>
    </div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
}

const SEVERITY_OPTIONS = ['All', 'Critical', 'High', 'Moderate', 'Low'];

export default function MiningSites() {
    const [severityFilter, setSeverityFilter] = useState('All');
    const [selectedSite, setSelectedSite] = useState<ApiSite | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markersRef = useRef<Map<string, L.Marker>>(new Map());
    const circlesRef = useRef<L.Circle[]>([]);

    const { data: sites = [], isLoading } = useSites({ limit: 100 });

    const filtered = severityFilter === 'All' ? sites : sites.filter(s => s.severity === severityFilter);

    // Init map once
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center: [20.5937, 78.9629],
            zoom: 5,
            zoomControl: false,
        });
        mapRef.current = map;

        L.control.zoom({ position: 'topright' }).addTo(map);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap © CARTO',
            maxZoom: 19,
        }).addTo(map);

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // Update markers when data or filter changes
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        // Clear existing markers and circles
        markersRef.current.forEach(m => m.remove());
        markersRef.current.clear();
        circlesRef.current.forEach(c => c.remove());
        circlesRef.current = [];

        filtered.forEach(site => {
            const color = severityColor[site.severity] || '#f97316';
            const isSelected = selectedSite?.id === site.id;

            const marker = L.marker([site.latitude, site.longitude], {
                icon: makeIcon(site.severity, isSelected),
                zIndexOffset: isSelected ? 1000 : 0,
            }).addTo(map);

            const confidence = site.confidence ? `${Math.round(site.confidence * 100)}%` : 'N/A';
            const area = site.areaHectares ? `${site.areaHectares.toFixed(1)} ha` : 'N/A';
            const loss = site.estimatedLossUSD
                ? `₹${(site.estimatedLossUSD / 100000).toFixed(2)} L`
                : 'N/A';
            const date = site.lastDetected
                ? new Date(site.lastDetected).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                : 'N/A';

            marker.bindPopup(
                `<div style="
          font-family:Inter,system-ui,sans-serif;
          background:#1e293b;color:#f1f5f9;
          padding:14px;min-width:240px;max-width:280px;
          border-radius:10px;border:1px solid #334155;
          box-shadow:0 8px 24px rgba(0,0,0,0.5);
        ">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
            <b style="font-size:14px;line-height:1.3;color:#f1f5f9;">${site.name}</b>
            <span style="
              padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;
              background:${color}22;color:${color};border:1px solid ${color}55;
            ">${site.severity}</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px;">
            <div style="background:#0f172a;border-radius:6px;padding:6px;">
              <div style="color:#64748b;margin-bottom:2px;">Confidence</div>
              <div style="font-weight:600;color:#10b981;">${confidence}</div>
            </div>
            <div style="background:#0f172a;border-radius:6px;padding:6px;">
              <div style="color:#64748b;margin-bottom:2px;">Type</div>
              <div style="font-weight:600;">${site.type || 'Unknown'}</div>
            </div>
            <div style="background:#0f172a;border-radius:6px;padding:6px;">
              <div style="color:#64748b;margin-bottom:2px;">Area</div>
              <div style="font-weight:600;color:#f59e0b;">${area}</div>
            </div>
            <div style="background:#0f172a;border-radius:6px;padding:6px;">
              <div style="color:#64748b;margin-bottom:2px;">Est. Loss</div>
              <div style="font-weight:600;color:#ef4444;">${loss}</div>
            </div>
          </div>
          <div style="margin-top:8px;padding:6px;background:#0f172a;border-radius:6px;font-size:11px;">
            <div style="color:#64748b;margin-bottom:2px;">Coordinates</div>
            <div style="font-family:monospace;">${site.latitude.toFixed(6)}, ${site.longitude.toFixed(6)}</div>
          </div>
          <div style="margin-top:6px;font-size:11px;color:#64748b;display:flex;justify-content:space-between;">
            <span>Last Detected: <b style="color:#94a3b8;">${date}</b></span>
            <span>${site.verified ? '✅ Verified' : '⏳ Pending'}</span>
          </div>
        </div>`,
                {
                    maxWidth: 300,
                    className: 'dark-popup',
                }
            );

            marker.on('click', () => setSelectedSite(site));

            // Glow circle
            const radius = (site.areaHectares || 10) * 50;
            const circle = L.circle([site.latitude, site.longitude], {
                color: color,
                fillColor: color,
                fillOpacity: 0.08,
                weight: 1,
                opacity: 0.4,
                radius,
            }).addTo(map);
            circlesRef.current.push(circle);
            markersRef.current.set(site.id, marker);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtered, selectedSite?.id]);

    const flyTo = (site: ApiSite) => {
        mapRef.current?.flyTo([site.latitude, site.longitude], 12, { duration: 1.2 });
        setSelectedSite(site);
        const marker = markersRef.current.get(site.id);
        if (marker) marker.openPopup();
    };

    const resetView = () => {
        mapRef.current?.flyTo([20.5937, 78.9629], 5, { duration: 1 });
        setSelectedSite(null);
    };

    const critCount = sites.filter(s => s.severity === 'Critical').length;
    const highCount = sites.filter(s => s.severity === 'High').length;

    return (
        <div className="flex flex-col gap-0 fade-in" style={{ height: 'calc(100vh - 56px - 48px)' }}>
            {/* Top bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Layers className="w-6 h-6 text-primary" /> Mining Sites Map
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {isLoading ? 'Loading...' : `${filtered.length} site${filtered.length !== 1 ? 's' : ''} detected`}
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Severity stats */}
                    <div className="hidden sm:flex items-center gap-2">
                        <Badge className="bg-red-500/15 text-red-400 border-red-500/30 border">
                            <AlertTriangle className="w-3 h-3 mr-1" /> {critCount} Critical
                        </Badge>
                        <Badge className="bg-orange-500/15 text-orange-400 border-orange-500/30 border">
                            <TrendingUp className="w-3 h-3 mr-1" /> {highCount} High
                        </Badge>
                    </div>

                    {/* Filter buttons */}
                    <div className="flex items-center gap-1 glass-card p-1">
                        <Filter className="w-3.5 h-3.5 text-muted-foreground ml-1" />
                        {SEVERITY_OPTIONS.map(s => (
                            <button
                                key={s}
                                onClick={() => setSeverityFilter(s)}
                                className={`px-3 py-1 rounded text-xs font-medium transition-all ${severityFilter === s
                                    ? 'bg-primary text-primary-foreground shadow'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    <Button variant="ghost" size="icon" onClick={resetView} title="Reset view">
                        <RotateCcw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Map + sidebar */}
            <div className="flex gap-4 flex-1 min-h-0">
                {/* Sites list panel */}
                <div className="w-64 flex-shrink-0 glass-card overflow-y-auto flex flex-col gap-1 p-2">
                    <p className="text-[11px] text-muted-foreground px-2 py-1 font-semibold uppercase tracking-wider">
                        {filtered.length} Sites
                    </p>
                    {isLoading ? (
                        <div className="flex items-center justify-center flex-1 text-muted-foreground">
                            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex items-center justify-center flex-1 text-muted-foreground text-sm">No sites found</div>
                    ) : (
                        filtered.map(site => {
                            const color = severityColor[site.severity] || '#f97316';
                            const isActive = selectedSite?.id === site.id;
                            return (
                                <button
                                    key={site.id}
                                    onClick={() => flyTo(site)}
                                    className={`w-full text-left rounded-lg p-2.5 transition-all border ${isActive
                                        ? 'bg-primary/10 border-primary/40'
                                        : 'border-transparent hover:bg-secondary/50'
                                        }`}
                                >
                                    <div className="flex items-start gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold text-foreground truncate leading-tight">{site.name}</p>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <span className="text-[10px]" style={{ color }}>{site.severity}</span>
                                                <span className="text-[10px] text-muted-foreground">· {site.type}</span>
                                            </div>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <MapPin className="w-2.5 h-2.5 text-muted-foreground" />
                                                <span className="text-[10px] font-mono text-muted-foreground">
                                                    {site.latitude.toFixed(3)}, {site.longitude.toFixed(3)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Map */}
                <div className="flex-1 glass-card overflow-hidden relative">
                    <div ref={mapContainerRef} className="w-full h-full" />

                    {/* Legend overlay */}
                    <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur rounded-lg p-3 border border-border z-[1000]">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Severity</p>
                        {Object.entries(severityColor).map(([sev, color]) => (
                            <div key={sev} className="flex items-center gap-2 mb-1">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                                <span className="text-[11px] text-muted-foreground">{sev}</span>
                            </div>
                        ))}
                    </div>

                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm z-[999]">
                            <div className="flex items-center gap-3 text-foreground">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                <span className="text-sm">Loading mining sites...</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        .dark-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .dark-popup .leaflet-popup-content {
          margin: 0 !important;
        }
        .dark-popup .leaflet-popup-tip {
          background: #1e293b !important;
        }
        .dark-popup .leaflet-popup-close-button {
          color: #94a3b8 !important;
          top: 8px !important;
          right: 8px !important;
        }
      `}</style>
        </div>
    );
}