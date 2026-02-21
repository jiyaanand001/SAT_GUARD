import { useState } from "react";

// ─── API hook inline (no separate file needed) ────────────────────────────────

const API_BASE = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

function useCompareDetection() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const compare = async (siteId: string) => {
        if (!siteId) return;
        setLoading(true);
        setError(null);
        setData(null);
        try {
            const res = await fetch(`${API_BASE}/api/sites/${siteId}/compare`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || `HTTP ${res.status}`);
            }
            setData(await res.json());
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return { data, loading, error, compare };
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

const fmtUsd = (n: number | null) =>
    n != null ? `$${Number(n).toLocaleString()}` : "—";

const fmtNum = (n: number | null, decimals = 2) =>
    n != null ? Number(n).toFixed(decimals) : "—";

// ─── severity ─────────────────────────────────────────────────────────────────

const SEV: Record<string, { bg: string; border: string; text: string }> = {
    Critical: { bg: "#ff2d2d22", border: "#ff2d2d", text: "#ff6b6b" },
    High: { bg: "#ff8c0022", border: "#ff8c00", text: "#ffb347" },
    Moderate: { bg: "#ffd70022", border: "#ffd700", text: "#ffd700" },
    Low: { bg: "#00e67622", border: "#00e676", text: "#00e676" },
};

function SeverityBadge({ value }: { value: string }) {
    const c = SEV[value] || { bg: "#ffffff11", border: "#888", text: "#aaa" };
    return (
        <span style={{
            background: c.bg, border: `1px solid ${c.border}`, color: c.text,
            borderRadius: "6px", padding: "2px 10px", fontSize: "0.78rem",
            fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
        }}>
            {value || "—"}
        </span>
    );
}

// ─── DetectionCard ────────────────────────────────────────────────────────────

interface CardData {
    id: number | string;
    location_name?: string;
    confidence?: number | null;
    severity?: string;
    area_hectares?: number | null;
    estimated_loss_usd?: number | null;
    mining_type?: string;
    detected_at?: string | null;
}

function DetectionCard({ label, data, accent }: { label: string; data: CardData; accent: string }) {
    const rows: [string, React.ReactNode][] = [
        ["ID", `#${data.id}`],
        ["Location", data.location_name || "—"],
        ["Confidence", data.confidence != null ? `${Number(data.confidence).toFixed(1)}%` : "—"],
        ["Severity", <SeverityBadge value={data.severity || ""} />],
        ["Area", `${fmtNum(data.area_hectares ?? null)} ha`],
        ["Est. Loss", fmtUsd(data.estimated_loss_usd ?? null)],
        ["Mining Type", data.mining_type || "—"],
        ["Detected At", fmtDate(data.detected_at ?? null)],
    ];

    return (
        <div style={{
            background: "#0d1117", border: `1px solid ${accent}`, borderRadius: "14px",
            padding: "28px", flex: "1 1 300px", minWidth: "260px",
            position: "relative", overflow: "hidden",
        }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: accent }} />
            <p style={{
                margin: "0 0 18px", fontSize: "0.7rem", letterSpacing: "0.12em",
                textTransform: "uppercase", color: accent, fontWeight: 700
            }}>
                {label}
            </p>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                    {rows.map(([k, v]) => (
                        <tr key={k} style={{ borderBottom: "1px solid #ffffff0a" }}>
                            <td style={{
                                padding: "9px 0", color: "#6b7280", fontSize: "0.82rem",
                                whiteSpace: "nowrap", paddingRight: "16px"
                            }}>{k}</td>
                            <td style={{ padding: "9px 0", color: "#e5e7eb", fontSize: "0.88rem", fontWeight: 500 }}>{v}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ─── ChangeRow ────────────────────────────────────────────────────────────────

interface ChangeRowProps {
    label: string;
    previous: number | null | undefined;
    current: number | null | undefined;
    changePct: number | null | undefined;
    trend?: string;
    unit?: string;
    formatAs?: "usd" | "num" | "";
    decimals?: number;
}

function ChangeRow({ label, previous, current, changePct, trend, unit = "", formatAs = "", decimals = 2 }: ChangeRowProps) {
    const up = (changePct ?? 0) > 0;
    const down = (changePct ?? 0) < 0;
    const trendColor = up ? "#ff6b6b" : down ? "#00e676" : "#6b7280";
    const arrow = up ? "▲" : down ? "▼" : "—";

    const display = (val: number | null | undefined): string => {
        if (val == null) return "—";
        if (formatAs === "usd") return fmtUsd(val);
        return `${Number(val).toFixed(decimals)}${unit}`;
    };

    return (
        <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 0", borderBottom: "1px solid #ffffff0a", flexWrap: "wrap", gap: "8px",
        }}>
            <span style={{ color: "#9ca3af", fontSize: "0.85rem", minWidth: "130px" }}>{label}</span>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ color: "#6b7280", fontSize: "0.85rem" }}>{display(previous)}</span>
                <span style={{ color: "#374151", fontSize: "0.9rem" }}>→</span>
                <span style={{ color: "#e5e7eb", fontSize: "0.85rem", fontWeight: 600 }}>{display(current)}</span>

                {changePct != null && (
                    <span style={{
                        color: trendColor, fontSize: "0.8rem", fontWeight: 700,
                        background: `${trendColor}18`, border: `1px solid ${trendColor}44`,
                        borderRadius: "6px", padding: "2px 8px",
                    }}>
                        {arrow} {Math.abs(changePct)}%
                    </span>
                )}

                {trend && (
                    <span style={{ color: "#6b7280", fontSize: "0.78rem", fontStyle: "italic" }}>
                        ({trend})
                    </span>
                )}
            </div>
        </div>
    );
}

// ─── SeverityChangeRow ────────────────────────────────────────────────────────

function SeverityChangeRow({ previous, current, worsened, improved }: {
    previous: string; current: string; worsened: boolean; improved: boolean;
}) {
    const badge = worsened
        ? { label: "WORSENED", color: "#ff6b6b", bg: "#ff2d2d18" }
        : improved
            ? { label: "IMPROVED", color: "#00e676", bg: "#00e67618" }
            : { label: "UNCHANGED", color: "#6b7280", bg: "#6b728018" };

    return (
        <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 0", flexWrap: "wrap", gap: "8px",
        }}>
            <span style={{ color: "#9ca3af", fontSize: "0.85rem", minWidth: "130px" }}>Severity</span>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <SeverityBadge value={previous} />
                <span style={{ color: "#374151" }}>→</span>
                <SeverityBadge value={current} />
                <span style={{
                    background: badge.bg, border: `1px solid ${badge.color}44`,
                    color: badge.color, borderRadius: "6px", padding: "2px 10px",
                    fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em",
                }}>
                    {badge.label}
                </span>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ComparisonPage() {
    const [inputId, setInputId] = useState("");
    const { data, loading, error, compare } = useCompareDetection();

    const handleCompare = () => compare(inputId.trim());

    const current = data?.current;
    const comparison = data?.comparison;
    const changes = comparison?.changes;
    const isFirst = data?.is_first_detection;
    const daysApart = comparison?.days_since_last_detection;

    return (
        <div style={{
            minHeight: "100vh", background: "#060910",
            fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
            color: "#e5e7eb", padding: "40px 24px 80px",
        }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&family=Syne:wght@700;800&display=swap');
        .cmp-input {
          background: #0d1117; border: 1px solid #1f2937; border-radius: 10px;
          color: #e5e7eb; font-family: inherit; font-size: 0.95rem;
          padding: 12px 18px; outline: none; transition: border-color 0.2s; width: 220px;
        }
        .cmp-input:focus { border-color: #f97316; }
        .cmp-btn {
          background: #f97316; border: none; border-radius: 10px; color: #000;
          cursor: pointer; font-family: inherit; font-size: 0.9rem; font-weight: 700;
          letter-spacing: 0.06em; padding: 12px 28px; transition: opacity 0.2s, transform 0.1s;
        }
        .cmp-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .cmp-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pulse { animation: pulse 1.5s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .fade-in { animation: fadeIn 0.4s ease forwards; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

            <div style={{ maxWidth: "980px", margin: "0 auto" }}>

                {/* Header */}
                <div style={{ marginBottom: "40px" }}>
                    <p style={{
                        fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase",
                        color: "#f97316", margin: "0 0 8px", fontWeight: 700
                    }}>
                        Mining Detection System
                    </p>
                    <h1 style={{
                        fontFamily: "'Syne', sans-serif", fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                        fontWeight: 800, margin: "0 0 10px", lineHeight: 1.1, color: "#f9fafb"
                    }}>
                        Site Comparison
                    </h1>
                    <p style={{ color: "#6b7280", fontSize: "0.88rem", margin: 0 }}>
                        Compare a detection with the previous scan at the same location
                    </p>
                </div>

                {/* Search */}
                <div style={{
                    display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap",
                    marginBottom: "40px", background: "#0d1117", border: "1px solid #1f2937",
                    borderRadius: "14px", padding: "20px 24px",
                }}>
                    <label style={{ color: "#9ca3af", fontSize: "0.82rem", letterSpacing: "0.06em" }}>
                        SITE ID
                    </label>
                    <input
                        className="cmp-input"
                        type="number"
                        min="1"
                        placeholder="e.g. 42"
                        value={inputId}
                        onChange={e => setInputId(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleCompare()}
                    />
                    <button className="cmp-btn" onClick={handleCompare} disabled={loading || !inputId}>
                        {loading ? "Comparing…" : "Compare →"}
                    </button>
                </div>

                {/* Loading */}
                {loading && (
                    <div style={{ textAlign: "center", padding: "60px 0" }}>
                        <div className="pulse" style={{ color: "#f97316", fontSize: "0.85rem", letterSpacing: "0.1em" }}>
                            ⬤ &nbsp; FETCHING DATA
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="fade-in" style={{
                        background: "#ff2d2d12", border: "1px solid #ff2d2d44",
                        borderRadius: "12px", padding: "20px 24px",
                        color: "#ff6b6b", fontSize: "0.88rem",
                    }}>
                        ✗ &nbsp; {error}
                    </div>
                )}

                {/* First detection */}
                {data && isFirst && (
                    <div className="fade-in" style={{
                        background: "#00e67612", border: "1px solid #00e67644",
                        borderRadius: "12px", padding: "28px 32px",
                    }}>
                        <p style={{ margin: "0 0 6px", color: "#00e676", fontWeight: 700, fontSize: "0.9rem" }}>
                            ✓ First Detection
                        </p>
                        <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.85rem" }}>
                            This is the first detection recorded at this location. No previous scan to compare against.
                        </p>
                        {current && (
                            <div style={{ marginTop: "28px" }}>
                                <DetectionCard label="Current Detection" data={current} accent="#00e676" />
                            </div>
                        )}
                    </div>
                )}

                {/* Full comparison */}
                {data && !isFirst && current && comparison && changes && (
                    <div className="fade-in">

                        {/* Days badge */}
                        {daysApart != null && (
                            <div style={{ marginBottom: "24px" }}>
                                <span style={{
                                    background: "#f9731618", border: "1px solid #f9731644",
                                    color: "#f97316", borderRadius: "8px", padding: "5px 14px",
                                    fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.06em",
                                }}>
                                    ⏱ &nbsp; {daysApart} day{daysApart !== 1 ? "s" : ""} since last detection
                                </span>
                            </div>
                        )}

                        {/* Two cards */}
                        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "32px" }}>
                            <DetectionCard
                                label="Previous Detection"
                                accent="#6b7280"
                                data={{
                                    id: comparison.previous_detection_id,
                                    location_name: current.location_name,
                                    confidence: changes.confidence?.previous ?? null,
                                    severity: changes.severity?.previous ?? "",
                                    area_hectares: changes.area_hectares?.previous ?? null,
                                    estimated_loss_usd: changes.estimated_loss_usd?.previous ?? null,
                                    mining_type: current.mining_type,
                                    detected_at: null,
                                }}
                            />
                            <DetectionCard
                                label="Current Detection"
                                data={current}
                                accent="#f97316"
                            />
                        </div>

                        {/* Changes summary */}
                        <div style={{
                            background: "#0d1117", border: "1px solid #1f2937",
                            borderRadius: "14px", padding: "28px",
                        }}>
                            <p style={{
                                margin: "0 0 4px", fontSize: "0.7rem", letterSpacing: "0.14em",
                                textTransform: "uppercase", color: "#f97316", fontWeight: 700
                            }}>
                                Changes Summary
                            </p>
                            <p style={{ margin: "0 0 20px", color: "#6b7280", fontSize: "0.8rem" }}>
                                Field-by-field diff between previous and current detection
                            </p>

                            <ChangeRow
                                label="Confidence"
                                previous={changes.confidence?.previous ?? null}
                                current={changes.confidence?.current ?? null}
                                changePct={changes.confidence?.change_percent ?? null}
                                trend={changes.confidence?.trend}
                                decimals={1}
                                unit="%"
                            />
                            <ChangeRow
                                label="Area Affected"
                                previous={changes.area_hectares?.previous ?? null}
                                current={changes.area_hectares?.current ?? null}
                                changePct={changes.area_hectares?.change_percent ?? null}
                                trend={changes.area_hectares?.trend}
                                decimals={2}
                                unit=" ha"
                            />
                            <ChangeRow
                                label="Estimated Loss"
                                previous={changes.estimated_loss_usd?.previous ?? null}
                                current={changes.estimated_loss_usd?.current ?? null}
                                changePct={changes.estimated_loss_usd?.change_percent ?? null}
                                formatAs="usd"
                            />
                            <SeverityChangeRow
                                previous={changes.severity?.previous ?? ""}
                                current={changes.severity?.current ?? ""}
                                worsened={changes.severity?.worsened ?? false}
                                improved={changes.severity?.improved ?? false}
                            />
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {!data && !loading && !error && (
                    <div style={{
                        textAlign: "center", padding: "80px 0",
                        color: "#374151", fontSize: "0.85rem", letterSpacing: "0.06em",
                    }}>
                        Enter a Site ID above and click Compare
                    </div>
                )}

            </div>
        </div>
    );
}