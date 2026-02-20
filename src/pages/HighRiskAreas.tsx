import { useState } from 'react';
import { Eye, Plus, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useSites, useAddMonitoringArea } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { generateSitePdfReport } from '@/lib/generateSitePdfReport';
import SiteDetailDialog from '@/components/SiteDetailDialog';
import satelliteMap from '@/assets/satellite-map.jpg';
import type { ApiSite } from '@/services/api';

const markerColor: Record<string, string> = {
  Critical: 'bg-red-500',
  High: 'bg-orange-500',
};

export default function HighRiskAreas() {
  const { data: sites, isLoading } = useSites();
  const [detailSite, setDetailSite] = useState<ApiSite | null>(null);
  const [monitoringId, setMonitoringId] = useState<string | null>(null);
  const addMonitor = useAddMonitoringArea();
  const { toast } = useToast();
  const navigate = useNavigate();

  const highRiskAreas = (sites || [])
    .filter(d => d.severity === 'Critical' || d.severity === 'High')
    .map(d => ({ ...d, riskScore: Math.min((d.confidence ?? 0), 100) }))
    .sort((a, b) => b.riskScore - a.riskScore);

  const handleMonitor = (area: ApiSite) => {
    setMonitoringId(area.id);
    addMonitor.mutate(
      { area_name: area.name, latitude: area.latitude, longitude: area.longitude, requested_by: 'Officer' },
      {
        onSuccess: () => {
          toast({ title: 'Added to Monitoring', description: `${area.name} added to the monitoring queue.` });
          setMonitoringId(null);
        },
        onError: () => {
          toast({ title: 'Error', description: 'Failed to add to monitoring queue.', variant: 'destructive' });
          setMonitoringId(null);
        },
      }
    );
  };

  const handleViewMap = (site: ApiSite) => {
    const params = new URLSearchParams({
      lat: String(site.latitude), lng: String(site.longitude),
      name: site.name, severity: site.severity,
      confidence: String(site.confidence ?? 0), detection_id: site.id,
    });
    navigate(`/map?${params}`);
  };

  const handleView3D = (site: ApiSite) => {
    const params = new URLSearchParams({
      detection_id: site.id, lat: String(site.latitude),
      lng: String(site.longitude), area: site.areaHectares.toFixed(1),
      severity: site.severity,
    });
    navigate(`/3d-model?${params}`);
  };

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">High Risk Areas</h2>
        <p className="text-sm text-muted-foreground mt-1">{isLoading ? '...' : `${highRiskAreas.length} high-risk zones identified`}</p>
      </div>

      {/* Risk Map */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Risk Heatmap</h3>
          <div className="flex items-center gap-2 text-[10px]">
            <div className="w-20 h-2 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500" />
            <span className="text-muted-foreground">Low → High</span>
          </div>
        </div>
        <div className="relative h-[350px]" style={{ backgroundImage: `url(${satelliteMap})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="absolute inset-0 bg-background/30" />
          {highRiskAreas.slice(0, 7).map((area, i) => {
            const positions = [
              { top: '20%', left: '55%' }, { top: '45%', left: '30%' }, { top: '35%', left: '65%' },
              { top: '60%', left: '50%' }, { top: '30%', left: '40%' }, { top: '50%', left: '70%' },
              { top: '25%', left: '45%' },
            ];
            const pos = positions[i % positions.length];
            return (
              <div key={area.id} className="absolute" style={pos}>
                <div className={`w-8 h-8 rounded-full ${area.severity === 'Critical' ? 'bg-red-500/30' : 'bg-orange-500/30'} flex items-center justify-center`}>
                  <div className={`w-3 h-3 rounded-full ${markerColor[area.severity]} animate-pulse`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Risk Area Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="stat-card space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {highRiskAreas.map(area => (
            <div key={area.id} className="stat-card space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{area.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{area.type} mining</p>
                </div>
                <Badge variant="outline" className={`text-[10px] ${area.severity === 'Critical' ? 'severity-critical' : 'severity-high'}`}>
                  {area.severity}
                </Badge>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Risk Score</span>
                  <span className="font-bold text-foreground">{area.riskScore.toFixed(0)}/100</span>
                </div>
                <Progress value={area.riskScore} className="h-2 bg-secondary" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Area:</span> <span className="text-foreground font-medium">{area.areaHectares.toFixed(1)} ha</span></div>
                <div><span className="text-muted-foreground">Loss:</span> <span className="text-foreground font-medium">₹{(area.estimatedLossUSD / 100000).toFixed(1)}L</span></div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline" size="sm" className="flex-1 text-xs"
                  onClick={() => setDetailSite(area)}
                >
                  <Eye className="w-3 h-3 mr-1" /> Details
                </Button>
                <Button
                  variant="outline" size="sm" className="flex-1 text-xs"
                  disabled={monitoringId === area.id || addMonitor.isPending}
                  onClick={() => handleMonitor(area)}
                >
                  {monitoringId === area.id ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Plus className="w-3 h-3 mr-1" />
                  )}
                  Monitor
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <SiteDetailDialog
        site={detailSite}
        open={!!detailSite}
        onClose={() => setDetailSite(null)}
        onViewMap={handleViewMap}
        onView3D={handleView3D}
        onReport={async (site) => { await generateSitePdfReport(site.id); toast({ title: 'Report Downloaded' }); }}
      />
    </div>
  );
}
