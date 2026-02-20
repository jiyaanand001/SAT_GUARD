// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Skeleton } from '@/components/ui/skeleton';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import { useToast } from '@/hooks/use-toast';
// import { useAddMonitoringArea, useMonitoringQueue } from '@/hooks/useApi';
// import { CheckCircle, Clock, Loader2, Plus } from 'lucide-react';
// import { useState } from 'react';

// const statusStyles: Record<string, { class: string; icon: any }> = {
//   Pending: { class: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: Clock },
//   pending: { class: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: Clock },
//   Scanning: { class: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: Loader2 },
//   scanning: { class: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: Loader2 },
//   Completed: { class: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: CheckCircle },
//   completed: { class: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: CheckCircle },
// };

// function timeAgo(dateStr: string) {
//   if (!dateStr) return 'N/A';
//   const diff = Date.now() - new Date(dateStr).getTime();
//   const hours = Math.floor(diff / 3600000);
//   if (hours < 24) return `${hours}h ago`;
//   return `${Math.floor(hours / 24)}d ago`;
// }

// export default function Monitoring() {
//   const [areaName, setAreaName] = useState('');
//   const [lat, setLat] = useState('');
//   const [lng, setLng] = useState('');
//   const { toast } = useToast();
//   const { data: queueData, isLoading } = useMonitoringQueue();
//   const addArea = useAddMonitoringArea();

//   const areas = queueData?.areas || [];

//   const handleAdd = () => {
//     if (!areaName || !lat || !lng) {
//       toast({ title: 'Missing fields', variant: 'destructive' });
//       return;
//     }
//     addArea.mutate(
//       { area_name: areaName, latitude: parseFloat(lat), longitude: parseFloat(lng) },
//       {
//         onSuccess: () => {
//           toast({ title: 'Area Added', description: `${areaName} added to monitoring queue.` });
//           setAreaName(''); setLat(''); setLng('');
//         },
//         onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
//       }
//     );
//   };

//   const pendingCount = areas.filter(a => a.status === 'Pending' || a.status === 'pending').length;
//   const completedCount = areas.filter(a => a.status === 'Completed' || a.status === 'completed').length;

//   return (
//     <div className="space-y-6 fade-in">
//       <div>
//         <h2 className="text-2xl font-bold text-foreground">Monitoring Queue</h2>
//         <p className="text-sm text-muted-foreground mt-1">Manage areas under active satellite surveillance</p>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
//         <div className="lg:col-span-3 glass-card p-6">
//           <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
//             <Plus className="w-4 h-4 text-primary" /> Add New Monitoring Area
//           </h3>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div><Label className="text-muted-foreground">Area Name</Label><Input value={areaName} onChange={e => setAreaName(e.target.value)} className="mt-1 bg-secondary/50" placeholder="e.g. Western Ghats Zone" /></div>
//             <div><Label className="text-muted-foreground">Latitude</Label><Input type="number" value={lat} onChange={e => setLat(e.target.value)} className="mt-1 bg-secondary/50" placeholder="e.g. 15.49" /></div>
//             <div><Label className="text-muted-foreground">Longitude</Label><Input type="number" value={lng} onChange={e => setLng(e.target.value)} className="mt-1 bg-secondary/50" placeholder="e.g. 73.83" /></div>
//           </div>
//           <Button onClick={handleAdd} disabled={addArea.isPending} className="mt-4">
//             {addArea.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />} Add to Queue
//           </Button>
//         </div>

//         <div className="glass-card p-6 space-y-4">
//           <h3 className="text-sm font-semibold text-foreground">Queue Stats</h3>
//           <div className="space-y-3">
//             <div className="flex justify-between"><span className="text-sm text-muted-foreground">Total Areas</span><span className="text-sm font-bold text-foreground">{isLoading ? '...' : areas.length}</span></div>
//             <div className="flex justify-between"><span className="text-sm text-muted-foreground">Pending</span><span className="text-sm font-bold text-amber-400">{isLoading ? '...' : pendingCount}</span></div>
//             <div className="flex justify-between"><span className="text-sm text-muted-foreground">Completed</span><span className="text-sm font-bold text-primary">{isLoading ? '...' : completedCount}</span></div>
//             <div className="border-t border-border pt-3"><p className="text-xs text-muted-foreground">Next scheduled scan</p><p className="text-sm font-medium text-foreground">{queueData?.next_scan_time || 'N/A'}</p></div>
//           </div>
//         </div>
//       </div>

//       <div className="glass-card overflow-hidden">
//         {isLoading ? (
//           <div className="p-4 space-y-3">
//             {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
//           </div>
//         ) : (
//           <Table>
//             <TableHeader>
//               <TableRow className="border-border hover:bg-transparent">
//                 <TableHead className="text-muted-foreground">Area Name</TableHead>
//                 <TableHead className="text-muted-foreground">Coordinates</TableHead>
//                 <TableHead className="text-muted-foreground">Status</TableHead>
//                 <TableHead className="text-muted-foreground">Requested By</TableHead>
//                 <TableHead className="text-muted-foreground">Last Scanned</TableHead>
//                 <TableHead className="text-muted-foreground">Frequency</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {areas.map(area => {
//                 const st = statusStyles[area.status] || statusStyles['Pending'];
//                 const StatusIcon = st.icon;
//                 return (
//                   <TableRow key={area.id} className="border-border hover:bg-secondary/30">
//                     <TableCell className="font-medium">{area.area_name}</TableCell>
//                     <TableCell className="text-xs text-muted-foreground font-mono">{area.latitude}, {area.longitude}</TableCell>
//                     <TableCell>
//                       <Badge variant="outline" className={`text-[10px] ${st.class} flex items-center gap-1 w-fit`}>
//                         <StatusIcon className={`w-3 h-3 ${area.status === 'Scanning' || area.status === 'scanning' ? 'animate-spin' : ''}`} />
//                         {area.status}
//                       </Badge>
//                     </TableCell>
//                     <TableCell className="text-sm">{area.requested_by}</TableCell>
//                     <TableCell className="text-xs text-muted-foreground">{timeAgo(area.last_scanned)}</TableCell>
//                     <TableCell className="text-sm">{area.scan_frequency}</TableCell>
//                   </TableRow>
//                 );
//               })}
//             </TableBody>
//           </Table>
//         )}
//       </div>
//     </div>
//   );
// }




import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAddMonitoringArea, useMonitoringQueue } from '@/hooks/useApi';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CheckCircle, Clock, Crosshair, Loader2, MapPin, Navigation, Plus } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const statusStyles: Record<string, { class: string; icon: any }> = {
  Pending: { class: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: Clock },
  pending: { class: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: Clock },
  Scanning: { class: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: Loader2 },
  scanning: { class: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: Loader2 },
  Completed: { class: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: CheckCircle },
  completed: { class: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: CheckCircle },
};

function timeAgo(dateStr: string) {
  if (!dateStr) return 'N/A';
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const greenIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background-color:#10b981;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="#10b981"/></svg>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const redIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background-color:#ef4444;width:32px;height:32px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(239,68,68,0.5);display:flex;align-items:center;justify-content:center;animation:pulse 1.5s infinite;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="#ef4444"/></svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export default function Monitoring() {
  const [areaName, setAreaName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [selectedName, setSelectedName] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const { toast } = useToast();
  const { data: queueData, isLoading } = useMonitoringQueue();
  const addArea = useAddMonitoringArea();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const selectedMarkerRef = useRef<L.Marker | null>(null);
  const existingMarkersRef = useRef<L.Marker[]>([]);

  const areas = queueData?.areas || [];

  const reverseGeocode = useCallback(async (latitude: number, longitude: number) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      const addr = data.address || {};
      const name = addr.city || addr.town || addr.village || addr.county || addr.state_district || data.display_name?.split(',')[0] || 'Unknown Area';
      setSelectedName(`${name} Zone`);
    } catch {
      setSelectedName(`Area ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20.5937, 78.9629], // India center
      zoom: 5,
      zoomControl: false,
    });
    mapRef.current = map;

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      maxZoom: 19,
    }).addTo(map);

    // Click handler
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setSelectedLat(lat);
      setSelectedLng(lng);

      // Remove previous selected marker
      if (selectedMarkerRef.current) {
        selectedMarkerRef.current.remove();
      }

      const marker = L.marker([lat, lng], { icon: redIcon }).addTo(map);
      marker.bindPopup(
        `<div style="text-align:center;padding:4px;">
          <b style="color:#ef4444;">New Selection</b><br/>
          <span style="font-size:11px;">${lat.toFixed(6)}, ${lng.toFixed(6)}</span>
        </div>`
      ).openPopup();
      selectedMarkerRef.current = marker;

      reverseGeocode(lat, lng);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [reverseGeocode]);

  // Update existing area markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear old markers
    existingMarkersRef.current.forEach(m => m.remove());
    existingMarkersRef.current = [];

    areas.forEach(area => {
      const marker = L.marker([area.latitude, area.longitude], { icon: greenIcon }).addTo(mapRef.current!);
      marker.bindPopup(
        `<div style="padding:4px;">
          <b style="color:#10b981;">${area.area_name}</b><br/>
          <span style="font-size:11px;">Status: ${area.status}</span><br/>
          <span style="font-size:11px;">${area.latitude.toFixed(4)}, ${area.longitude.toFixed(4)}</span>
        </div>`
      );
      existingMarkersRef.current.push(marker);
    });
  }, [areas]);

  const handleAddFromMap = () => {
    if (selectedLat === null || selectedLng === null || !selectedName) return;
    addArea.mutate(
      { area_name: selectedName, latitude: selectedLat, longitude: selectedLng },
      {
        onSuccess: () => {
          toast({ title: 'Area Added', description: `${selectedName} added to monitoring queue.` });
          setSelectedLat(null);
          setSelectedLng(null);
          setSelectedName('');
          if (selectedMarkerRef.current) {
            selectedMarkerRef.current.remove();
            selectedMarkerRef.current = null;
          }
        },
        onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
      }
    );
  };

  const handleAddManual = () => {
    if (!areaName || !lat || !lng) {
      toast({ title: 'Missing fields', variant: 'destructive' });
      return;
    }
    addArea.mutate(
      { area_name: areaName, latitude: parseFloat(lat), longitude: parseFloat(lng) },
      {
        onSuccess: () => {
          toast({ title: 'Area Added', description: `${areaName} added to monitoring queue.` });
          setAreaName(''); setLat(''); setLng('');
        },
        onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
      }
    );
  };

  const pendingCount = areas.filter(a => a.status === 'Pending' || a.status === 'pending').length;
  const completedCount = areas.filter(a => a.status === 'Completed' || a.status === 'completed').length;

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Monitoring Queue</h2>
        <p className="text-sm text-muted-foreground mt-1">Click on the map to select a location or add manually below</p>
      </div>

      {/* Interactive Map */}
      <div className="glass-card overflow-hidden">
        <div className="relative">
          <div ref={mapContainerRef} className="w-full" style={{ height: '400px' }} />

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur rounded-lg p-3 border border-border z-[1000]">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                <span className="text-muted-foreground">Existing Areas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive border-2 border-white" />
                <span className="text-muted-foreground">New Selection</span>
              </div>
            </div>
          </div>

          {/* Crosshair hint */}
          <div className="absolute top-4 left-4 bg-card/90 backdrop-blur rounded-lg px-3 py-2 border border-border z-[1000]">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Crosshair className="w-3.5 h-3.5 text-primary" />
              Click anywhere to select a location
            </div>
          </div>
        </div>

        {/* Selected location bar */}
        {selectedLat !== null && selectedLng !== null && (
          <div className="p-4 border-t border-border bg-card/50 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium text-foreground">Selected:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground">{selectedLat.toFixed(6)}, {selectedLng.toFixed(6)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Navigation className="w-3.5 h-3.5 text-primary" />
              {isGeocoding ? (
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Resolving name...</span>
              ) : (
                <Input
                  value={selectedName}
                  onChange={e => setSelectedName(e.target.value)}
                  className="h-8 w-56 bg-secondary/50 text-sm"
                  placeholder="Area name"
                />
              )}
            </div>
            <Button
              size="sm"
              onClick={handleAddFromMap}
              disabled={addArea.isPending || isGeocoding || !selectedName}
              className="ml-auto"
            >
              {addArea.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
              Add This Location
            </Button>
          </div>
        )}
      </div>

      {/* Manual form + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" /> Or Add Manually
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label className="text-muted-foreground">Area Name</Label><Input value={areaName} onChange={e => setAreaName(e.target.value)} className="mt-1 bg-secondary/50" placeholder="e.g. Western Ghats Zone" /></div>
            <div><Label className="text-muted-foreground">Latitude</Label><Input type="number" value={lat} onChange={e => setLat(e.target.value)} className="mt-1 bg-secondary/50" placeholder="e.g. 15.49" /></div>
            <div><Label className="text-muted-foreground">Longitude</Label><Input type="number" value={lng} onChange={e => setLng(e.target.value)} className="mt-1 bg-secondary/50" placeholder="e.g. 73.83" /></div>
          </div>
          <Button onClick={handleAddManual} disabled={addArea.isPending} className="mt-4">
            {addArea.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />} Add Manually
          </Button>
        </div>

        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Queue Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Total Areas</span><span className="text-sm font-bold text-foreground">{isLoading ? '...' : areas.length}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Pending</span><span className="text-sm font-bold text-amber-400">{isLoading ? '...' : pendingCount}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Completed</span><span className="text-sm font-bold text-primary">{isLoading ? '...' : completedCount}</span></div>
            <div className="border-t border-border pt-3"><p className="text-xs text-muted-foreground">Next scheduled scan</p><p className="text-sm font-medium text-foreground">{queueData?.next_scan_time || 'N/A'}</p></div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Area Name</TableHead>
                <TableHead className="text-muted-foreground">Coordinates</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Requested By</TableHead>
                <TableHead className="text-muted-foreground">Last Scanned</TableHead>
                <TableHead className="text-muted-foreground">Frequency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {areas.map(area => {
                const st = statusStyles[area.status] || statusStyles['Pending'];
                const StatusIcon = st.icon;
                return (
                  <TableRow key={area.id} className="border-border hover:bg-secondary/30">
                    <TableCell className="font-medium">{area.area_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{area.latitude}, {area.longitude}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${st.class} flex items-center gap-1 w-fit`}>
                        <StatusIcon className={`w-3 h-3 ${area.status === 'Scanning' || area.status === 'scanning' ? 'animate-spin' : ''}`} />
                        {area.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{area.requested_by}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{timeAgo(area.last_scanned)}</TableCell>
                    <TableCell className="text-sm">{area.scan_frequency}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

