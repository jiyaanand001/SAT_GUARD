import {
  AlertCircle, TrendingUp, UserCheck, CheckCircle, FileText,
  Check
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useApi';

const typeConfig: Record<string, { icon: any; color: string }> = {
  new_detection: { icon: AlertCircle, color: 'text-red-400' },
  'new_mining_detected ': { icon: AlertCircle, color: 'text-red-400' },
  new_mining_detected: { icon: AlertCircle, color: 'text-red-400' },
  activity_increased: { icon: TrendingUp, color: 'text-orange-400' },
  officer_dispatched: { icon: UserCheck, color: 'text-blue-400' },
  site_verified: { icon: CheckCircle, color: 'text-emerald-400' },
  report_generated: { icon: FileText, color: 'text-muted-foreground' },
};

const severityColor: Record<string, string> = {
  Critical: 'severity-critical',
  High: 'severity-high',
  Moderate: 'severity-moderate',
  Low: 'severity-low',
};

function timeAgo(dateStr: string) {
  if (!dateStr) return 'N/A';
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationsPage() {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = data?.notifications || [];
  const unread = notifications.filter(n => !n.read);

  const renderList = (items: typeof notifications) => (
    <div className="space-y-2">
      {isLoading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-4 flex gap-4">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No notifications</p>
        </div>
      ) : items.map(n => {
        const cfg = typeConfig[n.alert_type?.trim()] || typeConfig['new_detection'];
        const Icon = cfg.icon;
        return (
          <div key={n.id} className={`glass-card p-4 flex gap-4 transition-all ${!n.read ? 'border-l-2 border-l-primary' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center bg-secondary/50 ${cfg.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{n.location}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
              </div>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="outline" className={`text-[10px] ${severityColor[n.severity] || ''}`}>{n.severity}</Badge>
                <span className="text-[11px] text-muted-foreground">{(n.confidence * 100).toFixed(1)}% confidence</span>
                <span className="text-[11px] text-muted-foreground">{timeAgo(n.created_at)}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1 flex-shrink-0">
              {!n.read && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => markRead.mutate(n.id)}>
                  <Check className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6 fade-in max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Notifications</h2>
          <p className="text-sm text-muted-foreground mt-1">{isLoading ? '...' : `${unread.length} unread`}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
          Mark All as Read
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unread.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">{renderList(notifications)}</TabsContent>
        <TabsContent value="unread" className="mt-4">{renderList(unread)}</TabsContent>
      </Tabs>
    </div>
  );
}
