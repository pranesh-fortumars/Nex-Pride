"use client";
import { useEffect, useState } from "react";
import { initializeFirebase } from "@/firebase";
import { 
  collection, query, where, onSnapshot, 
  updateDoc, doc, orderBy
} from "firebase/firestore";

interface NotificationBellProps {
  userId: string | null | undefined;
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const { firestore: db } = initializeFirebase();
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, snap => {
      setNotifs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [userId]);

  const unread = notifs.filter(n => !n.read).length;

  const markRead = async (id: string) => {
    const { firestore: db } = initializeFirebase();
    await updateDoc(doc(db, "notifications", id), { read: true });
  };

  const markAllRead = async () => {
    notifs.filter(n => !n.read).forEach(n => markRead(n.id));
  };

  if (!userId) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
            <h4 className="font-semibold text-gray-800">Notifications</h4>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-purple-600 font-medium">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No notifications yet</div>
            ) : notifs.map(n => (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition ${!n.read ? "bg-purple-50" : ""}`}
              >
                <div className="flex gap-2">
                  <span>{n.type === "suspension" ? "⛔" : n.type === "warning" ? "⚠️" : "🔔"}</span>
                  <div>
                    <p className="text-sm text-gray-700">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {n.createdAt?.toDate?.()?.toLocaleDateString?.() || "Just now"}
                    </p>
                  </div>
                </div>
                {!n.read && <div className="w-2 h-2 bg-purple-500 rounded-full float-right mt-1" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
