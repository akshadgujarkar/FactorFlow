import { useNotifications } from "@/lib/hooks";
import { useAuth } from "@/lib/authContext";
import { Bell, FileText, CreditCard, Settings, Circle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const iconMap = {
  VOTE: FileText,
  REMINDER: CreditCard,
  PENALTY: CreditCard,
  SYSTEM: Settings,
};

const NotificationsPage = () => {
  const { wallet } = useAuth();
  const { data: notifications, isLoading } = useNotifications(wallet);

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-2xl">
        <div><h1 className="text-3xl font-display font-bold">Notifications</h1></div>
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    );
  }

  const unreadCount = notifications?.filter(n => !n.read).length ?? 0;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-display font-bold">Notifications</h1>
        <p className="text-muted-foreground mt-1">
          {unreadCount} unread • Real-time via <span className="text-orange-400 text-xs font-mono">Firebase onSnapshot 🔥</span>
        </p>
      </div>

      <div className="space-y-3">
        {notifications?.map(n => {
          const Icon = iconMap[n.type] || Settings;
          return (
            <div key={n.id} className={`glass-card p-4 flex items-start gap-4 ${!n.read ? "border-primary/30" : ""}`}>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{n.title}</p>
                  {!n.read && <Circle className="h-2 w-2 fill-primary text-primary" />}
                </div>
                <p className="text-sm text-muted-foreground">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{n.timestamp}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NotificationsPage;
