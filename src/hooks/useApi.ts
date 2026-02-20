import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchStats, fetchSites, fetchTrends, fetchNotifications,
  markNotificationRead, markAllNotificationsRead,
  fetchMonitoringQueue, addMonitoringArea, fetchHighRiskAreas,
  detectMining, verifySite, generateReport,
} from '@/services/api';

export const useStats = () =>
  useQuery({ queryKey: ['stats'], queryFn: fetchStats, staleTime: 60_000 });

export const useSites = (params?: { limit?: number; severity?: string; min_confidence?: number }) =>
  useQuery({ queryKey: ['sites', params], queryFn: () => fetchSites(params), staleTime: 60_000 });

export const useTrends = (months = 12) =>
  useQuery({ queryKey: ['trends', months], queryFn: () => fetchTrends(months), staleTime: 120_000 });

export const useNotifications = (unreadOnly = false) =>
  useQuery({ queryKey: ['notifications', unreadOnly], queryFn: () => fetchNotifications(unreadOnly), staleTime: 30_000 });

export const useMonitoringQueue = () =>
  useQuery({ queryKey: ['monitoring-queue'], queryFn: fetchMonitoringQueue, staleTime: 30_000 });

export const useHighRiskAreas = () =>
  useQuery({ queryKey: ['high-risk-areas'], queryFn: fetchHighRiskAreas, staleTime: 60_000 });

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};

export const useMarkAllNotificationsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};

export const useAddMonitoringArea = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addMonitoringArea,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['monitoring-queue'] }),
  });
};

export const useDetectMining = () =>
  useMutation({
    mutationFn: ({ file, params }: { file: File; params: { latitude: number; longitude: number; location_name?: string; mining_type?: string } }) =>
      detectMining(file, params),
  });

export const useVerifySite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ siteId, verified, notes }: { siteId: string; verified: boolean; notes?: string }) =>
      verifySite(siteId, verified, notes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sites'] }),
  });
};

export const useGenerateReport = () =>
  useMutation({ mutationFn: generateReport });
