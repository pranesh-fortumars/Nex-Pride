
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import ReportModal from "@/components/ReportModal";
import CompanyPhotosCarousel from "@/components/CompanyPhotosCarousel";
import { initializeFirebase } from "@/firebase";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  MapPin, 
  IndianRupee, 
  Briefcase, 
  Clock, 
  ChevronLeft, 
  Building2, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Phone,
  MessageCircle,
  User,
  Info,
  Tags,
  Flag,
  Calendar as CalendarIcon,
  AlertTriangle,
  Navigation,
  Heart,
  Bus,
  Coffee,
  FileText,
  UserCheck,
  Eye,
  Camera,
  ShieldAlert,
  Smartphone,
  ExternalLink,
  Search,
  Zap,
  Lock,
  UserCircle,
  Loader2,
  Home,
  ShoppingBag,
  ChevronRight,
  Rocket,
  Share2
} from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import Link from "next/link";
import { JobListing } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { cn, formatCompactNumber } from "@/lib/utils";
import { useFirestore, useDoc, useAuth, useUser } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp, query, where, getDocs, getDoc, updateDoc, increment, setDoc } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { format, isValid } from "date-fns";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function JobDetailsPage(props: { params: Promise<{ jobId: string }> }) {
  const params = React.use(props.params);
  const jobId = params.jobId;
  const { t } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  
  const jobRef = useMemo(() => doc(db, "Jobs", jobId), [db, jobId]);
  const { data: job, loading: jobLoading } = useDoc<any>(jobRef);

  const currentUserRef = useMemo(() => user ? doc(db, "Users", user.uid) : null, [db, user]);
  const { data: currentUserProfile, loading: profileLoading } = useDoc<any>(currentUserRef);

  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isOwner = useMemo(() => user?.uid && job?.employerId ? user.uid === job.employerId : false, [user, job]);
  const isAdmin = useMemo(() => currentUserProfile?.role === 'admin', [currentUserProfile]);
  const isSeeker = useMemo(() => currentUserProfile?.role === 'job_seeker', [currentUserProfile]);

  // Mandatory Profile Check State
  const [isProfileRequiredOpen, setIsProfileRequiredOpen] = useState(false);
  const [isSafetyInfoOpen, setIsSafetyInfoOpen] = useState(false);

  // Reporting State
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportCenterType, setReportCenterType] = useState<"job" | "employer" | "candidate">("job");
  const [reportCenterDesc, setReportCenterDesc] = useState("");
  const [reportScreenshot, setReportScreenshot] = useState("");

  const [showReport, setShowReport] = useState(false);
  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    if (job?.employerId) {
      const fetchCompany = async () => {
        try {
          const { firestore: db } = initializeFirebase();
          const docSnap = await getDoc(doc(db, "companies", job.employerId));
          if (docSnap.exists()) setCompany(docSnap.data());
        } catch (e) {
          console.error(e);
        }
      }
      fetchCompany();
    }
  }, [job]);


  const [applyEmail, setApplyEmail] = useState("");

  useEffect(() => {
    if (user?.email) {
      setApplyEmail(user.email);
    }
  }, [user]);

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReportScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenReport = (type: "job" | "employer" | "candidate") => {
    if (!user) {
      toast({ title: "Login Required", description: "Please sign in to submit a report." });
      router.push("/auth/login");
      return;
    }
    setReportCenterType(type);
    setReportReason("");
    setReportCenterDesc("");
    setReportScreenshot("");
    setIsReportDialogOpen(true);
  };

  const getReasons = () => {
    if (reportCenterType === "job") {
      return ["Fake Job", "Asking Money", "Wrong Salary", "Spam Posting", "Duplicate Listing", "Other"];
    } else if (reportCenterType === "employer") {
      return ["Fraud", "Fake Factory", "Harassment", "Misleading Information", "Other"];
    } else {
      return ["Fake Profile", "Fake Documents", "Harassment", "Spam Application", "Other"];
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Tracking Logic
  useEffect(() => {
    if (jobId && job && mounted && db) {
      const trackView = async () => {
        if (isOwner || isAdmin) return;

        const localKey = `viewed_job_${jobId}`;
        const locallyViewed = localStorage.getItem(localKey);
        
        if (user && isSeeker) {
          const viewDetailRef = doc(db, "Jobs", jobId, "Views", user.uid);
          try {
            const viewSnapshot = await getDoc(viewDetailRef);
            if (!viewSnapshot.exists()) {
              await setDoc(viewDetailRef, {
                userId: user.uid,
                name: currentUserProfile?.name || "Registered Seeker",
                email: user.email || currentUserProfile?.email || "N/A",
                phone: currentUserProfile?.phone || user.phoneNumber || "N/A",
                viewedAt: serverTimestamp()
              });
              
              const docRef = doc(db, "Jobs", jobId);
              await updateDoc(docRef, { views: increment(1) });
              localStorage.setItem(localKey, 'true');
            }
          } catch (err) {
            console.debug("View tracking failed", err);
          }
        } else if (!user) {
          if (!locallyViewed) {
            const docRef = doc(db, "Jobs", jobId);
            updateDoc(docRef, { views: increment(1) }).catch(err => console.debug("Guest view skip", err));
            localStorage.setItem(localKey, 'true');
          }
        }
      };
      
      trackView();
    }
  }, [jobId, job, mounted, db, user, currentUserProfile, isOwner, isAdmin, isSeeker]);

  // Check if already applied
  useEffect(() => {
    if (user && job) {
      const checkApplied = async () => {
        const appsRef = collection(db, "Applications");
        const q = query(appsRef, where("jobId", "==", jobId), where("jobSeekerId", "==", user.uid));
        const snap = await getDocs(q);
        if (!snap.empty) setApplied(true);
      };
      checkApplied();
    }
  }, [user, job, db, jobId]);

  // Check if interview date has passed
  const isInterviewPassed = useMemo(() => {
    const targetDateVal = job?.interviewEndDate || job?.interviewStartDate;
    if (!targetDateVal) return false;
    try {
      const dateObj = targetDateVal.toDate ? targetDateVal.toDate() : new Date(targetDateVal);
      if (!isValid(dateObj)) return false;
      dateObj.setHours(23, 59, 59, 999);
      return new Date() > dateObj;
    } catch (e) {
      return false;
    }
  }, [job?.interviewStartDate, job?.interviewEndDate]);

  const interviewDateText = useMemo(() => {
    if (!job?.interviewStartDate) return null;
    try {
      const dateVal = job.interviewStartDate;
      const dateObj = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
      if (!isValid(dateObj)) return null;

      const start = format(dateObj, "dd MMM");
      if (!job.interviewEndDate) return start;
      const endDateVal = job.interviewEndDate;
      const endDateObj = endDateVal.toDate ? endDateVal.toDate() : new Date(endDateVal);
      if (!isValid(endDateObj) || endDateObj.getTime() === dateObj.getTime()) return start;
      return `${start} to ${format(endDateObj, "dd MMM yyyy")}`;
    } catch (e) {
      return null;
    }
  }, [job?.interviewStartDate, job?.interviewEndDate]);

  // PROTECTION
  useEffect(() => {
    if (!jobLoading && job && job.status !== 'approved') {
      if (!isOwner && !isAdmin) {
        router.push('/jobs');
      }
    }
  }, [job, jobLoading, router, isOwner, isAdmin]);

  const handleApply = () => {
    if (!user) {
      toast({ title: "Login Required" });
      router.push("/auth/login");
      return;
    }
    if (profileLoading) return;
    if (currentUserProfile?.role === 'employer' || currentUserProfile?.role === 'admin') {
      toast({ variant: "destructive", title: "Action Denied" });
      return;
    }
    if (!currentUserProfile?.onboarded) {
      setIsProfileRequiredOpen(true);
      return;
    }

    setApplying(true);
    const appData = {
      jobId: jobId,
      jobSeekerId: user.uid,
      employerId: job.employerId || "unknown",
      status: 'applied',
      appliedAt: serverTimestamp(),
      jobTitle: job.jobTitle || "Industrial Role",
      companyName: job.companyName || "Verified Factory",
      seekerName: currentUserProfile.name || "User",
      phone: currentUserProfile.phone || user.phoneNumber || "",
      experience: currentUserProfile.experience || currentUserProfile.digitalResume?.professional?.totalExperience || "0"
    };

    const appsRef = collection(db, "Applications");
    addDoc(appsRef, appData)
      .then(() => {
        setApplied(true);
        toast({ title: t.applySuccess });
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: appsRef.path,
          operation: 'create',
          requestResourceData: appData,
        }));
      })
      .finally(() => setApplying(false));
  };

  const handleEmailContinue = () => {
    if (!applyEmail || !applyEmail.includes("@")) {
      toast({ variant: "destructive", title: "Invalid Email", description: "Please enter a valid email address." });
      return;
    }
    if (user) {
      handleApply();
    } else {
      router.push(`/auth/signup?email=${encodeURIComponent(applyEmail)}`);
    }
  };

  const handleReportSubmit = () => {
    if (!user) {
      toast({ title: "Login Required" });
      router.push("/auth/login");
      return;
    }
    if (!reportReason) {
      toast({ variant: "destructive", title: "Reason Required" });
      return;
    }

    setReporting(true);
    const reportData = {
      targetId: reportCenterType === "job" ? jobId : reportCenterType === "employer" ? (job.employerId || "unknown") : (user.uid === job.employerId ? "seeker_id_placeholder" : job.employerId),
      targetName: reportCenterType === "job" ? job.jobTitle : reportCenterType === "employer" ? (job.companyName || "Employer") : "Candidate Profile",
      targetType: reportCenterType,
      reason: reportReason,
      description: reportCenterDesc,
      screenshot: reportScreenshot || null,
      reportedById: user.uid,
      reportedByName: currentUserProfile?.name || "Registered User",
      reportedByPhone: currentUserProfile?.phone || user.phoneNumber || "N/A",
      status: "pending",
      createdAt: serverTimestamp()
    };

    addDoc(collection(db, "Reports"), reportData)
      .then(() => {
        toast({ title: "Report submitted successfully. Our Safety Team will review this incident." });
        setIsReportDialogOpen(false);
        setReportReason("");
        setReportCenterDesc("");
        setReportScreenshot("");
      })
      .catch((err) => {
        console.error("Report submit error:", err);
        toast({ variant: "destructive", title: "Error submitting report" });
      })
      .finally(() => setReporting(false));
  };

  if (jobLoading) return <div className="min-h-screen flex items-center justify-center font-bold"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!job) return <div className="min-h-screen flex items-center justify-center font-bold">Job Not Found</div>;

  const benefits = job.benefits || {};
  const salaryUnit = job.salaryBasis === 'shift' ? t.perShift : job.salaryBasis === 'piece' ? t.perPiece : t.perMonth;

  const initials = job.companyName
    ? job.companyName.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
    : '??';

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col">
      <Header />
      <main className="flex-grow pb-24">
        
        {/* PREMIUM HERO SECTION */}
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 mt-4 md:mt-6 mb-8 md:mb-[100px]">
          <div className="relative bg-white min-h-[460px] rounded-[24px] md:rounded-[32px] overflow-visible shadow-sm border border-slate-100 flex flex-col lg:flex-row w-full">
            
            {/* Background Image restricted to right side on desktop */}
            <div className="absolute inset-y-0 right-0 z-0 w-full lg:w-[55%] rounded-[24px] md:rounded-[32px] lg:rounded-l-none overflow-hidden">
               {/* Smooth blend on desktop, dim overlay on mobile */}
               <div className="absolute inset-0 bg-gradient-to-r from-white via-white/20 to-transparent z-10 hidden lg:block" />
               <div className="absolute inset-0 bg-white/85 z-10 lg:hidden" />
               {(company?.photos?.inside?.length > 0 || company?.photos?.outside?.length > 0) ? (
                 <img src={company.photos.inside?.[0] || company.photos.outside?.[0]} alt="Workspace" className="w-full h-full object-cover object-center" />
               ) : (
                 <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                   <Building2 className="w-32 h-32 text-slate-200" />
                 </div>
               )}
            </div>

            {/* Left Side Content (60%) */}
            <div className="w-full lg:w-[60%] z-10 relative px-4 md:px-12 py-6 md:py-8 flex flex-col justify-center h-full">
               <Link href="/jobs" className="inline-flex items-center text-slate-500 hover:text-slate-900 font-bold transition-colors mb-6">
                <ChevronLeft className="w-5 h-5 mr-1" /> {t.backToJobs}
               </Link>
              
              <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-[12px] md:rounded-[16px] bg-white flex items-center justify-center text-slate-400 font-black text-xl md:text-2xl shadow-sm overflow-hidden shrink-0 border border-slate-100 p-1">
                  {job.companyLogo ? (
                    <img src={job.companyLogo} alt={job.companyName} className="w-full h-full object-contain bg-white" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="flex flex-col">
                   <h2 className="text-xl md:text-2xl font-black text-slate-800 leading-none">{job.companyName}</h2>
                   <p className="text-xs md:text-sm font-bold text-slate-500 mt-1">{job.department || "Business Services"}</p>
                </div>
              </div>
              
              <h1 className="text-3xl md:text-[56px] font-black text-slate-900 tracking-tight leading-[1.1] mb-4 md:mb-6">
                {job.jobTitle}
              </h1>

              <div className="flex items-center gap-2 mb-6 md:mb-8 flex-wrap">
                   <span className="inline-flex items-center gap-1 md:gap-1.5 bg-slate-100/80 backdrop-blur-sm border border-slate-200/60 px-2.5 py-1.5 md:px-3 rounded-lg md:rounded-[10px] text-xs md:text-sm font-bold text-slate-700">
                      <MapPin className="w-3 h-3 md:w-4 md:h-4 text-slate-500"/> {t.locations[job.location as keyof typeof t.locations] || job.location}
                   </span>
                   <span className="inline-flex items-center gap-1 md:gap-1.5 bg-slate-100/80 backdrop-blur-sm border border-slate-200/60 px-2.5 py-1.5 md:px-3 rounded-lg md:rounded-[10px] text-xs md:text-sm font-bold text-slate-700">
                      <Briefcase className="w-3 h-3 md:w-4 md:h-4 text-slate-500"/> {job.workType}
                   </span>
                   <span className="inline-flex items-center gap-1 md:gap-1.5 bg-emerald-50/80 backdrop-blur-sm border border-emerald-200/60 px-2.5 py-1.5 md:px-3 rounded-lg md:rounded-[10px] text-xs md:text-sm font-bold text-emerald-700">
                      <IndianRupee className="w-3 h-3 md:w-4 md:h-4 text-emerald-600"/> ₹{job.salaryMin?.toLocaleString()} - ₹{job.salaryMax?.toLocaleString()}
                   </span>
                   <span className="inline-flex items-center gap-1 md:gap-1.5 bg-blue-50/80 backdrop-blur-sm border border-blue-200/60 px-2.5 py-1.5 md:px-3 rounded-lg md:rounded-[10px] text-xs md:text-sm font-bold text-blue-700">
                      <Users className="w-3 h-3 md:w-4 md:h-4 text-blue-600"/> {job.openings} Vacanc{job.openings > 1 ? 'ies' : 'y'}
                   </span>
              </div>

              {/* CTA directly under the details */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  {applied ? (
                    <Button disabled className="h-14 px-8 bg-emerald-500 text-white font-bold text-lg rounded-xl flex items-center gap-2 shadow-lg">
                      <CheckCircle2 className="w-6 h-6" /> {t.alreadyApplied}
                    </Button>
                  ) : (
                    <Button disabled={applying || job.status !== 'approved'} onClick={handleApply} className="h-14 px-8 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-lg rounded-xl shadow-[0_8px_20px_-8px_rgba(124,58,237,0.5)] flex items-center gap-2 transition-all hover:-translate-y-0.5">
                      {applying ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Express Interest <ArrowRight className="w-5 h-5" /></>}
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-wide ml-1 mt-1">
                   <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Quick Apply</span>
                   <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> No Registration Fee</span>
                </div>
              </div>
            </div>

            {/* FLOATING INFORMATION CARD - Vertical on mobile, horizontal absolute on desktop */}
            <div className="relative md:absolute left-0 right-0 md:-bottom-[60px] flex justify-center z-20 px-4 md:px-4 mt-6 md:mt-0 pb-6 md:pb-0">
               <Card className="bg-white rounded-[24px] shadow-xl shadow-slate-200/50 border border-slate-100 h-auto md:h-[120px] w-full max-w-[1000px] flex items-center overflow-hidden">
                 <div className="flex flex-col md:flex-row items-stretch md:items-center w-full divide-y md:divide-y-0 md:divide-x divide-slate-100 min-w-0 md:min-w-[700px]">
                   
                   {/* Salary */}
                   <div className={cn("flex-1 px-4 py-4 md:px-8 md:py-0 flex items-center gap-4 justify-start transition-opacity", isInterviewPassed && "opacity-40 grayscale-[50%]")}>
                     <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0", isInterviewPassed ? "bg-slate-100 text-slate-400" : "bg-emerald-50 text-emerald-500")}><IndianRupee className="w-4 h-4 md:w-5 md:h-5" /></div>
                     <div>
                       <p className={cn("text-[10px] md:text-xs font-bold uppercase tracking-widest", isInterviewPassed ? "text-slate-400" : "text-slate-500")}>Salary</p>
                       <p className={cn("text-base md:text-lg font-black mt-0.5 truncate", isInterviewPassed ? "text-slate-400 line-through" : "text-slate-900")}>₹{job.salaryMin?.toLocaleString()} - ₹{job.salaryMax?.toLocaleString()}</p>
                     </div>
                   </div>

                   {/* Interview */}
                   <div className="flex-1 px-4 py-4 md:px-8 md:py-0 flex items-center gap-4 justify-start">
                     <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0", isInterviewPassed ? "bg-emerald-100 text-emerald-600" : "bg-amber-50 text-amber-500")}>
                       {isInterviewPassed ? <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" /> : <CalendarIcon className="w-4 h-4 md:w-5 md:h-5" />}
                     </div>
                     <div>
                       <div className="flex items-center gap-1.5">
                         <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Interview</p>
                         {isInterviewPassed && (
                           <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide">Completed</span>
                         )}
                       </div>
                       <p className={cn("text-base md:text-lg font-black mt-0.5 truncate", isInterviewPassed ? "text-emerald-700" : "text-slate-900")}>
                         {interviewDateText ? `${interviewDateText}${job.interviewTimings ? ` at ${job.interviewTimings}` : ''}` : "Flexible"}
                       </p>
                     </div>
                   </div>

                   {/* Experience */}
                   <div className={cn("flex-1 px-4 py-4 md:px-8 md:py-0 flex items-center gap-4 justify-start transition-opacity", isInterviewPassed && "opacity-40 grayscale-[50%]")}>
                     <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0", isInterviewPassed ? "bg-slate-100 text-slate-400" : "bg-blue-50 text-blue-500")}><UserCheck className="w-4 h-4 md:w-5 md:h-5" /></div>
                     <div>
                       <p className={cn("text-[10px] md:text-xs font-bold uppercase tracking-widest", isInterviewPassed ? "text-slate-400" : "text-slate-500")}>Experience</p>
                       <p className={cn("text-base md:text-lg font-black mt-0.5 truncate", isInterviewPassed ? "text-slate-400" : "text-slate-900")}>{job.experienceRequired}+ Years</p>
                     </div>
                   </div>

                   {/* Vacancies */}
                   <div className={cn("flex-1 px-4 py-4 md:px-8 md:py-0 flex items-center gap-4 justify-start transition-opacity", isInterviewPassed && "opacity-40 grayscale-[50%]")}>
                     <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0", isInterviewPassed ? "bg-slate-100 text-slate-400" : "bg-purple-50 text-purple-500")}><Users className="w-4 h-4 md:w-5 md:h-5" /></div>
                     <div>
                       <p className={cn("text-[10px] md:text-xs font-bold uppercase tracking-widest", isInterviewPassed ? "text-slate-400" : "text-slate-500")}>Vacancies</p>
                       <p className={cn("text-base md:text-lg font-black mt-0.5 truncate", isInterviewPassed ? "text-slate-400" : "text-slate-900")}>{job.openings} Openings</p>
                     </div>
                   </div>

                 </div>
               </Card>
            </div>
          </div>

        </div>

        {/* MAIN CONTENT */}
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-8 items-start">
            
            {/* LEFT COLUMN */}
            <div className="space-y-10 w-full min-w-0">
               
               {/* 1. About this Job */}
               <section className="space-y-4">
                 <h2 className="text-2xl font-black text-slate-900">About this Job</h2>
                 <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 w-full">
                   {/* Industrial details inline */}
                   <div className="flex flex-wrap gap-3 mb-6 pb-6 border-b border-slate-100">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 text-sm font-semibold border border-slate-100"><Tags className="w-4 h-4"/> {job.category}</span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 text-sm font-semibold border border-slate-100"><Briefcase className="w-4 h-4"/> {job.department}</span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 text-sm font-semibold border border-slate-100"><Zap className="w-4 h-4 text-amber-500"/> {job.designation}</span>
                   </div>
                   <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-line text-[15px]">
                     {job.description || "No detailed description provided."}
                   </div>
                 </div>
               </section>

               {/* 2. Benefits */}
               {(Object.keys(benefits).length > 0 || benefits.bonus) && (
                 <section className="space-y-4">
                   <h2 className="text-2xl font-black text-slate-900">Perks & Benefits</h2>
                   <div className="grid grid-cols-5 gap-3 md:gap-4">
                      {[
                        { id: 'esi', label: t.esiEpf, desc: "Health & Retirement", icon: <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" />, active: benefits['esi'] },
                        { id: 'transport', label: t.transport, desc: "Company Transport", icon: <Bus className="w-5 h-5 md:w-6 md:h-6" />, active: benefits['transport'] },
                        { id: 'teaCash', label: t.teaCash, desc: "Refreshment Allowance", icon: <Coffee className="w-5 h-5 md:w-6 md:h-6" />, active: benefits['teaCash'] },
                        { id: 'food', label: t.food, desc: "Subsidized Meals", icon: <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" />, active: benefits['food'] },
                        { id: 'accommodation', label: t.accommodation, desc: "Housing Provided", icon: <Home className="w-5 h-5 md:w-6 md:h-6" />, active: benefits['accommodation'] },
                      ].filter(b => b.active).map((benefit, i) => {
                        const isWide = i % 4 === 0 || i % 4 === 3;
                        const colSpanClass = isWide ? 'col-span-3' : 'col-span-2';
                        return (
                        <div key={benefit.id} className={`bg-white rounded-[16px] md:rounded-[20px] p-3 md:p-5 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-2 md:gap-4 hover:-translate-y-1 hover:shadow-md transition-all group cursor-default ${colSpanClass}`}>
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-[12px] md:rounded-2xl bg-slate-50 text-slate-500 flex items-center justify-center shrink-0 group-hover:bg-[#7C3AED] group-hover:text-white transition-colors">
                            {benefit.icon}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-[11px] md:text-base leading-tight md:leading-normal">{benefit.label}</h4>
                            <p className="text-[9px] md:text-xs text-slate-500 font-medium mt-0.5 leading-tight">{benefit.desc}</p>
                          </div>
                        </div>
                      )})}
                      {benefits.bonus && (
                        <div className="bg-white rounded-[16px] md:rounded-[20px] p-3 md:p-5 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-2 md:gap-4 hover:-translate-y-1 hover:shadow-md transition-all group cursor-default col-span-5 md:col-span-3">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-[12px] md:rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                            <Zap className="w-5 h-5 md:w-6 md:h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-[11px] md:text-base leading-tight md:leading-normal">Annual Bonus</h4>
                            <p className="text-[9px] md:text-xs text-slate-500 font-medium mt-0.5 leading-tight">{benefits.bonus}</p>
                          </div>
                        </div>
                      )}
                   </div>
                 </section>
               )}

               {/* 3. Company Gallery */}
               {((company?.photos?.inside && company.photos.inside.length > 0) || (company?.photos?.outside && company.photos.outside.length > 0)) && (
                 <section className="space-y-4 w-full">
                   <h2 className="text-2xl font-black text-slate-900">Workspace Gallery</h2>
                   <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 w-full">
                      {(() => {
                        const allPhotos = [...(company?.photos?.inside || []), ...(company?.photos?.outside || [])].slice(0, 5);
                        if (allPhotos.length === 1) {
                           return (
                             <div className="rounded-xl overflow-hidden bg-slate-100 w-full aspect-video">
                                <img src={allPhotos[0]} className="w-full h-full object-cover" alt="Workspace" />
                             </div>
                           );
                        } else if (allPhotos.length === 2) {
                           return (
                             <div className="grid grid-cols-2 gap-4">
                               {allPhotos.map((img, idx) => (
                                 <div key={idx} className="rounded-xl overflow-hidden bg-slate-100 w-full aspect-video">
                                   <img src={img} className="w-full h-full object-cover" alt={`Workspace ${idx+1}`} />
                                 </div>
                               ))}
                             </div>
                           );
                        } else {
                           return (
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                               {allPhotos.map((img, idx) => {
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
                 </section>
               )}

            </div>

            {/* RIGHT SIDEBAR */}
            <div className="sticky top-24 w-full min-w-0 flex flex-col gap-8">
                 
                 {/* ONE PREMIUM STICKY CARD */}
                 <div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden w-full">
                    
                    {/* Header / Apply Action */}
                    <div className="p-6 bg-slate-50/50 border-b border-slate-100 text-center space-y-4">
                       <h3 className="font-bold text-slate-900 text-lg">Interested in this job?</h3>
                       {applied ? (
                          <Button disabled className="w-full h-14 bg-emerald-500 text-white font-bold text-lg rounded-xl shadow-md">
                             <CheckCircle2 className="w-6 h-6 mr-2" /> Applied
                          </Button>
                       ) : (
                          <Button disabled={applying || job.status !== 'approved'} onClick={handleApply} className="w-full h-14 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-lg rounded-xl shadow-lg shadow-[#7C3AED]/20 transition-all hover:-translate-y-0.5">
                             {applying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Apply Now"}
                          </Button>
                       )}
                       <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Apply securely in 1 click</p>
                    </div>

                    {/* Job Details List */}
                    <div className="p-6 space-y-5">
                       <div className="flex items-center justify-between">
                         <span className="text-sm font-semibold text-slate-500 flex items-center gap-2"><IndianRupee className="w-4 h-4"/> Salary</span>
                         <span className="text-sm font-black text-slate-900">₹{job.salaryMin?.toLocaleString()} - ₹{job.salaryMax?.toLocaleString()}</span>
                       </div>
                       <div className="flex items-center justify-between">
                         <span className="text-sm font-semibold text-slate-500 flex items-center gap-2"><Briefcase className="w-4 h-4"/> Job Type</span>
                         <span className="text-sm font-black text-slate-900">{job.workType}</span>
                       </div>
                       <div className="flex items-center justify-between">
                         <span className="text-sm font-semibold text-slate-500 flex items-center gap-2"><MapPin className="w-4 h-4"/> Location</span>
                         <span className="text-sm font-black text-slate-900 truncate max-w-[150px]" title={job.companyAddress || (t.locations[job.location as keyof typeof t.locations] || job.location)}>{job.companyAddress || (t.locations[job.location as keyof typeof t.locations] || job.location)}</span>
                       </div>
                       <div className="flex items-center justify-between">
                         <span className="text-sm font-semibold text-slate-500 flex items-center gap-2"><Clock className="w-4 h-4"/> Timing</span>
                         <span className="text-sm font-black text-slate-900">{job.shiftTiming || "9 AM - 7 PM"}</span>
                       </div>
                       <div className="flex items-center justify-between">
                         <span className="text-sm font-semibold text-slate-500 flex items-center gap-2"><UserCheck className="w-4 h-4"/> Experience</span>
                         <span className="text-sm font-black text-slate-900">{job.experienceRequired}+ Years</span>
                       </div>
                       <div className="flex items-center justify-between">
                         <span className="text-sm font-semibold text-slate-500 flex items-center gap-2"><Users className="w-4 h-4"/> Vacancies</span>
                         <span className="text-sm font-black text-slate-900">{job.openings}</span>
                       </div>
                       <div className="flex items-center justify-between">
                         <span className="text-sm font-semibold text-slate-500 flex items-center gap-2"><CalendarIcon className="w-4 h-4"/> Posted</span>
                         <span className="text-sm font-black text-slate-900">{job.createdAt ? format(new Date(job.createdAt.seconds ? job.createdAt.toDate() : job.createdAt), 'dd MMM yyyy') : "Recently"}</span>
                       </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                       <Button variant="outline" className="flex-1 h-10 rounded-xl bg-white text-slate-600 font-semibold border-slate-200 hover:bg-slate-50" onClick={() => {
                          const shareText = `📋 *Job Details on NexPride* 📋\n\n` +
                            `💼 *Job Title:* ${job.jobTitle}\n` +
                            `🏢 *Company:* ${job.companyName}\n` +
                            `${job.salaryMin && job.salaryMax ? `💰 *Salary:* ₹${job.salaryMin.toLocaleString()} - ₹${job.salaryMax.toLocaleString()} (${salaryUnit})\n` : ""}` +
                            `📍 *Location:* ${job.companyAddress || (t.locations[job.location as keyof typeof t.locations] || job.location)}\n` +
                            `🔗 *Apply Here:* ${window.location.href}`;
                          navigator.clipboard.writeText(shareText);
                          toast({ title: "Copied!", description: "Job details and link copied to clipboard." });
                       }}>
                          <Share2 className="w-4 h-4 mr-2" /> Share
                       </Button>
                       <Button variant="outline" className="flex-1 h-10 rounded-xl bg-red-50 text-red-600 font-semibold border-red-100 hover:bg-red-100" onClick={() => handleOpenReport("job")}>
                          <AlertTriangle className="w-4 h-4 mr-2" /> Report
                       </Button>
                    </div>

                 </div>

                 {/* 4. About Company - MOVED TO SIDEBAR TO FILL SPACE */}
                 <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex flex-col items-center gap-4 w-full">
                    <div className="w-20 h-20 rounded-[18px] bg-slate-50 border border-slate-100 flex items-center justify-center p-2 shrink-0">
                      {job.companyLogo ? (
                        <img src={job.companyLogo} alt={job.companyName} className="w-full h-full object-contain rounded-xl" />
                      ) : (
                        <Building2 className="w-10 h-10 text-slate-300" />
                      )}
                    </div>
                    <div className="text-center w-full">
                      <h3 className="text-lg font-black text-slate-900">{job.companyName || "Confidential Employer"}</h3>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">{job.department || "Verified Employer"}</p>
                      <p className="text-[13px] text-slate-600 mt-3 leading-relaxed">
                        {company?.description || "A verified employer offering opportunities on the platform. Join us to be part of an inclusive and dynamic workspace."}
                      </p>
                      <Link href={`/company/${job.employerId}`} className="inline-block mt-4 w-full">
                        <Button variant="outline" className="w-full rounded-xl font-bold border-slate-200">View Company Profile</Button>
                      </Link>
                    </div>
                 </div>

            </div>

          </div>
        </div>
      </main>
       <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
           <DialogHeader className={cn(
             "p-8 text-white text-left",
             reportCenterType === "candidate" ? "bg-indigo-600" : "bg-red-600"
           )}>
              <div className="flex items-center gap-3 mb-2">
                 <AlertTriangle className="w-6 h-6" />
                 <DialogTitle className="text-xl font-black uppercase tracking-tight">
                   {reportCenterType === "job" ? "Report This Job" : reportCenterType === "employer" ? "Report Employer" : "Report Candidate"}
                 </DialogTitle>
              </div>
              <DialogDescription className="text-white/80 font-medium">
                 Help us maintain NexTirupur as a safe and trusted environment. All reports are strictly confidential.
              </DialogDescription>
           </DialogHeader>

           <div className="p-8 space-y-5 flex-1 overflow-y-auto min-h-0">
              {/* Reason Dropdown */}
              <div className="space-y-2">
                 <Label className="font-bold text-xs uppercase text-muted-foreground">Select Reason</Label>
                 <Select value={reportReason} onValueChange={setReportReason}>
                    <SelectTrigger className="w-full h-12 rounded-xl border-slate-200">
                       <SelectValue placeholder="Why are you reporting?" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-lg border-slate-100">
                       {getReasons().map(r => (
                          <SelectItem key={r} value={r} className="font-semibold text-sm">
                             {r}
                          </SelectItem>
                       ))}
                    </SelectContent>
                 </Select>
              </div>

              {/* Description Textarea */}
              <div className="space-y-2">
                 <Label className="font-bold text-xs uppercase text-muted-foreground">Detailed Description</Label>
                 <Textarea 
                    value={reportCenterDesc}
                    onChange={e => setReportCenterDesc(e.target.value)}
                    placeholder="Provide specific details about the issue to help our moderation team review it..."
                    className="min-h-[100px] rounded-xl border-slate-200"
                    maxLength={500}
                 />
              </div>

              {/* Screenshot Upload */}
              <div className="space-y-2">
                 <Label className="font-bold text-xs uppercase text-muted-foreground">Upload Screenshot Evidence</Label>
                 <div className="flex items-center gap-4">
                    <input 
                       type="file" 
                       accept="image/*" 
                       onChange={handleScreenshotChange} 
                       className="hidden" 
                       id="report-screenshot-upload" 
                    />
                    <label 
                       htmlFor="report-screenshot-upload"
                       className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-primary/50 rounded-xl px-4 py-3 cursor-pointer text-xs font-bold text-slate-600 w-full transition-colors hover:bg-slate-50"
                    >
                       <Camera className="w-4 h-4 text-primary" />
                       {reportScreenshot ? "Change Screenshot" : "Choose Screenshot / Take Photo"}
                    </label>
                 </div>
                 {reportScreenshot && (
                    <div className="relative mt-2 aspect-video rounded-xl overflow-hidden border">
                       <img src={reportScreenshot} alt="Evidence preview" className="w-full h-full object-cover" />
                       <button 
                          onClick={() => setReportScreenshot("")}
                          className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors"
                       >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                             <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                       </button>
                    </div>
                 )}
              </div>
           </div>

           <DialogFooter className="p-6 bg-slate-50 border-t flex gap-3">
              <Button variant="ghost" onClick={() => setIsReportDialogOpen(false)} className="flex-1 font-bold rounded-xl h-12">Cancel</Button>
              <Button 
                disabled={reporting || !reportReason} 
                onClick={handleReportSubmit} 
                className={cn(
                  "flex-[2] text-white font-black rounded-xl h-12 border-none shadow-md",
                  reportCenterType === "candidate" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-red-600 hover:bg-red-700"
                )}
              >
                 {reporting ? "Submitting..." : "Submit Report"}
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Required Dialog */}
      <Dialog open={isProfileRequiredOpen} onOpenChange={setIsProfileRequiredOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-primary text-white text-left">
            <div className="flex items-center gap-3 mb-2">
              <UserCircle className="w-8 h-8" />
              <DialogTitle className="text-2xl font-black font-headline">Profile Required</DialogTitle>
            </div>
            <DialogDescription className="text-white/80 font-medium leading-relaxed">
              To maintain our high standards of verified inclusive hiring, you must complete your professional profile before applying to any jobs.
            </DialogDescription>
          </DialogHeader>
          <div className="p-10 text-center space-y-6">
             <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto text-primary shadow-inner">
                <FileText className="w-10 h-10" />
             </div>
             <p className="text-sm font-bold text-muted-foreground">It only takes 2 minutes to unlock thousands of verified opportunities.</p>
          </div>
          <DialogFooter className="p-6 bg-muted/30 border-t flex gap-3">
            <Button variant="ghost" className="font-bold rounded-xl" onClick={() => setIsProfileRequiredOpen(false)}>Later</Button>
            <Button className="bg-primary text-white font-black rounded-xl shadow-lg flex-1 h-12" onClick={() => router.push('/seeker/onboarding')}>
              Complete Profile Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trust & Safety Info Dialog */}
      <Dialog open={isSafetyInfoOpen} onOpenChange={setIsSafetyInfoOpen}>
        <DialogContent className="max-w-4xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="p-8 bg-primary text-white text-left shrink-0">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8" />
              <div>
                <DialogTitle className="text-2xl font-black font-headline">Trust, Safety & Guidelines</DialogTitle>
                <DialogDescription className="text-white/80 font-medium">Your security is our highest priority at NexPride.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
            <div className="space-y-10">
              {/* SECTION 1: TRUST & SAFETY HUB */}
              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <h3 className="text-2xl font-black text-primary">
                    🛡️ Trust & Safety Hub
                  </h3>
                  <p className="text-muted-foreground text-sm font-medium">
                    Every verified employer on NexPride passes multiple validation checks before posting jobs.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card 1 */}
                  <div className="bg-white p-5 rounded-3xl border border-primary/10 shadow-sm flex flex-col justify-between min-h-[140px]">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-primary">Verified Business</h4>
                        <p className="text-xs font-semibold text-muted-foreground mt-0.5">GST / Registration verified</p>
                      </div>
                    </div>
                    <div className="mt-2 flex">
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-bold text-[10px] rounded-full px-2 py-0.5">
                        Verified
                      </Badge>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="bg-white p-5 rounded-3xl border border-primary/10 shadow-sm flex flex-col justify-between min-h-[140px]">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-primary">Verified Location</h4>
                        <p className="text-xs font-semibold text-muted-foreground mt-0.5">Factory location confirmed</p>
                      </div>
                    </div>
                    <div className="mt-2 flex">
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-bold text-[10px] rounded-full px-2 py-0.5">
                        Confirmed
                      </Badge>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="bg-white p-5 rounded-3xl border border-primary/10 shadow-sm flex flex-col justify-between min-h-[140px]">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center text-violet-600 shrink-0">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-primary">Verified Contact</h4>
                        <p className="text-xs font-semibold text-muted-foreground mt-0.5">Mobile number OTP verified</p>
                      </div>
                    </div>
                    <div className="mt-2 flex">
                      <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 border-none font-bold text-[10px] rounded-full px-2 py-0.5">
                        OTP Verified
                      </Badge>
                    </div>
                  </div>

                  {/* Card 4 */}
                  <div className="bg-white p-5 rounded-3xl border border-primary/10 shadow-sm flex flex-col justify-between min-h-[140px]">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-pink-500/10 rounded-xl flex items-center justify-center text-pink-600 shrink-0">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-primary">Platform Protected</h4>
                        <p className="text-xs font-semibold text-muted-foreground mt-0.5">Activity monitored by Safety Team</p>
                      </div>
                    </div>
                    <div className="mt-2 flex">
                      <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-100 border-none font-bold text-[10px] rounded-full px-2 py-0.5">
                        Protected
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-slate-200" />

              {/* SECTION 2: SAFETY GUIDELINES */}
              <div className="space-y-6">
                <h3 className="text-2xl font-black text-primary">Safety Guidelines</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column - For Job Seekers */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-indigo-700 uppercase tracking-widest px-2">For Job Seekers</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="p-4 bg-white rounded-2xl border border-slate-200/60 shadow-sm flex gap-3">
                        <span className="text-xl shrink-0">💰</span>
                        <div>
                          <h5 className="font-black text-sm text-primary">Never Pay For A Job</h5>
                          <p className="text-xs font-semibold text-muted-foreground mt-0.5">No genuine job on NexPride requires payment.</p>
                        </div>
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-slate-200/60 shadow-sm flex gap-3">
                        <span className="text-xl shrink-0">📍</span>
                        <div>
                          <h5 className="font-black text-sm text-primary">Attend Interviews Only At Verified Locations</h5>
                          <p className="text-xs font-semibold text-muted-foreground mt-0.5">Always visit the location displayed in the job posting.</p>
                        </div>
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-slate-200/60 shadow-sm flex gap-3">
                        <span className="text-xl shrink-0">🔐</span>
                        <div>
                          <h5 className="font-black text-sm text-primary">Protect Personal Information</h5>
                          <p className="text-xs font-semibold text-muted-foreground mt-0.5">Never share OTP, ATM PIN, passwords, or banking credentials.</p>
                        </div>
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-slate-200/60 shadow-sm flex gap-3">
                        <span className="text-xl shrink-0">📄</span>
                        <div>
                          <h5 className="font-black text-sm text-primary">Verify Offer Letters</h5>
                          <p className="text-xs font-semibold text-muted-foreground mt-0.5">Check employer profile before accepting offers.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - For Employers */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-indigo-700 uppercase tracking-widest px-2">For Employers</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="p-4 bg-white rounded-2xl border border-slate-200/60 shadow-sm flex gap-3">
                        <span className="text-xl shrink-0">🆔</span>
                        <div>
                          <h5 className="font-black text-sm text-primary">Verify Candidate Identity</h5>
                          <p className="text-xs font-semibold text-muted-foreground mt-0.5">Review credentials before issuing offers.</p>
                        </div>
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-slate-200/60 shadow-sm flex gap-3">
                        <span className="text-xl shrink-0">🚫</span>
                        <div>
                          <h5 className="font-black text-sm text-primary">Report Fake Profiles</h5>
                          <p className="text-xs font-semibold text-muted-foreground mt-0.5">Flag suspicious candidates or fraudulent documents immediately.</p>
                        </div>
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-slate-200/60 shadow-sm flex gap-3">
                        <span className="text-xl shrink-0">🔒</span>
                        <div>
                          <h5 className="font-black text-sm text-primary">Use Platform Communication</h5>
                          <p className="text-xs font-semibold text-muted-foreground mt-0.5">Maintain conversations inside the platform for audit security.</p>
                        </div>
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-slate-200/60 shadow-sm flex gap-3">
                        <span className="text-xl shrink-0">📋</span>
                        <div>
                          <h5 className="font-black text-sm text-primary">Maintain Fair Hiring Practices</h5>
                          <p className="text-xs font-semibold text-muted-foreground mt-0.5">Adhere to local labor regulations and NexPride terms.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="p-4 bg-white border-t shrink-0">
            <Button onClick={() => setIsSafetyInfoOpen(false)} className="rounded-xl font-bold w-full sm:w-auto px-6 h-12 bg-primary text-white">
              Close Guidelines
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
