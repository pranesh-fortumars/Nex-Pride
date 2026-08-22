"use client";

import { useState, useEffect, useMemo } from "react";
import { JobListing } from "@/lib/types";
import { 
  Building2,
  MapPin,
  MessageCircle,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/utils";
import { isValid } from "date-fns";

interface JobCardProps {
  job: JobListing;
  isApplied?: boolean;
}

export function JobCard({ job, isApplied = false }: JobCardProps) {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isInterviewPassed = useMemo(() => {
    const targetDateVal = (job as any).interviewEndDate || (job as any).interviewStartDate;
    if (!targetDateVal) return false;
    try {
      const dateObj = targetDateVal.toDate ? targetDateVal.toDate() : new Date(targetDateVal);
      if (!isValid(dateObj)) return false;
      dateObj.setHours(23, 59, 59, 999);
      return new Date() > dateObj;
    } catch (e) {
      return false;
    }
  }, [(job as any).interviewStartDate, (job as any).interviewEndDate]);

  const handleWhatsappShare = (e: React.MouseEvent) => {
    e.preventDefault();
    const jobUrl = `${window.location.origin}/jobs/${job.jobId}`;
    const message = `📢 *Inclusion Job: ${job.jobTitle}*\n\n🏢 *Company:* ${job.companyName}\n📍 *Location:* ${t.locations[job.location as keyof typeof t.locations] || job.location}\n💰 *Salary:* ₹${job.salaryMin.toLocaleString()} – ₹${job.salaryMax.toLocaleString()}\n\n🔎 View details & apply at NexPride.in:\n${jobUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const translatedCategory = (t.categories as any)[job.category] || job.category;

  // Generate fallback initials avatar
  const initials = job.companyName
    ? job.companyName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '??';

  return (
    <div className={cn(
      "group flex flex-col justify-between bg-white rounded-2xl md:rounded-[24px] border border-slate-100 md:hover:border-slate-200 shadow-sm md:hover:shadow-xl md:hover:shadow-slate-200/50 transition-all duration-300 overflow-hidden relative",
      isInterviewPassed && "opacity-60 bg-slate-50/50"
    )}>
      <Link href={`/jobs/${job.jobId}`} className="absolute inset-0 z-0" />
      
      {/* Top Section */}
      <div className="p-3 md:p-6 pb-0 md:pb-6 relative z-10 pointer-events-none">
        <div className="flex justify-between items-start gap-2 md:gap-4 mb-2 md:mb-4">
          <div className={cn(
            "w-8 h-8 md:w-14 md:h-14 rounded-lg md:rounded-2xl bg-slate-50 flex items-center justify-center text-[#7C3AED] font-black text-xs md:text-lg border border-slate-100 overflow-hidden shrink-0",
            isInterviewPassed && "grayscale opacity-70"
          )}>
            {job.companyLogo ? (
              <img src={job.companyLogo} alt={job.companyName} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {isInterviewPassed && (
              <span className="bg-slate-200 text-slate-600 text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Interview Completed
              </span>
            )}
            <button
              className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-slate-400 md:hover:text-emerald-500 md:hover:bg-emerald-50 rounded-full transition-all shrink-0 active:scale-95"
              onClick={handleWhatsappShare}
              title="Share on WhatsApp"
            >
              <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        <div>
          <h3 className={cn(
            "text-sm md:text-xl font-black text-slate-900 md:group-hover:text-[#7C3AED] transition-colors line-clamp-2 leading-tight",
            isInterviewPassed && "text-slate-500 md:group-hover:text-slate-600"
          )}>
            {job.jobTitle}
          </h3>
          <div className="flex flex-wrap items-center gap-1 md:gap-1.5 text-slate-500 text-[10px] md:text-sm font-semibold mt-1.5 md:mt-2">
             <span className="truncate max-w-full">{job.companyName}</span>
             <span className="text-slate-300 hidden md:inline">&bull;</span>
             <span className={cn("text-[#7C3AED] hidden sm:inline", isInterviewPassed && "text-slate-400")}>{translatedCategory}</span>
             <span className="text-slate-300 hidden sm:inline">&bull;</span>
             <span className={cn("text-emerald-600 flex items-center gap-0.5 md:gap-1", isInterviewPassed && "text-slate-400")}>✦ Inclusive</span>
          </div>
        </div>

        {/* Clean Metadata Section */}
        <div className="flex flex-col gap-0.5 md:gap-2 mt-2 md:mt-6">
          <p className={cn("text-xs md:text-[15px] font-black text-slate-900", isInterviewPassed && "text-slate-500")}>
            ₹{Math.round(job.salaryMin/1000)}k – {Math.round(job.salaryMax/1000)}k
          </p>
          <p className={cn("hidden md:block text-xs md:text-sm font-semibold text-slate-500", isInterviewPassed && "text-slate-400")}>
            {job.experienceRequired !== undefined ? `${job.experienceRequired}+ Years` : "Fresher Friendly"}
          </p>
          <p className={cn("hidden md:block text-xs md:text-sm font-semibold text-slate-500", isInterviewPassed && "text-slate-400")}>
            {job.shiftTiming || "Flexible Timing"}
          </p>
          <p className={cn("text-[10px] md:text-sm font-semibold text-slate-500 flex items-center gap-1 md:gap-1.5 mt-0.5 md:mt-1 truncate", isInterviewPassed && "text-slate-400")}>
             <MapPin className="w-3 h-3 md:w-4 md:h-4 text-slate-400 shrink-0" /> {t.locations[job.location as keyof typeof t.locations] || job.location}
          </p>
        </div>
      </div>

      {/* Bottom Action Area */}
      <div className="p-3 md:p-6 pt-2 md:pt-0 mt-auto relative z-10 pointer-events-none">
        {isApplied ? (
          <div className="w-full h-8 md:h-12 flex items-center justify-center gap-1.5 md:gap-2 bg-emerald-50 text-emerald-600 font-bold rounded-lg md:rounded-xl text-xs md:text-base pointer-events-auto">
             <CheckCircle2 className="w-3.5 h-3.5 md:w-5 md:h-5" /> Applied
          </div>
        ) : (
          <div className="block w-full">
            <div className={cn(
              "w-full h-8 md:h-12 flex items-center justify-between px-2.5 md:px-6 bg-slate-50 md:hover:bg-[#7C3AED] text-slate-700 md:hover:text-white font-bold rounded-lg md:rounded-xl transition-all group/btn text-xs md:text-base cursor-pointer pointer-events-auto",
              isInterviewPassed && "bg-slate-100 text-slate-400 md:hover:bg-slate-200 md:hover:text-slate-600"
            )}
                 onClick={() => window.location.href = `/jobs/${job.jobId}`}
            >
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5 md:w-5 md:h-5 text-slate-400 md:group-hover/btn:text-white md:group-hover/btn:translate-x-1 transition-all" />
            </div>
          </div>
        )}
      </div>

    </div>
  );
}