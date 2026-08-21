"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  MapPin, 
  ArrowRight, 
  PlusCircle, 
  Building2,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Zap,
  Heart,
  Loader2,
  Sparkles,
  Shield,
  Briefcase,
  Users,
  SlidersHorizontal
} from "lucide-react";
import { JobListing } from "@/lib/types";
import { JobCard } from "@/components/jobs/JobCard";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useFirestore, useCollection, useUser, useDoc } from "@/firebase";
import { collection, query, where, limit, doc, getCountFromServer, getDocs } from "firebase/firestore";

const TECH_ROLES = ["Software Developer", "Software Engineer", "UI/UX Designer", "Data Analyst", "Product Manager"];
const CREATIVE_ROLES = ["Graphic Designer", "Content Writer", "Social Media Manager", "DESIGNER", "PATTERN MASTER"];
const CUSTOMER_ROLES = ["Customer Success", "Sales Executive", "Voice Process", "Receptionist"];
const PRO_ROLES = ["Human Resources", "HR Executive", "Accounts Assistant", "Finance Executive", "Operations Manager"];

const ROLE_CLASSIFICATION = {
  TECH: TECH_ROLES,
  CREATIVE: CREATIVE_ROLES,
  CUSTOMER: CUSTOMER_ROLES,
  PRO: PRO_ROLES,
  OTHERS: ["Admin", "Management", "Healthcare", "Hospitality", "Store Keeper"]
};

// Icons and counts are static; names come from t.categories inside the component
const SECTOR_IDS = [
  { id: "TECH",     icon: <Zap className="w-5 h-5" />,       count: "400+" },
  { id: "CREATIVE", icon: <Sparkles className="w-5 h-5" />,  count: "250+" },
  { id: "CUSTOMER", icon: <Heart className="w-5 h-5" />,     count: "300+" },
  { id: "PRO",      icon: <Shield className="w-5 h-5" />,    count: "200+" },
  { id: "OTHERS",   icon: <Briefcase className="w-5 h-5" />, count: "180+" },
];

export default function Home() {
  const { t } = useLanguage();
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();

  const profileRef = useMemo(() => user ? doc(db, "Users", user.uid) : null, [db, user]);
  const { data: profile, loading: profileLoading } = useDoc<any>(profileRef);
  
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [activeDept, setActiveDept] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sectorCounts, setSectorCounts] = useState<Record<string, number>>({});
  const [sectorsLoading, setSectorsLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState({ employers: 0, opportunities: 0, members: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      if (!db) return;
      setSectorsLoading(true);
      try {
        // 1. Fetch active jobs to determine trending designations
        const jobsQ = query(collection(db, "Jobs"), where("status", "==", "approved"));
        let jobsSnap;
        try {
          jobsSnap = await getDocs(jobsQ);
          const designationCounts: Record<string, number> = {};
          jobsSnap.forEach(doc => {
            const desig = doc.data().designation;
            if (desig) {
              designationCounts[desig] = (designationCounts[desig] || 0) + 1;
            }
          });
          setSectorCounts(designationCounts);
        } catch (jobErr) {
          console.debug("Could not fetch jobs for sectors:", jobErr);
        }

        // 2. Fetch global stats
        try {
          const employersQ = query(collection(db, "Users"), where("role", "==", "employer"), where("status", "==", "approved"));
          const membersQ = query(collection(db, "Users"), where("role", "==", "job_seeker"));
          const [employersSnap, membersSnap] = await Promise.all([
            getCountFromServer(employersQ),
            getCountFromServer(membersQ)
          ]);
          setGlobalStats({
            employers: employersSnap.data().count,
            opportunities: jobsSnap ? jobsSnap.size : 0,
            members: membersSnap.data().count
          });
        } catch (statErr) {
          console.debug("Could not fetch global stats:", statErr);
        }
      } catch (err) {
        console.debug("Unexpected error in fetchCounts:", err);
      } finally {
        setSectorsLoading(false);
      }
    };
    fetchCounts();
  }, [db]);

  const SECTOR_CATEGORIES = useMemo(() => {
    const sortedDesigs = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1]);
    const topDesigs = sortedDesigs.slice(0, 5).map(([desig, count], idx) => {
      const icons = [
        <Zap key="1" className="w-5 h-5" />,
        <Sparkles key="2" className="w-5 h-5" />,
        <Heart key="3" className="w-5 h-5" />,
        <Shield key="4" className="w-5 h-5" />,
        <Briefcase key="5" className="w-5 h-5" />
      ];
      return {
        id: desig,
        name: desig, // Since it's a dynamic designation, use it directly
        count: count.toString(),
        icon: icons[idx % icons.length],
        isDynamic: true
      };
    });

    return topDesigs;
  }, [sectorCounts]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoggedIn(localStorage.getItem('sim_is_logged_in') === 'true');
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    }, { threshold: 0.05 });
    
    document.querySelectorAll(".scroll-trigger").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const jobsQuery = useMemo(() => {
    return query(
      collection(db, "Jobs"),
      where("status", "==", "approved"),
      limit(6)
    );
  }, [db]);

  const { data: liveJobs, loading: jobsLoading } = useCollection<JobListing>(jobsQuery as any);

  const sortedLiveJobs = useMemo(() => {
    if (!liveJobs) return [];
    const isCompleted = (job: any) => {
      const targetDateVal = job.interviewEndDate || job.interviewStartDate;
      if (!targetDateVal) return false;
      try {
        const dateObj = targetDateVal.toDate ? targetDateVal.toDate() : new Date(targetDateVal);
        if (isNaN(dateObj.getTime())) return false;
        dateObj.setHours(23, 59, 59, 999);
        return new Date() > dateObj;
      } catch (e) {
        return false;
      }
    };

    return [...liveJobs].sort((a, b) => {
      const compA = isCompleted(a) ? 1 : 0;
      const compB = isCompleted(b) ? 1 : 0;
      if (compA !== compB) return compA - compB;
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  }, [liveJobs]);

  const handleSearch = () => {
    if (isLoggedIn && profile && profile.role === 'job_seeker' && !profile.onboarded) {
      router.push("/seeker/onboarding");
      return;
    }
    const params = new URLSearchParams();
    if (selectedCategory !== "all") params.set("category", encodeURIComponent(selectedCategory));
    if (selectedLocation !== "all") params.set("location", selectedLocation);
    params.set("sort", sortBy);
    router.push(`/jobs?${params.toString()}`);
  };

  const handleDeptClick = (catId: string, isDynamic: boolean = false) => {
    if (isLoggedIn && profile && profile.role === 'job_seeker' && !profile.onboarded) {
      router.push("/seeker/onboarding");
      return;
    }
    setSelectedCategory(catId); 
    if (isDynamic) {
      router.push(`/jobs?designation=${encodeURIComponent(catId)}&sort=${sortBy}`);
    } else {
      router.push(`/jobs?category=${encodeURIComponent(catId)}&sort=${sortBy}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white overflow-x-hidden">

      {/* Blob animation keyframes - hero only */}
      <style>{`
        @keyframes floatBlob1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(20px, -15px) scale(1.02); }
          66% { transform: translate(-15px, 15px) scale(0.98); }
        }
        @keyframes floatBlob2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(-15px, 20px) scale(1.03); }
          66% { transform: translate(15px, -10px) scale(0.97); }
        }
        @keyframes floatBlob3 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(12px, 15px) scale(1.02); }
        }
        @keyframes floatUp {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes floatDown {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(10px); }
        }
        .animate-float-up {
          animation: floatUp 6s ease-in-out infinite;
        }
        .animate-float-down {
          animation: floatDown 7s ease-in-out infinite;
        }
        
        /* Floating Side Portraits */
        .side-portrait {
          width: 160px;
          height: 160px;
          border-radius: 50%;
          overflow: hidden;
          backdrop-filter: blur(16px);
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 20px 40px rgba(139, 92, 246, 0.15);
        }
        .animate-side-float {
          animation: sideFloat 6s ease-in-out infinite;
        }
        @keyframes sideFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }

        /* Slow Moving Background Blobs */
        @keyframes slowMove {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.05); }
        }
        .animate-slow-blob {
          animation: slowMove 20s ease-in-out infinite;
        }

        /* Pure CSS Fade In on Load for Community Illustrations */
        @keyframes communityFadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 0.85;
            transform: translateY(0);
          }
        }
        .animate-community {
          animation: communityFadeIn 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <Header />
      
      <main className="flex-grow space-y-8 md:space-y-16 pb-0 overflow-x-hidden">

        {/* ── HERO SECTION ── orbs contained here only */}
        <section
          className="relative pt-24 xl:pt-28 pb-16 max-w-full flex items-center overflow-hidden min-h-[600px] xl:min-h-[720px]"
          style={{ background: "linear-gradient(135deg, #f0edff 0%, #faf8ff 35%, #ede4ff 65%, #fce7f8 100%)" }}
        >
          {/* Floating animated orbs - removed per user request */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
          </div>

          {/* Floating circular portrait cards around the hero section (Desktop only to prevent mobile clutter) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
            {/* Top Left (Large Circle) */}
            <div className="absolute hidden xl:block animate-float-up animate-stand-left" style={{ top: '18%', left: '8%', width: '180px', height: '180px', zIndex: 10 }}>
              <div className="w-full h-full rounded-full border border-white/40 bg-white/10 backdrop-blur-[16px] flex items-center justify-center p-3.5 shadow-xl relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 via-transparent to-white/40 pointer-events-none z-20" />
                <div className="w-full h-full rounded-full border-2 border-white bg-white overflow-hidden shadow-md relative z-10">
                  <img src="/young_prof_laptop.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              </div>
            </div>

            {/* Mid Left (Medium Circle - New - Spaced Down) */}
            <div className="absolute hidden xl:block animate-float-down animate-stand-left" style={{ top: '46%', left: '2%', width: '140px', height: '140px', zIndex: 10 }}>
              <div className="w-full h-full rounded-full border border-white/40 bg-white/10 backdrop-blur-[16px] flex items-center justify-center p-2.5 shadow-xl relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/15 via-transparent to-white/35 pointer-events-none z-20" />
                <div className="w-full h-full rounded-full border-2 border-white bg-white overflow-hidden shadow-md relative z-10">
                  <img src="/diverse_female.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              </div>
            </div>

            {/* Bottom Left (Medium Circle - Spaced Down) */}
            <div className="absolute hidden xl:block animate-float-up animate-stand-left" style={{ bottom: '12%', left: '8%', width: '150px', height: '150px', zIndex: 10 }}>
              <div className="w-full h-full rounded-full border border-white/40 bg-white/10 backdrop-blur-[16px] flex items-center justify-center p-3 shadow-xl relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 via-transparent to-white/40 pointer-events-none z-20" />
                <div className="w-full h-full rounded-full border-2 border-white bg-white overflow-hidden shadow-md relative z-10">
                  <img src="/lgbtq_member.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              </div>
            </div>

            {/* Top Right (Medium Circle) */}
            <div className="absolute hidden xl:block animate-float-down animate-stand-right" style={{ top: '20%', right: '22%', width: '140px', height: '140px', zIndex: 10 }}>
              <div className="w-full h-full rounded-full border border-white/40 bg-white/10 backdrop-blur-[16px] flex items-center justify-center p-2.5 shadow-xl relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/15 via-transparent to-white/35 pointer-events-none z-20" />
                <div className="w-full h-full rounded-full border-2 border-white bg-white overflow-hidden shadow-md relative z-10">
                  <img src="/corp_employee.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-30 w-full max-w-5xl mx-auto px-4 text-center space-y-8">
            
            {/* Badge */}
            <div 
              className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-md px-4.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider border border-violet-100/50 rainbow-border-l mx-auto"
              style={{ boxShadow: '0 8px 32px rgba(124,58,237,0.12), inset 0 1px 0 rgba(255,255,255,0.9)' }}
            >
              <Shield className="w-4 h-4 text-violet-600" /> {t.verifiedBadge}
            </div>

            {/* Headline */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-tight tracking-tight">
              {t.heroLine1}<br />
              {t.heroLine2Prefix} <span className="text-violet-600">{t.heroPride}</span>
            </h1>

            {/* Sub-headline */}
            <p className="text-slate-500 text-sm md:text-base max-w-xl mx-auto font-medium leading-relaxed">
              {t.heroSub}
            </p>

            {/* Search Bar - Centered */}
            <div className="relative max-w-4xl mx-auto mt-2 px-0 w-full z-30">
              <div className="clay-card p-2 md:p-4 grid grid-cols-2 md:flex md:flex-row gap-2 md:gap-3 bg-white rounded-2xl md:rounded-3xl shadow-xl">
                {/* Sector dropdown */}
                <div className="col-span-1 md:flex-1">
                  <Select value={selectedCategory} onValueChange={(val) => setSelectedCategory(val)}>
                    <SelectTrigger className="h-10 md:h-12 border-none shadow-none text-xs md:text-base font-semibold bg-transparent focus:ring-0 rounded-lg md:rounded-xl clay-input w-full px-2 md:px-3">
                      <div className="flex items-center gap-1.5 md:gap-3">
                        <div className="w-6 h-6 md:w-8 md:h-8 bg-violet-50 rounded-md md:rounded-lg flex items-center justify-center shrink-0">
                          <Search className="w-3 h-3 md:w-4 md:h-4 text-violet-600" />
                        </div>
                        <SelectValue placeholder={t.allSectors} />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl border-violet-100">
                      <SelectItem value="all" className="font-semibold">{t.allSectors}</SelectItem>
                      {SECTOR_CATEGORIES.map(cat => (
                        <SelectItem key={cat.id} value={cat.id} className="font-semibold">
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-px bg-slate-100 hidden md:block my-2" />

                {/* Location dropdown */}
                <div className="col-span-1 md:flex-1">
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="h-10 md:h-12 border-none shadow-none text-xs md:text-base font-semibold bg-transparent focus:ring-0 rounded-lg md:rounded-xl clay-input w-full px-2 md:px-3">
                      <div className="flex items-center gap-1.5 md:gap-3">
                        <div className="w-6 h-6 md:w-8 md:h-8 bg-violet-50 rounded-md md:rounded-lg flex items-center justify-center shrink-0">
                          <MapPin className="w-3 h-3 md:w-4 md:h-4 text-violet-600" />
                        </div>
                        <SelectValue placeholder={t.locations.all} />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl border-violet-100">
                      <SelectItem value="all" className="font-semibold">{t.locations.all}</SelectItem>
                      <SelectItem value="avinashi" className="font-semibold">{t.locations.avinashi}</SelectItem>
                      <SelectItem value="pnroad" className="font-semibold">{t.locations.pnroad}</SelectItem>
                      <SelectItem value="palladam" className="font-semibold">{t.locations.palladam}</SelectItem>
                      <SelectItem value="kangeyam" className="font-semibold">{t.locations.kangeyam}</SelectItem>
                      <SelectItem value="knppuram" className="font-semibold">{t.locations.knppuram}</SelectItem>
                      <SelectItem value="thennampalayam" className="font-semibold">{t.locations.thennampalayam}</SelectItem>
                      <SelectItem value="dharapuram" className="font-semibold">{t.locations.dharapuram}</SelectItem>
                      <SelectItem value="others" className="font-semibold">{t.locations.others}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-px bg-slate-100 hidden md:block my-2" />

                {/* Sort dropdown - Hidden on mobile */}
                <div className="hidden md:flex-1 md:block">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-12 border-none shadow-none text-base font-semibold bg-transparent focus:ring-0 rounded-xl clay-input w-full">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
                          <SlidersHorizontal className="w-4 h-4 text-violet-600" />
                        </div>
                        <SelectValue placeholder="Sort By" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl border-violet-100">
                      <SelectItem value="latest" className="font-semibold">{t.latestJobsSort}</SelectItem>
                      <SelectItem value="salary-high" className="font-semibold">{t.highestSalary}</SelectItem>
                      <SelectItem value="exp-low" className="font-semibold">{t.fresherFriendly}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleSearch} 
                  className="col-span-2 md:col-auto h-10 md:h-12 w-full md:w-auto px-10 bg-violet-600 hover:bg-violet-700 text-white font-black text-sm md:text-base rounded-xl md:rounded-full transition-all clay-btn"
                >
                  Find Jobs <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              {/* Rainbow gradient line at the bottom of the search card */}
              <div className="h-[3px] rounded-b-2xl rainbow-line mx-6 opacity-60 mt-1" />
            </div>

            {/* Visual Clay Stats Row - Centered */}
            <div className="flex flex-row overflow-x-auto gap-1.5 pb-0 mt-1 w-full scrollbar-hide snap-x snap-mandatory md:overflow-x-visible md:pb-0 md:gap-6 justify-center md:flex-nowrap relative z-30 px-2 md:px-0">
              <div className="clay-card p-2 md:py-3 md:px-4 text-center min-w-[75px] md:min-w-[120px] flex-1 flex flex-col items-center justify-center bg-white snap-start flex-shrink-0 rounded-lg md:rounded-2xl shadow-sm">
                <div className="text-sm md:text-3xl font-black text-violet-700 leading-none">{globalStats.employers > 0 ? globalStats.employers : 120}+</div>
                <div className="text-[7px] md:text-[10px] font-bold tracking-wider text-slate-400 uppercase mt-1 md:mt-1.5 leading-[1.1]">{t.statsEmployers}</div>
              </div>
              <div className="h-8 md:h-12 w-px bg-slate-200 hidden md:block shrink-0" />
              <div className="clay-card p-2 md:py-3 md:px-4 text-center min-w-[75px] md:min-w-[120px] flex-1 flex flex-col items-center justify-center bg-white snap-start flex-shrink-0 rounded-lg md:rounded-2xl shadow-sm">
                <div className="text-sm md:text-3xl font-black text-violet-700 leading-none">{globalStats.opportunities > 0 ? globalStats.opportunities : 500}+</div>
                <div className="text-[7px] md:text-[10px] font-bold tracking-wider text-slate-400 uppercase mt-1 md:mt-1.5 leading-[1.1]">{t.statsOpportunities}</div>
              </div>
              <div className="h-8 md:h-12 w-px bg-slate-200 hidden md:block shrink-0" />
              <div className="clay-card p-2 md:py-3 md:px-4 text-center min-w-[75px] md:min-w-[120px] flex-1 flex flex-col items-center justify-center bg-white snap-start flex-shrink-0 rounded-lg md:rounded-2xl shadow-sm">
                <div className="text-sm md:text-3xl font-black text-violet-700 leading-none">{globalStats.members > 0 ? globalStats.members : '2.5k'}+</div>
                <div className="text-[7px] md:text-[10px] font-bold tracking-wider text-slate-400 uppercase mt-1 md:mt-1.5 leading-[1.1]">{t.statsMembers}</div>
              </div>
            </div>

          </div>

          {/* Right-side Featured Standing Woman (Cropped up to hands) */}
          <div className="absolute bottom-0 right-0 h-[80%] xl:h-[85%] w-[350px] xl:w-[420px] pointer-events-none hidden lg:block z-10 rounded-bl-3xl">
            <img src="/business_woman.png" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
          </div>
        </section>

        {/* ── SECTOR & JOBS SECTION WITH INCLUSIVE DECORATIONS ── */}
        <div className="relative w-full overflow-hidden pt-8 pb-36 z-20">
          
          {/* Premium defined circular & organic orbs (radial gradients matching the mockup) */}
          {/* Top Left Circular Blob */}
          <div className="absolute left-[-100px] top-[40px] rounded-full pointer-events-none z-0 hidden xl:block animate-slow-blob" style={{ width: '360px', height: '360px', background: 'radial-gradient(circle, rgba(167,139,250,0.38) 0%, rgba(139,92,246,0.12) 50%, transparent 70%)' }} />
          {/* Bottom Left Organic Blob (Leaf style) */}
          <div className="absolute left-[-120px] bottom-[60px] pointer-events-none z-0 hidden xl:block animate-slow-blob" style={{ width: '400px', height: '400px', borderRadius: '60% 40% 70% 30% / 30% 60% 40% 70%', background: 'radial-gradient(circle at 40% 40%, rgba(167,139,250,0.4) 0%, rgba(124,58,237,0.15) 55%, transparent 72%)', animationDelay: '-3s' }} />

          {/* Top Right Organic Blob (Leaf style) */}
          <div className="absolute right-[-100px] top-[60px] pointer-events-none z-0 hidden xl:block animate-slow-blob" style={{ width: '360px', height: '360px', borderRadius: '40% 60% 30% 70% / 60% 30% 70% 40%', background: 'radial-gradient(circle at 60% 40%, rgba(249,168,212,0.45) 0%, rgba(236,72,153,0.15) 50%, transparent 70%)', animationDelay: '-6s' }} />
          {/* Bottom Right Circular Blob */}
          <div className="absolute right-[-120px] bottom-[60px] rounded-full pointer-events-none z-0 hidden xl:block animate-slow-blob" style={{ width: '420px', height: '420px', background: 'radial-gradient(circle, rgba(216,180,254,0.42) 0%, rgba(192,132,252,0.16) 55%, transparent 72%)', animationDelay: '-9s' }} />

          {/* Dotted patterns & Glassmorphic circles (Opacity < 10%) */}
          <div className="absolute left-10 top-[22%] w-24 h-24 rounded-full border border-violet-300/10 backdrop-blur-[2px] pointer-events-none z-0 hidden xl:block" />
          <div className="absolute right-20 top-[60%] w-36 h-36 rounded-full border border-pink-300/10 backdrop-blur-[2px] pointer-events-none z-0 hidden xl:block" />
          
          {/* Dotted Grid Decoration */}
          <div className="absolute left-6 top-[35%] opacity-[0.06] pointer-events-none z-0 hidden xl:block text-violet-800" style={{ backgroundImage: 'radial-gradient(currentColor 1.5px, transparent 1.5px)', backgroundSize: '16px 16px', width: '120px', height: '180px' }} />
          <div className="absolute right-6 top-[12%] opacity-[0.06] pointer-events-none z-0 hidden xl:block text-pink-800" style={{ backgroundImage: 'radial-gradient(currentColor 1.5px, transparent 1.5px)', backgroundSize: '16px 16px', width: '120px', height: '180px' }} />

          {/* Left Side Portrait: Aligned with the center of Trending Sectors */}
          <div className="absolute left-[-20px] 2xl:left-8 top-[110px] z-10 hidden xl:block animate-side-float">
            <div className="side-portrait relative p-3">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 to-white/30 pointer-events-none z-20" />
              <div className="w-full h-full rounded-full border-2 border-white/80 bg-white overflow-hidden shadow-md relative z-10">
                <img src="/trending_left_portrait.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
            {/* Overlapping Pride-Heart Badge (Moved OUTSIDE circular mask wrapper) */}
            <div className="absolute bottom-1 right-1 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg border border-violet-100 z-30 animate-pulse">
              <svg className="w-5 h-5 text-violet-600 fill-violet-600" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
          </div>

          {/* Right Side Portrait: Aligned with the center of Trending Sectors */}
          <div className="absolute right-[-20px] 2xl:right-8 top-[110px] z-10 hidden xl:block animate-side-float" style={{ animationDelay: '-3s' }}>
            <div className="side-portrait relative p-3">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 to-white/30 pointer-events-none z-20" />
              <div className="w-full h-full rounded-full border-2 border-white/80 bg-white overflow-hidden shadow-md relative z-10">
                <img src="/trending_right_portrait.png?v=2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
            {/* Overlapping Pride-Heart Badge (Moved OUTSIDE circular mask wrapper) */}
            <div className="absolute bottom-1 left-1 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg border border-violet-100 z-30 animate-pulse">
              <svg className="w-5 h-5 text-violet-600 fill-violet-600" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
          </div>

          {/* ── TRENDING SECTORS ── */}
          <section className="px-4 md:px-6 max-w-6xl mx-auto relative z-20">
            {/* Rainbow gradient accent bar above card */}
            <div className="h-1 w-full rounded-full bg-gradient-to-r from-pink-400 via-yellow-400 via-green-400 to-blue-500 mb-4" />
            
            <div className="clay-card p-4 md:p-8 bg-white overflow-hidden rounded-2xl md:rounded-3xl">
              <div className="flex justify-between items-end mb-8">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-slate-900">{t.popularCategories}</h2>
                  <p className="text-slate-400 text-sm">{t.topHubsSubtitle}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-white">
                {sectorsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="clay-card p-5 animate-pulse bg-white min-h-[140px] md:min-h-[160px] flex flex-col justify-between rounded-2xl md:rounded-3xl" style={{ boxShadow: "0 8px 32px rgba(124,58,237,0.05)" }}>
                      <div className="flex-1 flex items-center justify-center">
                        <div className="h-5 bg-slate-100 rounded w-2/3" />
                      </div>
                      <div className="h-4 bg-slate-100 rounded w-1/2 mx-auto mt-2" />
                    </div>
                  ))
                ) : SECTOR_CATEGORIES.length > 0 ? (
                  SECTOR_CATEGORIES.map((cat: any) => (
                    <button 
                      key={cat.id} 
                      onClick={() => handleDeptClick(cat.id, cat.isDynamic)}
                      className="w-full group text-left bg-transparent"
                    >
                      <div 
                        className="clay-card p-4 md:p-5 cursor-pointer bg-white min-h-[150px] md:min-h-[170px] flex flex-col h-full hover:scale-[1.03] hover:shadow-[0_20px_50px_rgba(124,58,237,0.25),0_6px_16px_rgba(124,58,237,0.15),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-2px_0_rgba(124,58,237,0.08)] transition-all duration-300 rounded-2xl md:rounded-3xl relative overflow-hidden"
                      >
                        {/* Premium translucent background bubbles */}
                        <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-violet-100/40 blur-sm group-hover:scale-150 group-hover:bg-violet-200/40 transition-all duration-500 pointer-events-none" />
                        <div className="absolute -bottom-6 -right-6 w-16 h-16 rounded-full bg-pink-100/50 blur-sm group-hover:scale-125 group-hover:bg-pink-200/50 transition-all duration-500 pointer-events-none" />
                        <div className="absolute top-1/2 left-3/4 w-8 h-8 rounded-full bg-sky-100/30 blur-[1px] group-hover:-translate-y-4 group-hover:scale-110 transition-all duration-700 pointer-events-none" />

                        {/* Dynamic Category Icon inside a colored bubble */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-50 to-violet-100/50 text-violet-600 flex items-center justify-center mb-3 mx-auto group-hover:scale-115 group-hover:from-violet-100 group-hover:to-violet-200 transition-all duration-300 relative z-10 shadow-sm border border-violet-100/50">
                          {cat.icon}
                        </div>

                        <div className="flex-1 flex items-center justify-center text-center w-full relative z-10">
                          <h3 className="font-bold text-slate-800 group-hover:text-violet-600 transition-colors text-xs md:text-sm leading-snug">{cat.name}</h3>
                        </div>
                        {cat.count !== "0" && (
                          <div className="flex justify-center w-full mt-2 shrink-0 relative z-10">
                            <span className="bg-violet-50/80 text-violet-600 text-[10px] font-black uppercase tracking-wider rounded-full px-2.5 py-1 w-fit border border-violet-100/30" style={{ boxShadow: '0 2px 8px rgba(124,58,237,0.1), inset 0 1px 0 rgba(255,255,255,0.8)' }}>
                              {cat.count} {t.vacanciesLabel}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="col-span-full py-8 text-center text-slate-400 font-bold">
                    No active hiring sectors found.
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ── FEATURED JOBS ── */}
          <section className="px-4 md:px-6 max-w-6xl mx-auto mt-16 relative z-20">
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{t.latestJobs}</h2>
                <p className="text-slate-400 text-sm">{t.freshOpportunitiesSubtitle}</p>
              </div>
              <Link href="/jobs">
                <Button variant="outline" className="clay-btn-ghost bg-white text-violet-600 border border-violet-200 hover:bg-violet-600 hover:text-white transition-all rounded-full px-5 py-2 h-auto flex items-center gap-1.5 font-bold">
                  {t.browseAll} <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              {jobsLoading ? (
                Array.from({length: 3}).map((_, i) => (
                  <div key={i} className="clay-card p-6 animate-pulse bg-white rounded-2xl md:rounded-3xl">
                    <div className="flex gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-100 rounded w-3/4" />
                        <div className="h-3 bg-slate-100 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-100 rounded" />
                      <div className="h-3 bg-slate-100 rounded w-4/5" />
                    </div>
                  </div>
                ))
              ) : sortedLiveJobs && sortedLiveJobs.length > 0 ? (
                sortedLiveJobs.map((job) => (
                  <JobCard key={job.jobId || (job as any).id} job={{ ...job, jobId: job.jobId || (job as any).id }} />
                ))
              ) : (
                <div className="col-span-full py-20 text-center clay-card bg-white rounded-2xl md:rounded-3xl">
                  <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4 clay-icon">
                    <Briefcase className="w-8 h-8 text-violet-600" />
                  </div>
                  <p className="font-black text-slate-600 text-lg">{t.arrivingSoon}</p>
                  <p className="text-slate-400 text-sm mt-1">{t.firstToDiscover}</p>
                  <Link href="/auth/login" className="block mt-4">
                    <Button className="bg-violet-600 hover:bg-violet-700 text-white font-black rounded-full px-8 h-12 clay-btn">
                      {t.getNotified}
                    </Button>
                  </Link>
                </div>
              )}
              
              {/* Explore more card */}
              <Link href="/jobs" className="group">
                <div className="h-full min-h-[160px] md:min-h-[220px] bg-gradient-to-br from-violet-600 to-violet-800 text-white rounded-2xl md:rounded-3xl p-4 md:p-8 flex flex-col justify-between hover:from-violet-700 hover:to-violet-900 transition-all duration-200 relative overflow-visible mx-0 md:mx-0" style={{ boxShadow: '0 12px 40px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.15)' }}>
                  <div className="absolute -bottom-4 -right-4 md:-bottom-8 md:-right-8 w-16 h-16 md:w-32 md:h-32 bg-white/10 rounded-full group-hover:scale-125 transition-transform duration-500" />
                  <div className="absolute -top-3 -left-3 md:-top-6 md:-left-6 w-12 h-12 md:w-24 md:h-24 bg-white/5 rounded-full" />
                  
                  <div className="relative z-10 flex flex-col gap-2 md:gap-4 text-left">
                    <div className="w-8 h-8 md:w-12 md:h-12 bg-white/20 rounded-lg md:rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-200 clay-icon">
                      <PlusCircle className="w-4 h-4 md:w-6 md:h-6 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="text-base md:text-xl font-bold text-white mb-0 md:mb-1 leading-tight">{t.exploreMore}</h3>
                      <p className="hidden sm:block text-violet-200 font-medium text-sm leading-relaxed">{t.exploreSubtitle}</p>
                    </div>
                  </div>
                  
                  <Button className="w-full sm:w-fit max-w-full bg-white hover:bg-violet-50 text-violet-700 font-black h-auto min-h-8 md:min-h-11 py-2 md:py-2.5 px-3 md:px-8 rounded-xl md:rounded-full transition-all relative z-10 text-[10px] md:text-sm clay-btn-white mt-3 md:mt-6 self-start whitespace-normal text-center leading-tight flex items-center justify-center gap-1 md:gap-1.5" style={{ boxShadow: '0 6px 20px rgba(0,0,0,0.15)' }}>
                    <span>{t.exploreCta}</span> <ArrowRight className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
                  </Button>
                </div>
              </Link>
            </div>
          </section>

          {/* SVG Leaves behind Left Illustration */}
          <div className="absolute left-12 2xl:left-24 bottom-[140px] pointer-events-none z-0 hidden xl:block opacity-[0.25] blur-[0.5px]">
            <svg className="w-12 h-12 text-emerald-500 fill-current" viewBox="0 0 24 24">
              <path d="M21,3C21,3 14.5,3 10,7.5C5.5,12 5,18.5 5,18.5C5,18.5 11.5,18 16,13.5C20.5,9 21,3 21,3M6,17C6.5,15.5 7.5,13.5 9,12C10.5,10.5 12.5,9.5 14,9C12.5,10.5 10.5,12.5 9,14C7.5,15.5 6.5,16.5 6,17Z" />
            </svg>
          </div>

          {/* Bottom Left Community Illustration */}
          <div className="absolute left-2 2xl:left-12 bottom-[80px] z-10 hidden xl:block animate-community pointer-events-none">
            <img src="/community_left.png" className="max-w-[200px] 2xl:max-w-[240px]" alt="Inclusive Community" />
          </div>

          {/* SVG Leaves behind Right Illustration */}
          <div className="absolute right-12 2xl:right-24 bottom-[145px] pointer-events-none z-0 hidden xl:block opacity-[0.25] blur-[0.5px]">
            <svg className="w-12 h-12 text-green-500 fill-current" viewBox="0 0 24 24">
              <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L7.04,18.5C8.89,19.34 11.23,19.46 13,18.5C18.5,15.5 19,8 19,8H17M11.66,16.29C10.36,16.62 9,16.29 8,15.29L15.36,7.93C15.21,9.73 13.9,15.72 11.66,16.29Z" />
            </svg>
          </div>

          {/* Bottom Right Community Illustration */}
          <div className="absolute right-2 2xl:right-12 bottom-[80px] z-10 hidden xl:block animate-community pointer-events-none">
            <img src="/community_right.png" className="max-w-[220px] 2xl:max-w-[260px]" alt="Celebrating Success" style={{ opacity: 0.85 }} />
          </div>

          {/* Flowing Gradient Wave Divider at Bottom */}
          <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden pointer-events-none z-10" style={{ height: '180px' }}>
            <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 180" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,90 C360,150 720,30 1080,120 C1260,165 1380,135 1440,120 L1440,180 L0,180 Z" fill="rgba(245,236,255,0.45)" />
              <path d="M0,120 C480,30 960,150 1440,90 L1440,180 L0,180 Z" fill="url(#wave-grad)" />
              <defs>
                <linearGradient id="wave-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f5ecff" />
                  <stop offset="50%" stopColor="#e9d5ff" />
                  <stop offset="100%" stopColor="#fce7f3" />
                </linearGradient>
              </defs>
            </svg>
          </div>

        </div>
      </main>

      <Dialog open={!!activeDept} onOpenChange={(open) => !open && setActiveDept(null)}>
        <DialogContent className="max-w-md rounded-[2rem] md:rounded-[2.5rem] p-0 border-none overflow-hidden" style={{ boxShadow: '0 24px 80px rgba(124, 58, 237, 0.25), inset 0 1px 0 rgba(255,255,255,0.9)' }}>
          <DialogHeader className="p-8 bg-gradient-to-br from-violet-600 to-violet-800 text-white text-left shrink-0">
            <DialogTitle className="text-2xl font-black font-headline tracking-tight">{activeDept} Specializations</DialogTitle>
            <DialogDescription className="text-violet-200 font-bold mt-1 text-xs uppercase tracking-wider">Select your preferred vertical.</DialogDescription>
          </DialogHeader>
          <div className="p-6 grid grid-cols-1 gap-3 bg-white">
            {(activeDept && (ROLE_CLASSIFICATION as any)[activeDept])?.map((des: string) => (
              <button 
                key={des} 
                className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-violet-200 hover:bg-violet-50 transition-all group clay-card"
                onClick={() => {
                  setActiveDept(null);
                  router.push(`/jobs?category=${encodeURIComponent(des)}&sort=${sortBy}`);
                }}
              >
                <span className="font-bold text-slate-700 group-hover:text-violet-600 transition-colors text-sm">{des}</span>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
