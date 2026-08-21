
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { User, MapPin, FileText, CheckCircle2, Briefcase, GraduationCap, Building2, UserCheck, Calendar as CalendarIcon, Phone, Camera, RefreshCw, Upload, AlertCircle, Heart, Plus, X, Trash2, Loader2, Info, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, differenceInYears, differenceInMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useAuth, useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, setDoc, serverTimestamp, collection, updateDoc, getDoc, query } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

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

export default function SeekerOnboarding() {
  const router = useRouter();
  const { t } = useLanguage();
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();

  const masterDesignationsQuery = useMemo(() => query(collection(db, "Designations")), [db]);
  const { data: masterDesignations } = useCollection<any>(masterDesignationsQuery);
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    otherLocation: "",
    category: "Worker" as 'Staff' | 'Worker',
    department: "",
    designation: "",
    experience: "0",
    accommodation: false,
    food: false,
    bio: "",
    phone: "",
    photo: "",
    gender: "transWoman",
    dob: null as string | null
  });

  const [resumeData, setResumeData] = useState<any>({
    personal: { fullName: "", gender: "transWoman", dob: null, age: "", languages: [], location: "", otherLocation: "", mobile: "", hasTwoWheeler: false, profileImage: "", certificationAccepted: false },
    academic: [{ education: "Graduate", degree: "", institute: "", year: "", percentage: "" }],
    professional: { totalExperience: "0", noticePeriod: "Immediate join", noticeDate: null, coreSkills: [], complianceKnowledge: [], previousBrands: "", lastSalary: "", expectedSalary: "", bio: "" },
    recentCompany: [{ name: "", position: "", startDate: "", endDate: "", isCurrent: false }],
    references: [{ name: "", designation: "", company: "", contact: "" }],
    recentCompanyToggle: true,
    referenceToggle: true
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  useEffect(() => {
    const savedCategory = localStorage.getItem('sim_job_seeker_category') as 'Staff' | 'Worker';
    if (savedCategory) {
      setFormData(prev => ({ ...prev, category: savedCategory }));
    }
    const mobile = localStorage.getItem('sim_user_phone') || auth.currentUser?.phoneNumber || "";
    setFormData(prev => ({ ...prev, phone: mobile.replace(/\D/g, "").slice(-10) }));
    setResumeData((prev: any) => ({ ...prev, personal: { ...prev.personal, mobile: mobile.replace(/\D/g, "").slice(-10) } }));

    if (auth.currentUser) {
      getDoc(doc(db, "Users", auth.currentUser.uid)).then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          setFormData(prev => ({
            ...prev,
            name: data.name || prev.name,
            location: data.location || prev.location,
            category: data.category || prev.category,
            department: data.department || prev.department,
            designation: data.designation || prev.designation,
            phone: data.phone || prev.phone,
            photo: data.photo || prev.photo,
            gender: data.gender || prev.gender,
            dob: data.dob || prev.dob
          }));
        }
      });
    }
  }, [auth.currentUser, db]);

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
          reject(new Error("Canvas context failed"));
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
        reader.onload = (e) => {
          if (e.target?.result) {
            img.src = e.target.result as string;
          } else {
            reject(new Error("Failed to read file"));
          }
        };
        reader.onerror = () => reject(new Error("File reader error"));
        reader.readAsDataURL(input);
      }
    });
  };

  const sanitizePayload = (obj: any): any => {
    const removeUndefined = (data: any): any => {
      if (data === undefined) return null;
      if (data === null) return null;
      if (Array.isArray(data)) return data.map(removeUndefined);
      if (typeof data === 'object') {
        if (data.constructor !== Object) return data;
        const result: any = {};
        for (const key in data) {
          result[key] = removeUndefined(data[key]);
        }
        return result;
      }
      return data;
    };
    return removeUndefined(obj);
  };

  const handleFinish = async () => {
    const user = auth.currentUser;
    if (!user) return;

    if (!formData.name.trim()) return toast({ variant: "destructive", title: "Name Required" });
    if (!formData.location) return toast({ variant: "destructive", title: "Location / City Required" });
    if (!formData.phone || formData.phone.length !== 10) return toast({ variant: "destructive", title: "Valid 10-digit Mobile Required" });
    if (!formData.department) return toast({ variant: "destructive", title: "Department Required" });
    if (!formData.designation) return toast({ variant: "destructive", title: "Designation Required" });
    if (!formData.dob) return toast({ variant: "destructive", title: "Birthday Required" });

    const age = differenceInYears(new Date(), new Date(formData.dob));
    if (age < 18) {
      toast({ variant: "destructive", title: "Age Restriction", description: "You must be at least 18 years old." });
      return;
    }

    if (formData.category === 'Staff' && !resumeData.personal?.certificationAccepted) {
      toast({ variant: "destructive", title: "Certification Required" });
      return;
    }

    setLoading(true);
    
    const finalBio = formData.category === 'Staff' ? resumeData.professional.bio : formData.bio;
    const finalPhoto = formData.photo || resumeData.personal.profileImage || "";

    const updatePayload = sanitizePayload({
      ...formData,
      photo: finalPhoto,
      name: (formData.category === 'Staff' ? resumeData.personal.fullName : formData.name) || formData.name,
      bio: finalBio,
      onboarded: true,
      digitalResume: formData.category === 'Staff' ? { ...resumeData, personal: { ...resumeData.personal, profileImage: finalPhoto } } : null,
      updatedAt: serverTimestamp(),
      preference: formData.category.toLowerCase()
    });

    const userRef = doc(db, "Users", user.uid);
    setDoc(userRef, updatePayload, { merge: true })
      .then(() => {
        localStorage.setItem('sim_seeker_onboarded', 'true');
        localStorage.setItem('sim_user_name', updatePayload.name);
        toast({ title: "Setup Complete!" });
        router.push("/");
      })
      .catch(async (error: any) => {
        console.error("Onboarding Save Error:", error);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path,
          operation: 'write',
          requestResourceData: updatePayload,
        }));
      })
      .finally(() => setLoading(false));
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setIsCameraActive(true);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (error) {
      toast({ variant: 'destructive', title: "Camera access denied" });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
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
          const base64 = await processImage(dataUrl);
          setFormData(prev => ({ ...prev, photo: base64 }));
          setResumeData((prev: any) => ({ ...prev, personal: { ...prev.personal, profileImage: base64 } }));
          
          const userRef = doc(db, "Users", auth.currentUser.uid);
          await setDoc(userRef, { photo: base64, updatedAt: serverTimestamp() }, { merge: true });
          toast({ title: "Photo Captured" });
        } catch (error: any) {
          console.error("Onboarding Photo Capture Error:", error);
          toast({ variant: "destructive", title: "Capture Failed" });
        } finally {
          setUploading(false);
          stopCamera();
        }
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!auth.currentUser) return;
    if (!file.type.startsWith('image/')) return;

    setUploading(true);
    try {
      const base64 = await processImage(file);
      setFormData(prev => ({ ...prev, photo: base64 }));
      setResumeData((prev: any) => ({ ...prev, personal: { ...prev.personal, profileImage: base64 } }));
      
      const userRef = doc(db, "Users", auth.currentUser.uid);
      await setDoc(userRef, { photo: base64, updatedAt: serverTimestamp() }, { merge: true });
      toast({ title: "Photo Uploaded" });
    } catch (error: any) {
      console.error("Onboarding Photo Upload Error:", error);
      toast({ variant: "destructive", title: "Upload Failed" });
    } finally {
      setUploading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-grow p-4 md:py-12 flex justify-center items-start">
        <Card className="w-full max-w-4xl shadow-2xl border-primary/10 rounded-[2.5rem] overflow-hidden">
          <CardHeader className="text-center space-y-4 border-b bg-muted/20 pb-8">
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3].map(i => (
                <div key={i} className={`h-2 w-12 rounded-full transition-all duration-500 ${step >= i ? 'bg-primary scale-110' : 'bg-muted'}`} />
              ))}
            </div>
            <CardTitle className="text-3xl font-extrabold font-headline text-primary">
              {step === 1 ? t.personalInfo : step === 2 ? t.jobPrefs : t.profilePhoto}
            </CardTitle>
            <CardDescription className="font-bold text-muted-foreground">
              Complete your NexPride identity to unlock verified jobs.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-8 px-6 md:px-12 max-h-[70vh] overflow-y-auto scrollbar-hide overscroll-contain">
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 font-bold"><User className="w-4 h-4" /> {t.fullNameLabel}</Label>
                  <Input placeholder={t.fullNamePlaceholder} className="h-12 rounded-xl font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div className="space-y-2">
                    <Label className="font-bold">{t.genderLabel}</Label>
                    <Select value={formData.gender} onValueChange={v => setFormData({...formData, gender: v})}>
                      <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(t.identities || {}).map(([key, val]) => (
                          <SelectItem key={key} value={key}>{val as string}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">{t.dobLabel}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full h-12 justify-start text-left font-bold rounded-xl", !formData.dob && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.dob ? format(new Date(formData.dob), "dd-MM-yyyy") : "Pick birth date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                        <Calendar 
                          mode="single" 
                          captionLayout="dropdown"
                          startMonth={new Date(1950, 0)}
                          endMonth={new Date(new Date().getFullYear() - 18, 11)}
                          selected={formData.dob ? new Date(formData.dob) : undefined} 
                          onSelect={d => setFormData({...formData, dob: d?.toISOString() || null})} 
                          initialFocus 
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">{t.locationPlaceholder}</Label>
                    <Select value={formData.location} onValueChange={v => setFormData({...formData, location: v})}>
                      <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue placeholder="Select City..." /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(t.locations || {}).map(([key, val]) => (
                          <SelectItem key={key} value={key}>{val as string}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">{t.mobileLabel}</Label>
                    <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, "").slice(0, 10)})} className="h-12 rounded-xl font-bold" />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bold">{t.categoryLabel}</Label>
                    <Select value={formData.category} onValueChange={(v: any) => setFormData({...formData, category: v, department: "", designation: ""})}>
                      <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="Staff">{t.staff}</SelectItem><SelectItem value="Worker">{t.worker}</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">{t.departmentLabel}</Label>
                    <Select value={formData.department} onValueChange={v => setFormData({...formData, department: v, designation: ""})}>
                      <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue placeholder="Select Vertical" /></SelectTrigger>
                      <SelectContent>{((CLASSIFICATION as any)[formData.category]?.departments || []).map((dept: string) => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">{t.designationLabel}</Label>
                    <Select value={formData.designation} onValueChange={v => setFormData({...formData, designation: v})}>
                      <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue placeholder="Select Role" /></SelectTrigger>
                      <SelectContent>{designations.map(des => <SelectItem key={des} value={des}>{des}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">{t.requirements}</Label>
                  <Textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="Tell us about your professional background and identity journey..." className="min-h-[120px] rounded-2xl" />
                </div>

                {formData.category === 'Staff' && (
                  <div className="flex items-start space-x-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <Checkbox
                      id="certification-check"
                      checked={resumeData.personal?.certificationAccepted || false}
                      onCheckedChange={(checked) => {
                        setResumeData((prev: any) => ({
                          ...prev,
                          personal: {
                            ...prev.personal,
                            certificationAccepted: !!checked
                          }
                        }));
                      }}
                      className="mt-1"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="certification-check"
                        className="text-sm font-bold text-slate-800 cursor-pointer"
                      >
                        I certify that all the details provided in my digital resume (qualifications, experience, and certifications) are true, accurate, and correct.
                      </label>
                      <p className="text-xs text-muted-foreground">
                        This certification is required for Corporate / Office candidates to apply for verified jobs.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-12 animate-in fade-in">
                <div className="space-y-6 pt-6 text-center">
                  <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-2 text-primary shadow-inner">
                    <Camera className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-primary">{t.profilePhoto}</h3>
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-full max-w-sm space-y-4">
                      <div className="aspect-square bg-muted rounded-3xl overflow-hidden relative border-4 border-white shadow-xl flex items-center justify-center">
                        {uploading ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            <p className="text-[10px] font-black text-primary uppercase">Hard-Saving Photo...</p>
                          </div>
                        ) : (
                          <>
                            <video ref={videoRef} className={cn("w-full h-full object-cover", !isCameraActive && "hidden")} autoPlay muted />
                            <canvas ref={canvasRef} className="hidden" />
                            {!isCameraActive && (formData.photo || resumeData.personal.profileImage ? (
                               <img src={formData.photo || resumeData.personal.profileImage} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-24 h-24 text-primary/20" />
                            ))}
                          </>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {isCameraActive ? (
                          <Button onClick={capturePhoto} className="col-span-2 h-14 bg-primary text-white font-black rounded-xl shadow-lg">Capture Photo</Button>
                        ) : (
                          <>
                            <Button onClick={startCamera} variant="outline" className="h-12 font-bold rounded-xl border-primary/20 text-primary hover:bg-primary/5">Camera</Button>
                            <div className="relative">
                              <Input type="file" accept="image/*" className="hidden" id="photo-upl" onChange={handleFileUpload} />
                              <Label htmlFor="photo-upl" className="flex items-center justify-center h-12 w-full border-2 border-muted rounded-xl cursor-pointer font-bold text-sm hover:bg-muted/50 transition-colors">Gallery</Label>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex gap-4 p-8 border-t bg-muted/10">
            {step > 1 && <Button variant="outline" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => setStep(step - 1)} disabled={loading}>Back</Button>}
            <Button className="flex-[2] h-14 font-bold bg-primary text-white rounded-2xl shadow-xl shadow-primary/20 text-lg" onClick={step === 3 ? handleFinish : () => setStep(step + 1)} disabled={loading}>
              {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Finalizing...</> : (step === 3 ? "Finish & Browse Jobs" : "Continue")}
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
