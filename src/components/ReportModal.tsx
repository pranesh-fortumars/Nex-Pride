"use client";
import { useState } from "react";
import { initializeFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const REPORT_REASONS = {
  user: [
    "Fake profile / false information",
    "Abusive or harassing behavior",
    "Spam or irrelevant applications",
    "Discriminatory behavior",
    "Fraudulent activity",
    "Other"
  ],
  company: [
    "Fake job posting",
    "Asking for payment",
    "Discriminatory hiring",
    "Misleading job description",
    "Abusive communication",
    "Other"
  ]
};

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reporterType: "user" | "company";
  reporterId: string;
  targetType: "user" | "company";
  targetId: string;
  targetName: string;
}

export default function ReportModal({ 
  isOpen, 
  onClose, 
  reporterType,
  reporterId,
  targetType,
  targetId,
  targetName
}: ReportModalProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason) return alert("Please select a reason");
    setLoading(true);
    try {
      const { firestore: db } = initializeFirebase();
      await addDoc(collection(db, "reports"), {
        reporterType,
        reporterId,
        targetType,
        targetId,
        targetName,
        reason,
        description,
        status: "pending",
        createdAt: serverTimestamp()
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Failed to submit report. Try again.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        {submitted ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Report Submitted</h3>
            <p className="text-sm text-gray-500">
              Our team will review this report within 24 hours. Thank you for keeping NexPride safe.
            </p>
            <button 
              onClick={onClose}
              className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-semibold"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Report {targetType === "company" ? "Company" : "User"}</h3>
                <p className="text-sm text-gray-500">{targetName}</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                >
                  <option value="">Select a reason...</option>
                  {REPORT_REASONS[targetType].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Details <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe what happened..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !reason}
                  className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {loading ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
