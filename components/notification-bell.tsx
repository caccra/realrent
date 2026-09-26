"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  async function fetchNotifications(): Promise<{ notifications: Notification[]; unreadCount: number } | null> {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return null;
      return await res.json();
    } catch {
      // Network hiccup or server temporarily unreachable — just skip this poll.
      return null;
    }
  }

  async function load() {
    const data = await fetchNotifications();
    if (!data) return;
    setNotifications(data.notifications);
    setUnreadCount(data.unreadCount);
    setLoaded(true);
  }

  useEffect(() => {
    let ignore = false;

    fetchNotifications().then((data) => {
      if (!ignore && data) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
        setLoaded(true);
      }
    });

    const interval = setInterval(() => {
      fetchNotifications().then((data) => {
        if (!ignore && data) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        }
      });
    }, 60000);

    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleOpen() {
    setOpen((v) => !v);
    if (!loaded) await load();
  }

  async function handleNotificationClick(n: Notification) {
    if (!n.read) {
      try {
        await fetch(`/api/notifications/${n.id}`, { method: "PATCH" });
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // Ignore — worst case it shows as unread until the next poll.
      }
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  async function handleMarkAllRead() {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // Ignore — worst case it shows as unread until the next poll.
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleOpen}
        className="relative text-slate-500 hover:text-slate-900"
        aria-label="Notifications"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <path
            d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-md border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
            <span className="text-sm font-medium text-slate-900">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-ivy-700 hover:text-ivy-800"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleNotificationClick(n)}
                  className={`block w-full border-b border-slate-50 px-4 py-3 text-left text-sm hover:bg-slate-50 ${
                    n.read ? "bg-white" : "bg-ivy-50"
                  }`}
                >
                  <p className="font-medium text-slate-900">{n.title}</p>
                  <p className="mt-0.5 text-slate-600">{n.message}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(n.createdAt).toLocaleString("en-UG")}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
