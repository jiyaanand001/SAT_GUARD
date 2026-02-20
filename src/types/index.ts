export type Severity = 'Critical' | 'High' | 'Moderate' | 'Low';

export interface Detection {
  id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  confidence: number;
  severity: Severity;
  mining_type: string;
  area_hectares: number;
  estimated_loss_usd: number;
  detected_at: string;
  verified: boolean;
  image_url?: string;
}

export interface Statistics {
  total_detections: number;
  critical_sites: number;
  total_area_hectares: number;
  total_estimated_loss_usd: number;
  avg_confidence: number;
  verified_count: number;
}

export interface Notification {
  id: string;
  alert_type: 'new_detection' | 'activity_increased' | 'officer_dispatched' | 'site_verified' | 'report_generated';
  location: string;
  severity: Severity;
  confidence: number;
  message: string;
  created_at: string;
  read: boolean;
}

export interface MonitoringArea {
  id: string;
  area_name: string;
  latitude: number;
  longitude: number;
  status: 'Pending' | 'Scanning' | 'Completed';
  requested_by: string;
  last_scanned: string;
  scan_frequency: string;
}

export interface NavItem {
  title: string;
  path: string;
  icon: string;
  badge?: number;
}
