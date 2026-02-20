import { MapPin, Box, FileText, X, AlertTriangle, Calendar, Layers, DollarSign, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getDetectionImage } from '@/lib/detectionImages';
import type { ApiSite } from '@/services/api';

const severityColor: Record<string, string> = {
  Critical: 'severity-critical',
  High: 'severity-high',
  Moderate: 'severity-moderate',
  Low: 'severity-low',
};

interface Props {
  site: ApiSite | null;
  open: boolean;
  onClose: () => void;
  onViewMap?: (site: ApiSite) => void;
  onView3D?: (site: ApiSite) => void;
  onReport?: (site: ApiSite) => void;
}

export default function SiteDetailDialog({ site, open, onClose, onViewMap, onView3D, onReport }: Props) {
  if (!site) return null;

  const localImg = getDetectionImage(site.id);
  const displayImg = localImg || (site.images?.[0] ?? null);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-start justify-between gap-2">
            <span className="text-foreground">{site.name}</span>
            <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${severityColor[site.severity] || ''}`}>
              {site.severity}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Image */}
        {/* {displayImg && (
          <div className="w-full h-48 rounded-lg overflow-hidden bg-secondary/50">
            <img src={displayImg} alt={site.name} className="w-full h-full object-cover" />
          </div>
        )} */}

        {/* Confidence bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">AI Confidence</span>
            <span className="font-bold text-foreground">{(site.confidence ?? 0).toFixed(1)}%</span>
          </div>
          <Progress value={site.confidence ?? 0} className="h-2 bg-secondary" />
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-secondary/40 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs"><MapPin className="w-3.5 h-3.5" /> Coordinates</div>
            <p className="font-mono text-xs text-foreground">{site.latitude.toFixed(4)}°N</p>
            <p className="font-mono text-xs text-foreground">{site.longitude.toFixed(4)}°E</p>
          </div>
          <div className="bg-secondary/40 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs"><Layers className="w-3.5 h-3.5" /> Mining Type</div>
            <p className="font-medium text-foreground capitalize">{site.type}</p>
          </div>
          <div className="bg-secondary/40 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs"><AlertTriangle className="w-3.5 h-3.5" /> Area Affected</div>
            <p className="font-medium text-foreground">{site.areaHectares.toFixed(2)} ha</p>
          </div>
          <div className="bg-secondary/40 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs"><DollarSign className="w-3.5 h-3.5" /> Est. Loss</div>
            <p className="font-medium text-foreground">₹{(site.estimatedLossUSD / 100000).toFixed(1)}L</p>
          </div>
          <div className="bg-secondary/40 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs"><Calendar className="w-3.5 h-3.5" /> Last Detected</div>
            <p className="font-medium text-foreground">{site.lastDetected}</p>
          </div>
          <div className="bg-secondary/40 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs"><CheckCircle className="w-3.5 h-3.5" /> Status</div>
            <p className={`font-medium ${site.verified ? 'text-primary' : 'text-muted-foreground'}`}>
              {site.verified ? 'Verified' : 'Unverified'}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          {onViewMap && (
            <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => { onClose(); onViewMap(site); }}>
              <MapPin className="w-3.5 h-3.5 mr-1" /> View on Map
            </Button>
          )}
          {onView3D && (
            <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => { onClose(); onView3D(site); }}>
              <Box className="w-3.5 h-3.5 mr-1" /> 3D Model
            </Button>
          )}
          {onReport && (
            <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => { onReport(site); }}>
              <FileText className="w-3.5 h-3.5 mr-1" /> Report
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
