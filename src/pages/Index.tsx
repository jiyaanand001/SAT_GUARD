import { Target, AlertTriangle, Layers, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useStats, useSites, useTrends } from '@/hooks/useApi';
import { getDetectionImage } from '@/lib/detectionImages';
import satelliteMap from '@/assets/satellite-map.jpg';

const severityColor: Record<string, string> = {
  Critical: 'severity-critical',
  High: 'severity-high',
  Moderate: 'severity-moderate',
  Low: 'severity-low',
};

const markerColor: Record<string, string> = {
  Critical: 'bg-red-500',
  High: 'bg-orange-500',
  Moderate: 'bg-amber-500',
  Low: 'bg-emerald-500',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function StatCard({ title, value, change, icon: Icon, positive, loading }: {
  title: string; value: string; change: string; icon: any; positive?: boolean; loading?: boolean;
}) {
  return (
    <div className="stat-card fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          {loading ? <Skeleton className="h-8 w-24 mt-1" /> : <p className="text-2xl font-bold mt-1 text-foreground">{value}</p>}
          <div className="flex items-center gap-1 mt-2">
            {positive ? <TrendingUp className="w-3 h-3 text-primary" /> : <TrendingDown className="w-3 h-3 text-destructive" />}
            <span className={`text-xs font-medium ${positive ? 'text-primary' : 'text-destructive'}`}>{change}</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 text-sm">
      <p className="font-medium text-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-muted-foreground">
          {p.name}: <span className="text-foreground font-medium">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: sites, isLoading: sitesLoading } = useSites({ limit: 10 });
  const { data: trends } = useTrends(12);

  const trendsData = trends?.map(t => ({ month: t.name, detections: t.detected })) || [];

  const formatLoss = (usd: number) => {
    const crore = usd / 10_000_000;
    return crore >= 1 ? `₹${crore.toFixed(1)} Cr` : `₹${(usd / 100_000).toFixed(1)} L`;
  };

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Monitor illegal mining activities across India</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Detections" value={stats ? stats.total_detections.toLocaleString() : '—'} change="+12.5% this month" icon={Target} positive loading={statsLoading} />
        <StatCard title="Critical Sites" value={stats ? String(stats.critical_sites) : '—'} change={`${stats?.high_severity_sites || 0} high severity`} icon={AlertTriangle} loading={statsLoading} />
        <StatCard title="Area Affected" value={stats ? `${stats.total_area_hectares.toLocaleString()} ha` : '—'} change="+8.2% increase" icon={Layers} positive loading={statsLoading} />
        <StatCard title="Estimated Loss" value={stats ? formatLoss(stats.total_estimated_loss_usd) : '—'} change="-2.1% vs last month" icon={DollarSign} positive loading={statsLoading} />
      </div>

      {/* Map + Recent Detections */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 glass-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Detection Map</h3>
            <div className="flex items-center gap-3 text-[10px]">
              {['Critical', 'High', 'Moderate', 'Low'].map(s => (
                <div key={s} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${markerColor[s]}`} />
                  <span className="text-muted-foreground">{s}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative h-[400px] bg-secondary/30" style={{ backgroundImage: `url(${satelliteMap})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="absolute inset-0 bg-background/40" />
            {(sites || []).slice(0, 6).map((d, i) => {
              const positions = [
                { top: '25%', left: '60%' }, { top: '55%', left: '25%' }, { top: '50%', left: '45%' },
                { top: '20%', left: '70%' }, { top: '40%', left: '55%' }, { top: '35%', left: '40%' },
              ];
              return (
                <div key={d.id} className="absolute group cursor-pointer" style={positions[i]}>
                  <div className={`w-3 h-3 rounded-full ${markerColor[d.severity] || 'bg-muted'} animate-pulse-glow shadow-lg`} />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="glass-card p-3 min-w-[180px] text-xs space-y-1.5">
                      <p className="font-semibold text-foreground">{d.name}</p>
                      <p className="text-muted-foreground">Confidence: {d.confidence ?? 'N/A'}%</p>
                      <Badge variant="outline" className={`text-[10px] ${severityColor[d.severity]}`}>{d.severity}</Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2 glass-card">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Recent Detections</h3>
          </div>
          <ScrollArea className="h-[400px]">
            <div className="p-2 space-y-1">
              {sitesLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="w-2 h-2 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  </div>
                ))
              ) : (sites || []).map(d => (
                <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/40 transition-colors cursor-pointer">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${markerColor[d.severity] || 'bg-muted'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${d.confidence ?? 0}%` }} />
                      </div>
                      <span className="text-[11px] text-muted-foreground w-8">{d.confidence ?? 0}%</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <Badge variant="outline" className={`text-[10px] ${severityColor[d.severity]}`}>{d.severity}</Badge>
                    <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(d.lastDetected)}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Single chart - full width */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Detection Trends</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={trendsData}>
            <defs>
              <linearGradient id="colorDetections" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(160 84% 39%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(160 84% 39%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 25% 22%)" />
            <XAxis dataKey="month" stroke="hsl(215 20% 65%)" fontSize={12} />
            <YAxis stroke="hsl(215 20% 65%)" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="detections" name="Detections" stroke="hsl(160 84% 39%)" fill="url(#colorDetections)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
