import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, MapPin, FileText, Eye, AlertTriangle, Loader2, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useDetectMining, useAddMonitoringArea } from '@/hooks/useApi';
import { saveDetectionImage, fileToDataUrl } from '@/lib/detectionImages';
import { generatePdfReport } from '@/lib/generatePdfReport';

export default function UploadDetection() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locationName, setLocationName] = useState('');
  const [miningType, setMiningType] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const detectMutation = useDetectMining();
  const monitoringMutation = useAddMonitoringArea();

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && (f.type === 'image/jpeg' || f.type === 'image/png')) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  }, []);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleDetect = () => {
    if (!file || !latitude || !longitude) {
      toast({ title: 'Missing fields', description: 'Please upload an image and provide coordinates.', variant: 'destructive' });
      return;
    }
    detectMutation.mutate(
      {
        file,
        params: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          location_name: locationName || undefined,
          mining_type: miningType || undefined,
        },
      },
      {
        onSuccess: async (data) => {
          // Save uploaded image linked to detection_id
          if (data.detection_id && file) {
            try {
              const dataUrl = await fileToDataUrl(file);
              saveDetectionImage(data.detection_id, dataUrl);
            } catch { /* ignore */ }
          }
          toast({
            title: data.mining_detected ? 'Mining Detected!' : 'No Mining Detected',
            description: `Analysis completed with ${data.confidence.toFixed(1)}% confidence.`,
          });
        },
        onError: (err) => {
          toast({ title: 'Detection Failed', description: err.message, variant: 'destructive' });
        },
      }
    );
  };

  const result = detectMutation.data;

  const formatLoss = (usd: number) => {
    const crore = usd / 10_000_000;
    return crore >= 1 ? `₹${crore.toFixed(1)} Cr` : `₹${(usd / 100_000).toFixed(1)} L`;
  };

  const handleGenerateReport = () => {
    if (!result) return;
    generatePdfReport(result, preview);
    toast({ title: 'PDF Report Downloaded', description: 'The report has been saved to your downloads.' });
  };

  const handleAddToMonitoring = () => {
    if (!result) return;
    monitoringMutation.mutate(
      { area_name: result.location.name, latitude: result.location.latitude, longitude: result.location.longitude },
      {
        onSuccess: (data) => toast({ title: 'Added to Monitoring', description: `Queue ID: ${data.queue_id}` }),
        onError: () => toast({ title: 'Failed', description: 'Could not add to monitoring.', variant: 'destructive' }),
      }
    );
  };

  const handleViewOnMap = () => {
    if (!result) return;
    const params = new URLSearchParams({
      lat: String(result.location.latitude), lng: String(result.location.longitude),
      name: result.location.name, severity: result.analysis.severity,
      confidence: result.confidence.toFixed(1), detection_id: result.detection_id || '',
    });
    navigate(`/map?${params}`);
  };

  const handleView3DModel = () => {
    if (!result) return;
    const params = new URLSearchParams({
      detection_id: result.detection_id || '', lat: String(result.location.latitude),
      lng: String(result.location.longitude), area: result.analysis.estimatedAreaHectares.toFixed(1),
      severity: result.analysis.severity,
    });
    navigate(`/3d-model?${params}`);
  };

  return (
    <div className="space-y-6 fade-in max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Upload Detection</h2>
        <p className="text-sm text-muted-foreground mt-1">Upload satellite imagery for AI-powered mining detection</p>
      </div>

      {/* Upload Zone */}
      <div
        className="glass-card border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer"
        onDrop={onDrop} onDragOver={e => e.preventDefault()}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input id="file-input" type="file" className="hidden" accept="image/jpeg,image/png" onChange={onFileSelect} />
        {preview ? (
          <div className="relative">
            <img src={preview} alt="Preview" className="w-full h-64 object-cover rounded-lg" />
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
              <p className="text-sm text-foreground font-medium">Click to change image</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <p className="text-foreground font-medium">Drop satellite image here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 10MB</p>
          </div>
        )}
      </div>

      {/* Form */}
      <div className="glass-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground">Latitude *</Label>
            <Input type="number" placeholder="e.g. 23.6102" value={latitude} onChange={e => setLatitude(e.target.value)} className="mt-1 bg-secondary/50" />
          </div>
          <div>
            <Label className="text-muted-foreground">Longitude *</Label>
            <Input type="number" placeholder="e.g. 85.2799" value={longitude} onChange={e => setLongitude(e.target.value)} className="mt-1 bg-secondary/50" />
          </div>
          <div>
            <Label className="text-muted-foreground">Location Name</Label>
            <Input placeholder="Optional" value={locationName} onChange={e => setLocationName(e.target.value)} className="mt-1 bg-secondary/50" />
          </div>
          <div>
            <Label className="text-muted-foreground">Mining Type</Label>
            <Select value={miningType} onValueChange={setMiningType}>
              <SelectTrigger className="mt-1 bg-secondary/50"><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                {['Sand', 'Coal', 'Stone', 'Iron', 'Bauxite', 'Gold', 'Unknown'].map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={handleDetect} disabled={detectMutation.isPending} className="mt-6 w-full md:w-auto" size="lg">
          {detectMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</> : 'Detect Mining'}
        </Button>
      </div>

      {/* Result */}
      {result && (
        <div className="glass-card p-6 slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 rounded-full ${result.mining_detected ? 'bg-destructive/20' : 'bg-primary/20'} flex items-center justify-center`}>
              <AlertTriangle className={`w-5 h-5 ${result.mining_detected ? 'text-destructive' : 'text-primary'}`} />
            </div>
            <div>
              <Badge className={result.mining_detected ? 'severity-high' : 'severity-low'}>
                Mining Detected: {result.mining_detected ? 'YES' : 'NO'}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">Analysis completed successfully</p>
            </div>
          </div>

          {/* Show uploaded image */}
          {preview && (
            <div className="mb-6 rounded-lg overflow-hidden">
              <img src={preview} alt="Uploaded satellite imagery" className="w-full h-48 object-cover" />
            </div>
          )}

          <div className="flex items-center gap-6 mb-6">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(215 25% 22%)" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(160 84% 39%)" strokeWidth="8" strokeDasharray={`${result.confidence * 2.64} 264`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-foreground">{result.confidence.toFixed(0)}%</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Confidence Score</p>
              <Badge variant="outline" className={`severity-${result.analysis.severity.toLowerCase()}`}>{result.analysis.severity} Severity</Badge>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-secondary/30 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{result.analysis.estimatedAreaHectares.toFixed(1)} ha</p>
              <p className="text-xs text-muted-foreground mt-1">Area Affected</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{result.analysis.machineryCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Machinery Detected</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{formatLoss(result.analysis.estimatedLossUSD)}</p>
              <p className="text-xs text-muted-foreground mt-1">Economic Loss</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="bg-secondary/20 rounded-lg p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">AI Reasoning</p>
              <p className="text-sm text-foreground">{result.analysis.reasoning}</p>
            </div>
            <div className="bg-secondary/20 rounded-lg p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Environmental Impact</p>
              <p className="text-sm text-foreground">{result.analysis.environmentalImpact}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button onClick={handleGenerateReport}>
              <FileText className="w-4 h-4 mr-2" /> Generate PDF Report
            </Button>
            <Button variant="outline" onClick={handleAddToMonitoring} disabled={monitoringMutation.isPending}>
              <Eye className="w-4 h-4 mr-2" /> {monitoringMutation.isPending ? 'Adding...' : 'Add to Monitoring'}
            </Button>
            <Button variant="outline" onClick={handleViewOnMap}>
              <MapPin className="w-4 h-4 mr-2" /> View on Map
            </Button>
            <Button variant="outline" className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-0 hover:from-cyan-700 hover:to-blue-700" onClick={handleView3DModel}>
              <Box className="w-4 h-4 mr-2" /> View 3D Model
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
