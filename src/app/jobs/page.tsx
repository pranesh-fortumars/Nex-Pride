
"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { JobListing } from "@/lib/types";
import { JobCard } from "@/components/jobs/JobCard";
import { 
  Search, 
  MapPin, 
  Filter, 
  X, 
  SlidersHorizontal, 
  IndianRupee, 
  Briefcase, 
  LocateFixed, 
  ChevronRight,
  MessageCircle,
  Headphones,
  ShieldCheck,
  ArrowRight,
  Building2,
  PlusCircle,
  ChevronLeft,
  User,
  Navigation,
  CheckCircle2,
  Loader2,
  Clock,
  Heart,
  UserCheck,
  AlertTriangle
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { useFirestore, useCollection, useAuth, useDoc } from "@/firebase";
import { collection, query, where, orderBy, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";

type PageProps = {
  params: Promise<{ [key: string]: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default function JobsPage(props: PageProps) {
  const params = React.use(props.params);
  const searchParams = React.use(props.searchParams);
  const { t } = useLanguage();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  
  const userRef = useMemo(() => auth.currentUser ? doc(db, "Users", auth.currentUser.uid) : null, [db, auth.currentUser]);
  const { data: userProfile, loading: profileLoading } = useDoc<any>(userRef);
  const masterDesignationsQuery = useMemo(() => query(collection(db, "Designations")), [db]);
  const { data: rawDesignations } = useCollection<any>(masterDesignationsQuery);

  // Mandatory Profile Redirect
  useEffect(() => {
    if (!profileLoading && userProfile && userProfile.role === 'job_seeker' && !userProfile.onboarded) {
      router.push("/seeker/onboarding");
    }
  }, [userProfile, profileLoading, router]);

  const initialCategory = typeof searchParams?.category === 'string' ? searchParams.category : 'all';
  const initialType = typeof searchParams?.type === 'string' ? searchParams.type : 'all';
  const initialSort = typeof searchParams?.sort === 'string' ? searchParams.sort : 'latest';
  const initialLocation = typeof searchParams?.location === 'string' ? searchParams.location : 'all';
  const initialEmployer = typeof searchParams?.employer === 'string' ? searchParams.employer : 'all';

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    category: initialCategory,
    employer: initialEmployer,
    location: initialLocation,
    type: initialType,
    designation: 'all',
    department: "all",
    accommodation: false,
    food: false,
    gender: "any",
    minSalary: 0,
    maxExperience: 20,
    nearMe: false,
    maxDistance: 10
  });

  const [sortBy, setSortBy] = useState(initialSort);
  const [currentPage, setCurrentPage] = useState(1);

  const searchParamsType = searchParams?.type;
  const searchParamsCategory = searchParams?.category;
  const searchParamsLocation = searchParams?.location;
  const searchParamsSort = searchParams?.sort;
  const searchParamsEmployer = searchParams?.employer;

  useEffect(() => {
    const type = typeof searchParamsType === 'string' ? searchParamsType : 'all';
    const cat = typeof searchParamsCategory === 'string' ? searchParamsCategory : 'all';
    const loc = typeof searchParamsLocation === 'string' ? searchParamsLocation : 'all';
    const s = typeof searchParamsSort === 'string' ? searchParamsSort : 'latest';
    const emp = typeof searchParamsEmployer === 'string' ? searchParamsEmployer : 'all';

    setFilters(prev => ({
      ...prev,
      type: type,
      category: cat.trim(),
      location: loc,
      employer: emp
    }));
    setSortBy(s);
  }, [searchParamsType, searchParamsCategory, searchParamsLocation, searchParamsSort, searchParamsEmployer]);

  // Real-time Firestore Jobs
  const jobsQuery = useMemo(() => {
    return query(
      collection(db, "Jobs"),
      where("status", "==", "approved")
    );
  }, [db]);
  
  const { data: liveJobs, loading: jobsLoading } = useCollection<JobListing>(jobsQuery as any);

  const appsQuery = useMemo(() => {
    if (!auth.currentUser) return null;
    return query(collection(db, "Applications"), where("jobSeekerId", "==", auth.currentUser.uid));
  }, [db, auth.currentUser]);
  const { data: userApps } = useCollection<any>(appsQuery);

  const appliedJobIds = useMemo(() => {
    if (!userApps) return new Set<string>();
    return new Set(userApps.map(app => app.jobId));
  }, [userApps]);

  const allJobs = useMemo(() => {
    return (liveJobs || []).map(j => ({
      ...j,
      jobId: j.jobId || (j as any).id,
      createdAt: j.createdAt || new Date(0).toISOString()
    }));
  }, [liveJobs]);

  const designationsList = useMemo(() => {
    let list: string[] = [];
    if (rawDesignations && rawDesignations.length > 0) {
      list = rawDesignations.filter((d: any) => d.isActive !== false).map((d: any) => d.title || d.name);
    } else if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sim_designations');
      if (saved) {
        list = JSON.parse(saved).filter((d: any) => d.isActive !== false).map((d: any) => d.title || d.name);
      }
    }
    if (list.length === 0) {
      list = ["Software Engineer", "Merchandising Assistant", "Senior Tailor"];
    }
    const activeJobDesignations = allJobs.map(j => j.designation).filter(Boolean);
    return Array.from(new Set([...list, ...activeJobDesignations].map(d => d?.trim()).filter(Boolean)));
  }, [rawDesignations, allJobs]);

  const filteredJobs = useMemo(() => {
    const queryLower = searchQuery.toLowerCase().trim();
    const catFilterLower = filters.category.toLowerCase().trim();

    return allJobs.filter(job => {
      // 1. Search Query Match
      const textToSearch = [
        job.jobTitle,
        job.companyName,
        job.location,
        job.department,
        job.designation,
        job.category
      ].join(" ").toLowerCase();
      const matchesSearch = queryLower === "" || textToSearch.includes(queryLower);

      // 2. Job Type Match
      const matchesType = filters.type === 'all' || job.category === filters.type;

      // 3. Category/Role Match
      const matchesCategory = filters.category === "all" || 
        (job.designation || "").toLowerCase().includes(catFilterLower) || 
        (job.department || "").toLowerCase().includes(catFilterLower) ||
        (job.category || "").toLowerCase().includes(catFilterLower);

      // 4. Location Match
      const matchesLocationSelect = filters.location === "all" || (
        job.location?.toLowerCase().includes(filters.location.toLowerCase()) ||
        (t.locations[filters.location as keyof typeof t.locations] && 
         job.location?.toLowerCase().includes(t.locations[filters.location as keyof typeof t.locations].toLowerCase())) ||
        job.location?.toLowerCase() === filters.location.toLowerCase()
      );

      // 5. Benefit Filters
      const matchesAccommodation = !filters.accommodation || job.accommodationProvided;
      const matchesFood = !filters.food || job.foodProvided;

      // 6. Demographic Filters
      const matchesGender = filters.gender === "any" || job.genderPreference === filters.gender;
      
      // 7. Salary & Experience
      const matchesSalary = (job.salaryMax || 999999) >= filters.minSalary;
      const matchesExperience = (job.experienceRequired || 0) <= filters.maxExperience;
      
      // 8. Distance Logic
      const hasCoords = job.latitude !== undefined && job.latitude !== null;
      const matchesDistance = !filters.nearMe || !hasCoords || (job.distance || 0) <= filters.maxDistance;
      
      // 9. Designation Filter Match
      const matchesDesignation = filters.designation === 'all' || job.designation === filters.designation;

      // 10. Employer Filter Match
      const matchesEmployer = filters.employer === 'all' || job.employerId === filters.employer;
      
      return matchesSearch && matchesType && matchesCategory && matchesLocationSelect && matchesAccommodation && matchesFood && matchesGender && matchesSalary && matchesExperience && matchesDistance && matchesDesignation && matchesEmployer;
    });
  }, [allJobs, filters, searchQuery, t.locations]);

  const sortedJobs = useMemo(() => {
    const jobs = [...filteredJobs];
    
    // Function to check if interview date has passed
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

    jobs.sort((a, b) => {
      const compA = isCompleted(a) ? 1 : 0;
      const compB = isCompleted(b) ? 1 : 0;
      // Active jobs (0) come before completed jobs (1)
      if (compA !== compB) return compA - compB;

      if (sortBy === "salary-high") return (b.salaryMax || 0) - (a.salaryMax || 0);
      if (sortBy === "exp-low") return (a.experienceRequired || 0) - (b.experienceRequired || 0);
      if (sortBy === "nearby") return (a.distance || 0) - (b.distance || 0);

      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    return jobs;
  }, [filteredJobs, sortBy]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(sortedJobs.length / itemsPerPage);
  
  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedJobs.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedJobs, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, sortBy]);

  if (profileLoading) {
    return <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
      <p className="font-bold text-muted-foreground">Authenticating Inclusive Hub...</p>
    </div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-grow pb-8">
        <div className="bg-primary py-4 md:py-6 shadow-inner">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-2xl md:text-3xl font-extrabold font-headline mb-3 md:mb-5 text-white text-center md:text-left">
              {filters.employer !== 'all' ? "Company Openings" : t.findJobs}
            </h1>
            <div className="flex flex-col md:flex-row gap-2.5 md:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                <Input 
                  placeholder={t.searchPlaceholder} 
                  className="pl-10 md:pl-12 h-11 md:h-14 bg-white border-none shadow-sm md:shadow-lg rounded-xl md:rounded-2xl text-base md:text-lg font-bold" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 w-full md:flex md:gap-3 md:flex-1">
                <div className="col-span-1 md:w-48">
                  <Select value={filters.type} onValueChange={(val) => setFilters(prev => ({ ...prev, type: val }))}>
                    <SelectTrigger className="h-10 md:h-14 bg-white border-none shadow-sm md:shadow-lg rounded-xl md:rounded-2xl text-[10px] md:text-lg font-bold px-2 md:px-4">
                      <div className="flex items-center gap-1 md:gap-2"><User className="w-3 h-3 md:w-5 md:h-5 text-primary shrink-0" /><SelectValue placeholder={t.allTypes} /></div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all" className="font-bold">{t.allTypes}</SelectItem>
                      <SelectItem value="Worker" className="font-bold">{t.worker}</SelectItem>
                      <SelectItem value="Staff" className="font-bold">{t.staff}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1 md:flex-1">
                  <Select value={filters.location} onValueChange={(val) => setFilters(prev => ({ ...prev, location: val }))}>
                    <SelectTrigger className="h-10 md:h-14 bg-white border-none shadow-sm md:shadow-lg rounded-xl md:rounded-2xl text-[10px] md:text-lg font-bold px-2 md:px-4">
                      <div className="flex items-center gap-1 md:gap-2"><MapPin className="w-3 h-3 md:w-5 md:h-5 text-primary shrink-0" /><SelectValue placeholder={t.filterByLocation} /></div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all" className="font-bold">{t.locations.all}</SelectItem>
                      <SelectItem value="avinashi" className="font-bold">{t.locations.avinashi}</SelectItem>
                      <SelectItem value="pnroad" className="font-bold">{t.locations.pnroad}</SelectItem>
                      <SelectItem value="palladam" className="font-bold">{t.locations.palladam}</SelectItem>
                      <SelectItem value="kangeyam" className="font-bold">{t.locations.kangeyam}</SelectItem>
                      <SelectItem value="knppuram" className="font-bold">{t.locations.knppuram}</SelectItem>
                      <SelectItem value="thennampalayam" className="font-bold">{t.locations.thennampalayam}</SelectItem>
                      <SelectItem value="dharapuram" className="font-bold">{t.locations.dharapuram}</SelectItem>
                      <SelectItem value="others" className="font-bold">{t.locations.others}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1 md:flex-1">
                  <Select value={filters.designation} onValueChange={(val) => setFilters(prev => ({ ...prev, designation: val }))}>
                    <SelectTrigger className="h-10 md:h-14 bg-white border-none shadow-sm md:shadow-lg rounded-xl md:rounded-2xl text-[10px] md:text-lg font-bold px-2 md:px-4">
                      <div className="flex items-center gap-1 md:gap-2"><Briefcase className="w-3 h-3 md:w-5 md:h-5 text-primary shrink-0" /><SelectValue placeholder="All Roles" /></div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all" className="font-bold">All Roles</SelectItem>
                      {designationsList.map((d: string) => (
                        <SelectItem key={d} value={d} className="font-bold">{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {filters.category !== 'all' && (
              <div className="mt-4 flex items-center gap-2 animate-in slide-in-from-left-4">
                <Badge className="bg-accent text-accent-foreground font-black px-4 py-1.5 rounded-lg flex items-center gap-2">
                  Role: {filters.category} 
                  <button onClick={() => setFilters(p => ({...p, category: 'all'}))} className="hover:scale-125 transition-transform"><X className="w-3 h-3" /></button>
                </Badge>
              </div>
            )}
            {filters.employer !== 'all' && (
              <div className="mt-4 flex items-center gap-2 animate-in slide-in-from-left-4">
                <Badge className="bg-white text-primary font-black px-4 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
                  <Building2 className="w-4 h-4" /> Company Filter Applied
                  <button onClick={() => {
                    setFilters(p => ({...p, employer: 'all'}));
                    router.push('/jobs');
                  }} className="hover:scale-125 transition-transform ml-1"><X className="w-3 h-3" /></button>
                </Badge>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {jobsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="font-bold text-muted-foreground">Syncing Live Jobs...</p>
            </div>
          ) : sortedJobs.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {paginatedJobs.map((job) => (
                  <JobCard key={job.jobId} job={job} isApplied={appliedJobIds.has(job.jobId)} />
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10 pb-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setCurrentPage(p => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                    className="font-bold rounded-xl"
                  >
                    <ChevronLeft className="w-4 h-4 md:mr-1" /> <span className="hidden md:inline">Prev</span>
                  </Button>
                  
                  <div className="flex gap-1.5 overflow-x-auto max-w-[200px] sm:max-w-none no-scrollbar">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <Button
                        key={i}
                        variant={currentPage === i + 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setCurrentPage(i + 1);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`w-9 h-9 p-0 shrink-0 font-bold rounded-xl ${currentPage === i + 1 ? 'shadow-md' : ''}`}
                      >
                        {i + 1}
                      </Button>
                    ))}
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setCurrentPage(p => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === totalPages}
                    className="font-bold rounded-xl"
                  >
                    <span className="hidden md:inline">Next</span> <ChevronRight className="w-4 h-4 md:ml-1" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed flex flex-col items-center justify-center space-y-6">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-muted-foreground shadow-sm">
                 <AlertTriangle className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black">{t.noResults}</h3>
                <p className="text-muted-foreground font-medium max-w-sm mx-auto">{t.tryRemoving}</p>
                <Button 
                  variant="outline" 
                  onClick={() => setFilters({
                    category: 'all',
                    employer: 'all',
                    location: 'all',
                    type: 'all',
                    designation: "all",
                    department: "all",
                    accommodation: false,
                    food: false,
                    gender: "any",
                    minSalary: 0,
                    maxExperience: 20,
                    nearMe: false,
                    maxDistance: 10
                  })}
                  className="mt-4 rounded-xl font-bold border-primary text-primary"
                >
                  {t.clearAll}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
