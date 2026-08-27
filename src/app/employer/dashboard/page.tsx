
"use client";

import { useState, useMemo, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Loader2,
  Clock,
  MapPin,
  Phone,
  User as UserIcon,
  ShieldCheck,
  Calendar,
  ArrowRight,
  Briefcase,
  Info,
  Mail,
  UserCircle,
  BarChart3,
  Users,
  Smartphone,
  ChevronRight,
  Building2,
  AlertTriangle,
  Camera,
  Flag,
  Bell,
  ShieldAlert,
  Calendar as CalendarIcon
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useFirestore, useCollection, useAuth, useDoc, useUser } from "@/firebase";
import { collection, query, where, doc, updateDoc, serverTimestamp, orderBy, addDoc, deleteDoc } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { format, formatDistanceToNow, isValid } from "date-fns";
import ReportModal from "@/components/ReportModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function EmployerDashboard() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const db = useFirestore();
  const auth = useAuth();
  
  const [activeTab, setActiveTab] = useState("applicants");
  const [searchQuery, setSearchQuery] = useState("");
  const [subTab, setSubTab] = useState("applied");
  const [viewingJobStats, setViewingJobStats] = useState<any>(null);
  const [reportTarget, setReportTarget] = useState<any>(null);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Report Candidate States
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [reportScreenshot, setReportScreenshot] = useState("");
  const [reporting, setReporting] = useState(false);

  // Job Status Action States
  const [jobToArchive, setJobToArchive] = useState<any>(null);
  const [archiveReason, setArchiveReason] = useState("");

  const { user, isLoading: authLoading } = useUser();
  const profileRef = useMemo(() => user ? doc(db, "Users", user.uid) : null, [db, user]);
  const { data: userProfile, loading: profileLoading } = useDoc<any>(profileRef);

  // Notification States & Query
  const [openNotifications, setOpenNotifications] = useState(false);
  const router = useRouter(); // Added router for redirects

  // Check for profile completion
  useEffect(() => {
    if (!profileLoading && userProfile) {
      if (!userProfile.profileSubmitted && !userProfile.gst && userProfile.status !== 'approved') {
        router.push('/employer/profile');
      }
    }
  }, [userProfile, profileLoading, router]);

  const notificationsQuery = useMemo(() => {
    if (!user) return null;
    return query(
      collection(db, "UserNotifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
  }, [user, db]);

  const { data: notifications, loading: notifLoading } = useCollection<any>(user ? notificationsQuery : null);

  const unreadCount = useMemo(() => {
    return (notifications || []).filter(n => n.status === 'unread').length;
  }, [notifications]);

  // Analytics State

  const isActuallyEmployer = useMemo(() => userProfile?.role === 'employer' || userProfile?.role === 'admin', [userProfile]);

  // Queries
  const jobsQuery = useMemo(() => {
    if (!user || !isActuallyEmployer) return null;
    return query(collection(db, "Jobs"), where("employerId", "==", user.uid));
  }, [db, user, isActuallyEmployer]);

  const appsQuery = useMemo(() => {
    if (!user || !isActuallyEmployer) return null;
    return query(collection(db, "Applications"), where("employerId", "==", user.uid));
  }, [db, user, isActuallyEmployer]);

  const { data: rawJobs, loading: jobsLoading } = useCollection<any>(jobsQuery);
  const { data: rawApps, loading: appsLoading } = useCollection<any>(appsQuery);

  // Analytics Data Fetching
  const jobViewsQuery = useMemo(() => 
    viewingJobStats ? query(collection(db, "Jobs", viewingJobStats.id, "Views"), orderBy("viewedAt", "desc")) : null, 
  [db, viewingJobStats]);
  const { data: jobViewers, loading: viewersLoading } = useCollection<any>(jobViewsQuery);

  // Profile data for selected candidate
  const seekerRef = useMemo(() => selectedApp ? doc(db, "Users", selectedApp.jobSeekerId) : null, [db, selectedApp]);
  const { data: seekerProfile, loading: seekerLoading } = useDoc<any>(seekerRef);

  // In-Memory Sorting & Filtering
  const liveJobs = useMemo(() => {
    return [...(rawJobs || [])].sort((a, b) => (b.createdAt || 0).toString().localeCompare(a.createdAt || 0));
  }, [rawJobs]);

  const liveApps = useMemo(() => {
    const apps = (rawApps || []).filter(app => {
      const matchesSearch = !searchQuery || 
        app.seekerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
    return apps.sort((a, b) => (b.appliedAt?.seconds || 0) - (a.appliedAt?.seconds || 0));
  }, [rawApps, searchQuery]);

  const filteredApps = useMemo(() => {
    return liveApps.filter(app => app.status === subTab);
  }, [liveApps, subTab]);

  const counts = useMemo(() => ({
    pending: liveApps.filter(a => a.status === 'applied').length,
    shortlisted: liveApps.filter(a => a.status === 'shortlisted').length,
    rejected: liveApps.filter(a => a.status === 'rejected').length,
  }), [liveApps]);

  const handleUpdateStatus = async (app: any, newStatus: string) => {
    setIsProcessing(true);
    const appRef = doc(db, "Applications", app.id);
    const notificationsRef = collection(db, "UserNotifications");
    
    const notificationData = {
      userId: app.jobSeekerId,
      title: newStatus === 'shortlisted' 
        ? "Application Shortlisted!" 
        : newStatus === 'hired' 
        ? "Congratulations! You are Hired 🎉" 
        : "Application Update",
      message: newStatus === 'shortlisted' 
        ? `Great news! You have been shortlisted for the "${app.jobTitle}" position at ${app.companyName}.`
        : newStatus === 'hired'
        ? `Congratulations! You have been hired for the "${app.jobTitle}" position at ${app.companyName}.`
        : `Your application status for "${app.jobTitle}" at ${app.companyName} has been updated to ${newStatus}.`,
      status: "unread",
      createdAt: serverTimestamp()
    };

    try {
      await updateDoc(appRef, { status: newStatus, updatedAt: serverTimestamp() });
      await addDoc(notificationsRef, notificationData);
      
      toast({ title: `Candidate ${newStatus.toUpperCase()}` });
      if (selectedApp?.id === app.id) setSelectedApp(null);
    } catch (err: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: appRef.path,
        operation: 'update',
        requestResourceData: { status: newStatus }
      }));
    } finally {
      setIsProcessing(false);
    }
  };

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

  const handleReportSubmit = async () => {
    if (!user) {
      toast({ title: "Login Required" });
      return;
    }
    if (!reportReason) {
      toast({ variant: "destructive", title: "Reason Required" });
      return;
    }

    setReporting(true);
    const reportData = {
      targetId: seekerProfile?.uid || selectedApp?.jobSeekerId || "unknown",
      targetName: seekerProfile?.name || selectedApp?.seekerName || "Candidate Profile",
      targetType: "candidate",
      reason: reportReason,
      description: reportDesc,
      screenshot: reportScreenshot || null,
      reportedById: user.uid,
      reportedByName: userProfile?.companyName || userProfile?.name || "Verified Employer",
      reportedByPhone: userProfile?.phone || user.phoneNumber || "N/A",
      status: "pending",
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, "Reports"), reportData);
      toast({ title: "Report submitted successfully. Our Safety Team will review this incident." });
      setIsReportDialogOpen(false);
      setReportReason("");
      setReportDesc("");
      setReportScreenshot("");
      setSelectedApp(null);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to submit report" });
    } finally {
      setReporting(false);
    }
  };

  const handleMarkAsRead = async (notif: any) => {
    if (notif.status === 'read') return;
    try {
      await updateDoc(doc(db, "UserNotifications", notif.id), { status: 'read' });
    } catch (e) {
      console.debug(e);
    }
  };

  const handleClearAll = async () => {
    if (!notifications) return;
    for (const n of notifications) {
      try {
        await deleteDoc(doc(db, "UserNotifications", n.id));
      } catch (e) {
        console.debug(e);
      }
    }
    toast({ title: "Notifications cleared" });
  };

  const handleCloseJob = async (job: any) => {
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "Jobs", job.id), { status: 'closed' });
      toast({ title: "Job marked as closed." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to close job" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchiveJobSubmit = async () => {
    if (!jobToArchive) return;
    if (!archiveReason) {
      toast({ variant: "destructive", title: "Reason Required" });
      return;
    }
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "Jobs", jobToArchive.id), { status: 'archived', archiveReason });
      toast({ title: "Job archived." });
      setJobToArchive(null);
      setArchiveReason("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to archive job" });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string, reason?: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-100 text-green-700 font-bold border-none">Approved</Badge>;
      case 'pending': return <Badge className="bg-amber-100 text-amber-700 font-bold border-none">Pending Approval</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-700 font-bold border-none">Rejected</Badge>;
      case 'closed': return <Badge variant="secondary">Closed</Badge>;
      case 'archived': return (
        <div className="flex flex-col gap-1 items-start">
          <Badge variant="secondary" className="bg-slate-200 text-slate-700 border-none">Archived</Badge>
          {reason && <span className="text-[10px] text-muted-foreground max-w-[120px] truncate" title={reason}>Reason: {reason}</span>}
        </div>
      );
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const safeFormatDate = (dateVal: any) => {
    if (!dateVal) return "N/A";
    try {
      const date = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
      if (!isValid(date)) return "N/A";
      return format(date, "dd MMM, hh:mm a");
    } catch (e) {
      return "N/A";
    }
  };

  const safeFormatDistance = (dateVal: any) => {
    if (!dateVal) return "N/A";
    try {
      const date = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return "N/A";
    }
  };

  if (userProfile?.status === 'suspended') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center p-4">
          <Card className="max-w-md w-full rounded-[2.5rem] border-none shadow-2xl p-10 text-center space-y-6 bg-red-50/50 backdrop-blur-sm border border-red-105">
            <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto text-red-600 shadow-inner">
              <ShieldAlert className="w-10 h-10 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-red-600 font-headline">Account Suspended</h2>
              <p className="text-sm font-semibold text-slate-500 leading-relaxed">
                Your NexPride employer account has been suspended by our trust & safety moderation team for violating our community guidelines.
              </p>
            </div>
            <div className="bg-white/60 p-4 rounded-xl border text-xs font-bold text-slate-500">
              Suspended accounts cannot post jobs, view applicant profiles, or contact candidates.
            </div>
            <Button className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-lg shadow-red-200 transition-all" onClick={() => window.open("mailto:support@nexpride.com")}>
              Contact Safety Desk
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  // Pending Admin Approval Lockout (only for new flow profiles to preserve existing)
  if (userProfile?.status === 'pending' && userProfile?.profileSubmitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center p-4">
          <Card className="max-w-md w-full rounded-[2.5rem] border-none shadow-2xl p-10 text-center space-y-6 bg-amber-50/50 backdrop-blur-sm border border-amber-100">
            <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto text-amber-600 shadow-inner">
              <ShieldCheck className="w-10 h-10 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-amber-600 font-headline">Verification in Progress</h2>
              <p className="text-sm font-semibold text-slate-500 leading-relaxed">
                Your factory profile is currently being reviewed by our Admin team. This usually takes 24-48 hours.
              </p>
            </div>
            <div className="bg-white/60 p-4 rounded-xl border text-xs font-bold text-slate-500">
              You will be able to post jobs and view candidates once your profile is approved.
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black font-headline text-primary tracking-tight">{t.manageOperations}</h1>
            <p className="text-muted-foreground text-sm font-medium">{t.manageOperationsDesc}</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder={t.searchCandidates} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-xl bg-muted/30 border-none focus-visible:ring-primary/20"
              />
            </div>
            
            {userProfile?.status === 'approved' && (
              <Button onClick={() => router.push('/employer/post-job')} className="h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold px-6 shadow-md shadow-primary/20 transition-all">
                Post Job
              </Button>
            )}

            <Dialog open={openNotifications} onOpenChange={setOpenNotifications}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-11 w-11 relative rounded-xl border-primary/20 text-primary hover:bg-primary/5 transition-all active:scale-95 shrink-0">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-in zoom-in" />
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2rem] max-w-md w-[95%] p-0 border-none shadow-2xl overflow-hidden flex flex-col h-[70vh]">
                <DialogHeader className="p-6 bg-primary text-white text-left shrink-0">
                  <div className="flex justify-between items-center">
                    <DialogTitle className="text-xl font-bold font-headline flex items-center gap-2">
                      <Bell className="w-5 h-5" /> Status Alerts
                    </DialogTitle>
                    {notifications && notifications.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-white hover:bg-white/10 font-bold text-xs h-8 px-2">Clear All</Button>
                    )}
                  </div>
                </DialogHeader>
                <ScrollArea className="flex-1">
                  {notifLoading ? (
                    <div className="p-20 text-center space-y-4"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /><p className="text-xs font-bold text-muted-foreground">Syncing alerts...</p></div>
                  ) : (notifications || []).length === 0 ? (
                    <div className="p-20 text-center space-y-3">
                      <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto text-muted-foreground/30"><Bell className="w-8 h-8" /></div>
                      <p className="text-sm font-black text-muted-foreground">No updates yet.</p>
                      <p className="text-[10px] font-medium text-muted-foreground/60">We'll notify you when an admin reviews your safety reports or updates your status.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-muted">
                      {(notifications || []).map((n: any) => (
                        <div 
                          key={n.id} 
                          className={cn(
                            "p-5 hover:bg-muted/10 cursor-pointer transition-all",
                            n.status === 'unread' ? "bg-primary/5" : ""
                          )}
                          onClick={() => handleMarkAsRead(n)}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <h5 className={cn("text-sm", n.status === 'unread' ? "font-black text-slate-900" : "font-semibold text-slate-700")}>{n.title}</h5>
                            <span className="text-[9px] font-bold text-muted-foreground whitespace-nowrap">{safeFormatDistance(n.createdAt)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1.5 font-medium leading-relaxed">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {userProfile?.warningCount > 0 && (
          <div className="bg-amber-50 border-2 border-dashed border-amber-300 p-6 rounded-3xl flex items-start gap-4 shadow-sm animate-pulse">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-left">
              <h4 className="font-black text-amber-800 text-sm">{t.communitySafetyWarning}</h4>
              <p className="text-xs font-semibold text-amber-700 leading-relaxed">
                {t.warningDesc1}{userProfile.warningCount}{t.warningDesc2}
              </p>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <div className="flex justify-between items-center border-b">
            <TabsList className="bg-transparent p-0 h-14 space-x-8">
              <TabsTrigger 
                value="applicants" 
                className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 font-black text-lg h-14"
              >
                {t.applicantsTab}
              </TabsTrigger>
              <TabsTrigger 
                value="my-jobs" 
                className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 font-black text-lg h-14"
              >
                {t.myJobsTab}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="applicants" className="m-0 space-y-6">
            <div className="flex bg-muted/40 p-1 rounded-2xl w-fit">
              <button 
                onClick={() => setSubTab("applied")}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                  subTab === 'applied' ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.pendingStatus} ({counts.pending})
              </button>
              <button 
                onClick={() => setSubTab("shortlisted")}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                  subTab === 'shortlisted' ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.shortlistedStatus} ({counts.shortlisted})
              </button>
              <button 
                onClick={() => setSubTab("rejected")}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                  subTab === 'rejected' ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.rejectedStatus} ({counts.rejected})
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
              {appsLoading ? (
                <div className="col-span-full h-60 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
              ) : liveApps.length === 0 ? (
                <div className="col-span-full h-60 flex items-center justify-center font-bold text-muted-foreground">{t.noCandidatesCategory}</div>
              ) : (
                filteredApps.map((app) => (
                  <Card key={app.id} className="p-5 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow group border border-slate-200">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-black text-lg text-slate-900 group-hover:text-primary transition-colors">{app.seekerName}</p>
                          <p className="text-[11px] font-black uppercase text-muted-foreground tracking-widest">{app.experience || 'NEW'} YRS EXPERIENCE</p>
                        </div>
                        {getStatusBadge(app.status)}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Briefcase className="w-4 h-4 text-slate-400" />
                          <span className="font-semibold text-slate-700">{app.jobTitle}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarIcon className="w-4 h-4 text-slate-400" />
                          <span className="font-semibold text-slate-700">{safeFormatDistance(app.appliedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 flex items-center gap-2 pt-4 border-t border-slate-100">
                      <Button 
                        variant="outline" 
                        className="flex-1 font-bold text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => setSelectedApp(app)}
                      >
                        <Eye className="w-4 h-4 mr-2" /> View Profile
                      </Button>
                      
                      {app.status === 'applied' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-10 w-10 shrink-0 rounded-xl border-green-200 text-green-600 hover:bg-green-50"
                            onClick={() => handleUpdateStatus(app, 'shortlisted')}
                            title="Shortlist"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-10 w-10 shrink-0 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => handleUpdateStatus(app, 'rejected')}
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {app.status === 'shortlisted' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-10 w-10 shrink-0 rounded-xl border-green-200 text-green-600 hover:bg-green-50"
                            onClick={() => handleUpdateStatus(app, 'hired')}
                            title="Hire Candidate"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-10 w-10 shrink-0 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => handleUpdateStatus(app, 'rejected')}
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 shrink-0 rounded-xl border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold"
                        onClick={() => setReportTarget(app)}
                      >
                        🚩 Report
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
            
            <ReportModal
              isOpen={!!reportTarget}
              onClose={() => setReportTarget(null)}
              reporterType="company"
              reporterId={user?.uid || ""}
              targetType="user"
              targetId={reportTarget?.jobSeekerId || reportTarget?.uid || ""}
              targetName={reportTarget?.seekerName || reportTarget?.name || "Candidate"}
            />
          </TabsContent>

          <TabsContent value="my-jobs" className="m-0">
            <Card className="rounded-[1.5rem] border-none shadow-xl overflow-hidden bg-white w-full">
              <div className="overflow-x-auto w-full">
              <div className="max-h-[600px] overflow-auto w-full"><Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 border-none hover:bg-muted/30">
                    <TableHead className="font-bold text-muted-foreground h-14 px-8 whitespace-nowrap">{t.jobTitleCol}</TableHead>
                    <TableHead className="font-bold text-muted-foreground h-14 whitespace-nowrap">{t.statusCol}</TableHead>
                    <TableHead className="font-bold text-muted-foreground h-14 text-right px-8 whitespace-nowrap">{t.viewsCol}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobsLoading ? (
                    <TableRow><TableCell colSpan={3} className="h-60 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                  ) : liveJobs.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="h-60 text-center font-bold text-muted-foreground">{t.noJobsPosted}</TableCell></TableRow>
                  ) : (
                    liveJobs.map((job) => (
                      <TableRow key={job.id} className="hover:bg-primary/5 border-muted/30">
                        <TableCell className="px-8 py-6 font-black text-lg">{job.jobTitle}</TableCell>
                        <TableCell className="py-6">{getStatusBadge(job.status, job.archiveReason)}</TableCell>
                        <TableCell className="text-right px-8 py-6">
                           <div className="flex items-center justify-end gap-3">
                            <span className="font-black text-primary text-2xl">{job.views || 0}</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 text-muted-foreground hover:text-primary rounded-full hover:bg-primary/5 transition-all"
                              onClick={() => setViewingJobStats(job)}
                              title="View Detailed Audience"
                            >
                              <BarChart3 className="w-5 h-5" />
                            </Button>
                            {job.status === 'approved' && (
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="font-bold border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all rounded-lg h-9"
                                  onClick={() => handleCloseJob(job)}
                                  disabled={isProcessing}
                                >
                                  Close
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="font-bold border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700 transition-all rounded-lg h-9"
                                  onClick={() => setJobToArchive(job)}
                                  disabled={isProcessing}
                                >
                                  Archive
                                </Button>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table></div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Archive Job Modal */}
      <Dialog open={!!jobToArchive} onOpenChange={(o) => !o && setJobToArchive(null)}>
        <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
           <DialogHeader className="p-6 bg-amber-500 text-white text-left">
              <div className="flex items-center gap-3 mb-2">
                 <AlertTriangle className="w-6 h-6" />
                 <DialogTitle className="text-xl font-black uppercase tracking-tight">Archive Job</DialogTitle>
              </div>
              <DialogDescription className="text-white/90 font-medium">
                 Are you sure you want to archive "{jobToArchive?.jobTitle}"? Please provide a reason for archiving this job.
              </DialogDescription>
           </DialogHeader>
           <div className="p-6 space-y-4">
              <div className="space-y-2">
                 <Label className="font-bold text-xs uppercase text-muted-foreground">Reason for Archiving</Label>
                 <Textarea 
                    value={archiveReason}
                    onChange={(e) => setArchiveReason(e.target.value)}
                    placeholder="e.g. Position filled offline, project cancelled, etc."
                    className="min-h-[100px] rounded-xl border-slate-200"
                    maxLength={200}
                 />
              </div>
           </div>
           <DialogFooter className="p-6 bg-slate-50 border-t flex gap-3">
              <Button variant="ghost" onClick={() => setJobToArchive(null)} className="flex-1 font-bold rounded-xl h-12">Cancel</Button>
              <Button 
                disabled={isProcessing || !archiveReason} 
                onClick={handleArchiveJobSubmit} 
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl h-12 shadow-md"
              >
                 {isProcessing ? "Archiving..." : "Archive Job"}
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audience Analysis Modal */}
      <Dialog open={!!viewingJobStats} onOpenChange={(o) => !o && setViewingJobStats(null)}>
        <DialogContent className="max-w-4xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl h-[80vh] flex flex-col">
          <DialogHeader className="p-8 bg-primary text-white text-left shrink-0">
             <div className="flex justify-between items-start gap-4">
               <div>
                 <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-white/20 text-white border-none font-black uppercase text-[10px] tracking-widest">{viewingJobStats?.category}</Badge>
                    <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest">• REACH ANALYSIS</span>
                 </div>
                 <DialogTitle className="text-3xl font-black font-headline tracking-tight">{viewingJobStats?.jobTitle}</DialogTitle>
                 <DialogDescription className="text-primary-foreground/80 font-bold mt-1 uppercase text-xs tracking-widest flex items-center gap-2">
                    <Building2 className="w-3 h-3" /> {viewingJobStats?.companyName} • {viewingJobStats?.views || 0} Total Views
                 </DialogDescription>
               </div>
               <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                 <BarChart3 className="w-10 h-10" />
               </div>
             </div>
          </DialogHeader>
          
          <ScrollArea className="flex-1">
             <div className="p-8">
               <h3 className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-6 border-b pb-2 flex items-center gap-2">
                 <Users className="w-4 h-4" /> Registered Users Who Viewed This Job
               </h3>
               
               {viewersLoading ? (
                 <div className="h-60 flex flex-col items-center justify-center space-y-4">
                   <Loader2 className="w-8 h-8 animate-spin text-primary" />
                   <p className="text-sm font-bold text-muted-foreground">Fetching audience data...</p>
                 </div>
               ) : (jobViewers || []).length === 0 ? (
                 <div className="h-60 flex flex-col items-center justify-center text-center space-y-4 bg-muted/20 rounded-3xl border border-dashed">
                    <Users className="w-12 h-12 text-muted-foreground/30" />
                    <div className="space-y-1">
                      <p className="font-black text-muted-foreground">No Registered Views Yet</p>
                      <p className="text-xs font-medium text-muted-foreground/60 max-w-[200px]">Views might be from anonymous visitors or before tracking started.</p>
                    </div>
                 </div>
               ) : (
                 <div className="rounded-2xl border overflow-hidden">
                   <div className="max-h-[600px] overflow-auto w-full"><Table>
                     <TableHeader className="bg-muted/50">
                       <TableRow>
                         <TableHead className="font-bold">User / Contact</TableHead>
                         <TableHead className="font-bold">Email Address</TableHead>
                         <TableHead className="font-bold">Viewed At</TableHead>
                         <TableHead className="text-right font-bold">Action</TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {(jobViewers || []).map((viewer: any) => (
                         <TableRow key={viewer.id} className="hover:bg-primary/5">
                           <TableCell className="p-4">
                             <div className="flex items-center gap-3">
                               <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary shrink-0"><UserIcon className="w-5 h-5" /></div>
                               <div>
                                 <p className="font-black text-sm">{viewer.name}</p>
                                 <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1"><Smartphone className="w-3 h-3" /> +91 {viewer.phone}</p>
                               </div>
                             </div>
                           </TableCell>
                           <TableCell className="text-sm font-medium text-muted-foreground">
                             <div className="flex items-center gap-2">
                               <Mail className="w-3.5 h-3.5 text-primary/40" />
                               {viewer.email}
                             </div>
                           </TableCell>
                           <TableCell className="text-[11px] font-bold uppercase text-muted-foreground">
                             {safeFormatDate(viewer.viewedAt)}
                           </TableCell>
                           <TableCell className="text-right">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="font-bold rounded-xl border-primary/20 text-primary hover:text-primary hover:bg-primary/5 h-9 transition-all active:scale-95"
                                onClick={() => window.open(`tel:${viewer.phone}`)}
                              >
                                <Phone className="w-3.5 h-3.5 mr-1.5" /> Call
                              </Button>
                           </TableCell>
                         </TableRow>
                       ))}
                     </TableBody>
                   </Table></div>
                 </div>
               )}
             </div>
          </ScrollArea>
          
          <DialogFooter className="p-6 bg-muted/30 border-t shrink-0">
             <Button variant="ghost" className="font-bold text-muted-foreground" onClick={() => setViewingJobStats(null)}>Close Analytics</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Candidate Profile Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={(o) => !o && setSelectedApp(null)}>
        <DialogContent className="max-w-3xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-primary text-white text-left">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <DialogTitle className="text-3xl font-black font-headline tracking-tight">{seekerProfile?.name || selectedApp?.seekerName || "Applicant Profile"}</DialogTitle>
                  <Badge className="bg-white/20 text-white border-none font-black px-3 py-1 rounded-lg">
                    {seekerProfile?.digitalResume?.professional?.totalExperience || seekerProfile?.experience || '0'} YRS EXP
                  </Badge>
                </div>
                <p className="text-primary-foreground/80 font-bold uppercase text-xs tracking-widest flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5" /> Applied for: {selectedApp?.jobTitle}
                </p>
              </div>
              <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden border-2 border-white/30 bg-white/10 shrink-0">
                {seekerProfile?.photo || seekerProfile?.digitalResume?.personal?.profileImage ? (
                  <img src={seekerProfile?.photo || seekerProfile?.digitalResume?.personal?.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/40"><UserIcon className="w-8 h-8" /></div>
                )}
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[60vh] overflow-y-auto overscroll-contain">
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Contact Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 font-bold text-sm">
                    <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0"><Phone className="w-4 h-4" /></div>
                    +91 {seekerProfile?.phone || selectedApp?.phone || "N/A"}
                  </div>
                  <div className="flex items-center gap-3 font-bold text-sm">
                    <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0"><Mail className="w-4 h-4" /></div>
                    {seekerProfile?.email || "Email Not Provided"}
                  </div>
                  <div className="flex items-center gap-3 font-bold text-sm">
                    <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0"><MapPin className="w-4 h-4" /></div>
                    {seekerProfile?.location || "Tirupur Hub"}
                  </div>
                  <div className="flex items-center gap-3 font-bold text-sm">
                    <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0"><Clock className="w-4 h-4" /></div>
                    Applied {safeFormatDistance(selectedApp?.appliedAt)}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Verification Status</h4>
                <div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="text-xs font-black text-green-800 uppercase">NexPride Verified</p>
                    <p className="text-[10px] font-bold text-green-700/70">Phone & Identity Authenticated</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsReportDialogOpen(true)}
                  className="w-full justify-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold rounded-xl h-10 mt-3 shadow-sm transition-all"
                >
                  <AlertTriangle className="w-4 h-4" /> Report Candidate
                </Button>
              </div>
            </div>

            <div className="space-y-6">
               <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2"><Info className="w-3.5 h-3.5" /> About The Candidate</h4>
                <div className="text-sm font-medium leading-relaxed text-muted-foreground bg-muted/20 p-5 rounded-2xl italic border border-dashed whitespace-pre-line">
                  {seekerProfile?.bio || seekerProfile?.digitalResume?.professional?.bio ? (
                    `"${seekerProfile.bio || seekerProfile.digitalResume.professional.bio}"`
                  ) : (
                    `"${seekerProfile?.name || 'This candidate'} is a skilled garment professional with ${seekerProfile?.digitalResume?.professional?.totalExperience || seekerProfile?.experience || 'extensive'} years of industrial experience in Tirupur. Highly proficient in ${seekerProfile?.digitalResume?.professional?.coreSkills?.slice(0, 3).join(', ') || 'modern textile operations'}."`
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Core Skills & Expertise</h4>
                <div className="flex flex-wrap gap-2">
                   {seekerProfile?.digitalResume?.professional?.coreSkills?.length > 0 ? (
                     seekerProfile.digitalResume.professional.coreSkills.map((skill: string) => (
                       <Badge key={skill} variant="secondary" className="bg-primary/5 text-primary border-primary/10 font-bold px-3 py-1 rounded-lg">
                         {skill}
                       </Badge>
                     ))
                   ) : (
                     <span className="text-xs font-bold text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg">General Textile Operations</span>
                   )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-muted/20 border-t flex gap-3">
            <Button 
              variant="ghost" 
              className="rounded-xl font-bold h-12 flex-1" 
              onClick={() => setSelectedApp(null)}
            >
              Close
            </Button>
            {selectedApp?.status === 'applied' && (
              <Button 
                disabled={isProcessing}
                className="bg-primary text-white hover:bg-primary/90 rounded-xl font-black h-12 flex-1 shadow-lg shadow-primary/20 transition-all active:scale-95"
                onClick={() => handleUpdateStatus(selectedApp, 'shortlisted')}
              >
                {isProcessing ? "Processing..." : "Shortlist Candidate"}
              </Button>
            )}
            {selectedApp?.status === 'shortlisted' && (
              <>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black h-12 px-4 shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  onClick={() => window.open(`tel:${seekerProfile?.phone || selectedApp?.phone}`)}
                >
                  <Phone className="w-4 h-4" /> Call Candidate
                </Button>
                <Button 
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700 text-white rounded-xl font-black h-12 flex-1 shadow-lg transition-all active:scale-95"
                  onClick={() => handleUpdateStatus(selectedApp, 'hired')}
                >
                  {isProcessing ? "Processing..." : "Hire Candidate"}
                </Button>
                <Button 
                  disabled={isProcessing}
                  variant="destructive"
                  className="rounded-xl font-black h-12 flex-1 shadow-lg transition-all active:scale-95"
                  onClick={() => handleUpdateStatus(selectedApp, 'rejected')}
                >
                  {isProcessing ? "Processing..." : "Reject"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Candidate Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
           <DialogHeader className="p-8 text-white text-left bg-indigo-600">
              <div className="flex items-center gap-3 mb-2">
                 <AlertTriangle className="w-6 h-6" />
                 <DialogTitle className="text-xl font-black uppercase tracking-tight">
                   Report Candidate
                 </DialogTitle>
              </div>
              <DialogDescription className="text-white/80 font-medium">
                 Help us maintain NexPride as a safe and trusted environment. All reports are strictly confidential.
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
                       {["Fake Profile", "Invalid Contact Number", "False Documents", "Suspicious Activity", "Other"].map(r => (
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
                    value={reportDesc}
                    onChange={e => setReportDesc(e.target.value)}
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
                className="flex-[2] text-white font-black rounded-xl h-12 border-none shadow-md bg-indigo-600 hover:bg-indigo-700"
              >
                 {reporting ? "Submitting..." : "Submit Report"}
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
