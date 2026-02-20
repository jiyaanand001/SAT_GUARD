import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutGrid, List, MapPin, ChevronLeft, ChevronRight, FileText, Box, CheckCircle, XCircle, Loader2, Eye, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useSites, useVerifySite, useAddMonitoringArea } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { generateSitePdfReport } from '@/lib/generateSitePdfReport';
import SiteDetailDialog from '@/components/SiteDetailDialog';
import type { ApiSite } from '@/services/api';

const severityColor: Record<string, string> = {
  Critical: 'severity-critical',
  High: 'severity-high',
  Moderate: 'severity-moderate',
  Low: 'severity-low',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AllSites() {
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [verifyDialog, setVerifyDialog] = useState<{ site: ApiSite; open: boolean } | null>(null);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [detailSite, setDetailSite] = useState<ApiSite | null>(null);
  const [monitoringId, setMonitoringId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const verifySiteMutation = useVerifySite();
  const addMonitor = useAddMonitoringArea();

  const { data: sites, isLoading } = useSites({
    severity: severityFilter !== 'all' ? severityFilter : undefined,
  });

  const filtered = (sites || []).filter(d => {
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleViewOnMap = (site: ApiSite) => {
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

  const handleGenerateReport = async (site: ApiSite) => {
    try {
      await generateSitePdfReport(site.id);
      toast({ title: 'PDF Report Downloaded', description: `Report for ${site.name} saved.` });
    } catch (err) {
      toast({ title: 'Report Failed', description: 'Could not generate the PDF report.', variant: 'destructive' });
    }
  };

  const handleMonitor = (site: ApiSite) => {
    setMonitoringId(site.id);
    addMonitor.mutate(
      { area_name: site.name, latitude: site.latitude, longitude: site.longitude, requested_by: 'Officer' },
      {
        onSuccess: () => {
          toast({ title: 'Added to Monitoring', description: `${site.name} added to the monitoring queue.` });
          setMonitoringId(null);
        },
        onError: () => {
          toast({ title: 'Error', description: 'Failed to add to monitoring queue.', variant: 'destructive' });
          setMonitoringId(null);
        },
      }
    );
  };

  const handleVerify = (site: ApiSite, verified: boolean) => {
    verifySiteMutation.mutate(
      { siteId: site.id, verified, notes: verifyNotes || undefined },
      {
        onSuccess: () => {
          toast({ title: verified ? 'Site Verified' : 'Site Rejected', description: `${site.name} has been ${verified ? 'verified' : 'rejected'}.` });
          setVerifyDialog(null);
          setVerifyNotes('');
        },
        onError: () => toast({ title: 'Failed', description: 'Could not verify site.', variant: 'destructive' }),
      }
    );
  };

  const ActionButtons = ({ site }: { site: ApiSite }) => (
    <div className="flex flex-wrap gap-1.5 mt-3">
      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); setDetailSite(site); }}>
        <Eye className="w-3 h-3 mr-1" /> Details
      </Button>
      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); handleViewOnMap(site); }}>
        <MapPin className="w-3 h-3 mr-1" /> Map
      </Button>
      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); handleView3D(site); }}>
        <Box className="w-3 h-3 mr-1" /> 3D
      </Button>
      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); handleGenerateReport(site); }}>
        <FileText className="w-3 h-3 mr-1" /> Report
      </Button>
      <Button
        size="sm" variant="outline" className="h-7 text-xs"
        disabled={monitoringId === site.id}
        onClick={(e) => { e.stopPropagation(); handleMonitor(site); }}
      >
        {monitoringId === site.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />}
        Monitor
      </Button>
      <Button
        size="sm"
        variant={site.verified ? 'default' : 'outline'}
        className={`h-7 text-xs ${site.verified ? 'bg-primary/20 text-primary' : ''}`}
        onClick={(e) => { e.stopPropagation(); setVerifyDialog({ site, open: true }); }}
      >
        <CheckCircle className="w-3 h-3 mr-1" />{site.verified ? 'Verified' : 'Verify'}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">All Detection Sites</h2>
        <p className="text-sm text-muted-foreground mt-1">{isLoading ? '...' : `${filtered.length} sites found`}</p>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by location..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-secondary/50" />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[150px] bg-secondary/50"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Moderate">Moderate</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex border border-border rounded-md overflow-hidden">
          <Button variant={view === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setView('grid')}>
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button variant={view === 'table' ? 'default' : 'ghost'} size="sm" onClick={() => setView('table')}>
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="stat-card space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(d => (
            <div key={d.id} className="stat-card space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.latitude.toFixed(4)}°N, {d.longitude.toFixed(4)}°E</p>
                </div>
                <div className="flex items-center gap-1">
                  {d.verified && <CheckCircle className="w-3.5 h-3.5 text-primary" />}
                  <Badge variant="outline" className={`text-[10px] ${severityColor[d.severity]}`}>{d.severity}</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Confidence: <span className="text-foreground font-medium">{(d.confidence ?? 0).toFixed(1)}%</span></span>
                <span className="text-muted-foreground">{timeAgo(d.lastDetected)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary" style={{ width: `${d.confidence ?? 0}%` }} />
              </div>
              <ActionButtons site={d} />
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">ID</TableHead>
                <TableHead className="text-muted-foreground">Location</TableHead>
                <TableHead className="text-muted-foreground">Confidence</TableHead>
                <TableHead className="text-muted-foreground">Severity</TableHead>
                <TableHead className="text-muted-foreground">Area (ha)</TableHead>
                <TableHead className="text-muted-foreground">Loss</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(d => (
                <TableRow key={d.id} className="border-border hover:bg-secondary/30">
                  <TableCell className="text-xs font-mono text-muted-foreground">{d.id}</TableCell>
                  <TableCell className="font-medium text-sm">{d.name}</TableCell>
                  <TableCell>{(d.confidence ?? 0).toFixed(1)}%</TableCell>
                  <TableCell><Badge variant="outline" className={`text-[10px] ${severityColor[d.severity]}`}>{d.severity}</Badge></TableCell>
                  <TableCell>{d.areaHectares.toFixed(1)}</TableCell>
                  <TableCell className="text-sm">₹{(d.estimatedLossUSD / 100000).toFixed(1)}L</TableCell>
                  <TableCell>
                    {d.verified ? (
                      <Badge className="bg-primary/20 text-primary text-[10px]"><CheckCircle className="w-3 h-3 mr-1" /> Verified</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">Unverified</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setDetailSite(d)} title="Details">
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleViewOnMap(d)} title="View on Map">
                        <MapPin className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleView3D(d)} title="3D Model">
                        <Box className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleGenerateReport(d)} title="Generate Report">
                        <FileText className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleMonitor(d)} title="Add to Monitor" disabled={monitoringId === d.id}>
                        {monitoringId === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setVerifyDialog({ site: d, open: true })} title="Verify">
                        <CheckCircle className={`w-3.5 h-3.5 ${d.verified ? 'text-primary' : ''}`} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Showing {filtered.length} sites</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="default" size="sm">1</Button>
          <Button variant="outline" size="sm"><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Site Detail Dialog */}
      <SiteDetailDialog
        site={detailSite}
        open={!!detailSite}
        onClose={() => setDetailSite(null)}
        onViewMap={handleViewOnMap}
        onView3D={handleView3D}
        onReport={handleGenerateReport}
      />

      {/* Verify Dialog */}
      <Dialog open={!!verifyDialog?.open} onOpenChange={(open) => { if (!open) { setVerifyDialog(null); setVerifyNotes(''); } }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Verify Site: {verifyDialog?.site.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>Coordinates: {verifyDialog?.site.latitude.toFixed(4)}°N, {verifyDialog?.site.longitude.toFixed(4)}°E</p>
              <p>Severity: {verifyDialog?.site.severity} | Confidence: {(verifyDialog?.site.confidence ?? 0).toFixed(1)}%</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Notes (optional)</label>
              <Textarea value={verifyNotes} onChange={e => setVerifyNotes(e.target.value)} placeholder="Add verification notes..." className="mt-1 bg-secondary/50" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="destructive" onClick={() => verifyDialog && handleVerify(verifyDialog.site, false)} disabled={verifySiteMutation.isPending}>
              {verifySiteMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
              Reject
            </Button>
            <Button onClick={() => verifyDialog && handleVerify(verifyDialog.site, true)} disabled={verifySiteMutation.isPending}>
              {verifySiteMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Verify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
