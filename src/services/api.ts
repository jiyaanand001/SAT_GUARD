const BASE_URL = 'https://illegal-mining-api.onrender.com';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
  return res.json();
}

// Types matching API response shapes
export interface ApiSite {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  severity: string;
  type: string;
  areaHectares: number;
  estimatedLossUSD: number;
  lastDetected: string;
  images: string[];
  confidence: number | null;
  verified: boolean | null;
}

export interface ApiStats {
  total_detections: number;
  total_area_hectares: number;
  total_estimated_loss_usd: number;
  critical_sites: number;
  high_severity_sites: number;
  moderate_severity_sites: number;
  avg_confidence: number;
  verified_count: number;
}

export interface ApiTrend {
  name: string;
  loss: number;
  detected: number;
}

export interface ApiDetectionResponse {
  mining_detected: boolean;
  confidence: number;
  analysis: {
    detected: boolean;
    confidence: number;
    reasoning: string;
    environmentalImpact: string;
    legalContext: string;
    machineryCount: number;
    severity: string;
    estimatedAreaHectares: number;
    estimatedLossUSD: number;
  };
  location: { latitude: number; longitude: number; name: string };
  timestamp: string;
  detection_id: string | null;
}

export interface ApiNotification {
  id: number;
  alert_type: string;
  location: string;
  severity: string;
  confidence: number;
  message: string;
  created_at: string;
  read: boolean;
}

export interface ApiMonitoringArea {
  id: number;
  area_name: string;
  latitude: number;
  longitude: number;
  status: string;
  requested_by: string;
  last_scanned: string;
  scan_frequency: string;
}

// --- Fetch functions ---

export const fetchStats = () => fetchAPI<ApiStats>('/api/stats');

export const fetchSites = (params?: { limit?: number; severity?: string; min_confidence?: number }) => {
  const q = new URLSearchParams();
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.severity) q.set('severity', params.severity);
  if (params?.min_confidence) q.set('min_confidence', String(params.min_confidence));
  const qs = q.toString();
  return fetchAPI<ApiSite[]>(`/api/sites${qs ? `?${qs}` : ''}`);
};

export const fetchSiteById = (id: string) => fetchAPI<ApiSite>(`/api/sites/${id}`);

export const fetchTrends = (months = 6) => fetchAPI<ApiTrend[]>(`/api/trends/monthly?months=${months}`);

export const fetchNotifications = (unreadOnly = false) =>
  fetchAPI<{ success: boolean; count: number; unread_count: number; notifications: ApiNotification[] }>(
    `/api/notifications?unread_only=${unreadOnly}`
  );

export const markNotificationRead = (id: number) =>
  fetchAPI<{ success: boolean }>(`/api/notifications/${id}/mark-read`, { method: 'PATCH' });

export const markAllNotificationsRead = () =>
  fetchAPI<{ success: boolean }>('/api/notifications/mark-all-read', { method: 'POST' });

export const fetchHighRiskAreas = () =>
  fetchAPI<{ success: boolean; count: number; areas: any[] }>('/api/high-risk-areas');

export const fetchMonitoringQueue = () =>
  fetchAPI<{ success: boolean; count: number; areas: ApiMonitoringArea[]; next_scan_time: string }>('/api/monitoring/queue');

export const addMonitoringArea = (params: { area_name: string; latitude: number; longitude: number; requested_by?: string }) => {
  const q = new URLSearchParams({
    area_name: params.area_name,
    latitude: String(params.latitude),
    longitude: String(params.longitude),
    requested_by: params.requested_by || 'Officer',
  });
  return fetchAPI<{ success: boolean; queue_id: number }>(`/api/monitoring/add-area?${q}`, { method: 'POST' });
};

export const detectMining = async (file: File, params: { latitude: number; longitude: number; location_name?: string; mining_type?: string }) => {
  const q = new URLSearchParams({
    latitude: String(params.latitude),
    longitude: String(params.longitude),
  });
  if (params.location_name) q.set('location_name', params.location_name);
  if (params.mining_type) q.set('mining_type', params.mining_type);

  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/api/detect?${q}`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
  return res.json() as Promise<ApiDetectionResponse>;
};

export const verifySite = (siteId: string, verified: boolean, notes?: string) => {
  const q = new URLSearchParams({ verified: String(verified) });
  if (notes) q.set('notes', notes);
  return fetchAPI<{ success: boolean }>(`/api/sites/${siteId}/verify?${q}`, { method: 'PATCH' });
};

export const generateReport = (detectionId: string) =>
  fetchAPI<{ success: boolean; report_filename: string }>(`/api/generate-report/${detectionId}`, { method: 'POST' });
