import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  MapPin,
  FileText,
  Eye,
  AlertTriangle,
  Loader2,
  Box,
  Shield,
  ShieldCheck,
  ShieldX,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useDetectMining, useAddMonitoringArea } from "@/hooks/useApi";
import { saveDetectionImage, fileToDataUrl } from "@/lib/detectionImages";
import { generatePdfReport } from "@/lib/generatePdfReport";

// ── ArmorIQ Backend URL ──────────────────────────────────────────
const ARMORIQ_BACKEND =
  import.meta.env.VITE_ARMORIQ_BACKEND_URL || "http://localhost:8000";

type MiningAction =
  | "analyze_satellite_image"
  | "generate_pdf_report"
  | "add_to_monitoring"
  | "view_on_map"
  | "view_3d_model";

const SESSION_PLAN: MiningAction[] = [
  "analyze_satellite_image",
  "generate_pdf_report",
  "add_to_monitoring",
  "view_on_map",
  "view_3d_model",
];

interface IntentToken {
  id: string;
  plan_hash: string;
  expires: string;
  stepProofs: number;
  steps: MiningAction[];
}

interface VerifyResult {
  allowed: boolean;
  reason: string;
  tokenId: string;
  action: MiningAction;
  timestamp: string;
}

interface AuditEntry {
  id: string;
  action: MiningAction;
  allowed: boolean;
  reason: string;
  time: string;
}

// ── ArmorIQ API calls ────────────────────────────────────────────
async function capturePlan(prompt: string): Promise<IntentToken> {
  const res = await fetch(`${ARMORIQ_BACKEND}/armoriq/capture-plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, steps: SESSION_PLAN }),
  });
  if (!res.ok) throw new Error("Plan capture failed");
  return res.json();
}

async function verifyAction(
  action: MiningAction,
  token: IntentToken,
): Promise<VerifyResult> {
  const res = await fetch(`${ARMORIQ_BACKEND}/armoriq/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token_id: token.id,
      action,
      plan_steps: token.steps,
    }),
  });
  if (!res.ok) throw new Error("Verification failed");
  const data = await res.json();
  return { ...data, action };
}

// ── Main Component ───────────────────────────────────────────────
export default function UploadDetection() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locationName, setLocationName] = useState("");
  const [miningType, setMiningType] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const detectMutation = useDetectMining();
  const monitoringMutation = useAddMonitoringArea();

  // ArmorIQ state
  const [armorToken, setArmorToken] = useState<IntentToken | null>(null);
  const [armorLogs, setArmorLogs] = useState<AuditEntry[]>([]);
  const [armorVerifying, setArmorVerifying] = useState(false);
  const [lastVerify, setLastVerify] = useState<VerifyResult | null>(null);
  const [planCaptured, setPlanCaptured] = useState(false);

  const addLog = (result: VerifyResult) => {
    setArmorLogs((prev) => [
      {
        id: Math.random().toString(16).slice(2, 8),
        action: result.action,
        allowed: result.allowed,
        reason: result.reason,
        time: new Date(result.timestamp).toLocaleTimeString(),
      },
      ...prev,
    ]);
  };

  // Initialize ArmorIQ session
  const initSession = async () => {
    setArmorVerifying(true);
    try {
      const token = await capturePlan(
        "Analyze satellite image for illegal mining, generate report, add to monitoring",
      );
      setArmorToken(token);
      setPlanCaptured(true);
      toast({
        title: "🛡️ ArmorIQ Session Started",
        description: `${token.stepProofs} actions secured.`,
      });
    } catch {
      toast({
        title: "ArmorIQ Error",
        description: "Backend not reachable. Run: uvicorn main:app --reload",
        variant: "destructive",
      });
    } finally {
      setArmorVerifying(false);
    }
  };

  // Verify then run
  const verifyAndRun = async (action: MiningAction, fn: () => void) => {
    if (!armorToken) {
      toast({
        title: "⚠️ Start ArmorIQ session first",
        variant: "destructive",
      });
      return;
    }
    setArmorVerifying(true);
    try {
      const result = await verifyAction(action, armorToken);
      setLastVerify(result);
      addLog(result);
      if (result.allowed) {
        fn();
      } else {
        toast({
          title: "❌ Blocked by ArmorIQ",
          description: result.reason,
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Verification error", variant: "destructive" });
    } finally {
      setArmorVerifying(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && (f.type === "image/jpeg" || f.type === "image/png")) {
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
      toast({
        title: "Missing fields",
        description: "Upload image and enter coordinates.",
        variant: "destructive",
      });
      return;
    }
    verifyAndRun("analyze_satellite_image", () => {
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
            if (data.detection_id && file) {
              try {
                saveDetectionImage(
                  data.detection_id,
                  await fileToDataUrl(file),
                );
              } catch {}
            }
            toast({
              title: data.mining_detected
                ? "⚠️ Mining Detected!"
                : "✅ No Mining Detected",
              description: `Confidence: ${data.confidence.toFixed(1)}%`,
            });
          },
          onError: (err) =>
            toast({
              title: "Detection Failed",
              description: err.message,
              variant: "destructive",
            }),
        },
      );
    });
  };

  const result = detectMutation.data;

  const formatLoss = (usd: number) => {
    const crore = usd / 10_000_000;
    return crore >= 1
      ? `₹${crore.toFixed(1)} Cr`
      : `₹${(usd / 100_000).toFixed(1)} L`;
  };

  const handleGenerateReport = () => {
    if (!result) return;
    verifyAndRun("generate_pdf_report", () => {
      generatePdfReport(result, preview);
      toast({ title: "PDF Downloaded" });
    });
  };

  const handleAddToMonitoring = () => {
    if (!result) return;
    verifyAndRun("add_to_monitoring", () => {
      monitoringMutation.mutate(
        {
          area_name: result.location.name,
          latitude: result.location.latitude,
          longitude: result.location.longitude,
        },
        {
          onSuccess: (data) =>
            toast({
              title: "Added to Monitoring",
              description: `Queue ID: ${data.queue_id}`,
            }),
          onError: () => toast({ title: "Failed", variant: "destructive" }),
        },
      );
    });
  };

  const handleViewOnMap = () => {
    if (!result) return;
    verifyAndRun("view_on_map", () => {
      const params = new URLSearchParams({
        lat: String(result.location.latitude),
        lng: String(result.location.longitude),
        name: result.location.name,
        severity: result.analysis.severity,
        confidence: result.confidence.toFixed(1),
        detection_id: result.detection_id || "",
      });
      navigate(`/map?${params}`);
    });
  };

  const handleView3DModel = () => {
    if (!result) return;
    verifyAndRun("view_3d_model", () => {
      const params = new URLSearchParams({
        detection_id: result.detection_id || "",
        lat: String(result.location.latitude),
        lng: String(result.location.longitude),
        area: result.analysis.estimatedAreaHectares.toFixed(1),
        severity: result.analysis.severity,
      });
      navigate(`/3d-model?${params}`);
    });
  };

  const verifiedCount = armorLogs.filter((l) => l.allowed).length;
  const blockedCount = armorLogs.filter((l) => !l.allowed).length;

  return (
    <div className="space-y-6 fade-in max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Upload Detection</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload satellite imagery for AI-powered mining detection
        </p>
      </div>

      {/* ── ArmorIQ Panel ── */}
      <div className="rounded-xl border border-cyan-800/50 bg-slate-950/80 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Shield size={18} className="text-cyan-400" />
            <span className="text-sm font-bold text-white font-mono tracking-widest">
              ARMORIQ
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              INTENT VERIFICATION
            </span>
          </div>
          {planCaptured && (
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 border border-emerald-800 rounded px-2 py-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />{" "}
              LIVE
            </span>
          )}
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left: Init + Last Result */}
          <div className="space-y-4">
            {/* Step 1 */}
            <div>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-2">
                Step 1 — Initialize Session
              </p>
              <button
                onClick={initSession}
                disabled={planCaptured || armorVerifying}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] font-mono font-bold tracking-wider border transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-cyan-500/10 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20"
              >
                {armorVerifying && !planCaptured ? (
                  <>
                    <Loader2 size={12} className="animate-spin" /> CONNECTING…
                  </>
                ) : planCaptured ? (
                  <>
                    <ShieldCheck size={12} className="text-emerald-400" />{" "}
                    SESSION ACTIVE ✓
                  </>
                ) : (
                  <>
                    <Shield size={12} /> START ARMORIQ SESSION
                  </>
                )}
              </button>

              {armorToken && (
                <div className="mt-2 p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-lg text-[10px] font-mono space-y-1.5">
                  {[
                    ["token_id", armorToken.id.slice(0, 14) + "…"],
                    ["step_proofs", String(armorToken.stepProofs)],
                    ["expires", armorToken.expires],
                    ["plan_hash", armorToken.plan_hash.slice(0, 14) + "…"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-slate-600">{k}</span>
                      <span className="text-emerald-400">{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2 */}
            <div>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-2">
                Step 2 — Pre-Execution Verification
              </p>
              {lastVerify ? (
                <div
                  className={`rounded-lg border p-3 ${lastVerify.allowed ? "bg-emerald-950/30 border-emerald-700/50" : "bg-red-950/30 border-red-700/50"}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {lastVerify.allowed ? (
                      <ShieldCheck size={16} className="text-emerald-400" />
                    ) : (
                      <ShieldX size={16} className="text-red-400" />
                    )}
                    <span
                      className={`text-[11px] font-mono font-bold ${lastVerify.allowed ? "text-emerald-300" : "text-red-300"}`}
                    >
                      {lastVerify.allowed
                        ? "✅ EXECUTION ALLOWED"
                        : "❌ EXECUTION BLOCKED"}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mb-1">
                    {lastVerify.action.replace(/_/g, " ")}
                  </div>
                  <div className="text-[10px] text-slate-400 bg-slate-900/60 rounded p-2 leading-relaxed">
                    {lastVerify.reason}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-800 bg-slate-900/20 p-5 text-center">
                  <p className="text-[11px] text-slate-600 font-mono">
                    {planCaptured
                      ? "Click an action to see verification"
                      : "Initialize session first"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Audit Trail */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                Step 3 — Audit Trail
              </p>
              {armorLogs.length > 0 && (
                <div className="text-[10px] font-mono flex gap-3">
                  <span className="text-emerald-400">
                    {verifiedCount} verified
                  </span>
                  <span className="text-red-400">{blockedCount} blocked</span>
                </div>
              )}
            </div>

            {armorLogs.length === 0 ? (
              <div className="rounded-lg border border-slate-800 bg-slate-900/20 p-6 text-center">
                <p className="text-[11px] text-slate-600 font-mono">
                  No events yet
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {armorLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-2 p-2 rounded-lg border text-[10px] font-mono ${
                      log.allowed
                        ? "bg-emerald-950/20 border-emerald-800/30"
                        : "bg-red-950/20 border-red-800/30"
                    }`}
                  >
                    {log.allowed ? (
                      <CheckCircle2
                        size={10}
                        className="text-emerald-400 mt-0.5 shrink-0"
                      />
                    ) : (
                      <XCircle
                        size={10}
                        className="text-red-400 mt-0.5 shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-1">
                        <span className="text-slate-300 truncate">
                          {log.action.replace(/_/g, " ")}
                        </span>
                        <span className="text-slate-600 shrink-0 flex items-center gap-0.5">
                          <Clock size={8} />
                          {log.time}
                        </span>
                      </div>
                      <div className="text-slate-600 truncate mt-0.5">
                        {log.reason}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {armorLogs.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[
                  {
                    label: "Total",
                    val: armorLogs.length,
                    color: "text-slate-300",
                  },
                  {
                    label: "Verified",
                    val: verifiedCount,
                    color: "text-emerald-400",
                  },
                  {
                    label: "Blocked",
                    val: blockedCount,
                    color: "text-red-400",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-center"
                  >
                    <div className={`text-xl font-bold font-mono ${s.color}`}>
                      {s.val}
                    </div>
                    <div className="text-[9px] text-slate-600 uppercase tracking-wider mt-0.5">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[9px] text-slate-700 font-mono text-center mt-3">
              Powered by ArmorIQ — platform.armoriq.ai
            </p>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        className="glass-card border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer"
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          className="hidden"
          accept="image/jpeg,image/png"
          onChange={onFileSelect}
        />
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-64 object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
              <p className="text-sm text-foreground font-medium">
                Click to change image
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <p className="text-foreground font-medium">
              Drop satellite image here or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG up to 10MB
            </p>
          </div>
        )}
      </div>

      {/* Form */}
      <div className="glass-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground">Latitude *</Label>
            <Input
              type="number"
              placeholder="e.g. 23.6102"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="mt-1 bg-secondary/50"
            />
          </div>
          <div>
            <Label className="text-muted-foreground">Longitude *</Label>
            <Input
              type="number"
              placeholder="e.g. 85.2799"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="mt-1 bg-secondary/50"
            />
          </div>
          <div>
            <Label className="text-muted-foreground">Location Name</Label>
            <Input
              placeholder="Optional"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="mt-1 bg-secondary/50"
            />
          </div>
          <div>
            <Label className="text-muted-foreground">Mining Type</Label>
            <Select value={miningType} onValueChange={setMiningType}>
              <SelectTrigger className="mt-1 bg-secondary/50">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {[
                  "Sand",
                  "Coal",
                  "Stone",
                  "Iron",
                  "Bauxite",
                  "Gold",
                  "Unknown",
                ].map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleDetect}
          disabled={detectMutation.isPending || armorVerifying}
          className="mt-6 w-full md:w-auto"
          size="lg"
        >
          {detectMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...
            </>
          ) : armorVerifying ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> ArmorIQ
              Verifying...
            </>
          ) : (
            "Detect Mining"
          )}
        </Button>

        {!planCaptured && (
          <p className="text-[11px] text-amber-500 mt-2 font-mono">
            ⚠️ Start ArmorIQ session above before running detection
          </p>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className="glass-card p-6 slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div
              className={`w-10 h-10 rounded-full ${result.mining_detected ? "bg-destructive/20" : "bg-primary/20"} flex items-center justify-center`}
            >
              <AlertTriangle
                className={`w-5 h-5 ${result.mining_detected ? "text-destructive" : "text-primary"}`}
              />
            </div>
            <div>
              <Badge
                className={
                  result.mining_detected ? "severity-high" : "severity-low"
                }
              >
                Mining Detected: {result.mining_detected ? "YES" : "NO"}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                Analysis completed successfully
              </p>
            </div>
          </div>

          {preview && (
            <div className="mb-6 rounded-lg overflow-hidden">
              <img
                src={preview}
                alt="Uploaded"
                className="w-full h-48 object-cover"
              />
            </div>
          )}

          <div className="flex items-center gap-6 mb-6">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="hsl(215 25% 22%)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="hsl(160 84% 39%)"
                  strokeWidth="8"
                  strokeDasharray={`${result.confidence * 2.64} 264`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-foreground">
                  {result.confidence.toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Confidence Score</p>
              <Badge
                variant="outline"
                className={`severity-${result.analysis.severity.toLowerCase()}`}
              >
                {result.analysis.severity} Severity
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-secondary/30 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-foreground">
                {result.analysis.estimatedAreaHectares.toFixed(1)} ha
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Area Affected
              </p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-foreground">
                {result.analysis.machineryCount}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Machinery Detected
              </p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-foreground">
                {formatLoss(result.analysis.estimatedLossUSD)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Economic Loss
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="bg-secondary/20 rounded-lg p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                AI Reasoning
              </p>
              <p className="text-sm text-foreground">
                {result.analysis.reasoning}
              </p>
            </div>
            <div className="bg-secondary/20 rounded-lg p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                Environmental Impact
              </p>
              <p className="text-sm text-foreground">
                {result.analysis.environmentalImpact}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button onClick={handleGenerateReport} disabled={armorVerifying}>
              <FileText className="w-4 h-4 mr-2" /> Generate PDF Report
            </Button>
            <Button
              variant="outline"
              onClick={handleAddToMonitoring}
              disabled={monitoringMutation.isPending || armorVerifying}
            >
              <Eye className="w-4 h-4 mr-2" />
              {monitoringMutation.isPending ? "Adding..." : "Add to Monitoring"}
            </Button>
            <Button
              variant="outline"
              onClick={handleViewOnMap}
              disabled={armorVerifying}
            >
              <MapPin className="w-4 h-4 mr-2" /> View on Map
            </Button>
            <Button
              variant="outline"
              className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-0 hover:from-cyan-700 hover:to-blue-700"
              onClick={handleView3DModel}
              disabled={armorVerifying}
            >
              <Box className="w-4 h-4 mr-2" /> View 3D Model
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}