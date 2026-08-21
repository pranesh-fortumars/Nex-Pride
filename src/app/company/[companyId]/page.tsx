"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { JobListing } from "@/lib/types";
import { JobCard } from "@/components/jobs/JobCard";
import { 
  Building2,
  MapPin,
  ChevronLeft,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Users,
  Briefcase,
  Globe,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useFirestore, useCollection, useAuth } from "@/firebase";
import { collection, query, where, getDoc, doc } from "firebase/firestore";
import { useLanguage } from "@/components/providers/LanguageProvider";

type PageProps = {
  params: Promise<{ companyId: string }>;
};

export default function CompanyProfilePage(props: PageProps) {
  const params = React.use(props.params);
  const { t } = useLanguage();
  const db = useFirestore();
  const auth = useAuth();
  
  const [company, setCompany] = useState<any>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);

  // Fetch Company Data
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const docSnap = await getDoc(doc(db, "Users", params.companyId));
        if (docSnap.exists()) {
          setCompany(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching company:", error);
      } finally {
        setLoadingCompany(false);
      }
    };
    fetchCompany();
  }, [db, params.companyId]);

  // Fetch Live Jobs for this Company
  const jobsQuery = useMemo(() => {
    return query(
      collection(db, "Jobs"),
      where("employerId", "==", params.companyId),
      where("status", "==", "approved")
    );
  }, [db, params.companyId]);
  
  const { data: liveJobs, loading: jobsLoading } = useCollection<JobListing>(jobsQuery as any);

  // Fetch User Applications to mark "Applied" status
  const appsQuery = useMemo(() => {
    if (!auth.currentUser) return null;
    return query(collection(db, "Applications"), where("jobSeekerId", "==", auth.currentUser.uid));
  }, [db, auth.currentUser]);
  const { data: userApps } = useCollection<any>(appsQuery);

  const appliedJobIds = useMemo(() => {
    if (!userApps) return new Set<string>();
    return new Set(userApps.map(app => app.jobId));
  }, [userApps]);

  const activeJobs = useMemo(() => {
    return (liveJobs || []).map(j => ({
      ...j,
      jobId: j.jobId || (j as any).id,
      createdAt: j.createdAt || new Date(0).toISOString()
    })).sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  }, [liveJobs]);

  if (loadingCompany) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#7C3AED] animate-spin" />
          <p className="font-bold text-slate-500">Loading Company Profile...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm">
             <Building2 className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">Company Not Found</h3>
          <p className="text-slate-500 font-medium">This employer profile does not exist or has been removed.</p>
          <Link href="/jobs">
            <Button className="mt-4 rounded-xl font-bold bg-[#7C3AED] hover:bg-[#6D28D9] text-white">Back to Jobs</Button>
          </Link>
        </div>
      </div>
    );
  }

  const allPhotos = [...(company.photos?.inside || []), ...(company.photos?.outside || [])];
  const initials = (company.companyName || company.name || "")
    ? (company.companyName || company.name).split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
    : '??';

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col">
      <Header />
      <main className="flex-grow pb-24">
        
        {/* LINKEDIN STYLE HERO SECTION */}
        <div className="max-w-[1200px] mx-auto mt-0 md:mt-6 mb-8 px-0 md:px-4">
          <div className="bg-white md:rounded-[32px] overflow-visible shadow-sm border-x border-b md:border border-slate-200">
            
            {/* COVER IMAGE - Top Full Width */}
            <div className="w-full h-[200px] md:h-[260px] bg-[#E2E8F0] md:rounded-t-[32px] overflow-hidden relative">
               {allPhotos.length > 0 ? (
                 <img src={allPhotos[0]} alt="Workspace Cover" className="w-full h-full object-cover object-center" />
               ) : (
                 <div className="absolute inset-0 bg-gradient-to-r from-slate-200 to-slate-300" />
               )}
            </div>

            {/* COMPANY METADATA CONTAINER */}
            <div className="px-6 md:px-10 pb-10 relative">
               {/* OVERLAPPING LOGO */}
               <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-white flex items-center justify-center text-slate-400 font-black text-4xl shadow-xl border-4 border-white absolute -top-16 md:-top-20 z-10 overflow-hidden">
                 {company.logo || company.companyLogo ? (
                   <img src={company.logo || company.companyLogo} alt={company.companyName || company.name} className="w-full h-full object-contain bg-white p-2" />
                 ) : (
                   initials
                 )}
               </div>

               {/* BUTTONS (RIGHT ALIGNED ON DESKTOP) */}
               <div className="flex justify-end pt-4 pb-2 md:pb-0 md:absolute md:right-10 md:top-6 gap-3">
                  <Button variant="outline" className="rounded-full font-bold border-slate-300 hover:bg-slate-50 text-slate-700">
                    <Globe className="w-4 h-4 mr-2 text-slate-400"/> Visit Website
                  </Button>
                  <Button className="rounded-full font-bold bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
                    <Plus className="w-4 h-4 mr-1"/> Follow
                  </Button>
               </div>

               {/* METADATA CONTENT */}
               <div className="mt-24 md:mt-28 max-w-3xl">
                 <div className="flex items-center gap-3 mb-2 flex-wrap">
                   <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                     {company.companyName || company.name}
                   </h1>
                   <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none px-3 py-1 font-bold rounded-full">
                     ✓ Verified Employer
                   </Badge>
                 </div>
                 
                 <p className="text-lg font-semibold text-slate-600 mb-4">
                   {company.industry || "Business Services"}
                 </p>
                 
                 <div className="flex items-center gap-x-6 gap-y-2 flex-wrap text-sm font-semibold text-slate-500">
                   {company.headquarters && (
                     <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-slate-400"/> {company.headquarters}
                     </span>
                    )}
                    {company.size && (
                      <span className="flex items-center gap-1.5">
                         <Users className="w-4 h-4 text-slate-400"/> {company.size}
                      </span>
                    )}
                    {activeJobs.length > 0 && (
                      <span className="flex items-center gap-1.5 text-[#7C3AED]">
                         <Briefcase className="w-4 h-4 text-[#7C3AED]"/> {activeJobs.length} Open Position{activeJobs.length !== 1 && 's'}
                      </span>
                    )}
                 </div>
               </div>

            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="max-w-[1200px] mx-auto px-4 md:px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8 items-start">
            
            {/* LEFT COLUMN: ABOUT & GALLERY */}
            <div className="space-y-8 w-full min-w-0">
               
               {/* About Company */}
               <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-200 w-full">
                 <h2 className="text-2xl font-black text-slate-900 mb-6">About the Company</h2>
                 
                 {/* Structured Metadata Grid — only show if data exists */}
                 {(company.foundedYear || company.industry || company.size || company.headquarters) && (
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 pb-8 border-b border-slate-100">
                     {company.foundedYear && (
                       <div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Founded</p>
                         <p className="text-sm font-black text-slate-900">{company.foundedYear}</p>
                       </div>
                     )}
                     {company.industry && (
                       <div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Industry</p>
                         <p className="text-sm font-black text-slate-900">{company.industry}</p>
                       </div>
                     )}
                     {company.size && (
                       <div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Company Size</p>
                         <p className="text-sm font-black text-slate-900">{company.size}</p>
                       </div>
                     )}
                     {company.headquarters && (
                       <div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Location</p>
                         <p className="text-sm font-black text-slate-900">{company.headquarters}</p>
                       </div>
                     )}
                   </div>
                 )}

                 {company.description ? (
                   <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-line text-[16px]">
                     {company.description}
                   </div>
                 ) : (
                   <div className="text-center py-8 text-slate-400">
                     <p className="font-semibold">No description added yet.</p>
                     <p className="text-sm mt-1">The employer can add a company description from their profile settings.</p>
                   </div>
                 )}
               </div>

               {/* Workspace Gallery */}
               {allPhotos.length > 0 && (
                 <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-200 w-full">
                    <h2 className="text-2xl font-black text-slate-900 mb-6">Workspace Gallery</h2>
                    {(() => {
                      const photos = allPhotos.slice(0, 5);
                      if (photos.length === 1) {
                         return (
                           <div className="rounded-xl overflow-hidden bg-slate-100 w-full aspect-video">
                              <img src={photos[0]} className="w-full h-full object-cover" alt="Workspace" />
                           </div>
                         );
                      } else if (photos.length === 2) {
                         return (
                           <div className="grid grid-cols-2 gap-4">
                             {photos.map((img: string, idx: number) => (
                               <div key={idx} className="rounded-xl overflow-hidden bg-slate-100 w-full aspect-video">
                                 <img src={img} className="w-full h-full object-cover" alt={`Workspace ${idx+1}`} />
                               </div>
                             ))}
                           </div>
                         );
                      } else {
                         return (
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                             {photos.map((img: string, idx: number) => {
                               const isHeroImage = idx === 0;
                               return (
                                 <div key={idx} className={`rounded-xl overflow-hidden bg-slate-100 ${isHeroImage ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1 aspect-square'}`}>
                                   <img src={img} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" alt={`Workspace ${idx+1}`} />
                                 </div>
                               );
                             })}
                           </div>
                         );
                      }
                    })()}
                 </div>
               )}
            </div>

            {/* RIGHT COLUMN: OPEN ROLES */}
            <div className="sticky top-24 space-y-4 w-full min-w-0">
               <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 mb-2">
                 Open Roles
                 <Badge className="bg-purple-100 text-[#7C3AED] hover:bg-purple-200 border-none px-2 py-0.5">{activeJobs.length}</Badge>
               </h2>
               
               {jobsLoading ? (
                 <div className="bg-white rounded-[24px] p-12 shadow-sm border border-slate-200 flex flex-col items-center justify-center space-y-4">
                   <Loader2 className="w-8 h-8 text-[#7C3AED] animate-spin" />
                 </div>
               ) : activeJobs.length > 0 ? (
                 <div className="flex flex-col gap-4">
                   {activeJobs.map((job) => (
                     <JobCard key={job.jobId} job={job} isApplied={appliedJobIds.has(job.jobId)} />
                   ))}
                 </div>
               ) : (
                 <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-200 flex flex-col items-center text-center space-y-3">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-2">
                       <Briefcase className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No Open Positions</h3>
                    <p className="text-sm text-slate-500">This company currently does not have any active job listings.</p>
                 </div>
               )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
