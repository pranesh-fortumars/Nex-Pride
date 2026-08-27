
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Camera, 
  ArrowLeft,
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  User
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore, useDoc } from "@/firebase";
import { doc, setDoc, serverTimestamp, collection, addDoc, updateDoc } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function EmployerProfilePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();
  
  const userRef = useMemo(() => auth.currentUser ? doc(db, "Users", auth.currentUser.uid) : null, [db, auth.currentUser]);
  const { data: userData, loading: userLoading } = useDoc<any>(userRef);

  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileData, setProfileData] = useState({
    name: "",
    location: "",
    gst: "",
    photo: "",
    logo: "",
    phone: "",
    industry: "",
    size: "",
    foundedYear: "",
    headquarters: "",
    description: "",
    contactPerson: "",
    designation: "",
    email: "",
    status: 'pending'
  });

  const isSimSession = useMemo(() => {
    if (typeof window === "undefined") return false;
    const simLoggedIn = localStorage.getItem("sim_is_logged_in") === "true";
    const simRole = localStorage.getItem("sim_user_role");
    return simLoggedIn && (simRole === "employer" || simRole === "admin" || simRole === "superadmin");
  }, []);

  useEffect(() => {
    if (!userLoading && userData && userData.role !== 'employer' && userData.role !== 'admin') {
      router.push('/');
    }
  }, [userData, userLoading, router]);

  useEffect(() => {
    if (userData) {
      const draft = userData.draftProfile || {};
      setProfileData({
        name: draft.name || userData.name || "",
        location: draft.location || userData.location || "",
        gst: draft.gst || userData.gst || "",
        photo: draft.photo || userData.photo || "",
        logo: draft.logo || userData.companyLogo || "",
        phone: draft.phone || userData.phone || "",
        industry: draft.industry || userData.industry || "",
        size: draft.size || userData.size || "",
        foundedYear: draft.foundedYear || userData.foundedYear || "",
        headquarters: draft.headquarters || userData.headquarters || "",
        description: draft.description || userData.description || "",
        contactPerson: draft.contactPerson || userData.contactPerson || "",
        designation: draft.designation || userData.designation || "",
        email: draft.email || userData.email || "",
        status: userData.status || 'pending'
      });
    } else {
      if (isSimSession) {
        setProfileData({
          name: localStorage.getItem('sim_user_name') || "",
          location: localStorage.getItem('sim_user_location') || "",
          gst: localStorage.getItem('sim_user_gst') || "",
          photo: localStorage.getItem('sim_user_photo') || "",
          logo: localStorage.getItem('sim_user_logo') || "",
          phone: localStorage.getItem('sim_user_phone') || "",
          industry: localStorage.getItem('sim_user_industry') || "",
          size: localStorage.getItem('sim_user_size') || "",
          foundedYear: localStorage.getItem('sim_user_founded') || "",
          headquarters: localStorage.getItem('sim_user_hq') || "",
          description: localStorage.getItem('sim_user_desc') || "",
          contactPerson: localStorage.getItem('sim_user_contact_person') || "",
          designation: localStorage.getItem('sim_user_designation') || "",
          email: localStorage.getItem('sim_user_email') || "",
          status: localStorage.getItem('sim_user_status') || 'pending'
        });
      }
    }
  }, [userData, isSimSession]);

  // Background Auto-Save
  useEffect(() => {
    if (!auth.currentUser || isSimSession || !userRef) return;
    
    // Auto-save debouncer
    const timeoutId = setTimeout(() => {
      // Prevent saving an empty object before initial load
      if (profileData.name || profileData.gst || profileData.phone) {
        updateDoc(userRef, { draftProfile: profileData }).catch(() => {});
      }
    }, 2000);
    
    return () => clearTimeout(timeoutId);
  }, [profileData, auth.currentUser, isSimSession, userRef]);

  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 600;
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
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isSim = isSimSession;
    if (!auth.currentUser && !isSim) {
      toast({ variant: "destructive", title: "Authentication Required" });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({ variant: "destructive", title: "Invalid File Type", description: "Please upload an image file." });
      return;
    }

    setProcessing(true);
    
    try {
      const base64Data = await processImage(file);
      setProfileData(prev => ({ ...prev, photo: base64Data }));
      
      if (!isSim && userRef) {
        await updateDoc(userRef, { 
          photo: base64Data,
          updatedAt: serverTimestamp()
        });
      } else if (isSim) {
        localStorage.setItem('sim_user_photo', base64Data);
      }
      toast({ title: "Photo Updated", description: "Image stored in your industrial record." });
    } catch (error: any) {
      console.error("Image Processing Error:", error);
      toast({ variant: "destructive", title: "Upload Failed", description: "Could not process image for database storage." });
    } finally {
      setProcessing(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isSim = isSimSession;
    if (!auth.currentUser && !isSim) {
      toast({ variant: "destructive", title: "Authentication Required" });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({ variant: "destructive", title: "Invalid File Type", description: "Please upload an image file." });
      return;
    }

    setProcessing(true);
    
    try {
      const base64Data = await processImage(file);
      setProfileData(prev => ({ ...prev, logo: base64Data }));
      
      if (!isSim && userRef) {
        await updateDoc(userRef, { 
          companyLogo: base64Data,
          updatedAt: serverTimestamp()
        });
      } else if (isSim) {
        localStorage.setItem('sim_user_logo', base64Data);
      }
      toast({ title: "Logo Updated", description: "Company logo stored in your profile." });
    } catch (error: any) {
      console.error("Logo Processing Error:", error);
      toast({ variant: "destructive", title: "Upload Failed", description: "Could not process logo for database storage." });
    } finally {
      setProcessing(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const isSim = isSimSession;
    
    if (!isSim && (!userRef || !auth.currentUser)) return;
    const currentUser = auth.currentUser;

    if (!profileData.name?.trim()) {
      toast({ variant: "destructive", title: "Name Required", description: "Please provide your company name." });
      return;
    }
    if (!profileData.gst?.trim()) {
      toast({ variant: "destructive", title: "GST Required", description: "Please provide your GST registration number." });
      return;
    }
    if (!profileData.location?.trim()) {
      toast({ variant: "destructive", title: "Location Required", description: "Please provide your factory location." });
      return;
    }
    if (!profileData.phone?.trim()) {
      toast({ variant: "destructive", title: "Contact Required", description: "Please provide a contact number." });
      return;
    }
    if (!profileData.photo) {
      toast({ variant: "destructive", title: "Photo Required", description: "Please provide your factory gate photo for verification." });
      return;
    }

    setLoading(true);
    
    // Always set back to pending so admin reviews changes
    const wasApproved = profileData.status === 'approved';
    const newStatus = 'pending';
    
    if (isSim) {
      localStorage.setItem('sim_user_name', profileData.name);
      localStorage.setItem('sim_user_gst', profileData.gst);
      localStorage.setItem('sim_user_location', profileData.location);
      localStorage.setItem('sim_user_logo', profileData.logo);
      localStorage.setItem('sim_user_industry', profileData.industry);
      localStorage.setItem('sim_user_size', profileData.size);
      localStorage.setItem('sim_user_founded', profileData.foundedYear);
      localStorage.setItem('sim_user_hq', profileData.headquarters);
      localStorage.setItem('sim_user_desc', profileData.description);
      localStorage.setItem('sim_user_contact_person', profileData.contactPerson);
      localStorage.setItem('sim_user_designation', profileData.designation);
      localStorage.setItem('sim_user_email', profileData.email);
      localStorage.setItem('sim_user_status', newStatus);
      localStorage.setItem('sim_user_profileSubmitted', 'true');
      
      toast({ title: "Profile Submitted", description: "Our team will now review your details." });
      router.push("/employer/dashboard");
      setLoading(false);
      return;
    }

    const updateData = { 
      ...profileData, 
      companyLogo: profileData.logo,
      status: newStatus,
      profileSubmitted: true,
      draftProfile: null, // Clear draft on actual submission
      updatedAt: serverTimestamp() 
    };

    const entranceProfileRef = doc(db, "CompanyEntranceProfile", currentUser!.uid);
    const entranceData = {
      uid: currentUser!.uid,
      photoUrl: profileData.photo,
      companyName: profileData.name,
      gst: profileData.gst,
      status: newStatus,
      createdAt: serverTimestamp()
    };

    // Compute changed fields if previously approved (re-review flow)
    const TRACKED_FIELDS = ['name', 'gst', 'location', 'industry', 'size', 'foundedYear', 'headquarters', 'description', 'contactPerson', 'designation', 'email'];
    const changedFields: { field: string; oldValue: any; newValue: any }[] = [];
    if (wasApproved && userData) {
      for (const field of TRACKED_FIELDS) {
        const oldVal = (userData as any)[field === 'name' ? 'name' : field] ?? '';
        const newVal = (profileData as any)[field] ?? '';
        if (String(oldVal).trim() !== String(newVal).trim()) {
          changedFields.push({ field, oldValue: oldVal, newValue: newVal });
        }
      }
    }

    const notificationRef = collection(db, "AdminNotifications");
    const isProfileUpdate = wasApproved && changedFields.length > 0;
    const notificationData = {
      type: isProfileUpdate ? "profile_update" : "new_employer",
      title: isProfileUpdate ? "Profile Update Request" : "New Factory Verification",
      message: isProfileUpdate
        ? `${profileData.name} has updated their profile. ${changedFields.length} field(s) changed.`
        : `${profileData.name || 'A new factory'} has submitted details for approval.`,
      targetId: currentUser!.uid,
      status: "unread",
      createdAt: serverTimestamp()
    };

    const ops: Promise<any>[] = [
      setDoc(userRef!, updateData, { merge: true }),
      setDoc(entranceProfileRef, entranceData, { merge: true }),
      addDoc(notificationRef, notificationData)
    ];

    // Write a change-request document for diff review
    if (isProfileUpdate) {
      const changeReqRef = doc(db, "ProfileChangeRequests", currentUser!.uid);
      ops.push(setDoc(changeReqRef, {
        uid: currentUser!.uid,
        companyName: profileData.name,
        previousData: {
          name: userData?.name ?? '',
          gst: userData?.gst ?? '',
          location: userData?.location ?? '',
          industry: userData?.industry ?? '',
          size: userData?.size ?? '',
          foundedYear: userData?.foundedYear ?? '',
          headquarters: userData?.headquarters ?? '',
          description: userData?.description ?? '',
          contactPerson: userData?.contactPerson ?? '',
          designation: userData?.designation ?? '',
          email: userData?.email ?? '',
        },
        newData: {
          name: profileData.name,
          gst: profileData.gst,
          location: profileData.location,
          industry: profileData.industry,
          size: profileData.size,
          foundedYear: profileData.foundedYear,
          headquarters: profileData.headquarters,
          description: profileData.description,
          contactPerson: profileData.contactPerson,
          designation: profileData.designation,
          email: profileData.email,
        },
        changedFields,
        status: 'pending',
        createdAt: serverTimestamp()
      }, { merge: false }));
    }

    Promise.all(ops)
      .then(() => {
        toast({ title: "Profile Submitted", description: "Our team will now review your factory details." });
        router.push("/employer/dashboard");
      })
      .catch(async (error: any) => {
        const code = error?.code || "";
        if (code.includes("permission-denied")) {
          toast({
            variant: "destructive",
            title: "Permission denied",
            description: "Please log out and log in again with your employer account, then resubmit profile details."
          });
          return;
        }
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef!.path,
          operation: 'write',
          requestResourceData: updateData,
        }));
      })
      .finally(() => setLoading(false));
  };

  if (userLoading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-semibold text-sm">Loading Profile...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-grow p-4 md:p-8 max-w-3xl mx-auto w-full space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.push('/employer/dashboard')} className="font-semibold text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl gap-2 h-9 transition-all">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </div>

        {/* Profile Completion Banner */}
        {(() => {
          const checks = [
            { label: "Company Name", done: !!profileData.name?.trim() },
            { label: "GST Number", done: !!profileData.gst?.trim() },
            { label: "Location", done: !!profileData.location?.trim() },
            { label: "Contact Number", done: !!profileData.phone?.trim() },
            { label: "Gate Photo", done: !!profileData.photo },
            { label: "Industry", done: !!profileData.industry?.trim() },
            { label: "Company Description", done: !!profileData.description?.trim() },
          ];
          const doneCount = checks.filter(c => c.done).length;
          const allRequired = checks.slice(0, 5).every(c => c.done); // name, gst, location, phone, photo are must-haves
          const pct = Math.round((doneCount / checks.length) * 100);
          return (
            <div className={`rounded-2xl border p-4 ${allRequired ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className={`text-sm font-black ${allRequired ? 'text-green-800' : 'text-amber-800'}`}>
                    {allRequired ? '✅ Ready to Submit for Verification' : '⚠️ Complete your profile to submit for verification'}
                  </p>
                  <p className={`text-xs mt-0.5 font-medium ${allRequired ? 'text-green-600' : 'text-amber-600'}`}>
                    {allRequired ? 'All required fields are filled. You can now submit.' : 'Required fields marked below must be filled before submitting.'}
                  </p>
                </div>
                <span className={`text-2xl font-black ${allRequired ? 'text-green-700' : 'text-amber-700'}`}>{pct}%</span>
              </div>
              {/* Progress bar */}
              <div className="h-2 bg-white/60 rounded-full overflow-hidden mb-3">
                <div className={`h-full rounded-full transition-all duration-500 ${allRequired ? 'bg-green-500' : 'bg-amber-400'}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="flex flex-wrap gap-2">
                {checks.map(c => (
                  <span key={c.label} className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    c.done ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>
                    {c.done ? '✓' : '✗'} {c.label}
                  </span>
                ))}
              </div>
            </div>
          );
        })()}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Gradient top strip */}
            <div className="h-2 rainbow-line" />

            <div className="p-6 md:p-8">
              {/* Avatar upload + title */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
                <div className="flex gap-4">
                  {/* Gate Photo Upload */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Gate Photo</Label>
                    <div
                      className="relative w-28 h-28 flex-shrink-0 cursor-pointer group"
                      onClick={() => !processing && fileInputRef.current?.click()}
                    >
                      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoSelect} />
                      <div className="w-full h-full rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-400 group-hover:bg-blue-50">
                        {processing ? (
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" style={{borderWidth:'3px'}} />
                          </div>
                        ) : profileData.photo ? (
                          <>
                            <img src={profileData.photo} alt="Gate" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                              <Camera className="w-6 h-6 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-1 p-2">
                            <Upload className="w-6 h-6 text-blue-400" />
                            <span className="text-[9px] font-bold text-blue-500 text-center uppercase leading-tight">Gate Photo</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Company Logo Upload */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Company Logo</Label>
                    <div
                      className="relative w-28 h-28 flex-shrink-0 cursor-pointer group"
                      onClick={() => !processing && logoFileInputRef.current?.click()}
                    >
                      <input type="file" accept="image/*" className="hidden" ref={logoFileInputRef} onChange={handleLogoSelect} />
                      <div className="w-full h-full rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/50 flex items-center justify-center overflow-hidden transition-all group-hover:border-purple-400 group-hover:bg-purple-50">
                        {processing ? (
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-6 h-6 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" style={{borderWidth:'3px'}} />
                          </div>
                        ) : profileData.logo ? (
                          <>
                            <img src={profileData.logo} alt="Logo" className="w-full h-full object-contain bg-white" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-1 p-2">
                            <ImageIcon className="w-6 h-6 text-purple-400" />
                            <span className="text-[9px] font-bold text-purple-500 text-center uppercase leading-tight">Add Logo</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company name + status */}
                <div className="text-center sm:text-left flex-1">
                  <h1 className="text-2xl font-bold text-slate-900">
                    {profileData.name || "Your Company"}
                  </h1>
                  <p className="text-slate-500 text-sm mt-0.5">Employer Profile · Tirupur</p>
                  <div className="mt-3">
                    {profileData.status === 'approved' ? (
                      <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified Employer
                      </span>
                    ) : profileData.status === 'rejected' ? (
                      <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 rounded-full px-3 py-1 text-xs font-bold">
                        <AlertTriangle className="w-3.5 h-3.5" /> Verification Failed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-3 py-1 text-xs font-bold">
                        Pending Review
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Form fields */}
              <div className="space-y-5">
                {/* SECTION: Basic Identity */}
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Basic Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-sm text-slate-700">{t.companyName || "Company Name"} <span className="text-red-500">*</span></Label>
                    <Input
                      value={profileData.name}
                      onChange={e => setProfileData({...profileData, name: e.target.value})}
                      className="h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      placeholder="e.g. Royal Garments Pvt. Ltd."
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-sm text-slate-700">{t.gstLabel || "GST Number"} <span className="text-red-500">*</span></Label>
                    <Input
                      value={profileData.gst}
                      onChange={e => setProfileData({...profileData, gst: e.target.value.toUpperCase()})}
                      className="h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono transition-all"
                      placeholder="33OQPPS2202M1Z9"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-sm text-slate-700">Location <span className="text-red-500">*</span></Label>
                    <Input
                      value={profileData.location}
                      onChange={e => setProfileData({...profileData, location: e.target.value})}
                      className="h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      placeholder="e.g. Avinashi, Tirupur"
                      required
                    />
                  </div>
                </div>

                {/* SECTION: Management Profile */}
                <p className="text-sm font-black text-blue-600 flex items-center gap-2 border-b border-slate-100 pb-2 pt-4">
                  <User className="w-5 h-5" /> Management Profile
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-sm text-slate-700 uppercase text-xs tracking-wide">Contact Person Name</Label>
                    <Input
                      value={profileData.contactPerson}
                      onChange={e => setProfileData({...profileData, contactPerson: e.target.value})}
                      className="h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-bold text-slate-900 transition-all"
                      placeholder="e.g. Pranesh S"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-sm text-slate-700 uppercase text-xs tracking-wide">Designation</Label>
                    <Input
                      value={profileData.designation}
                      onChange={e => setProfileData({...profileData, designation: e.target.value})}
                      className="h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-bold text-slate-900 transition-all"
                      placeholder="e.g. Creator"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-sm text-slate-700 uppercase text-xs tracking-wide flex items-center gap-1">
                       Mobile No <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={profileData.phone}
                      onChange={e => setProfileData({...profileData, phone: e.target.value})}
                      className="h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-bold text-slate-900 transition-all bg-blue-50/50"
                      placeholder="e.g. 7604871241"
                      required
                    />
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">This number is used for industrial verification audits.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-sm text-slate-700 uppercase text-xs tracking-wide">Email Address</Label>
                    <Input
                      type="email"
                      value={profileData.email}
                      onChange={e => setProfileData({...profileData, email: e.target.value})}
                      className="h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-bold text-slate-900 transition-all"
                      placeholder="e.g. contact@company.com"
                    />
                  </div>
                </div>

                {/* SECTION: Company Details */}
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 pt-2">Company Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-sm text-slate-700">Industry</Label>
                    <Input
                      value={profileData.industry}
                      onChange={e => setProfileData({...profileData, industry: e.target.value})}
                      className="h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      placeholder="e.g. Garments, Manufacturing, Services"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-sm text-slate-700">Company Size</Label>
                    <Input
                      value={profileData.size}
                      onChange={e => setProfileData({...profileData, size: e.target.value})}
                      className="h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      placeholder="e.g. 50-200 Employees"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-sm text-slate-700">Founded Year</Label>
                    <Input
                      value={profileData.foundedYear}
                      onChange={e => setProfileData({...profileData, foundedYear: e.target.value})}
                      className="h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      placeholder="e.g. 2020"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-sm text-slate-700">Headquarters</Label>
                    <Input
                      value={profileData.headquarters}
                      onChange={e => setProfileData({...profileData, headquarters: e.target.value})}
                      className="h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      placeholder="e.g. K.N.P Puram, Tirupur"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold text-sm text-slate-700">Company Description</Label>
                  <Textarea
                    value={profileData.description}
                    onChange={e => setProfileData({...profileData, description: e.target.value})}
                    className="min-h-[120px] rounded-xl border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    placeholder="Tell us about your company, mission, and culture..."
                  />
                </div>

                {/* Photo instructions */}
                {!profileData.photo && (
                  <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 flex gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-800 font-semibold text-sm">Factory Gate Photo Required</p>
                      <ul className="text-amber-700/80 text-xs mt-1.5 space-y-1 font-medium">
                        <li>• Photo must clearly show the factory name board</li>
                        <li>• Include the main gate or entrance in the frame</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Card footer */}
            <div className="px-6 py-4 md:px-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
                Verified within 24–48 hours
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading || processing}
                  onClick={async () => {
                    if (isSimSession || !userRef) return;
                    setLoading(true);
                    try {
                      await updateDoc(userRef, { draftProfile: profileData });
                      toast({ title: "Draft Saved", description: "You can safely exit and continue later." });
                    } catch (e) {}
                    setLoading(false);
                  }}
                  className="w-full sm:w-auto h-11 px-6 font-bold rounded-xl shadow-sm transition-all border-slate-200"
                >
                  Save Draft
                </Button>
                <Button
                  type="submit"
                  disabled={loading || processing}
                  className="w-full sm:w-auto h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-200 transition-all active:scale-95"
                >
                  {loading ? "Submitting..." : "Submit for Verification"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
