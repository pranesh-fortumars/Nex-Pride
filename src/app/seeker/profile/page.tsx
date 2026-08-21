
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  User, MapPin, Briefcase, Phone, Save, ArrowLeft, GraduationCap, CheckCircle2, Heart, Trash2, 
  AlertTriangle, X, Plus, Calendar as CalendarIcon, Download, ShieldCheck, UserCheck, Clock, 
  IndianRupee, Camera, Upload, Loader2, Zap, Tag, RefreshCw, Info 
} from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, differenceInYears } from "date-fns";
import { useAuth, useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, setDoc, serverTimestamp, deleteDoc, collection, query, updateDoc } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";

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

export default function SeekerProfilePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();
  
  const userRef = useMemo(() => auth.currentUser ? doc(db, "Users", auth.currentUser.uid) : null, [db, auth.currentUser]);
  const { data: userData, loading: userLoading } = useDoc<any>(userRef);

  const masterDesignationsQuery = useMemo(() => query(collection(db, "Designations")), [db]);
  const { data: masterDesignations } = useCollection<any>(masterDesignationsQuery);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    location: "avinashi",
    category: "Worker" as 'Staff' | 'Worker',
    department: "",
    designation: "",
    experience: "0",
    otherLocation: "",
    otherDesignation: "",
    dob: null as string | null,
    gender: "transWoman",
    phone: "",
    hasTwoWheeler: false,
    bio: "",
    photo: ""
  });

  const [resumeData, setResumeData] = useState<any>({
    personal: { 
      fullName: "", 
      gender: "transWoman", 
      dob: null, 
      languages: [], 
      location: "", 
      mobile: "", 
      hasTwoWheeler: false, 
      profileImage: "",
      certificationAccepted: false 
    },
    academic: [{ education: "Graduate", degree: "", institute: "", year: "", percentage: "" }],
    professional: { 
      totalExperience: "0", 
      noticePeriod: "Immediate join", 
      noticeDate: null, 
      coreSkills: [], 
      complianceKnowledge: [], 
      previousBrands: "", 
      lastSalary: "", 
      expectedSalary: "",
      bio: ""
    },
    recentCompany: [{ name: "", position: "", startDate: "", endDate: "", isCurrent: false }],
    references: [{ name: "", designation: "", company: "", contact: "" }]
  });

  const [langInput, setLangInput] = useState("");
  const [skillInput, setSkillInput] = useState("");

  const designations = useMemo(() => {
    if (!formData.department || !formData.category) return [];
    const categoryData = (CLASSIFICATION as any)[formData.category];
    if (!categoryData) return [];
    const std = (categoryData.designations as any)[formData.department] || [];
    const masters = (masterDesignations || [])
      .filter((d: any) => d.category === formData.category && d.department === formData.department)
      .map((d: any) => d.name);
    return Array.from(new Set([...std, ...masters]));
  }, [formData.category, formData.department, masterDesignations]);

  useEffect(() => {
    if (userData && !hasInitialized) {
      const dbCategory = userData.category || (typeof window !== 'undefined' ? localStorage.getItem('sim_job_seeker_category') : "Worker") || "Worker";
      
      setFormData({
        name: userData.name || "",
        location: userData.location || "avinashi",
        category: dbCategory as 'Staff' | 'Worker',
        department: userData.department || "",
        designation: userData.designation || "",
        experience: userData.experience || "0",
        otherLocation: userData.otherLocation || "",
        otherDesignation: userData.otherDesignation || "",
        dob: userData.dob || null,
        gender: userData.gender || "transWoman",
        phone: userData.phone || userData.mobile || "",
        hasTwoWheeler: userData.hasTwoWheeler || false,
        bio: userData.bio || "",
        photo: userData.photo || ""
      });

      if (userData.digitalResume) {
        const dr = userData.digitalResume;
        setResumeData({
          ...dr,
          academic: Array.isArray(dr.academic) ? dr.academic : [{ education: "Graduate", degree: "", institute: "", year: "", percentage: "" }],
          recentCompany: Array.isArray(dr.recentCompany) ? dr.recentCompany : [{ name: "", position: "", startDate: "", endDate: "", isCurrent: false }],
          references: Array.isArray(dr.references) ? dr.references : [{ name: "", designation: "", company: "", contact: "" }],
          professional: {
            ...dr.professional,
            coreSkills: Array.isArray(dr.professional?.coreSkills) ? dr.professional.coreSkills : [],
            complianceKnowledge: Array.isArray(dr.professional?.complianceKnowledge) ? dr.professional.complianceKnowledge : [],
            bio: dr.professional?.bio || userData.bio || ""
          }
        });
      } else {
        setResumeData((prev: any) => ({
          ...prev,
          personal: {
            ...prev.personal,
            mobile: userData.phone || userData.mobile || "",
            profileImage: userData.photo || ""
          },
          professional: {
            ...prev.professional,
            bio: userData.bio || ""
          }
        }));
      }
      setHasInitialized(true);
    }
  }, [userData, hasInitialized]);

  const processImage = (input: File | string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new (window as any).Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      
      if (typeof input === 'string') {
        img.src = input;
      } else {
        const reader = new FileReader();
        reader.onload = (e) => (img.src = e.target?.result as string);
        reader.onerror = () => reject(new Error("File reader error"));
        reader.readAsDataURL(input);
      }
    });
  };

  const sanitizePayload = (obj: any): any => {
    const isPlainObject = (item: any) => {
      return item !== null && typeof item === 'object' && item.constructor === Object;
    };

    const removeUndefined = (data: any): any => {
      if (data === undefined) return null;
      if (data === null) return null;
      if (Array.isArray(data)) return data.map(removeUndefined);
      if (typeof data === 'object') {
        if (!isPlainObject(data)) return data;
        const result: any = {};
        for (const key in data) {
          const val = removeUndefined(data[key]);
          result[key] = val;
        }
        return result;
      }
      return data;
    };
    return removeUndefined(obj);
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!auth.currentUser || !userRef) return;

    if (!formData.name.trim()) return toast({ variant: "destructive", title: "Name Required" });
    if (!formData.phone || formData.phone.length !== 10) return toast({ variant: "destructive", title: "Valid 10-digit Mobile Required" });
    if (!formData.location) return toast({ variant: "destructive", title: "Location Required" });
    if (!formData.department) return toast({ variant: "destructive", title: "Department Required" });
    if (!formData.designation) return toast({ variant: "destructive", title: "Designation Required" });
    if (!formData.dob) return toast({ variant: "destructive", title: "Birthday Required" });

    const age = differenceInYears(new Date(), new Date(formData.dob));
    if (age < 18) {
      toast({ variant: "destructive", title: "Age Restriction", description: "You must be at least 18 years old." });
      return;
    }

    if (formData.category === 'Staff') {
      if (!formData.bio || formData.bio.length < 5) return toast({ variant: "destructive", title: "Bio Required" });
      if (!resumeData.professional.expectedSalary) return toast({ variant: "destructive", title: "Expected Salary Required" });
      if (!resumeData.personal.certificationAccepted) return toast({ variant: "destructive", title: "Certification Required" });
    }

    setLoading(true);

    const currentPhoto = formData.photo || resumeData.personal.profileImage || userData?.photo || "";

    const finalResume = {
      ...resumeData,
      personal: {
        ...resumeData.personal,
        fullName: formData.name,
        gender: formData.gender,
        dob: formData.dob,
        location: formData.location,
        mobile: formData.phone,
        hasTwoWheeler: formData.hasTwoWheeler,
        profileImage: currentPhoto
      },
      professional: {
        ...resumeData.professional,
        bio: formData.bio
      }
    };

    const updatePayload = sanitizePayload({
      ...formData,
      photo: currentPhoto,
      preference: formData.category.toLowerCase(),
      digitalResume: formData.category === 'Staff' ? finalResume : (userData?.digitalResume || null),
      updatedAt: serverTimestamp(),
      onboarded: true
    });

    setDoc(userRef, updatePayload, { merge: true })
      .then(() => {
        toast({ title: "Profile Saved!" });
        if (typeof window !== 'undefined') {
          localStorage.setItem('sim_job_seeker_category', formData.category);
          localStorage.setItem('sim_user_name', formData.name);
          localStorage.setItem('sim_seeker_onboarded', 'true');
        }
        router.push("/");
      })
      .catch(async (error: any) => {
        console.error("Profile Save Error:", error);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path,
          operation: 'write',
          requestResourceData: updatePayload,
        }));
      })
      .finally(() => setLoading(false));
  };

  const handleCategorySwitch = (v: 'Staff' | 'Worker') => {
    const isSavedCategory = v === userData?.category;
    setFormData(prev => ({ 
      ...prev, 
      category: v, 
      department: isSavedCategory ? (userData?.department || "") : "", 
      designation: isSavedCategory ? (userData?.designation || "") : "" 
    }));
  };

  const addChip = (section: 'languages' | 'coreSkills', val: string) => {
    if (!val.trim()) return;
    if (section === 'languages') {
      setResumeData((prev: any) => ({ ...prev, personal: { ...prev.personal, languages: [...new Set([...prev.personal.languages, val.trim()])] } }));
    } else {
      setResumeData((prev: any) => ({ ...prev, professional: { ...prev.professional, [section]: [...new Set([...prev.professional[section], val.trim()])] } }));
    }
  };

  const removeChip = (section: 'languages' | 'coreSkills', val: string) => {
    if (section === 'languages') {
      setResumeData((prev: any) => ({ ...prev, personal: { ...prev.personal, languages: prev.personal.languages.filter((l: string) => l !== val) } }));
    } else {
      setResumeData((prev: any) => ({ ...prev, professional: { ...prev.professional, [section]: prev.professional[section].filter((s: string) => s !== val) } }));
    }
  };

  const addRow = (section: 'academic' | 'recentCompany' | 'references') => {
    const templates = {
      academic: { education: "Graduate", degree: "", institute: "", year: "", percentage: "" },
      recentCompany: { name: "", position: "", startDate: "", endDate: "", isCurrent: false },
      references: { name: "", designation: "", company: "", contact: "" }
    };
    setResumeData((prev: any) => ({ ...prev, [section]: [...prev[section], templates[section]] }));
  };

  const updateRow = (section: 'academic' | 'recentCompany' | 'references', idx: number, field: string, val: any) => {
    const newData = [...resumeData[section]];
    newData[idx] = { ...newData[idx], [field]: val };
    setResumeData((prev: any) => ({ ...prev, [section]: newData }));
  };

  const removeRow = (section: 'academic' | 'recentCompany' | 'references', idx: number) => {
    if (resumeData[section].length <= 1) return;
    setResumeData((prev: any) => ({ ...prev, [section]: prev[section].filter((_: any, i: number) => i !== idx) }));
  };

  const handleSalaryInput = (field: 'lastSalary' | 'expectedSalary', val: string) => {
    const numeric = val.replace(/\D/g, "");
    const formatted = numeric ? `₹ ${parseInt(numeric).toLocaleString('en-IN')}` : "";
    setResumeData((prev: any) => ({
      ...prev,
      professional: { ...prev.professional, [field]: formatted }
    }));
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setIsCameraActive(true);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (error) {
      toast({ variant: 'destructive', title: t.cameraPermissionDenied });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current && auth.currentUser) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setUploading(true);
        try {
          const optimizedBase64 = await processImage(dataUrl);
          setFormData(prev => ({ ...prev, photo: optimizedBase64 }));
          setResumeData((prev: any) => ({ ...prev, personal: { ...prev.personal, profileImage: optimizedBase64 } }));
          
          if (userRef) {
            const syncData: any = { photo: optimizedBase64, updatedAt: serverTimestamp() };
            if (formData.category === 'Staff') {
              syncData["digitalResume.personal.profileImage"] = optimizedBase64;
            }
            await setDoc(userRef, syncData, { merge: true });
          }
          toast({ title: "Photo Captured" });
        } catch (error: any) {
          console.error("Profile Photo Capture Error:", error);
          toast({ variant: "destructive", title: "Capture Failed" });
        } finally {
          setUploading(false);
          stopCamera();
        }
      }
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!auth.currentUser) return;
    if (!file.type.startsWith('image/')) return;

    setUploading(true);
    try {
      const base64 = await processImage(file);
      setFormData(prev => ({ ...prev, photo: base64 }));
      setResumeData((prev: any) => ({ ...prev, personal: { ...prev.personal, profileImage: base64 } }));
      
      if (userRef) {
        const syncData: any = { photo: base64, updatedAt: serverTimestamp() };
        if (formData.category === 'Staff') {
          syncData["digitalResume.personal.profileImage"] = base64;
        }
        await setDoc(userRef, syncData, { merge: true });
      }
      toast({ title: "Photo Updated" });
    } catch (error: any) {
      console.error("Profile Photo Upload Error:", error);
      toast({ variant: "destructive", title: "Upload Failed" });
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleDeleteAccount = async () => {
    if (!auth.currentUser || !userRef) return;
    try {
      await deleteDoc(userRef);
      await auth.currentUser.delete();
      localStorage.clear();
      router.push("/");
      toast({ title: t.deleteSuccess });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-grow p-4 md:py-12 flex justify-center items-start">
        <div className="w-full max-w-5xl space-y-6">
          <div className="flex justify-between items-center print:hidden">
            <Button variant="ghost" type="button" onClick={() => router.push('/seeker/dashboard')} className="font-bold text-primary hover:text-primary hover:bg-primary/5 active:scale-95 transition-all">
              <ArrowLeft className="w-4 h-4 mr-2" /> {t.backToPrev}
            </Button>
            <div className="flex gap-3">
              <Button onClick={() => window.print()} variant="outline" className="font-bold gap-2 h-11 px-6 rounded-xl border-primary/20 text-primary">
                <Download className="w-4 h-4" /> {t.downloadReport}
              </Button>
              <Button onClick={() => handleSave()} disabled={loading} className="bg-primary text-white font-black gap-2 shadow-lg h-11 px-8 rounded-xl">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save All Changes
              </Button>
            </div>
          </div>

          <div id="resume-report" className="print-area relative bg-white rounded-[2rem] overflow-hidden shadow-2xl border print:shadow-none print:border-none">
            <form onSubmit={handleSave}>
              <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="bg-primary text-white p-8 md:p-12 print:bg-white print:text-primary print:p-6 print:border-b-2 print:border-primary">
                  <div className="flex flex-col md:flex-row justify-between gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-lg">
                           <Heart className="w-10 h-10 text-primary fill-primary" />
                        </div>
                        <span className="text-2xl font-black font-headline">NexPride.in</span>
                      </div>
                      <CardTitle className="text-3xl md:text-5xl font-black font-headline">
                        {formData.name || "Seeker Profile"}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge className="bg-white/20 text-white border-white/20 font-black"><ShieldCheck className="w-4 h-4 mr-1" /> Verified Member</Badge>
                        <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-white border border-white/20">
                           <MapPin className="w-4 h-4" />
                           <span className="text-[10px] md:text-xs font-black uppercase tracking-wider">{t.locations[formData.location as keyof typeof t.locations] || formData.location}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="shrink-0 flex flex-col items-center gap-3">
                      <div className="relative w-32 h-32 md:w-40 md:h-40 print:w-32 print:h-32 rounded-[2rem] overflow-hidden border-4 border-white/30 shadow-2xl bg-white/10 group">
                         {uploading ? (
                           <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                             <div className="flex flex-col items-center gap-2">
                               <Loader2 className="w-8 h-8 animate-spin text-white" />
                               <p className="text-[10px] font-black text-white uppercase">Syncing Database...</p>
                             </div>
                           </div>
                         ) : isCameraActive ? (
                           <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted />
                         ) : (formData.photo || userData?.photo) ? (
                           <img src={formData.photo || userData?.photo} alt="Profile" className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-white/50"><User className="w-16 h-16" /></div>
                         )}
                         <canvas ref={canvasRef} className="hidden" />
                         <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                         {!uploading && !isCameraActive && (
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 text-white print:hidden">
                             <Button size="sm" variant="ghost" type="button" onClick={startCamera} className="hover:bg-white/20 text-white font-bold"><Camera className="w-4 h-4 mr-2" /> Camera</Button>
                             <Button size="sm" variant="ghost" type="button" onClick={() => fileInputRef.current?.click()} className="hover:bg-white/20 text-white font-bold"><Upload className="w-4 h-4 mr-2" /> Upload</Button>
                           </div>
                         )}
                         {isCameraActive && (
                           <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-10 print:hidden">
                             <Button size="icon" type="button" onClick={capturePhoto} className="bg-primary h-10 w-10 rounded-full shadow-lg"><Camera className="w-5 h-5" /></Button>
                             <Button size="icon" type="button" variant="destructive" onClick={stopCamera} className="h-10 w-10 rounded-full shadow-lg"><X className="w-5 h-5" /></Button>
                           </div>
                         )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-10 px-6 md:px-12 space-y-12 pb-10 print:px-8 print:pt-4">
                  <div className="space-y-8">
                    <h3 className="text-xl font-black text-primary flex items-center gap-2 border-b-2 border-primary/10 pb-2 print:text-sm">
                      <User className="w-6 h-6" /> {t.personalInfo}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-2 lg:col-span-2">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">{t.fullNameLabel}</Label>
                        <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-11 font-black rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">{t.mobileLabel}</Label>
                        <Input 
                          value={formData.phone || ""} 
                          onChange={e => setFormData(prev => ({...prev, phone: e.target.value.replace(/\D/g, "").slice(0, 10)}))} 
                          className="h-11 font-black rounded-xl" 
                          placeholder="10 digit number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">{t.genderLabel}</Label>
                        <Select value={formData.gender} onValueChange={v => setFormData({...formData, gender: v})}>
                          <SelectTrigger className="h-11 rounded-xl font-black"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(t.identities || {}).map(([key, val]) => (
                              <SelectItem key={key} value={key}>{val as string}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">{t.dobLabel}</Label>
                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full h-11 justify-start text-left font-black rounded-xl">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.dob ? format(new Date(formData.dob), "dd-MM-yyyy") : "Pick date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                            <Calendar 
                              mode="single" 
                              captionLayout="dropdown"
                              startMonth={new Date(1950, 0)} 
                              endMonth={new Date(new Date().getFullYear() - 18, 11)} 
                              selected={formData.dob ? new Date(formData.dob) : undefined} 
                              onSelect={d => { setFormData({...formData, dob: d?.toISOString() || null}); setIsCalendarOpen(false); }} 
                              initialFocus 
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">{t.locationPlaceholder}</Label>
                        <Select value={formData.location} onValueChange={v => setFormData({...formData, location: v})}>
                          <SelectTrigger className="h-11 rounded-xl font-black"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(t.locations || {}).map(([key, val]) => (
                              <SelectItem key={key} value={key}>{val as string}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <h3 className="text-xl font-black text-primary flex items-center gap-2 border-b-2 border-primary/10 pb-2 print:text-sm">
                      <Tag className="w-6 h-6" /> {t.jobPrefs}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">{t.categoryLabel}</Label>
                        <Select value={formData.category} onValueChange={(v: any) => handleCategorySwitch(v)}>
                          <SelectTrigger className="h-11 rounded-xl font-black"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="Staff">{t.staff}</SelectItem><SelectItem value="Worker">{t.worker}</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">{t.departmentLabel}</Label>
                        <Select value={formData.department} onValueChange={v => setFormData(prev => ({ ...prev, department: v, designation: "" }))}>
                          <SelectTrigger className="h-11 rounded-xl font-black"><SelectValue placeholder="Select Department" /></SelectTrigger>
                          <SelectContent>{((CLASSIFICATION as any)[formData.category]?.departments || []).map((dept: string) => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">{t.designationLabel}</Label>
                        <Select value={formData.designation || ""} onValueChange={v => setFormData(prev => ({ ...prev, designation: v }))}>
                          <SelectTrigger className="h-11 rounded-xl font-black"><SelectValue placeholder="Select Designation" /></SelectTrigger>
                          <SelectContent>{designations.map(des => <SelectItem key={des} value={des}>{des}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <h3 className="text-xl font-black text-primary flex items-center gap-2 border-b-2 border-primary/10 pb-2 print:text-sm">
                      <Info className="w-6 h-6" /> About Me
                    </h3>
                    <div className="space-y-4">
                      <Textarea 
                        value={formData.bio || ""} 
                        onChange={e => setFormData(prev => ({...prev, bio: e.target.value}))} 
                        className="min-h-[120px] rounded-2xl border-primary/10 font-medium italic print:border-none print:p-0"
                        placeholder="I am an experienced..."
                        maxLength={500}
                      />
                    </div>
                  </div>

                  {formData.category === 'Staff' && (
                    <div className="space-y-12 animate-in fade-in">
                      <div className="space-y-8">
                        <div className="flex justify-between items-center border-b-2 border-primary/10 pb-2">
                          <h3 className="text-xl font-black text-primary flex items-center gap-2 print:text-sm">
                            <GraduationCap className="w-6 h-6" /> {t.academic}
                          </h3>
                          <Button type="button" size="sm" onClick={() => addRow('academic')} className="bg-primary text-white font-bold h-9 px-4 rounded-xl gap-1 print:hidden">
                            <Plus className="w-4 h-4" /> Add
                          </Button>
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-muted print:border-none">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b print:bg-transparent">
                              <tr>
                                <th className="p-4 text-left font-bold uppercase text-[10px] text-muted-foreground">Level</th>
                                <th className="p-4 text-left font-bold uppercase text-[10px] text-muted-foreground">Degree</th>
                                <th className="p-4 text-left font-bold uppercase text-[10px] text-muted-foreground">Institute</th>
                                <th className="p-4 text-left font-bold uppercase text-[10px] text-muted-foreground">Year</th>
                                <th className="p-4 text-left w-12 print:hidden"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {resumeData.academic.map((row: any, idx: number) => (
                                <tr key={idx} className="border-b last:border-0">
                                  <td className="p-2">
                                    <Select value={row.education || ""} onValueChange={v => updateRow('academic', idx, 'education', v)}>
                                      <SelectTrigger className="h-10 border-none font-black"><SelectValue /></SelectTrigger>
                                      <SelectContent><SelectItem value="10th">10th</SelectItem><SelectItem value="12th">12th</SelectItem><SelectItem value="Graduate">Graduate</SelectItem><SelectItem value="Postgraduate">Postgraduate</SelectItem></SelectContent>
                                    </Select>
                                  </td>
                                  <td className="p-2"><Input value={row.degree || ""} onChange={e => updateRow('academic', idx, 'degree', e.target.value)} className="h-10 border-none font-black" placeholder="Degree" /></td>
                                  <td className="p-2"><Input value={row.institute || ""} onChange={e => updateRow('academic', idx, 'institute', e.target.value)} className="h-10 border-none font-black" placeholder="College" /></td>
                                  <td className="p-2"><Input value={row.year || ""} onChange={e => updateRow('academic', idx, 'year', e.target.value)} className="h-10 border-none font-black" placeholder="YYYY" /></td>
                                  <td className="p-2 print:hidden"><Button variant="ghost" size="icon" onClick={() => removeRow('academic', idx)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="space-y-8">
                        <h3 className="text-xl font-black text-primary flex items-center gap-2 border-b-2 border-primary/10 pb-2 print:text-sm">
                          <Briefcase className="w-6 h-6" /> {t.industryMetrics}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Total Exp (Yrs)</Label>
                            <Input type="number" step="0.5" value={resumeData.professional.totalExperience} onChange={e => setResumeData({...resumeData, professional: {...resumeData.professional, totalExperience: e.target.value}})} className="h-11 font-black rounded-xl" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Notice Period</Label>
                            <Select value={resumeData.professional.noticePeriod} onValueChange={v => setResumeData({...resumeData, professional: {...resumeData.professional, noticePeriod: v}})}>
                              <SelectTrigger className="h-11 rounded-xl font-black"><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="Immediate join">Immediate join</SelectItem><SelectItem value="15 Days">15 Days</SelectItem><SelectItem value="30 Days">30 Days</SelectItem></SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Last Drawn</Label>
                            <Input value={resumeData.professional.lastSalary} onChange={e => handleSalaryInput('lastSalary', e.target.value)} className="h-11 font-black rounded-xl" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Expected Salary</Label>
                            <Input value={resumeData.professional.expectedSalary} onChange={e => handleSalaryInput('expectedSalary', e.target.value)} className="h-11 font-black rounded-xl text-primary" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                        <div className="space-y-4">
                          <Label className="font-black text-primary">Core Skills</Label>
                          <div className="flex flex-wrap gap-2 mb-2 p-3 bg-muted/10 rounded-xl min-h-[50px] border border-dashed">
                            {resumeData.professional.coreSkills.map((s: string) => (
                              <Badge key={s} className="bg-primary text-white font-bold px-2.5 py-1 rounded-lg">
                                {s} <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => removeChip('coreSkills', s)} />
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input value={skillInput} onChange={e => setSkillInput(e.target.value)} placeholder="Add skill..." className="h-11 rounded-xl" />
                            <Button type="button" onClick={() => {addChip('coreSkills', skillInput); setSkillInput("");}} className="h-11 w-11 rounded-xl bg-primary flex-shrink-0"><Plus className="w-5 h-5" /></Button>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <Label className="font-black text-primary">Certification</Label>
                          <div className="flex items-center gap-3 p-6 bg-primary/5 rounded-2xl border-2 border-dashed border-primary/20">
                             <Switch checked={resumeData.personal.certificationAccepted} onCheckedChange={v => setResumeData({...resumeData, personal: {...resumeData.personal, certificationAccepted: v}})} />
                             <Label className="font-bold text-sm cursor-pointer">True & Accurate Certification</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <section className="pt-12 border-t print:hidden">
                    <div className="bg-destructive/5 p-6 rounded-3xl border border-destructive/20 flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="space-y-1 text-center md:text-left">
                        <h4 className="font-bold text-destructive">{t.deleteAccount}</h4>
                        <p className="text-sm text-muted-foreground">Permanently remove your records.</p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="font-bold px-8 rounded-xl h-11"><Trash2 className="w-4 h-4 mr-2" /> Delete Account</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-bold">Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription className="font-medium">This action is irreversible.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-2">
                            <AlertDialogCancel className="rounded-xl font-bold h-11 flex-1">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-white rounded-xl font-black h-11 flex-1 shadow-lg">Yes, Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </section>
                </CardContent>

                <CardFooter className="p-8 border-t bg-muted/10 flex gap-4 print:hidden">
                  <Button disabled={loading} type="submit" className="w-full h-14 font-black bg-primary text-white rounded-2xl text-lg shadow-xl shadow-primary/20">
                    {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving Changes...</> : "Save & Unlock Jobs"}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
