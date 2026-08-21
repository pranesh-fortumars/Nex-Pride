"use client";
import { useState } from "react";

interface CompanyPhotosCarouselProps {
  logo?: string;
  insidePhotos?: string[];
  outsidePhotos?: string[];
  companyName?: string;
}

export default function CompanyPhotosCarousel({ 
  logo, 
  insidePhotos = [], 
  outsidePhotos = [], 
  companyName 
}: CompanyPhotosCarouselProps) {
  const [activeTab, setActiveTab] = useState<"inside" | "outside">("inside");
  const [lightbox, setLightbox] = useState<string | null>(null);

  const photos = activeTab === "inside" ? insidePhotos : outsidePhotos;

  if (!insidePhotos.length && !outsidePhotos.length) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        {logo && (
          <img src={logo} alt={companyName} className="w-10 h-10 rounded-xl object-contain border border-gray-100" />
        )}
        <div>
          <h3 className="font-bold text-gray-800">Company Workspace</h3>
          <p className="text-xs text-gray-400">{insidePhotos.length + outsidePhotos.length} photos</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setActiveTab("inside")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
            activeTab === "inside"
              ? "bg-purple-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          🏢 Inside ({insidePhotos.length})
        </button>
        <button
          onClick={() => setActiveTab("outside")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
            activeTab === "outside"
              ? "bg-purple-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          🏙️ Outside ({outsidePhotos.length})
        </button>
      </div>

      {/* Photo Grid */}
      {photos.length === 0 ? (
        <div className="text-center py-6 text-sm text-gray-400">
          No {activeTab} photos available
        </div>
      ) : (
        <div className={`grid gap-2 ${
          photos.length === 1 ? "grid-cols-1" :
          photos.length === 2 ? "grid-cols-2" :
          photos.length === 3 ? "grid-cols-3" :
          "grid-cols-2"
        }`}>
          {photos.map((url, i) => (
            <div
              key={i}
              onClick={() => setLightbox(url)}
              className={`relative overflow-hidden rounded-xl cursor-pointer group w-full ${
                photos.length === 1 ? "h-[250px] md:h-[400px]" :
                photos.length === 4 && i === 0 ? "col-span-2 row-span-2 aspect-video" : "aspect-video"
              }`}
            >
              <img
                src={url}
                alt={`${activeTab} ${i + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              <span className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-0.5 rounded-full">
                {activeTab === "inside" ? "🏢" : "🏙️"} {i + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="Expanded view"
            className="max-w-3xl w-full max-h-[80vh] object-contain rounded-xl"
          />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white text-2xl bg-white/20 w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/30 transition"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
