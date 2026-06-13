"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  AppNotification,
  subscribeNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/firestore/notifications";

interface UseNotificationsResult {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export function useNotifications(): UseNotificationsResult {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.companyId) return;

    setLoading(true);
    const unsub = subscribeNotifications(profile.companyId, (data) => {
      setNotifications(data);
      setLoading(false);
    });

    return () => unsub();
  }, [profile?.companyId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = async (id: string) => {
    await markNotificationRead(id);
  };

  const markAllRead = async () => {
    if (!profile?.companyId) return;
    await markAllNotificationsRead(profile.companyId);
  };

  return { notifications, unreadCount, loading, markRead, markAllRead };
}
