"use client";
import { useState } from "react";
import { initializeFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";

interface ExistingPhotos {
  logo?: string;
  inside?: string[];
  outside?: string[];
}

interface CompanyPhotoUploadProps {
  companyId: string;
  existingPhotos?: ExistingPhotos;
  onComplete: () => void;
}

export default function CompanyPhotoUpload({ companyId, existingPhotos = {}, onComplete }: CompanyPhotoUploadProps) {
  const [logo, setLogo] = useState(existingPhotos.logo || "");
  const [insideUrl, setInsideUrl] = useState(existingPhotos.inside?.[0] || "");
  const [outsideUrl, setOutsideUrl] = useState(existingPhotos.outside?.[0] || "");
  const [saving, setSaving] = useState(false);

  const isComplete = logo.trim() && insideUrl.trim() && outsideUrl.trim();

  const handleSave = async () => {
    if (!isComplete) return;
    setSaving(true);
    try {
      const { firestore: db } = initializeFirebase();
      const photoData = {
        logo: logo.trim(),
        companyLogo: logo.trim(),
        photos: {
          inside: [insideUrl.trim()],
          outside: [outsideUrl.trim()]
        },
        companyPhotos: {
          inside: [insideUrl.trim()],
          outside: [outsideUrl.trim()]
        }
      };

      // Save to companies collection (read by job details page)
      await setDoc(doc(db, "companies", companyId), {
        logo: photoData.logo,
        photos: photoData.photos
      }, { merge: true });

      // Save to Users collection (read by employer post-job check)
      await setDoc(doc(db, "Users", companyId), {
        companyLogo: photoData.companyLogo,
        companyPhotos: photoData.companyPhotos
      }, { merge: true });

      onComplete();
    } catch (err) {
      console.error("Error saving photos:", err);
      alert("Failed to save. Please check console.");
    }
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
      <div>
        <h3 className="font-bold text-gray-800 text-lg">Company Photos (Using URLs)</h3>
        <p className="text-sm text-gray-400 mt-0.5">Required before you can post jobs</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">Company Logo URL <span className="text-red-500">*</span></label>
          <input
            type="url"
            value={logo}
            onChange={e => setLogo(e.target.value)}
            placeholder="https://example.com/logo.png"
            className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-400"
          />
          {logo && <img src={logo} alt="Logo Preview" className="h-16 mt-2 object-contain rounded-lg border border-gray-100" />}
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">Inside Office Photo URL <span className="text-red-500">*</span></label>
          <input
            type="url"
            value={insideUrl}
            onChange={e => setInsideUrl(e.target.value)}
            placeholder="https://example.com/inside.jpg"
            className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-400"
          />
          {insideUrl && <img src={insideUrl} alt="Inside Preview" className="h-16 mt-2 object-cover rounded-lg border border-gray-100" />}
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">Outside Building Photo URL <span className="text-red-500">*</span></label>
          <input
            type="url"
            value={outsideUrl}
            onChange={e => setOutsideUrl(e.target.value)}
            placeholder="https://example.com/outside.jpg"
            className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-400"
          />
          {outsideUrl && <img src={outsideUrl} alt="Outside Preview" className="h-16 mt-2 object-cover rounded-lg border border-gray-100" />}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={!isComplete || saving}
        className={`w-full py-3 rounded-xl font-semibold transition ${isComplete && !saving ? "bg-purple-600 text-white hover:bg-purple-700" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
      >
        {saving ? "Saving..." : "✓ Save & Continue to Post Job"}
      </button>

      {!isComplete && (
        <div className="bg-blue-50 text-blue-600 text-sm px-4 py-3 rounded-xl">
          ℹ️ Please provide valid URLs for all required images.
        </div>
      )}
    </div>
  );
}
