
"use client";

import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  Search, 
  Bell, 
  ChevronRight, 
  MapPin, 
  Briefcase,
  FileText,
  UserCircle,
  Info,
  Calendar,
  ShieldCheck,
  Loader2,
  TrendingUp,
  Mail,
  Trash2,
  IndianRupee,
  Zap,
  ShieldAlert,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/utils";
import { useAuth, useFirestore, useCollection, useDoc } from "@/firebase";
import { collection, query, where, orderBy, doc, updateDoc, deleteDoc, limit } from "firebase/firestore";
import { formatDistanceToNow, isValid } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

function ApplicationTimeline({ status }: { status: string }) {
  const steps = ["applied", "shortlisted", "hired"];
  const isRejected = status === "rejected";
  const currentIndex = steps.indexOf(status);

  return (
    <div className="mt-4 md:mt-6 pt-4 border-t border-muted/30">
      <div className="relative flex justify-between items-center px-4 md:px-6">
        <div className="absolute top-[10px] left-6 right-6 h-0.5 bg-muted/20 -translate-y-1/2 z-0" />
        {isRejected ? (
          <div className="absolute top-[10px] left-6 right-6 h-0.5 bg-red-500 -translate-y-1/2 z-0" />
        ) : (
          currentIndex >= 0 && (
            <div 
              className="absolute top-[10px] left-6 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-700" 
              style={{ width: `${(currentIndex / (steps.length - 1)) * (100 - 12)}%` }}
            />
          )
        )}

        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const isActive = !isRejected && idx <= currentIndex;
          const isCompleted = !isRejected && idx < currentIndex;
          
          return (
            <div key={step} className="relative z-10 flex flex-col items-center">
              <div className={cn(
                "w-4 h-4 md:w-5 md:h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 bg-white",
                isRejected ? "border-red-500 bg-red-500" : (isActive ? "border-primary" : "border-muted"),
                isCompleted ? "bg-primary" : ""
              )}>
                {isRejected ? (
                  isLast ? <XCircle className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-white" /> : <CheckCircle className="w-2 md:w-3 h-2 md:h-3 text-white" />
                ) : (
                  isCompleted ? (
                    <CheckCircle className="w-2.5 md:w-3 h-2.5 md:h-3 text-white" />
                  ) : isActive ? (
                    <div className="w-1 md:w-1.5 h-1 md:h-1.5 bg-primary rounded-full animate-pulse" />
                  ) : null
                )}
              </div>
              <span className={cn(
                "text-[8px] md:text-[10px] font-bold uppercase tracking-wider mt-2",
                isRejected ? "text-red-500" : (isActive ? "text-primary" : "text-muted-foreground")
              )}>
                {isRejected && isLast ? "Rejected" : (step === 'hired' ? 'Result' : step)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SeekerDashboard() {
  const { t } = useLanguage();
  const auth = useAuth();
  const db = useFirestore();
  
  const [openNotifications, setOpenNotifications] = useState(false);
  const [userCategory, setUserCategory] = useState<'Worker' | 'Staff'>('Worker');

  // Fetch real user profile for matching
  const profileRef = useMemo(() => auth.currentUser ? doc(db, "Users", auth.currentUser.uid) : null, [db, auth.currentUser]);
  const { data: profile } = useDoc<any>(profileRef);

  // Fetch real applications - Index-free query for real-time synchronization
  const appsQuery = useMemo(() => {
    if (!auth.currentUser) return null;
    return query(
      collection(db, "Applications"),
      where("jobSeekerId", "==", auth.currentUser.uid)
    );
  }, [auth.currentUser, db]);

  // Only run collection query if authenticated to prevent permission errors
  const { data: rawApps, loading: appsLoading } = useCollection<any>(auth.currentUser ? appsQuery : null);

  // In-Memory Sorting to handle serverTimestamp and index-free performance
  const realApps = useMemo(() => {
    if (!rawApps) return [];
    return [...rawApps].sort((a, b) => {
      const timeA = a.appliedAt?.seconds || a.appliedAt?.toMillis?.() || Date.now();
      const timeB = b.appliedAt?.seconds || b.appliedAt?.toMillis?.() || Date.now();
      return timeB - timeA;
    });
  }, [rawApps]);

  // Fetch real-time recommended jobs based on profile
  const recommendationsQuery = useMemo(() => {
    const cat = profile?.category || userCategory;
    return query(
      collection(db, "Jobs"),
      where("status", "==", "approved"),
      where("category", "==", cat),
      limit(3)
    );
  }, [db, profile, userCategory]);

  const { data: recommendedJobs, loading: recsLoading } = useCollection<any>(recommendationsQuery);

  // Fetch notifications
  const notificationsQuery = useMemo(() => {
    if (!auth.currentUser) return null;
    return query(
      collection(db, "UserNotifications"),
      where("userId", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    );
  }, [auth.currentUser, db]);

  const { data: notifications, loading: notifLoading } = useCollection<any>(auth.currentUser ? notificationsQuery : null);

  useEffect(() => {
    const saved = localStorage.getItem('sim_job_seeker_category') as 'Worker' | 'Staff';
    if (saved) setUserCategory(saved);
  }, []);

  const unreadCount = useMemo(() => {
    return (notifications || []).filter(n => n.status === 'unread').length;
  }, [notifications]);

  const handleMarkAsRead = (notif: any) => {
    if (notif.status === 'read') return;
    const notifRef = doc(db, "UserNotifications", notif.id);
    updateDoc(notifRef, { status: 'read' });
  };

  const handleClearAll = async () => {
    if (!notifications) return;
    notifications.forEach(n => {
      deleteDoc(doc(db, "UserNotifications", n.id));
    });
  };

  const safeFormatDistance = (dateVal: any) => {
    if (!dateVal) return "Just now";
    try {
      const date = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
      if (!isValid(date)) return "Recently";
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return "Recently";
    }
  };

  if (profile?.status === 'suspended') {
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
                Your NexPride candidate account has been suspended by our trust & safety moderation team for violating our community guidelines.
              </p>
            </div>
            <div className="bg-white/60 p-4 rounded-xl border text-xs font-bold text-slate-500">
              Suspended accounts cannot apply for jobs or view employer listings.
            </div>
            <Button className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-lg shadow-red-200 transition-all" onClick={() => window.open("mailto:support@nexpride.com")}>
              Contact Safety Desk
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 md:space-y-8">
        {profile?.warningCount > 0 && (
          <div className="bg-amber-50 border-2 border-dashed border-amber-300 p-6 rounded-3xl flex items-start gap-4 shadow-sm animate-pulse">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-left">
              <h4 className="font-black text-amber-800 text-sm">Community Safety Warning</h4>
              <p className="text-xs font-semibold text-amber-700 leading-relaxed">
                Your profile has received a formal warning ({profile.warningCount} total) from our trust & safety moderation desk due to reported guidelines violations. Please ensure your applications and communications remain respectful and genuine. Multiple warnings will lead to temporary suspension or permanent blocking of your account.
              </p>
            </div>
          </div>
        )}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 w-full">
            <h1 className="text-2xl md:text-3xl font-extrabold font-headline text-primary">Welcome Back! 👋</h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="text-muted-foreground text-sm font-medium">
                Your career dashboard in Tirupur's garment hub
              </p>
              <Badge variant="outline" className="w-fit text-[9px] uppercase tracking-widest border-primary/20 text-primary bg-primary/5 font-bold py-1 px-3">
                <Calendar className="w-3 h-3 mr-1.5" /> Industrial Member
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <Link href="/jobs" className="flex-1 md:flex-none">
              <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold h-11 px-6 shadow-lg shadow-accent/20 rounded-xl transition-all active:scale-95">
                <Search className="mr-2 w-4 h-4 md:w-5 md:h-5" /> {t.findJobs}
              </Button>
            </Link>
            
            <Dialog open={openNotifications} onOpenChange={setOpenNotifications}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-11 w-11 relative rounded-xl border-primary/20 text-primary hover:bg-primary/5 transition-all active:scale-95">
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
                      <p className="text-[10px] font-medium text-muted-foreground/60">We'll notify you when a factory owner shortlists your application.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-muted">
                      {(notifications || []).map((n: any) => (
                        <div 
                          key={n.id} 
                          onClick={() => handleMarkAsRead(n)}
                          className={cn(
                            "p-5 space-y-2 hover:bg-muted/30 transition-colors cursor-pointer relative",
                            n.status === 'unread' && "bg-primary/5 border-l-4 border-primary"
                          )}
                        >
                          <div className="flex justify-between items-start gap-3">
                            <h4 className="text-xs font-black text-primary uppercase tracking-tight">{n.title}</h4>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase shrink-0">{safeFormatDistance(n.createdAt)}</span>
                          </div>
                          <p className="text-sm font-medium text-muted-foreground leading-snug">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold font-headline flex items-center gap-2 px-1">
              <FileText className="w-5 h-5 text-primary" /> My Applications
            </h2>
            
            <div className="space-y-4">
              {appsLoading ? (
                <div className="py-20 text-center space-y-4 bg-muted/10 rounded-3xl border-2 border-dashed">
                  <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                  <p className="font-bold text-muted-foreground">Syncing your status...</p>
                </div>
              ) : (realApps || []).length === 0 ? (
                <div className="py-20 text-center space-y-6 bg-muted/10 rounded-3xl border-2 border-dashed">
                  <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="font-black text-lg text-muted-foreground">No Applications Yet</h3>
                    <p className="text-sm font-medium text-muted-foreground/60">Start applying to factory jobs to track them here.</p>
                  </div>
                  <Link href="/jobs">
                    <Button variant="outline" className="rounded-xl border-primary text-primary hover:text-primary active:scale-95 transition-all font-bold">Find Local Jobs</Button>
                  </Link>
                </div>
              ) : (
                realApps.map((app: any) => (
                  <Card key={app.id} className="group hover:border-primary/30 transition-all shadow-sm rounded-2xl overflow-hidden border-muted/60">
                    <CardContent className="p-5 md:p-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex gap-4 w-full">
                          <div className={cn(
                            "w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0",
                            app.status === 'shortlisted' || app.status === 'hired' ? 'bg-green-500' : 
                            app.status === 'rejected' ? 'bg-red-500' : 'bg-primary'
                          )}>
                            <Briefcase className="w-5 h-5 md:w-6 md:h-6" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-base md:text-lg truncate group-hover:text-primary transition-colors">{app.jobTitle || "Industrial Position"}</h3>
                            <p className="text-xs md:text-sm text-muted-foreground font-medium truncate">{app.companyName || "Industrial Unit"}</p>
                            <p className="text-[9px] md:text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">Applied {safeFormatDistance(app.appliedAt)}</p>
                          </div>
                          <Badge className={cn(
                            "h-fit capitalize font-black px-3 py-1 rounded-lg text-[10px] md:text-xs border-none",
                            app.status === 'applied' ? "bg-blue-100 text-blue-700" :
                            app.status === 'shortlisted' ? "bg-green-100 text-green-700" :
                            app.status === 'rejected' ? "bg-red-100 text-red-700" :
                            "bg-purple-100 text-purple-700"
                          )} variant="secondary">
                            {app.status}
                          </Badge>
                        </div>
                      </div>
                      <ApplicationTimeline status={app.status} />
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
             <h2 className="text-xl font-bold font-headline flex items-center gap-2 px-1">
              <TrendingUp className="w-5 h-5 text-accent" /> Recommended
            </h2>
            <div className="grid grid-cols-1 gap-5">
              {recsLoading ? (
                [1, 2].map(i => (
                  <Card key={i} className="animate-pulse bg-muted/20 border-none rounded-[2rem] h-40" />
                ))
              ) : (recommendedJobs || []).length === 0 ? (
                <Card className="border-dashed bg-muted/10 rounded-[2rem] p-8 text-center space-y-3">
                  <Zap className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                  <p className="text-xs font-bold text-muted-foreground">No specific matches yet.</p>
                  <Link href="/jobs">
                    <Button variant="link" className="text-primary text-xs font-bold">Browse all jobs</Button>
                  </Link>
                </Card>
              ) : (
                (recommendedJobs || []).map((job: any) => (
                  <Card key={job.id} className="bg-primary text-white border-none shadow-2xl rounded-[2rem] overflow-hidden group hover:scale-[1.02] transition-all duration-200 flex flex-col justify-between h-[180px]">
                    <CardHeader className="pb-2 pt-6 px-6 shrink-0">
                      <CardTitle className="font-headline text-lg truncate pr-2">{job.companyName}</CardTitle>
                      <CardDescription className="text-primary-foreground/70 font-medium text-xs line-clamp-1">
                        Matching your "{job.jobTitle || job.designation || 'Specialist'}" skill
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 px-6 pb-6 mt-auto">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-[10px] font-bold bg-white/10 p-2.5 rounded-xl min-w-0">
                          <MapPin className="w-3.5 h-3.5 text-accent shrink-0" /> <span className="truncate capitalize">{t.locations[job.location as keyof typeof t.locations] || job.location || 'Remote'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold bg-white/10 p-2.5 rounded-xl min-w-0">
                          <IndianRupee className="w-3.5 h-3.5 text-accent shrink-0" />
                          <span className="truncate">₹{job.salaryMin ? `${(job.salaryMin/1000).toFixed(0)}k` : '?'}-{(job.salaryMax/1000).toFixed(0)}k</span>
                        </div>
                      </div>
                      <Link href={`/jobs/${job.id}`} className="block">
                        <Button className="w-full bg-white text-primary hover:bg-white/90 font-extrabold h-11 rounded-xl shadow-lg text-sm transition-transform active:scale-95">
                          View Match
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <Card className="border-primary/10 bg-muted/20 rounded-[2rem] overflow-hidden border-2 border-dashed">
               <CardContent className="p-6 text-center space-y-4">
                 <div className="bg-white w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                   <UserCircle className="w-8 h-8 text-primary" />
                 </div>
                 <div className="space-y-1">
                   <h3 className="font-bold text-lg">Update Records</h3>
                   <p className="text-xs text-muted-foreground font-medium leading-snug">Increases hiring chances by 60% with verified badges.</p>
                 </div>
                 <Link href="/seeker/profile" className="block">
                    <Button variant="outline" className="w-full font-bold h-11 border-primary text-primary hover:bg-primary/5 hover:text-primary active:scale-95 transition-all rounded-xl">Open Profile</Button>
                 </Link>
               </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-100 rounded-[2rem] p-6 space-y-4 border">
               <div className="flex items-center gap-3 text-green-900 font-bold">
                 <ShieldCheck className="w-6 h-6 text-green-600" /> Safe Hiring
               </div>
               <p className="text-xs text-green-800/70 font-medium leading-relaxed">
                 All jobs on NexPride are verified with GST and Photo proof. Genuine work is always free.
               </p>
               <Link href="/safety" className="text-xs font-bold text-green-700 hover:underline inline-flex items-center gap-1">
                 Read Safety Guide <ChevronRight className="w-3 h-3" />
               </Link>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
