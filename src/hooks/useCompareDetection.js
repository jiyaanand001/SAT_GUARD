import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function useCompareDetection() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const compare = async (siteId) => {
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
            const json = await res.json();
            setData(json);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return { data, loading, error, compare };
}
