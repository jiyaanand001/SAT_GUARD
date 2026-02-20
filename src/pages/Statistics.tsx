import { Target, AlertTriangle, Layers, DollarSign, Percent, CheckCircle } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useStats, useTrends, useSites } from '@/hooks/useApi';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 text-sm">
      <p className="font-medium text-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="text-xs">
          {p.name}: <span className="font-medium">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

function StatCard({ title, value, icon: Icon, loading }: { title: string; value: string; icon: any; loading?: boolean }) {
  return (
    <div className="stat-card">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{title}</p>
          {loading ? <Skeleton className="h-6 w-20 mt-1" /> : <p className="text-xl font-bold text-foreground">{value}</p>}
        </div>
      </div>
    </div>
  );
}

export default function Statistics() {
  const { data: stats, isLoading } = useStats();
  const { data: trends } = useTrends(12);
  const { data: sites } = useSites();

  const trendsData = trends?.map(t => ({ month: t.name, detections: t.detected, loss: t.loss })) || [];

  const formatLoss = (usd: number) => {
    const crore = usd / 10_000_000;
    return crore >= 1 ? `₹${crore.toFixed(1)} Cr` : `₹${(usd / 100_000).toFixed(1)} L`;
  };

  // Compute mining type distribution from live sites data
  const miningTypeData = (() => {
    if (!sites) return [];
    const counts: Record<string, number> = {};
    sites.forEach(s => {
      const t = s.type || 'Unknown';
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
  })();

  // Compute severity distribution from live data
  const severityData = (() => {
    if (!sites) return [];
    const counts: Record<string, number> = {};
    sites.forEach(s => { counts[s.severity] = (counts[s.severity] || 0) + 1; });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  })();

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Statistics</h2>
        <p className="text-sm text-muted-foreground mt-1">Comprehensive analysis of mining detection data</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Total Detections" value={stats ? stats.total_detections.toLocaleString() : '—'} icon={Target} loading={isLoading} />
        <StatCard title="Critical Sites" value={stats ? String(stats.critical_sites) : '—'} icon={AlertTriangle} loading={isLoading} />
        <StatCard title="Area Affected" value={stats ? `${stats.total_area_hectares.toLocaleString()} ha` : '—'} icon={Layers} loading={isLoading} />
        <StatCard title="Economic Loss" value={stats ? formatLoss(stats.total_estimated_loss_usd) : '—'} icon={DollarSign} loading={isLoading} />
        <StatCard title="Avg Confidence" value={stats ? `${stats.avg_confidence.toFixed(1)}%` : '—'} icon={Percent} loading={isLoading} />
        <StatCard title="Verified Sites" value={stats ? String(stats.verified_count) : '—'} icon={CheckCircle} loading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Trends */}
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Detection Trends</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendsData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(160 84% 39%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(160 84% 39%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 25% 22%)" />
              <XAxis dataKey="month" stroke="hsl(215 20% 65%)" fontSize={12} />
              <YAxis stroke="hsl(215 20% 65%)" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="detections" name="Detections" stroke="hsl(160 84% 39%)" fill="url(#colorTotal)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Mining Type Distribution - computed from live data */}
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Mining Type Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={miningTypeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 25% 22%)" />
              <XAxis dataKey="type" stroke="hsl(215 20% 65%)" fontSize={12} />
              <YAxis stroke="hsl(215 20% 65%)" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Count" fill="hsl(38 92% 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Loss Trends */}
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Economic Loss</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendsData}>
              <defs>
                <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0 84% 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(0 84% 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 25% 22%)" />
              <XAxis dataKey="month" stroke="hsl(215 20% 65%)" fontSize={12} />
              <YAxis stroke="hsl(215 20% 65%)" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="loss" name="Loss (USD)" stroke="hsl(0 84% 60%)" fill="url(#colorLoss)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Severity Distribution - computed from live data */}
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Severity Breakdown</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={severityData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 25% 22%)" />
              <XAxis type="number" stroke="hsl(215 20% 65%)" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="hsl(215 20% 65%)" fontSize={11} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Sites" fill="hsl(160 84% 39%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
