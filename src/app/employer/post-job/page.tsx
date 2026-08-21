"use client";

import { useState, useMemo, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { 
  Briefcase, 
  IndianRupee, 
  MapPin, 
  Users, 
  Clock, 
  PlusCircle, 
  Save, 
  ArrowLeft, 
  AlertTriangle, 
  Heart, 
  Bus, 
  Coffee, 
  Calendar as CalendarIcon, 
  User, 
  Zap, 
  ShoppingBag,
  Home,
  ShieldCheck,
  LocateFixed,
  Loader2
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useAuth, useFirestore, useDoc, useCollection } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc, query, setDoc } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import CompanyPhotoUpload from "@/components/CompanyPhotoUpload";

const CLASSIFICATION = {
  Staff: {
    departments: [
      "MERCHANDISING", "FABRIC", "PRINT & EMBROIDERY", "PRODUCTION", "QUALITY", "HR & ADMIN", "ACCOUNTS & DOCS", "CAD & SAMPLING", "ERP/EDP", "STORE", "OTHERS"
    ],
    designations: {
      MERCHANDISING: ["Merchandiser", "Junior Merchandiser", "Senior Merchandiser"],
      FABRIC: ["Fabric Follow-Up", "Fabric Incharge", "Fabric Manager", "Dyeing Followup", "Knitting Followup", "Lot Incharge", "Lot Assistant", "Dyeing Master", "Knitting Supervisor", "Knitting Incharge", "Knitting Manager", "Compacting Manager", "Dyeing Supervisor", "Dyeing Incharge", "Dyeing Manager"],
      "PRINT & EMBROIDERY": ["Print/Embroidery Followup", "Printing Followup"],
      PRODUCTION: ["Cutting Incharge", "Cutting Manager", "Line Supervisor", "Production Incharge", "Production Manager", "Factory Manager", "Finishing Incharge", "Checking Incharge", "Ironing Incharge", "Packing Incharge", "Cutter Machine Operator", "Spreader Operator", "Feeding Incharge", "Industrial Engineer", "Cutting Supervisor"],
      QUALITY: ["Quality Manager", "Quality Controller", "Quality Executive", "Lab Incharge", "Lab Assistant", "Lab Technician"],
      "HR & ADMIN": ["HR Manager", "HR Executive", "HR Assistant", "Admin Manager", "Admin Officer", "Recruitment Officer"],
      "ACCOUNTS & DOCS": ["Accounts cum Documentation Manager", "Accounts Manager", "Documentation Manager", "Documentation Incharge", "Accounts Assistant", "Accounts Executive"],
      "CAD & SAMPLING": ["CAD MASTER", "SAMPLING INCHARGE", "SAMPLE FOLLOWUP", "PATTERN MASTER", "DESIGNER"],
      "ERP/EDP": ["ERP Manager", "ERP Incharge", "EDP Incharge", "Data Entry Operator"],
      STORE: ["Store Incharge", "Store Asst", "Store Keeper"],
      OTHERS: ["Fresher", "Receptionist", "Mechanic", "Warden", "Electrician", "Cook", "Loadman", "Others"]
    }
  },
  Worker: {
    departments: ["CUTTING", "SEWING", "CHECKING", "IRONING & PACKING", "KNITTING", "DYEING", "COMPACTING", "PRINT / EMBROIDERY", "OTHERS"],
    designations: {
      CUTTING: ["Cutting Master", "Cutting Helper", "Cutting Operator", "Spreader Operator", "Stickering Helper", "Cutting Contractor"],
      SEWING: ["Overlock Tailor", "Flatlock Tailor", "Singer Tailor", "Multi Tailor", "Sample Tailor", "Sewing Helper", "Singer Contractor", "Powertable Contractor"],
      CHECKING: ["Trimmer", "Checker", "Stain Remove Operator", "Checking Contractor"],
      "IRONING & PACKING": ["Ironing Master", "Ironing Contractor", "Packer", "Packing Helper", "Packing Contractor", "Needle Detector Operator"],
      KNITTING: ["Knitting Foreman", "Knitting Operator"],
      DYEING: ["Dyeing Operator"],
      COMPACTING: ["Compacting Operator"],
      "PRINT / EMBROIDERY": ["Embroidery Operator", "Embroidery Framer"],
      OTHERS: ["Fusing Operator", "Snap Button Operator", "Fusing Contractor", "Driver", "Security Guard", "Watchman", "Loadman", "Cook", "Others"]
    }
  }
};

export default function PostJobPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { t } = useLanguage();
  const auth = useAuth();
  const db = useFirestore();
  
  const userRef = useMemo(() => auth.currentUser ? doc(db, "Users", auth.currentUser.uid) : null, [db, auth.currentUser]);
  const { data: userData, loading: userLoading } = useDoc<any>(userRef);

  const masterDesignationsQuery = useMemo(() => query(collection(db, "Designations")), [db]);
  const { data: rawDesignations } = useCollection<any>(masterDesignationsQuery);

  const masterDesignations = useMemo(() => {
    if (rawDesignations && rawDesignations.length > 0) {
      return rawDesignations;
    }
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sim_designations');
      if (saved) return JSON.parse(saved);
    }
    return [
      { id: "sim-d-1", title: "Software Engineer", category: "Staff", department: "HR & ADMIN", isActive: true },
      { id: "sim-d-2", title: "Merchandising Assistant", category: "Staff", department: "MERCHANDISING", isActive: true },
      { id: "sim-d-3", title: "Senior Tailor", category: "Worker", department: "SEWING", isActive: true }
    ];
  }, [rawDesignations]);

  const [loading, setLoading] = useState(false);
  const [availableCredits, setAvailableCredits] = useState(0);

  const [category, setCategory] = useState<'Staff' | 'Worker'>('Worker');
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [openings, setOpenings] = useState("1");
  const [experience, setExperience] = useState("0");
  const [gender, setGender] = useState("any");
  const [workType, setWorkType] = useState("Full-time");
  
  const [salaryBasis, setSalaryBasis] = useState("monthly");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [payoutSchedule, setPayoutSchedule] = useState("");
  
  const [location, setLocation] = useState("");
  const [timing, setTiming] = useState("");
  const [description, setDescription] = useState("");
  const [benefits, setBenefits] = useState({ esi: false, epf: false, transport: false, teaCash: false, accommodation: false, food: false, bonus: "8.33" });

  // Location State
  const [isLocating, setIsLocating] = useState(false);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

  // Interview State
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [interviewTimings, setInterviewTimings] = useState("");

  useEffect(() => {
    const simRole = localStorage.getItem('sim_user_role');
    const isDemo = simRole === 'employer' || simRole === 'admin';
    if (!userLoading && userData && !isDemo) {
      if (userData.role !== 'employer' && userData.role !== 'admin') {
        router.push('/');
      } else if (userData.role === 'employer' && userData.status !== 'approved') {
        router.push('/employer/dashboard');
      }
    }
  }, [userData, userLoading, router]);

  useEffect(() => {
    const credits = parseInt(localStorage.getItem('sim_user_credits') || '10');
    setAvailableCredits(credits);
  }, []);

  const departments = useMemo(() => CLASSIFICATION[category].departments, [category]);
  
  const designations = useMemo(() => {
    if (!department) return [];
    const std = (CLASSIFICATION[category].designations as any)[department] || [];
    const masters = (masterDesignations || [])
      .filter((d: any) => d.category === category && d.department === department && d.isActive !== false)
      .map((d: any) => d.title || d.name);
    return Array.from(new Set([...std, ...masters]));
  }, [category, department, masterDesignations]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "Location Not Supported" });
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18`);
          const data = await response.json();
          if (data && data.display_name) {
            const parts = data.display_name.split(',');
            setLocation(parts.slice(0, 3).join(',').trim());
          } else {
            setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
          toast({ title: "Location Captured" });
        } catch (e) {
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        toast({ variant: "destructive", title: "Permission Denied" });
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    if (availableCredits < 1) { 
      toast({ variant: "destructive", title: "No Credits" }); 
      router.push("/pricing"); 
      return; 
    }

    setLoading(true);
    const jobData = {
      employerId: user.uid,
      companyName: userData?.name || localStorage.getItem('sim_user_name') || "Verified Factory",
      companyLogo: userData?.companyLogo || localStorage.getItem('sim_user_logo') || null,
      jobTitle: designation || "Industrial Role",
      category,
      department,
      designation,
      openings: parseInt(openings),
      experienceRequired: parseInt(experience),
      genderPreference: gender,
      workType,
      salaryBasis,
      salaryMin: parseInt(salaryMin.replace(/\D/g, "")) || 0,
      salaryMax: parseInt(salaryMax.replace(/\D/g, "")) || 0,
      payoutSchedule,
      location,
      latitude: coords?.lat || null,
      longitude: coords?.lng || null,
      shiftTiming: timing,
      description,
      benefits,
      interviewStartDate: dateRange?.from?.toISOString() || null,
      interviewEndDate: dateRange?.to?.toISOString() || null,
      interviewTimings: interviewTimings || null,
      status: userData?.trustedEmployer ? "active" : "pending",
      createdAt: new Date().toISOString(),
      views: 0
    };

    const jobsRef = collection(db, "Jobs");
    addDoc(jobsRef, jobData)
      .then((docRef) => {
        if (!userData?.trustedEmployer) {
          addDoc(collection(db, "AdminNotifications"), {
            type: "new_job",
            title: "New Job for Approval",
            message: `${jobData.companyName} has posted a new ${jobData.jobTitle} position.`,
            targetId: docRef.id,
            status: "unread",
            createdAt: serverTimestamp()
          });
        }
        localStorage.setItem('sim_user_credits', (availableCredits - 1).toString());
        toast({ title: userData?.trustedEmployer ? "Job Posted & Active!" : "Job Posted for Approval!" });
        router.push("/employer/dashboard");
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: jobsRef.path,
          operation: 'create',
          requestResourceData: jobData,
        }));
      })
      .finally(() => setLoading(false));
  };

  if (userLoading) return <div className="p-20 text-center font-bold">Checking Factory Status...</div>;

  const hasRequiredPhotos = userData?.companyLogo && 
                            userData?.companyPhotos?.inside?.length > 0 && 
                            userData?.companyPhotos?.outside?.length > 0;

  if (!hasRequiredPhotos && userData?.role === 'employer') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-grow p-4 md:py-12 max-w-4xl mx-auto w-full">
          <CompanyPhotoUpload companyId={auth.currentUser?.uid || ""} onComplete={() => window.location.reload()} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-grow p-4 md:py-12 flex flex-col items-center">
        <form onSubmit={handleSubmit} className="w-full max-w-4xl">
          <Card className="shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="text-center space-y-4 border-b bg-primary/5 pb-10 relative">
              <Button 
                variant="ghost" 
                type="button" 
                className="absolute left-6 top-6 rounded-full" 
                onClick={() => router.push('/employer/dashboard')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <CardTitle className="text-3xl font-extrabold text-primary">{t.postJobNow}</CardTitle>
            </CardHeader>
            <CardContent className="pt-12 px-8 space-y-12">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase text-muted-foreground">{t.categoryLabel}</Label>
                  <Select value={category} onValueChange={(v: any) => { setCategory(v); setDepartment(""); setDesignation(""); }}>
                    <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Staff">{t.staff}</SelectItem>
                      <SelectItem value="Worker">{t.worker}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase text-muted-foreground">{t.departmentLabel}</Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue placeholder="Select Department" /></SelectTrigger>
                    <SelectContent>
                      {departments.map(d => <SelectItem key={d} value={d}>{(t.departments as any)[d] || d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase text-muted-foreground">{t.designationLabel}</Label>
                  <Select value={designation} onValueChange={setDesignation}>
                    <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue placeholder="Select Role" /></SelectTrigger>
                    <SelectContent>
                      {designations.map(d => <SelectItem key={d} value={d}>{(t.designations as any)[d] || d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                 <div className="space-y-6">
                    <h3 className="text-lg font-bold text-primary flex items-center gap-2 border-b pb-2"><Briefcase className="w-5 h-5" /> Basic Details</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-bold text-xs uppercase text-muted-foreground">{t.openingsLabel}</Label>
                          <Input type="number" value={openings} onChange={e => setOpenings(e.target.value)} className="h-12 rounded-xl font-bold" />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold text-xs uppercase text-muted-foreground">{t.maxExperience}</Label>
                          <Input type="number" value={experience} onChange={e => setExperience(e.target.value)} className="h-12 rounded-xl font-bold" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase text-muted-foreground">{t.genderLabel}</Label>
                        <RadioGroup value={gender} onValueChange={setGender} className="flex gap-4">
                          <div className="flex items-center space-x-2"><RadioGroupItem value="any" id="g-any" /><Label htmlFor="g-any" className="cursor-pointer">{t.anyGender}</Label></div>
                          <div className="flex items-center space-x-2"><RadioGroupItem value="male" id="g-male" /><Label htmlFor="g-male" className="cursor-pointer">{t.maleOnly}</Label></div>
                          <div className="flex items-center space-x-2"><RadioGroupItem value="female" id="g-female" /><Label htmlFor="g-female" className="cursor-pointer">{t.femaleOnly}</Label></div>
                        </RadioGroup>
                      </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <h3 className="text-lg font-bold text-primary flex items-center gap-2 border-b pb-2"><IndianRupee className="w-5 h-5" /> Salary & Payout</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-bold text-xs uppercase text-muted-foreground">{t.salaryBasis}</Label>
                          <Select value={salaryBasis} onValueChange={setSalaryBasis}>
                             <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                             <SelectContent>
                                <SelectItem value="monthly">{t.perMonth}</SelectItem>
                                {category === 'Worker' && (
                                  <>
                                    <SelectItem value="shift">{t.perShift}</SelectItem>
                                    <SelectItem value="piece">{t.perPiece}</SelectItem>
                                  </>
                                )}
                             </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold text-xs uppercase text-muted-foreground">{t.payoutTiming}</Label>
                          <Input value={payoutSchedule} onChange={e => setPayoutSchedule(e.target.value)} placeholder={t.payoutTimingPlaceholder} className="h-12 rounded-xl font-bold" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-bold text-xs uppercase text-muted-foreground">{t.minSalary}</Label>
                          <Input type="number" value={salaryMin} onChange={e => setSalaryMin(e.target.value)} placeholder={salaryBasis === 'monthly' ? "₹ 15,000" : "₹ 400"} className="h-12 rounded-xl font-bold" />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold text-xs uppercase text-muted-foreground">{t.maxSalary}</Label>
                          <Input type="number" value={salaryMax} onChange={e => setSalaryMax(e.target.value)} placeholder={salaryBasis === 'monthly' ? "₹ 25,000" : "₹ 600"} className="h-12 rounded-xl font-bold" />
                        </div>
                      </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-6 bg-primary/5 p-8 rounded-[2rem] border-2 border-dashed border-primary/20">
                <h3 className="text-xl font-black text-primary flex items-center gap-2"><CalendarIcon className="w-6 h-6" /> {t.interviewSchedule}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase text-muted-foreground">{t.interviewDates}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full h-12 justify-start text-left font-bold rounded-xl bg-white", !dateRange && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "LLL dd")} - ${format(dateRange.to, "LLL dd, y")}` : format(dateRange.from, "LLL dd, y")) : <span>{t.selectDateRange}</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl" align="start">
                        <Calendar initialFocus mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} fromDate={new Date()} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase text-muted-foreground">{t.interviewTimings}</Label>
                    <Input value={interviewTimings} onChange={e => setInterviewTimings(e.target.value)} placeholder={t.timingsPlaceholder} className="h-12 rounded-xl font-bold bg-white" />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-bold text-primary flex items-center gap-2 border-b pb-2"><MapPin className="w-5 h-5" /> Logistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <Label className="font-bold text-xs uppercase text-muted-foreground">{t.location}</Label>
                      <Select value={location} onValueChange={setLocation}>
                        <SelectTrigger className="h-12 rounded-xl font-bold bg-white"><SelectValue placeholder="Select Location" /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(t.locations || {})
                            .filter(([key]) => key !== 'all')
                            .map(([key, val]) => (
                              <SelectItem key={key} value={key} className="font-semibold">{val as string}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase text-muted-foreground">{t.shiftTimingLabel}</Label>
                    <Input value={timing} onChange={e => setTiming(e.target.value)} placeholder="9 AM - 7 PM" className="h-12 rounded-xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase text-muted-foreground">{t.workTypeLabel}</Label>
                    <Select value={workType} onValueChange={setWorkType}>
                      <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Shift">Shift</SelectItem>
                        <SelectItem value="Piece Rate">Piece Rate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                 <h3 className="text-lg font-bold text-primary flex items-center gap-2 border-b pb-2"><Heart className="w-5 h-5" /> Benefits</h3>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { id: 'esi', label: t.esiEpf, icon: <ShieldCheck className="w-4 h-4" /> },
                      { id: 'transport', label: t.transport, icon: <Bus className="w-4 h-4" /> },
                      { id: 'teaCash', label: t.teaCash, icon: <Coffee className="w-4 h-4" /> },
                      { id: 'food', label: t.food, icon: <ShoppingBag className="w-4 h-4" /> },
                      { id: 'accommodation', label: t.accommodation, icon: <Home className="w-4 h-4" /> },
                    ].map(benefit => (
                      <div 
                        key={benefit.id} 
                        className={cn("flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer font-bold text-xs", (benefits as any)[benefit.id] ? "bg-primary/5 border-primary text-primary shadow-sm" : "bg-white border-muted text-muted-foreground")}
                        onClick={() => setBenefits(prev => ({...prev, [benefit.id]: !(prev as any)[benefit.id]}))}
                      >
                        {benefit.icon} {benefit.label}
                      </div>
                    ))}
                 </div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-muted-foreground">{t.requirements}</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the job..." className="min-h-[150px] rounded-2xl font-bold" />
              </div>
            </CardContent>
            <CardFooter className="p-8 border-t bg-muted/5 flex flex-col gap-4">
              {userData?.trustedEmployer && (
                <div className="w-full bg-green-50 text-green-700 border border-green-200 rounded-xl p-4 flex gap-3 items-center shadow-sm">
                  <ShieldCheck className="w-6 h-6 shrink-0 text-green-600" />
                  <div>
                    <p className="font-bold text-sm">Trusted Company Status</p>
                    <p className="text-xs font-semibold text-green-700/80">Your jobs are auto-approved and will go live instantly without waiting for admin review.</p>
                  </div>
                </div>
              )}
              <Button disabled={loading || availableCredits < 1} type="submit" className="w-full h-14 font-bold bg-primary text-white rounded-2xl shadow-lg text-lg">
                {loading ? "Posting..." : <><Zap className="w-5 h-5 mr-2" /> {t.postJobNow}</>}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </main>
    </div>
  );
}
