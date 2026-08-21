"use client";
import { useEffect, useState } from "react";
import { initializeFirebase } from "@/firebase";
import { 
  collection, getDocs, updateDoc, doc, addDoc, 
  query, orderBy, serverTimestamp 
} from "firebase/firestore";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  reviewed: "bg-blue-100 text-blue-700",
  actioned: "bg-green-100 text-green-700",
  dismissed: "bg-gray-100 text-gray-500"
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [grouped, setGrouped] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState("all"); // all | user | company | pending

  const { firestore: db } = initializeFirebase();

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    setLoading(true);
    const snap = await getDocs(query(collection(db, "reports"), orderBy("createdAt", "desc")));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    setReports(data);

    // Group by targetId
    const grp: Record<string, any> = {};
    data.forEach(r => {
      if (!grp[r.targetId]) {
        grp[r.targetId] = {
          targetId: r.targetId,
          targetName: r.targetName,
          targetType: r.targetType,
          reports: [],
          reasons: new Set(),
          latestDate: r.createdAt
        };
      }
      grp[r.targetId].reports.push(r);
      grp[r.targetId].reasons.add(r.reason);
    });
    setGrouped(grp);
    setLoading(false);
  };

  const sendNotification = async (targetId: string, targetType: string, message: string, type: string) => {
    await addDoc(collection(db, "notifications"), {
      userId: targetId,
      userType: targetType,
      message,
      type, // "warning" | "suspension"
      read: false,
      createdAt: serverTimestamp()
    });
  };

  const handleSuspend = async (targetId: string, targetType: string, targetName: string, reportIds: string[]) => {
    if (!confirm(`Suspend ${targetName}? This will disable their account.`)) return;
    setActionLoading(targetId);
    try {
      // Update account status
      const collectionName = targetType === "company" ? "companies" : "Users";
      await updateDoc(doc(db, collectionName, targetId), { 
        status: "suspended",
        suspendedAt: serverTimestamp()
      });

      // Update all reports as actioned
      for (const rid of reportIds) {
        await updateDoc(doc(db, "reports", rid), { status: "actioned" });
      }

      // Send notification
      await sendNotification(
        targetId, targetType,
        `⛔ Your account has been suspended due to multiple reports for violating NexPride community guidelines. Contact support@nexpride.in to appeal.`,
        "suspension"
      );

      alert(`${targetName} has been suspended.`);
      fetchReports();
    } catch (err) {
      console.error(err);
      alert("Failed to suspend. Try again.");
    }
    setActionLoading(null);
  };

  const handleWarn = async (targetId: string, targetType: string, targetName: string, reasons: Set<string>, reportIds: string[]) => {
    if (!confirm(`Send warning to ${targetName}?`)) return;
    setActionLoading(targetId + "_warn");
    try {
      const collectionName = targetType === "company" ? "companies" : "Users";
      await updateDoc(doc(db, collectionName, targetId), { 
        warned: true,
        warnedAt: serverTimestamp()
      });

      for (const rid of reportIds) {
        await updateDoc(doc(db, "reports", rid), { status: "reviewed" });
      }

      await sendNotification(
        targetId, targetType,
        `⚠️ Warning: Your account has received ${reportIds.length} report(s) for: ${Array.from(reasons).join(", ")}. Further violations may result in suspension.`,
        "warning"
      );

      alert(`Warning sent to ${targetName}.`);
      fetchReports();
    } catch (err) {
      console.error(err);
    }
    setActionLoading(null);
  };

  const handleDismiss = async (reportIds: string[], targetId: string) => {
    setActionLoading(targetId + "_dismiss");
    for (const rid of reportIds) {
      await updateDoc(doc(db, "reports", rid), { status: "dismissed" });
    }
    fetchReports();
    setActionLoading(null);
  };

  const filteredGroups = Object.values(grouped).filter(g => {
    if (filter === "all") return true;
    if (filter === "pending") return g.reports.some((r: any) => r.status === "pending");
    return g.targetType === filter;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">🚨 Report Management</h1>
          <p className="text-gray-500 text-sm mt-1">Review and action reports filed by users and companies</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Reports", value: reports.length, color: "bg-purple-50 text-purple-700", icon: "📋" },
            { label: "Pending Review", value: reports.filter(r => r.status === "pending").length, color: "bg-yellow-50 text-yellow-700", icon: "⏳" },
            { label: "Companies Reported", value: Object.values(grouped).filter(g => g.targetType === "company").length, color: "bg-blue-50 text-blue-700", icon: "🏢" },
            { label: "Users Reported", value: Object.values(grouped).filter(g => g.targetType === "user").length, color: "bg-red-50 text-red-700", icon: "👤" },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-xl p-4`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs font-medium opacity-75">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          {["all", "pending", "company", "user"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                filter === f 
                  ? "bg-purple-600 text-white border-purple-600" 
                  : "bg-white text-gray-600 border-gray-200 hover:border-purple-300"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Report Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading reports...</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Report ID</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Type</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Reports</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Reasons</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredGroups.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-400">No reports found</td>
                  </tr>
                ) : filteredGroups.map(g => {
                  const reportIds = g.reports.map((r: any) => r.id);
                  const pendingCount = g.reports.filter((r: any) => r.status === "pending").length;
                  const status = g.reports[0]?.status || "pending";

                  return (
                    <tr key={g.targetId} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                          #{g.targetId.slice(0, 8)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{g.targetName}</div>
                        <div className="text-xs text-gray-400">{g.targetId}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          g.targetType === "company" 
                            ? "bg-blue-100 text-blue-700" 
                            : "bg-purple-100 text-purple-700"
                        }`}>
                          {g.targetType === "company" ? "🏢 Company" : "👤 User"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          g.reports.length >= 5 ? "bg-red-100 text-red-600" :
                          g.reports.length >= 3 ? "bg-orange-100 text-orange-600" :
                          "bg-yellow-100 text-yellow-600"
                        }`}>
                          {g.reports.length}
                        </span>
                        {pendingCount > 0 && (
                          <span className="ml-1 text-xs text-yellow-600">({pendingCount} new)</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {Array.from(g.reasons).slice(0, 2).map((r: any) => (
                            <span key={r} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full truncate max-w-[140px]" title={r}>
                              {r}
                            </span>
                          ))}
                          {g.reasons.size > 2 && (
                            <span className="text-xs text-gray-400">+{g.reasons.size - 2} more</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[status] || STATUS_COLORS.pending}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleWarn(g.targetId, g.targetType, g.targetName, g.reasons, reportIds)}
                            disabled={actionLoading === g.targetId + "_warn"}
                            className="px-3 py-1.5 bg-yellow-500 text-white text-xs rounded-lg font-medium hover:bg-yellow-600 disabled:opacity-50 transition"
                          >
                            ⚠️ Warn
                          </button>
                          <button
                            onClick={() => handleSuspend(g.targetId, g.targetType, g.targetName, reportIds)}
                            disabled={actionLoading === g.targetId}
                            className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 transition"
                          >
                            ⛔ Suspend
                          </button>
                          <button
                            onClick={() => handleDismiss(reportIds, g.targetId)}
                            disabled={actionLoading === g.targetId + "_dismiss"}
                            className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 transition"
                          >
                            ✓ Dismiss
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
