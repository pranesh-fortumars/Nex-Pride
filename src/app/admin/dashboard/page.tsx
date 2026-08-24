
"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Briefcase, 
  Search, 
  CheckCircle2, 
  MoreVertical,
  Eye,
  Trash2,
  Flag,
  CheckCircle,
  UserCheck,
  Building2,
  Phone,
  MapPin,
  Clock,
  CreditCard,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  History,
  Copy,
  Check,
  FileText,
  Camera,
  ChevronRight,
  Loader2,
  TrendingUp,
  UserX,
  ShieldCheck,
  IndianRupee,
  PhoneCall,
  XCircle,
  ShieldBan,
  User as UserIcon,
  Calendar as CalendarIcon,
  Filter,
  Plus,
  Settings2,
  Tag,
  Bell,
  Info,
  MessageCircle,
  ShieldQuestion,
  FileWarning,
  Smartphone,
  Zap,
  Bus,
  Coffee,
  ShoppingBag,
  Home,
  Tags,
  Heart,
  BarChart3,
  Mail,
  Smartphone as PhoneIcon
} from "lucide-react";
import { ProfileTab } from "@/components/admin/ProfileTab";
import { ManageAdminsTab } from "@/components/admin/ManageAdminsTab";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CompanyPhotosCarousel from "@/components/CompanyPhotosCarousel";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useFirestore, useCollection, useUser, useDoc } from "@/firebase";
import { collection, doc, updateDoc, query, orderBy, where, deleteDoc, addDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { format, isValid } from "date-fns";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { firebaseConfig } from "@/firebase/config";

const DEPARTMENTS = {
  Staff: [
    "MERCHANDISING", "FABRIC", "PRINT & EMBROIDERY", "PRODUCTION", "QUALITY", "HR & ADMIN", "ACCOUNTS & DOCS", "CAD & SAMPLING", "ERP/EDP", "STORE", "OTHERS"
  ],
  Worker: [
    "CUTTING", "SEWING", "CHECKING", "IRONING & PACKING", "KNITTING", "DYEING", "COMPACTING", "PRINT / EMBROIDERY", "OTHERS"
  ]
};

export default function AdminDashboard() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const db = useFirestore();
  const { user, isLoading: authLoading } = useUser();
  const router = useRouter();

  // Load Admin Profile first to gate collection queries
  const profileRef = useMemo(() => user ? doc(db, "Users", user.uid) : null, [db, user]);
  const { data: userProfile, loading: profileLoading } = useDoc<any>(profileRef);
  
  const isActuallyAdmin = useMemo(
    () => userProfile?.role === 'admin' || userProfile?.role === 'superadmin',
    [userProfile]
  );
  
  // Also accept demo/simulation mode via localStorage
  const [simRole, setSimRole] = useState<string | null>(null);
  useEffect(() => {
    setSimRole(localStorage.getItem('sim_user_role'));
  }, []);
  
  const isDemoAdmin = simRole === 'admin' || simRole === 'superadmin';
  const canQuery = isActuallyAdmin; // Do not fetch from live Firestore if they are not a real authenticated Admin in Firebase to prevent permission errors.

  // Queries - Gated by canQuery to prevent permission errors
  const usersQuery = useMemo(() => canQuery ? query(collection(db, "Users")) : null, [db, canQuery]);
  const reportsQuery = useMemo(() => canQuery ? query(collection(db, "Reports")) : null, [db, canQuery]);
  const paymentsQuery = useMemo(() => canQuery ? query(collection(db, "Payments")) : null, [db, canQuery]);
  const designationsQuery = useMemo(() => canQuery ? query(collection(db, "Designations")) : null, [db, canQuery]);
  const notificationsQuery = useMemo(() => canQuery ? query(collection(db, "AdminNotifications")) : null, [db, canQuery]);
  const pendingJobsQuery = useMemo(() => canQuery ? query(collection(db, "Jobs"), where("status", "==", "pending")) : null, [db, canQuery]);
  const allJobsQuery = useMemo(() => canQuery ? query(collection(db, "Jobs"), orderBy("createdAt", "desc")) : null, [db, canQuery]);
  
  const { data: rawUsers, loading: usersLoading } = useCollection<any>(usersQuery);
  const { data: rawReports, loading: reportsLoading } = useCollection<any>(reportsQuery);
  const { data: rawPayments, loading: paymentsLoading } = useCollection<any>(paymentsQuery);
  const { data: rawDesignations, loading: designationsLoading } = useCollection<any>(designationsQuery);
  const { data: rawNotifications, loading: notificationsLoading } = useCollection<any>(notificationsQuery);
  const { data: rawPendingJobs, loading: jobsLoading } = useCollection<any>(pendingJobsQuery);
  const { data: rawAllJobs, loading: allJobsLoading } = useCollection<any>(allJobsQuery);

  // In-Memory Sorting
  const liveUsers = useMemo(() => {
    const list = [...(rawUsers || [])];
    if (typeof window !== 'undefined') {
      const simRole = localStorage.getItem('sim_user_role');
      const simName = localStorage.getItem('sim_user_name');
      if (simName && simRole) {
        const isEmployer = simRole === 'employer';
        const simUser = {
          id: isEmployer ? 'sim-employer-id' : 'sim-seeker-id',
          uid: isEmployer ? 'sim-employer-id' : 'sim-seeker-id',
          name: simName,
          role: simRole, 
          gst: localStorage.getItem('sim_user_gst') || '',
          location: localStorage.getItem('sim_user_location') || 'avinashi',
          photo: localStorage.getItem('sim_user_photo') || '',
          status: localStorage.getItem('sim_user_status') || 'pending',
          phone: localStorage.getItem('sim_user_phone') || '+919999999999',
          profileSubmitted: localStorage.getItem('sim_user_profileSubmitted') === 'true',
          createdAt: { seconds: Date.now() / 1000 }
        };
        if (!list.some(u => u.uid === simUser.uid || u.id === simUser.id)) {
          list.push(simUser);
        }
      }
    }
    return list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [rawUsers]);
  const liveReports = useMemo(() => [...(rawReports || [])].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)), [rawReports]);
  const livePayments = useMemo(() => [...(rawPayments || [])].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)), [rawPayments]);
  const liveDesignations = useMemo(() => {
    if (rawDesignations && rawDesignations.length > 0) {
      return [...rawDesignations].sort((a, b) => (a.title || a.name || '').localeCompare(b.title || b.name || ''));
    }
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sim_designations');
      if (saved) {
        return JSON.parse(saved).sort((a: any, b: any) => (a.title || a.name || '').localeCompare(b.title || b.name || ''));
      }
    }
    return [
      { id: "sim-d-1", title: "Software Engineer", category: "Staff", department: "HR & ADMIN", isActive: true },
      { id: "sim-d-2", title: "Merchandising Assistant", category: "Staff", department: "MERCHANDISING", isActive: true },
      { id: "sim-d-3", title: "Senior Tailor", category: "Worker", department: "SEWING", isActive: true }
    ].sort((a, b) => a.title.localeCompare(b.title));
  }, [rawDesignations]);
  const notifications = useMemo(() => [...(rawNotifications || [])].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)), [rawNotifications]);
  const pendingJobs = useMemo(() => [...(rawPendingJobs || [])].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)), [rawPendingJobs]);

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  const [jobToArchive, setJobToArchive] = useState<any>(null);
  const [archiveReason, setArchiveReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedJobEmployer = useMemo(() => {
    if (!selectedJob || !liveUsers) return null;
    return liveUsers.find(u => u.uid === selectedJob.employerId || u.id === selectedJob.employerId);
  }, [selectedJob, liveUsers]);

  const isCompanyApproved = useMemo(() => {
    if (!selectedJob) return true;
    if (selectedJobEmployer) {
      return selectedJobEmployer.status === 'approved';
    }
    return false;
  }, [selectedJob, selectedJobEmployer]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const [reportFilter, setReportFilter] = useState("all");

  const [isDesignationDialogOpen, setIsDesignationDialogOpen] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState<any>(null);
  const [designationSearch, setDesignationSearch] = useState("");
  
  const [supportAddress, setSupportAddress] = useState("");
  const [supportHours, setSupportHours] = useState("");
  const supportRef = useMemo(() => canQuery ? doc(db, "SystemConfig", "supportConfig") : null, [db, canQuery]);

  const [adminProfileData, setAdminProfileData] = useState({ name: "", dob: "" });
  const [newAdminData, setNewAdminData] = useState({ name: "", email: "", password: "", dob: "" });
  const [isAdminCreating, setIsAdminCreating] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setAdminProfileData({
        name: userProfile.name || "",
        dob: userProfile.dob || ""
      });
    }
  }, [userProfile]);

  const handleUpdateAdminProfile = async () => {
    if (!profileRef) return;
    try {
      setIsProcessing(true);
      await updateDoc(profileRef, {
        name: adminProfileData.name,
        dob: adminProfileData.dob,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Profile Updated Successfully" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error updating profile", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminData.name || !newAdminData.email || !newAdminData.password || !newAdminData.dob) {
      toast({ variant: "destructive", title: "Missing fields" });
      return;
    }
    if (newAdminData.password.length < 6) {
      toast({ variant: "destructive", title: "Weak password", description: "Password must be at least 6 characters" });
      return;
    }
    setIsAdminCreating(true);
    let tempApp = null;
    try {
      tempApp = initializeApp(firebaseConfig, "TempAdminApp");
      const tempAuth = getAuth(tempApp);
      
      const userCred = await createUserWithEmailAndPassword(tempAuth, newAdminData.email, newAdminData.password);
      const newUid = userCred.user.uid;

      await setDoc(doc(db, "Users", newUid), {
        uid: newUid,
        name: newAdminData.name,
        email: newAdminData.email,
        role: "admin",
        dob: newAdminData.dob,
        status: "approved",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        onboarded: true
      });

      toast({ title: "Super Admin Created Successfully!" });
      setNewAdminData({ name: "", email: "", password: "", dob: "" });
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Error creating admin", description: err.message });
    } finally {
      if (tempApp) {
        await deleteApp(tempApp);
      }
      setIsAdminCreating(false);
    }
  };
  const { data: supportConfigData } = useDoc<any>(supportRef);
  
  useEffect(() => {
    if (supportConfigData) {
      setSupportAddress(supportConfigData.officeAddress || "NexPride.in Hub,\\nOpp. Old Bus Stand, Avinashi Road,\\nTirupur, Tamil Nadu - 641601");
      setSupportHours(supportConfigData.officeHours || "Monday - Saturday: 9:00 AM - 6:00 PM");
    }
  }, [supportConfigData]);

  const saveSupportConfig = async () => {
    if (!canQuery) {
      toast({ title: "Settings saved (Simulated)" });
      return;
    }
    try {
      await updateDoc(doc(db, "SystemConfig", "supportConfig"), {
        officeAddress: supportAddress,
        officeHours: supportHours,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Settings Saved!" });
    } catch (e: any) {
      if (e.code === 'not-found') {
         await setDoc(doc(db, "SystemConfig", "supportConfig"), {
           officeAddress: supportAddress,
           officeHours: supportHours,
           updatedAt: serverTimestamp()
         });
         toast({ title: "Settings Saved!" });
      } else {
         toast({ variant: "destructive", title: "Failed to save settings" });
      }
    }
  };

  const DESIGNATION_CATEGORIES = ["Staff", "Worker"];
  const DEPARTMENTS = {
    Staff: [
      "MERCHANDISING", "FABRIC", "PRINT & EMBROIDERY", "PRODUCTION", "QUALITY", "HR & ADMIN", "ACCOUNTS & DOCS", "CAD & SAMPLING", "ERP/EDP", "STORE", "OTHERS"
    ],
    Worker: [
      "CUTTING", "SEWING", "CHECKING", "IRONING & PACKING", "KNITTING", "DYEING", "COMPACTING", "PRINT / EMBROIDERY", "OTHERS"
    ]
  };
  const [newDesignation, setNewDesignation] = useState({ title: "", category: "Staff", department: "HR & ADMIN", isActive: true });

  // View Details Modal State
  const [viewingJobStats, setViewingJobStats] = useState<any>(null);
  const jobViewsQuery = useMemo(() => 
    viewingJobStats ? query(collection(db, "Jobs", viewingJobStats.id, "Views"), orderBy("viewedAt", "desc")) : null, 
  [db, viewingJobStats]);
  const { data: jobViewers, loading: viewersLoading } = useCollection<any>(jobViewsQuery);

  // Profile Change Request for diff review
  const changeRequestRef = useMemo(() => selectedItem?.id ? doc(db, "ProfileChangeRequests", selectedItem.id) : null, [db, selectedItem]);
  const { data: changeRequest } = useDoc<any>(changeRequestRef);

  const [confirmAction, setConfirmAction] = useState<{
    type: 'approved' | 'rejected' | 'suspended' | 'pending' | 'delete' | 'dismiss';
    coll: string;
    id: string;
    label: string;
    targetName?: string;
  } | null>(null);

  const stats = useMemo(() => {
    const users = liveUsers || [];
    const payments = livePayments || [];
    return {
      factories: users.filter(u => u.role === 'employer').length,
      workers: users.filter(u => u.role === 'job_seeker' && u.category === 'Worker').length,
      staff: users.filter(u => u.role === 'job_seeker' && u.category === 'Staff').length,
      pendingVerification: users.filter(u => u.role === 'employer' && u.status === 'pending' && u.name && u.profileSubmitted).length,
      upcomingDues: payments.filter(p => p.paymentStatus !== 'paid').length,
      pendingJobs: (pendingJobs || []).length
    };
  }, [liveUsers, livePayments, pendingJobs]);

  const unreadCount = useMemo(() => {
    return (notifications || []).filter(n => n.status === 'unread').length;
  }, [notifications]);

  const handleNotificationClick = (notif: any) => {
    const docRef = doc(db, "AdminNotifications", notif.id);
    updateDoc(docRef, { status: 'read' });

    if (notif.type === 'new_employer' || notif.type === 'profile_update') {
      const employer = (liveUsers || []).find(u => u.uid === notif.targetId || u.id === notif.targetId);
      if (employer) {
        setSelectedItem(employer);
        setActiveTab("pending");
      }
    } else if (notif.type === 'new_job') {
      const job = (pendingJobs || []).find(j => j.id === notif.targetId);
      if (job) {
        setSelectedJob(job);
        setActiveTab("jobs-queue");
      } else {
        setActiveTab("jobs-queue");
      }
    }
  };

  const handleSaveDesignation = () => {
    if (!newDesignation.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    const isSim = !canQuery;
    if (isSim) {
      const saved = localStorage.getItem('sim_designations');
      let list = saved ? JSON.parse(saved) : [
        { id: "sim-d-1", title: "Software Engineer", category: "Staff", department: "HR & ADMIN", isActive: true },
        { id: "sim-d-2", title: "Merchandising Assistant", category: "Staff", department: "MERCHANDISING", isActive: true },
        { id: "sim-d-3", title: "Senior Tailor", category: "Worker", department: "SEWING", isActive: true }
      ];
      if (editingDesignation) {
        list = list.map((item: any) => 
          item.id === editingDesignation.id 
            ? { ...item, title: newDesignation.title.trim(), category: newDesignation.category, department: newDesignation.department, isActive: newDesignation.isActive }
            : item
        );
        toast({ title: "Designation Updated (Simulated)" });
      } else {
        const newItem = {
          id: `mock-${Date.now()}`,
          title: newDesignation.title.trim(),
          category: newDesignation.category,
          department: newDesignation.department,
          isActive: newDesignation.isActive
        };
        list.push(newItem);
        toast({ title: "Designation Added (Simulated)" });
      }
      localStorage.setItem('sim_designations', JSON.stringify(list));
      setIsDesignationDialogOpen(false);
      setEditingDesignation(null);
      return;
    }

    if (editingDesignation) {
      // Edit existing
      const docRef = doc(db, "Designations", editingDesignation.id);
      updateDoc(docRef, {
        title: newDesignation.title.trim(),
        category: newDesignation.category,
        department: newDesignation.department,
        isActive: newDesignation.isActive,
        updatedAt: serverTimestamp(),
      }).then(() => {
        toast({ title: "Designation Updated" });
        setIsDesignationDialogOpen(false);
        setEditingDesignation(null);
      });
    } else {
      // Add new
      const collRef = collection(db, "Designations");
      addDoc(collRef, {
        title: newDesignation.title.trim(),
        category: newDesignation.category,
        department: newDesignation.department,
        isActive: newDesignation.isActive,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).then(() => {
        toast({ title: "Designation Added" });
        setNewDesignation({ title: "", category: "Staff", department: "HR & ADMIN", isActive: true });
        setIsDesignationDialogOpen(false);
      });
    }
  };

  const handleToggleDesignationActive = (d: any) => {
    const isSim = !canQuery;
    if (isSim) {
      const saved = localStorage.getItem('sim_designations');
      if (saved) {
        const list = JSON.parse(saved).map((item: any) => 
          item.id === d.id ? { ...item, isActive: !d.isActive } : item
        );
        localStorage.setItem('sim_designations', JSON.stringify(list));
        toast({ title: !d.isActive ? "Designation activated" : "Designation deactivated" });
      }
      return;
    }

    const docRef = doc(db, "Designations", d.id);
    updateDoc(docRef, { isActive: !d.isActive, updatedAt: serverTimestamp() }).then(() => {
      toast({ title: d.isActive ? "Designation deactivated" : "Designation activated" });
    });
  };

  const openEditDesignation = (d: any) => {
    setEditingDesignation(d);
    setNewDesignation({ 
      title: d.title || d.name || "", 
      category: d.category || "Staff", 
      department: d.department || "HR & ADMIN",
      isActive: d.isActive !== false 
    });
    setIsDesignationDialogOpen(true);
  };

  const openAddDesignation = () => {
    setEditingDesignation(null);
    setNewDesignation({ title: "", category: "Staff", department: "HR & ADMIN", isActive: true });
    setIsDesignationDialogOpen(true);
  };

  const handleToggleTrustedEmployer = (id: string, currentStatus: boolean) => {
    const docRef = doc(db, 'Users', id);
    updateDoc(docRef, { trustedEmployer: !currentStatus })
      .then(() => {
        toast({ title: "Trust Level Updated", description: `Employer is now ${!currentStatus ? 'Trusted (Auto-Approve Jobs)' : 'Standard'}.` });
        if (selectedItem?.id === id) {
          setSelectedItem({ ...selectedItem, trustedEmployer: !currentStatus });
        }
      })
      .catch((error) => console.error("Error updating trust:", error));
  };

  const executeAction = () => {
    if (!confirmAction) return;

    const { type, coll, id } = confirmAction;

    if (id === 'sim-employer-id') {
      if (type === 'delete') {
        localStorage.removeItem('sim_user_name');
        localStorage.removeItem('sim_user_gst');
        localStorage.removeItem('sim_user_location');
        localStorage.removeItem('sim_user_photo');
        localStorage.removeItem('sim_user_status');
        toast({ title: "Simulated Record Deleted" });
      } else {
        localStorage.setItem('sim_user_status', type);
        toast({ title: `Status Updated`, description: `Simulated record is now ${type}.` });
      }
      setConfirmAction(null);
      setSelectedItem(null);
      return;
    }

    if (type === 'delete' || type === 'dismiss') {
      const docRef = doc(db, coll, id);
      deleteDoc(docRef).then(() => {
        toast({ title: type === 'delete' ? "Record Deleted" : "Report Dismissed", variant: "destructive" });
        setConfirmAction(null);
        setTimeout(() => {
          if (selectedItem?.id === id) setSelectedItem(null);
          if (selectedReport?.id === id) setSelectedReport(null);
          if (selectedJob?.id === id) setSelectedJob(null);
        }, 100);
      });
      return;
    }

    const docRef = doc(db, coll, id);
    const updateData = { 
      status: type, 
      verified: type === 'approved', 
      updatedAt: serverTimestamp() 
    };
    
    updateDoc(docRef, updateData)
      .then(() => {
        toast({ title: `Status Updated`, description: `The record is now ${type}.` });
        setConfirmAction(null);
        setTimeout(() => {
          if (selectedItem?.id === id) setSelectedItem({ ...selectedItem, ...updateData });
          if (selectedJob?.id === id) setSelectedJob(null);
        }, 100);
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: updateData,
        }));
      });
  };

  const handleUpdateReportStatus = async (reportId: string, status: string, targetId?: string, actionType?: string) => {
    const reportRef = doc(db, "Reports", reportId);
    const updateData: any = { 
      status: status, 
      updatedAt: serverTimestamp() 
    };
    if (actionType) {
      updateData.moderationAction = actionType;
    }
    
    try {
      await updateDoc(reportRef, updateData);
      toast({ title: `Report status updated to ${status.toUpperCase()}`, description: actionType ? `Action performed: ${actionType}` : undefined });
      
      const notificationsRef = collection(db, "UserNotifications");
      const targetName = selectedReport?.targetName || "Target";
      const reporterId = selectedReport?.reportedById;
      
      // 1. Notify the reporter (e.g. company owner or candidate who filed the report)
      if (reporterId) {
        let reporterMsg = "";
        let reporterTitle = "Incident Report Update";
        
        if (actionType === "warn_user") {
          reporterTitle = "Report Resolved: User Warned";
          reporterMsg = `Your safety report against "${targetName}" has been reviewed. The moderation team has issued a formal warning to this candidate.`;
        } else if (actionType === "suspend_user") {
          reporterTitle = "Report Resolved: User Suspended";
          reporterMsg = `Your safety report against "${targetName}" has been reviewed. The moderation team has suspended the target user account.`;
        } else if (actionType === "block_user") {
          reporterTitle = "Report Resolved: User Blocked";
          reporterMsg = `Your safety report against "${targetName}" has been reviewed. The target has been permanently blocked from our platform.`;
        } else if (actionType === "reject_report") {
          reporterTitle = "Report Reviewed";
          reporterMsg = `Your safety report against "${targetName}" has been reviewed. We found no policy violations at this time, and the report has been closed.`;
        } else if (actionType === "approve_report") {
          reporterTitle = "Report Approved";
          reporterMsg = `Your safety report against "${targetName}" has been reviewed and approved. Necessary action has been taken.`;
        }
        
        if (reporterMsg) {
          await addDoc(notificationsRef, {
            userId: reporterId,
            title: reporterTitle,
            message: reporterMsg,
            status: "unread",
            createdAt: serverTimestamp()
          });
        }
      }
      
      // 2. Cascade Actions on Target ID
      if (targetId) {
        let targetUserId = targetId;
        if (selectedReport?.targetType === "job") {
          try {
            const { getDoc } = await import("firebase/firestore");
            const jobSnap = await getDoc(doc(db, "Jobs", targetId));
            if (jobSnap.exists()) {
              targetUserId = jobSnap.data().employerId;
            }
          } catch (e) {
            console.debug("Error getting job employerId for warning:", e);
          }
        }

        const isUserTarget = selectedReport?.targetType === "employer" || selectedReport?.targetType === "candidate" || selectedReport?.targetType === "job";
        const userRef = isUserTarget && targetUserId ? doc(db, "Users", targetUserId) : null;
        
        if (userRef) {
          if (actionType === "warn_user") {
            // Get current warning count of target user
            let currentWarningCount = 0;
            try {
              const { getDoc } = await import("firebase/firestore");
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                currentWarningCount = userSnap.data().warningCount || 0;
              }
            } catch (e) {
              console.debug("Error getting current warning count:", e);
            }

            // Increment warnings
            await updateDoc(userRef, { 
              warningCount: currentWarningCount + 1,
              updatedAt: serverTimestamp() 
            }).catch(e => console.debug("Error updating target user warning count:", e));
            
            // Construct detailed warning message
            let warningMessage = "Your profile has been flagged for behavior violating our community guidelines.";
            if (selectedReport?.targetType === "job") {
              warningMessage = `Your job posting "${targetName}" has received a warning for violating our guidelines (Reason: ${selectedReport?.reason || "Guidelines Violation"}).`;
            } else if (selectedReport?.targetType === "employer") {
              warningMessage = `Your employer account has received a warning (Reason: ${selectedReport?.reason || "Guidelines Violation"}).`;
            } else if (selectedReport?.targetType === "candidate") {
              warningMessage = `Your profile has received a warning (Reason: ${selectedReport?.reason || "Guidelines Violation"}).`;
            }
            warningMessage += " Multiple warnings may lead to temporary suspension or blocking.";

            // Notify target user
            await addDoc(notificationsRef, {
              userId: targetUserId,
              title: "Safety Notice: Warning Issued",
              message: warningMessage,
              status: "unread",
              createdAt: serverTimestamp()
            }).catch(e => console.debug(e));
            
          } else if (actionType === "suspend_user") {
            // Suspend target user
            await updateDoc(userRef, { 
              status: 'suspended', 
              updatedAt: serverTimestamp() 
            }).catch(e => console.debug("Error suspending user:", e));
            
            let suspendMessage = "Your NexPride account has been suspended due to violations of our community safety standards.";
            if (selectedReport?.targetType === "job") {
              suspendMessage = `Your NexPride account has been suspended due to severe guidelines violations on your job posting "${targetName}" (Reason: ${selectedReport?.reason || "Guidelines Violation"}).`;
            }
            
            // Notify target user
            await addDoc(notificationsRef, {
              userId: targetUserId,
              title: "Account Suspended",
              message: suspendMessage,
              status: "unread",
              createdAt: serverTimestamp()
            }).catch(e => console.debug(e));
            
          } else if (actionType === "block_user") {
            // Block target user
            await updateDoc(userRef, { 
              status: 'blocked', 
              updatedAt: serverTimestamp() 
            }).catch(e => console.debug("Error blocking user:", e));
            
            // Notify target user
            await addDoc(notificationsRef, {
              userId: targetUserId,
              title: "Account Blocked Permanently",
              message: "Your account has been permanently blocked from NexPride for policy breaches.",
              status: "unread",
              createdAt: serverTimestamp()
            }).catch(e => console.debug(e));
          }
        }
        
        // If target is a Job, delete the job from database ONLY on block
        if (selectedReport?.targetType === "job" && actionType === "block_user") {
          await deleteDoc(doc(db, "Jobs", targetId))
            .then(() => toast({ title: "Job post deleted from database successfully" }))
            .catch(e => console.debug("Error deleting job from database:", e));
        }
      }
      
      setSelectedReport(null);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to update report status" });
    }
  };

  const handleCloseJob = async (job: any) => {
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "Jobs", job.id), { status: 'closed', updatedAt: serverTimestamp() });
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
      await updateDoc(doc(db, "Jobs", jobToArchive.id), { status: 'archived', archiveReason, updatedAt: serverTimestamp() });
      toast({ title: "Job archived." });
      setJobToArchive(null);
      setArchiveReason("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to archive job" });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
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

  const parseInterviewDate = (val: any) => {
    if (!val) return null;
    try {
      const date = val.toDate ? val.toDate() : new Date(val);
      return isValid(date) ? date : null;
    } catch (e) {
      return null;
    }
  };

  const filteredUsers = useMemo(() => {
    return (liveUsers || []).filter(u => 
      !searchQuery || 
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.phone?.includes(searchQuery) ||
      u.gst?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [liveUsers, searchQuery]);

  const filteredReports = useMemo(() => {
    const list = liveReports || [];
    if (reportFilter === "reported_jobs") {
      return list.filter(r => r.targetType === "job");
    } else if (reportFilter === "reported_employers") {
      return list.filter(r => r.targetType === "employer");
    } else if (reportFilter === "reported_candidates") {
      return list.filter(r => r.targetType === "candidate");
    } else if (reportFilter === "pending_reviews") {
      return list.filter(r => r.status === "pending" || r.status === "under_review" || !r.status);
    } else if (reportFilter === "blocked_employers") {
      return list.filter(r => r.targetType === "employer" && r.status === "blocked");
    } else if (reportFilter === "blocked_candidates") {
      return list.filter(r => r.targetType === "candidate" && r.status === "blocked");
    }
    return list;
  }, [liveReports, reportFilter]);

  // In demo mode skip auth loading (no real Firebase session)
  const isDemoMode = !user && (simRole === 'admin' || simRole === 'superadmin');

  if (!isDemoMode && (authLoading || profileLoading)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="font-bold text-muted-foreground">Authenticating Admin Access...</p>
      </div>
    );
  }

  if (!user && simRole !== 'admin' && simRole !== 'superadmin') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
          <ShieldBan className="w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black">Access Denied</h2>
          <p className="text-muted-foreground max-w-sm">You must be logged in as an administrator to view this page.</p>
        </div>
        <Button onClick={() => router.push('/auth/login')} className="rounded-xl font-bold">Return to Login</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: "linear-gradient(135deg, #EEF2FF 0%, #F0F9FF 50%, #EFF6FF 100%)" }}>
      {/* Floating clay blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-16 left-[5%] w-72 h-72 rounded-full bg-blue-200/40 blur-3xl animate-float-slow" style={{animationDelay:'0s'}} />
        <div className="absolute top-32 right-[8%] w-96 h-96 rounded-full bg-sky-200/30 blur-3xl animate-float-medium" style={{animationDelay:'-2s'}} />
        <div className="absolute bottom-16 left-[25%] w-80 h-80 rounded-full bg-indigo-200/30 blur-3xl animate-float-slow" style={{animationDelay:'-4s'}} />
      </div>

      <Header />
      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-extrabold font-headline text-primary tracking-tight">{t.adminDashboard}</h1>
            <p className="text-muted-foreground font-medium">{t.globalControl}</p>
          </div>
          <div className="flex gap-2">
             <Popover>
               <PopoverTrigger asChild>
                 <Button variant="outline" className="rounded-xl border-primary/20 h-12 w-12 p-0 relative shadow-sm hover:bg-primary/5 transition-all">
                   <Bell className="w-5 h-5 text-primary" />
                   {unreadCount > 0 && (
                     <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in">
                       {unreadCount}
                     </span>
                   )}
                 </Button>
               </PopoverTrigger>
               <PopoverContent className="w-80 p-0 rounded-2xl shadow-2xl border-none overflow-hidden" align="end">
                 <div className="bg-primary p-4 text-white">
                   <h4 className="font-bold text-sm flex items-center gap-2">
                     <Bell className="w-4 h-4" /> Activity Feed
                   </h4>
                 </div>
                 <ScrollArea className="h-[300px]">
                   {(notifications || []).length === 0 ? (
                     <div className="p-10 text-center space-y-2">
                       <Info className="w-8 h-8 text-muted-foreground/20 mx-auto" />
                       <p className="text-xs font-bold text-muted-foreground">No recent alerts.</p>
                     </div>
                   ) : (
                     <div className="divide-y divide-muted">
                       {notifications.map((n: any) => (
                         <button 
                           key={n.id} 
                           onClick={() => handleNotificationClick(n)}
                           className={cn(
                             "w-full text-left p-4 hover:bg-muted/50 transition-colors flex gap-3",
                             n.status === 'unread' && "bg-primary/5 border-l-4 border-primary"
                           )}
                         >
                           <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                             {n.type === 'new_employer' ? <Building2 className="w-4 h-4" /> : n.type === 'new_job' ? <Briefcase className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                           </div>
                           <div className="space-y-1">
                             <p className="text-[11px] font-black leading-tight text-primary uppercase tracking-tight">{n.title}</p>
                             <p className="text-xs font-medium text-muted-foreground line-clamp-2">{n.message}</p>
                             <p className="text-[9px] font-bold text-muted-foreground/60 uppercase">{safeFormatDate(n.createdAt)}</p>
                           </div>
                         </button>
                       ))}
                     </div>
                   )}
                 </ScrollArea>
               </PopoverContent>
             </Popover>

             <Button variant="outline" className="rounded-xl border-primary/20 font-bold gap-2 h-12 shadow-sm">
               <History className="w-4 h-4" /> Logs
             </Button>
          </div>
        </div>

        {/* Real-time Clay Stat Cards */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.05 }
            }
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4"
        >
          <motion.div variants={{ hidden: { opacity: 0, y: 15, scale: 0.98 }, visible: { opacity: 1, y: 0, scale: 1 } }} className="clay-card p-5">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Factories</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 clay-icon"><Building2 className="w-4.5 h-4.5" /></div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">{usersLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.factories}</div>
          </motion.div>
          
          <motion.div variants={{ hidden: { opacity: 0, y: 15, scale: 0.98 }, visible: { opacity: 1, y: 0, scale: 1 } }} className="clay-card p-5">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Workers</span>
              <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-500 clay-icon"><UserCheck className="w-4.5 h-4.5" /></div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">{usersLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.workers}</div>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 15, scale: 0.98 }, visible: { opacity: 1, y: 0, scale: 1 } }} className="clay-card p-5">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Staff</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 clay-icon"><Briefcase className="w-4.5 h-4.5" /></div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">{usersLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.staff}</div>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 15, scale: 0.98 }, visible: { opacity: 1, y: 0, scale: 1 } }} className="clay-card p-5">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Verification</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 clay-icon"><ShieldAlert className="w-4.5 h-4.5" /></div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">{usersLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.pendingVerification}</div>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 15, scale: 0.98 }, visible: { opacity: 1, y: 0, scale: 1 } }} className="clay-card p-5">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Job Queue</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-500 clay-icon"><Zap className="w-4.5 h-4.5" /></div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">{jobsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.pendingJobs}</div>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 15, scale: 0.98 }, visible: { opacity: 1, y: 0, scale: 1 } }} className="clay-card p-5">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Dues</span>
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 clay-icon"><IndianRupee className="w-4.5 h-4.5" /></div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">{paymentsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.upcomingDues}</div>
          </motion.div>
        </motion.div>

        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-muted p-1 h-14 w-full overflow-x-auto justify-start">
              <TabsTrigger value="profile" className="px-6 font-bold h-12 shrink-0">My Profile</TabsTrigger>
              <TabsTrigger value="manage-admins" className="px-6 font-bold h-12 shrink-0">Manage Admins</TabsTrigger>
              <TabsTrigger value="pending" className="px-6 font-bold h-12 flex items-center gap-1.5 shrink-0">
                Verify Companies ({stats.pendingVerification})
                {stats.pendingVerification > 0 && (
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                )}
              </TabsTrigger>
              <TabsTrigger value="jobs-queue" className="px-6 font-bold h-12 flex items-center gap-1.5 shrink-0">
                Job Approvals ({stats.pendingJobs})
                {stats.pendingJobs > 0 && (
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                )}
              </TabsTrigger>
              <TabsTrigger value="jobs-performance" className="px-6 font-bold h-12 shrink-0">Job Performance</TabsTrigger>
              <TabsTrigger value="factories" className="px-6 font-bold h-12 shrink-0">Factories</TabsTrigger>
              <TabsTrigger value="seekers" className="px-6 font-bold h-12 shrink-0">People</TabsTrigger>
              <TabsTrigger value="reports" className="px-6 font-bold h-12 flex items-center gap-1.5 shrink-0">
                Reports ({(liveReports || []).length})
                {(liveReports || []).filter(r => r.status === 'pending' || r.status === 'under_review' || !r.status).length > 0 && (
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                )}
              </TabsTrigger>
              <TabsTrigger value="dues" className="px-6 font-bold h-12 shrink-0">Upcoming Dues</TabsTrigger>
              <TabsTrigger value="designations" className="px-6 font-bold h-12 shrink-0">Designations</TabsTrigger>
              <TabsTrigger value="settings" className="px-6 font-bold h-12 shrink-0">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="jobs-queue" className="mt-6">
              <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-xl bg-white">
                <div className="max-h-[600px] overflow-auto w-full"><Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-bold">Job Title / Company</TableHead>
                      <TableHead className="font-bold">Category</TableHead>
                      <TableHead className="font-bold">Location</TableHead>
                      <TableHead className="font-bold">Posted At</TableHead>
                      <TableHead className="text-right font-bold">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobsLoading ? <TableRow><TableCell colSpan={5} className="h-40 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></TableCell></TableRow> :
                      (pendingJobs || []).map(j => (
                        <TableRow key={j.id} className="hover:bg-primary/5">
                          <TableCell className="font-black p-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600"><Briefcase className="w-5 h-5" /></div>
                              <div>{j.jobTitle}<div className="text-[10px] text-muted-foreground uppercase font-bold">{j.companyName}</div></div>
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline" className="font-bold border-primary/20 text-primary">{j.category}</Badge></TableCell>
                          <TableCell className="text-sm font-bold text-muted-foreground">{j.location}</TableCell>
                          <TableCell className="text-[11px] font-bold text-muted-foreground uppercase">{safeFormatDate(j.createdAt)}</TableCell>
                          <TableCell className="text-right p-5">
                            <Button variant="default" size="sm" className="rounded-xl font-bold bg-primary text-white shadow-lg" onClick={() => setSelectedJob(j)}>
                               Review Listing
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    }
                    {(pendingJobs || []).length === 0 && !jobsLoading && (
                      <TableRow><TableCell colSpan={5} className="h-40 text-center font-bold text-muted-foreground">No jobs waiting for approval.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table></div>
              </Card>
            </TabsContent>

            <TabsContent value="jobs-performance" className="mt-6">
               <div className="flex justify-between items-center mb-4">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search jobs by title or company..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 h-11 rounded-xl" />
                  </div>
               </div>
               <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-xl bg-white">
                <div className="max-h-[600px] overflow-auto w-full"><Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-bold">Job Profile</TableHead>
                      <TableHead className="font-bold">Company</TableHead>
                      <TableHead className="font-bold">Status</TableHead>
                      <TableHead className="font-bold">Views</TableHead>
                      <TableHead className="text-right font-bold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allJobsLoading ? <TableRow><TableCell colSpan={5} className="h-60 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></TableCell></TableRow> :
                      (rawAllJobs || []).filter(j => !searchQuery || j.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) || j.companyName?.toLowerCase().includes(searchQuery.toLowerCase())).map(j => (
                        <TableRow key={j.id} className="hover:bg-primary/5">
                          <TableCell className="font-black p-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-muted-foreground"><Briefcase className="w-5 h-5" /></div>
                              <div>{j.jobTitle}<div className="text-[10px] text-muted-foreground uppercase font-bold">{j.category} • {j.department}</div></div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-bold text-primary">{j.companyName}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 items-start">
                              <Badge className={cn(
                                "font-bold border-none",
                                j.status === 'approved' ? "bg-green-100 text-green-700" : 
                                j.status === 'pending' ? "bg-amber-100 text-amber-700" : 
                                j.status === 'closed' || j.status === 'archived' ? "bg-slate-200 text-slate-700" :
                                "bg-red-100 text-red-700"
                              )}>
                                {j.status?.toUpperCase()}
                              </Badge>
                              {j.status === 'archived' && j.archiveReason && (
                                <div className="text-[10px] text-muted-foreground truncate max-w-[150px]" title={j.archiveReason}>
                                  {j.archiveReason}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                             <div className="flex items-center gap-2">
                               <span className="font-black text-primary text-lg">{j.views || 0}</span>
                               <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setViewingJobStats(j)}>
                                 <BarChart3 className="w-4 h-4" />
                               </Button>
                             </div>
                          </TableCell>
                          <TableCell className="text-right p-5">
                             <div className="flex items-center justify-end gap-2">
                               <Button variant="outline" size="sm" className="rounded-xl font-bold h-9" onClick={() => router.push(`/jobs/${j.id}`)}>
                                 View Post
                               </Button>
                               {j.status === 'approved' && (
                                 <>
                                   <Button 
                                     variant="outline" 
                                     size="sm" 
                                     className="font-bold border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all rounded-lg h-9"
                                     onClick={() => handleCloseJob(j)}
                                     disabled={isProcessing}
                                   >
                                     Close
                                   </Button>
                                   <Button 
                                     variant="outline" 
                                     size="sm" 
                                     className="font-bold border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700 transition-all rounded-lg h-9"
                                     onClick={() => setJobToArchive(j)}
                                     disabled={isProcessing}
                                   >
                                     Archive
                                   </Button>
                                 </>
                               )}
                             </div>
                          </TableCell>
                        </TableRow>
                      ))
                    }
                  </TableBody>
                </Table></div>
              </Card>
            </TabsContent>

            <TabsContent value="pending" className="mt-6">
              <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-xl bg-white">
                <div className="max-h-[600px] overflow-auto w-full"><Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-bold">Factory Identity</TableHead>
                      <TableHead className="font-bold">GST / Location</TableHead>
                      <TableHead className="font-bold">Status</TableHead>
                      <TableHead className="text-right font-bold">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? <TableRow><TableCell colSpan={4} className="h-40 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></TableCell></TableRow> :
                      (liveUsers || []).filter(u => u.role === 'employer' && u.status === 'pending' && u.name && u.profileSubmitted).map(u => (
                        <TableRow key={u.id} className="hover:bg-primary/5">
                          <TableCell className="font-black p-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><Building2 className="w-5 h-5" /></div>
                              <div>{u.name || "Unnamed Unit"}<div className="text-[10px] text-muted-foreground">{u.phone}</div></div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-bold">
                            {u.gst || "NO GST"}<div className="text-[10px] text-muted-foreground uppercase">{u.location}</div>
                          </TableCell>
                          <TableCell><Badge className="bg-amber-100 text-amber-700 border-none font-bold">READY FOR REVIEW</Badge></TableCell>
                          <TableCell className="text-right p-5">
                            <Button variant="default" size="sm" className="rounded-xl font-bold bg-primary text-white shadow-lg" onClick={() => setSelectedItem(u)}>
                               Review & Verify
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    }
                    {(liveUsers || []).filter(u => u.role === 'employer' && u.status === 'pending' && u.name && u.profileSubmitted).length === 0 && !usersLoading && (
                      <TableRow><TableCell colSpan={4} className="h-40 text-center font-bold text-muted-foreground">No registration requests.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table></div>
              </Card>
            </TabsContent>

            <TabsContent value="factories" className="mt-6">
               <div className="flex justify-between items-center mb-4">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search factories..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 h-11 rounded-xl" />
                  </div>
               </div>
               <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-xl bg-white">
                <div className="max-h-[600px] overflow-auto w-full"><Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-bold">Factory Name</TableHead>
                      <TableHead className="font-bold">GST</TableHead>
                      <TableHead className="font-bold">Location</TableHead>
                      <TableHead className="font-bold">Status</TableHead>
                      <TableHead className="text-right font-bold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.filter(u => u.role === 'employer').map(u => (
                      <TableRow key={u.id} className="hover:bg-primary/5">
                        <TableCell className="font-black p-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center"><Building2 className="w-5 h-5 text-muted-foreground" /></div>
                            <div>{u.name}<div className="text-[10px] text-muted-foreground">{u.phone}</div></div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{u.gst || "N/A"}</TableCell>
                        <TableCell className="text-sm font-bold">{u.location}</TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "font-bold border-none",
                            u.status === 'approved' ? "bg-green-100 text-green-700" : u.status === 'rejected' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                          )}>
                            {u.status?.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right p-5">
                           <Button variant="ghost" size="icon" onClick={() => setSelectedItem(u)}><Eye className="w-4 h-4 text-primary" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              </Card>
            </TabsContent>

            <TabsContent value="seekers" className="mt-6">
               <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-xl bg-white">
                <div className="max-h-[600px] overflow-auto w-full"><Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-bold">Seeker Name</TableHead>
                      <TableHead className="font-bold">Category</TableHead>
                      <TableHead className="font-bold">Status</TableHead>
                      <TableHead className="text-right font-bold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.filter(u => u.role === 'job_seeker').map(u => (
                      <TableRow key={u.id} className="hover:bg-primary/5">
                        <TableCell className="font-black p-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center"><UserIcon className="w-5 h-5 text-muted-foreground" /></div>
                            <div>{u.name}<div className="text-[10px] text-muted-foreground">{u.phone}</div></div>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="secondary" className="font-bold">{u.category}</Badge></TableCell>
                        <TableCell><Badge className="bg-green-100 text-green-700 border-none font-bold">ACTIVE</Badge></TableCell>
                        <TableCell className="text-right p-5">
                           <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setConfirmAction({ type: 'delete', coll: 'Users', id: u.id, label: 'Delete Seeker', targetName: u.name })}><Trash2 className="w-4 h-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="mt-6 space-y-4">
              <div className="flex gap-2 flex-wrap bg-white/50 p-2 rounded-2xl border border-primary/5 backdrop-blur">
                <Button variant={reportFilter === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setReportFilter('all')} className="rounded-xl font-bold">
                  All ({liveReports.length})
                </Button>
                <Button variant={reportFilter === 'reported_jobs' ? 'default' : 'ghost'} size="sm" onClick={() => setReportFilter('reported_jobs')} className="rounded-xl font-bold">
                  Reported Jobs ({liveReports.filter(r => r.targetType === 'job').length})
                </Button>
                <Button variant={reportFilter === 'reported_employers' ? 'default' : 'ghost'} size="sm" onClick={() => setReportFilter('reported_employers')} className="rounded-xl font-bold">
                  Reported Employers ({liveReports.filter(r => r.targetType === 'employer').length})
                </Button>
                <Button variant={reportFilter === 'reported_candidates' ? 'default' : 'ghost'} size="sm" onClick={() => setReportFilter('reported_candidates')} className="rounded-xl font-bold">
                  Reported Candidates ({liveReports.filter(r => r.targetType === 'candidate').length})
                </Button>
                <Button variant={reportFilter === 'pending_reviews' ? 'default' : 'ghost'} size="sm" onClick={() => setReportFilter('pending_reviews')} className="rounded-xl font-bold">
                  Pending Reviews ({liveReports.filter(r => r.status === 'pending' || r.status === 'under_review' || !r.status).length})
                </Button>
                <Button variant={reportFilter === 'blocked_employers' ? 'default' : 'ghost'} size="sm" onClick={() => setReportFilter('blocked_employers')} className="rounded-xl font-bold">
                  Blocked Employers ({liveReports.filter(r => r.targetType === 'employer' && r.status === 'blocked').length})
                </Button>
                <Button variant={reportFilter === 'blocked_candidates' ? 'default' : 'ghost'} size="sm" onClick={() => setReportFilter('blocked_candidates')} className="rounded-xl font-bold">
                  Blocked Candidates ({liveReports.filter(r => r.targetType === 'candidate' && r.status === 'blocked').length})
                </Button>
              </div>

              <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-xl bg-white p-6">
                <Accordion type="single" collapsible className="w-full space-y-4">
                  {(() => {
                    const groups: Record<string, any> = {};
                    filteredReports.forEach(r => {
                      const key = r.targetId || "unknown";
                      if (!groups[key]) {
                         groups[key] = {
                           targetId: key,
                           targetName: r.targetName || "Unknown",
                           targetType: r.targetType || "unknown",
                           reports: []
                         };
                      }
                      groups[key].reports.push(r);
                    });
                    const groupedList = Object.values(groups);

                    if (groupedList.length === 0) {
                      return <div className="p-10 text-center font-bold text-muted-foreground">No reports found matching this category.</div>;
                    }

                    return groupedList.map((group: any) => (
                      <AccordionItem key={group.targetId} value={group.targetId} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                        <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-slate-100 transition-colors">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center gap-4 text-left">
                               <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                                 <AlertTriangle className="w-5 h-5" />
                               </div>
                               <div>
                                 <p className="font-black text-lg text-slate-800">{group.targetName}</p>
                                 <p className="text-[11px] font-bold uppercase text-muted-foreground tracking-widest">{group.targetType}</p>
                               </div>
                            </div>
                            <Badge variant="destructive" className="font-black text-sm px-3 py-1 shrink-0">
                               {group.reports.length} Reports
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="bg-white border-t border-slate-100 p-0">
                           <div className="overflow-x-auto w-full"><Table>
                             <TableHeader className="bg-slate-50/50">
                               <TableRow>
                                 <TableHead className="font-bold pl-6">Reason</TableHead>
                                 <TableHead className="font-bold">Reported By</TableHead>
                                 <TableHead className="font-bold">Date</TableHead>
                                 <TableHead className="font-bold">Status</TableHead>
                                 <TableHead className="text-right font-bold pr-6">Action</TableHead>
                               </TableRow>
                             </TableHeader>
                             <TableBody>
                               {group.reports.map((r: any) => (
                                 <TableRow key={r.id}>
                                    <TableCell className="pl-6 font-semibold max-w-[200px] truncate">{r.reason}</TableCell>
                                    <TableCell>
                                      <p className="font-bold text-sm">{r.reportedByName}</p>
                                      <p className="text-[10px] text-muted-foreground">{r.reportedById}</p>
                                    </TableCell>
                                    <TableCell className="text-xs font-medium text-slate-500">{safeFormatDate(r.createdAt)}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className={cn(r.status === 'resolved' ? "border-green-200 text-green-700" : "border-amber-200 text-amber-700")}>
                                        {r.status?.toUpperCase() || 'PENDING'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                       <Button variant="outline" size="sm" onClick={() => setSelectedReport(r)}>Review Detail</Button>
                                    </TableCell>
                                 </TableRow>
                               ))}
                             </TableBody>
                           </Table></div>
                        </AccordionContent>
                      </AccordionItem>
                    ));
                  })()}
                </Accordion>
              </Card>
            </TabsContent>

            <TabsContent value="dues" className="mt-6">
              <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-xl bg-white">
                <div className="max-h-[600px] overflow-auto w-full"><Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-bold">Factory</TableHead>
                      <TableHead className="font-bold">Plan</TableHead>
                      <TableHead className="font-bold">Amount</TableHead>
                      <TableHead className="font-bold">Status</TableHead>
                      <TableHead className="text-right font-bold">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(livePayments || []).map(p => (
                      <TableRow key={p.id} className="hover:bg-primary/5">
                        <TableCell className="font-bold">{p.companyName}</TableCell>
                        <TableCell><Badge variant="outline" className="font-bold">{p.planType}</Badge></TableCell>
                        <TableCell className="font-black text-primary">₹ {p.amount}</TableCell>
                        <TableCell><Badge className="bg-red-100 text-red-700 font-bold border-none">{p.paymentStatus?.toUpperCase()}</Badge></TableCell>
                        <TableCell className="text-right p-5">
                           <Button variant="outline" size="sm" className="rounded-xl font-bold gap-2"><PhoneCall className="w-3 h-3" /> Remind</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(livePayments || []).length === 0 && (
                      <TableRow><TableCell colSpan={5} className="h-40 text-center font-bold text-muted-foreground">No dues tracked.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table></div>
              </Card>
            </TabsContent>

            <TabsContent value="designations" className="mt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Designations Manager</h2>
                  <p className="text-slate-500 text-sm mt-0.5 font-medium">Manage job designations shown in employer post-job form</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => router.push('/admin/designations')} className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 font-bold h-11 px-6 rounded-full gap-2 transition-all shadow-sm">
                    <ExternalLink className="w-4 h-4" /> Dedicated Page
                  </Button>
                  <Button onClick={openAddDesignation} className="bg-blue-600 hover:bg-blue-700 text-white font-black h-11 px-6 rounded-full clay-btn gap-2">
                    <Plus className="w-4 h-4" /> Add Designation
                  </Button>
                </div>
              </div>

              {/* Search + filter */}
              <div className="flex gap-3 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search designations..."
                    value={designationSearch}
                    onChange={e => setDesignationSearch(e.target.value)}
                    className="pl-9 h-10 rounded-xl text-sm font-semibold clay-input"
                  />
                </div>
              </div>

              <div className="clay-card overflow-hidden">
                <div className="max-h-[600px] overflow-auto w-full"><Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 border-b border-slate-100">
                      <TableHead className="font-bold text-slate-700 py-3">Designation Title</TableHead>
                      <TableHead className="font-bold text-slate-700">Category</TableHead>
                      <TableHead className="font-bold text-slate-700">Status</TableHead>
                      <TableHead className="text-right font-bold text-slate-700 pr-5">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {designationsLoading ? (
                      <TableRow><TableCell colSpan={4} className="h-32 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /></TableCell></TableRow>
                    ) : (
                      (liveDesignations || [])
                        .filter((d: any) => !designationSearch || (d.title || d.name || '').toLowerCase().includes(designationSearch.toLowerCase()) || (d.category || '').toLowerCase().includes(designationSearch.toLowerCase()))
                        .map((d: any) => (
                          <TableRow key={d.id} className="hover:bg-slate-50 border-b border-slate-50">
                            <TableCell className="font-semibold p-4 text-slate-900">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                  <Tag className="w-4 h-4" />
                                </div>
                                {d.title || d.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-blue-50 text-blue-700 border-none font-semibold text-xs rounded-full px-3">
                                {d.category} • {d.department || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <button
                                onClick={() => handleToggleDesignationActive(d)}
                                className={cn(
                                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all",
                                  d.isActive !== false
                                    ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                    : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                                )}
                              >
                                <span className={cn("w-1.5 h-1.5 rounded-full", d.isActive !== false ? "bg-green-500" : "bg-slate-400")} />
                                {d.isActive !== false ? "Active" : "Inactive"}
                              </button>
                            </TableCell>
                            <TableCell className="text-right pr-4">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost" size="icon"
                                  className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                  onClick={() => openEditDesignation(d)}
                                >
                                  <Settings2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost" size="icon"
                                  className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                  onClick={() => setConfirmAction({ type: 'delete', coll: 'Designations', id: d.id, label: 'Delete Designation', targetName: d.title || d.name })}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                    {!designationsLoading && (liveDesignations || []).filter((d: any) => !designationSearch || (d.title || d.name || '').toLowerCase().includes(designationSearch.toLowerCase())).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-32 text-center">
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <Tag className="w-8 h-8" />
                            <p className="font-semibold text-sm">{designationSearch ? 'No results found' : 'No designations yet'}</p>
                            {!designationSearch && <Button size="sm" onClick={openAddDesignation} className="mt-1 rounded-xl bg-blue-600 text-white text-xs font-bold">Add First Designation</Button>}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table></div>
              </div>
            </TabsContent>
            <TabsContent value="settings" className="mt-6">
              <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-xl bg-white">
                <CardHeader className="bg-primary/5 pb-8">
                  <CardTitle className="text-2xl font-black text-primary">System Settings</CardTitle>
                  <CardDescription className="font-medium text-slate-500">Configure global platform settings like support address and hours.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="max-w-2xl space-y-6">
                     <div className="space-y-2">
                        <Label className="font-bold">Regional Presence (Office Address)</Label>
                        <Textarea 
                           className="min-h-[100px] rounded-xl border-primary/20"
                           value={supportAddress} 
                           onChange={(e: any) => setSupportAddress(e.target.value)} 
                           placeholder="Enter office address..."
                        />
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">This appears on the Support Page.</p>
                     </div>
                     <div className="space-y-2">
                        <Label className="font-bold">Office Hours</Label>
                        <Input 
                           className="h-12 rounded-xl border-primary/20"
                           value={supportHours} 
                           onChange={(e: any) => setSupportHours(e.target.value)} 
                           placeholder="e.g. Monday - Saturday: 9:00 AM - 6:00 PM"
                        />
                     </div>
                     <Button className="h-12 rounded-xl bg-primary text-white font-bold w-40 shadow-lg" onClick={saveSupportConfig}>Save Settings</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="mt-6">
              <ProfileTab
                userProfile={userProfile}
                adminProfileData={adminProfileData}
                setAdminProfileData={setAdminProfileData}
                isProcessing={isProcessing}
                handleUpdateAdminProfile={handleUpdateAdminProfile}
              />
            </TabsContent>

            <TabsContent value="manage-admins" className="mt-6">
              <ManageAdminsTab
                newAdminData={newAdminData}
                setNewAdminData={setNewAdminData}
                isAdminCreating={isAdminCreating}
                handleCreateSuperAdmin={handleCreateSuperAdmin}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

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
                    <UserX className="w-12 h-12 text-muted-foreground/30" />
                    <div className="space-y-1">
                      <p className="font-black text-muted-foreground">No Registered Views</p>
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
                         <TableHead className="text-right font-bold">Profile</TableHead>
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
                                 <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1"><PhoneIcon className="w-3 h-3" /> +91 {viewer.phone}</p>
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
                              <Button variant="ghost" size="icon" className="h-9 w-9 text-primary rounded-full hover:bg-primary/10">
                                <ChevronRight className="w-5 h-5" />
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

      {/* Verification Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(o) => !o && setSelectedItem(null)}>
        <DialogContent className="max-w-3xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl max-h-[90vh] flex flex-col">
           <DialogHeader className="p-10 bg-primary text-white text-left shrink-0">
             <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                            <div className="flex items-center gap-5">
                  {/* Company Logo */}
                  <div className="w-16 h-16 shrink-0 rounded-2xl bg-white flex items-center justify-center overflow-hidden shadow-md border-2 border-white/30">
                    {selectedItem?.companyLogo || selectedItem?.logo ? (
                      <img src={selectedItem.companyLogo || selectedItem.logo} alt={selectedItem.name} className="w-full h-full object-contain p-1" />
                    ) : (
                      <Building2 className="w-8 h-8 text-primary/40" />
                    )}
                  </div>
                  <div>
                    <DialogTitle className="text-4xl font-black font-headline tracking-tight">{selectedItem?.name || "Factory Details"}</DialogTitle>
                    <DialogDescription className="text-primary-foreground/80 font-bold mt-1 uppercase text-xs tracking-widest">{selectedItem?.phone} • {selectedItem?.status} Profile</DialogDescription>
                    {selectedItem?.industry && (
                      <span className="inline-block mt-1.5 bg-white/20 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">{selectedItem.industry}{selectedItem.size ? ` · ${selectedItem.size}` : ''}</span>
                    )}
                  </div>
                </div>
               <div className="flex gap-2">
                  <Button 
                    variant={selectedItem?.trustedEmployer ? "default" : "outline"}
                    className={cn("font-bold rounded-xl shadow-sm border-2", selectedItem?.trustedEmployer ? "bg-violet-600 text-white hover:bg-violet-700 border-violet-600" : "border-violet-200 text-violet-700 hover:bg-violet-50")}
                    onClick={() => selectedItem?.id && handleToggleTrustedEmployer(selectedItem.id, !!selectedItem.trustedEmployer)}
                  >
                    <ShieldCheck className="w-4 h-4 mr-2" /> 
                    {selectedItem?.trustedEmployer ? "Trusted Company" : "Mark as Trusted"}
                  </Button>
                  <Button className="bg-green-500 text-white hover:bg-green-600 font-black rounded-xl border-none shadow-lg ml-2" onClick={() => selectedItem?.id && setConfirmAction({ type: 'approved', coll: 'Users', id: selectedItem.id, label: 'Approve Factory', targetName: selectedItem.name || 'Factory' })}>
                    <CheckCircle className="w-4 h-4 mr-2" /> Approve
                  </Button>
                  <Button variant="destructive" className="font-bold rounded-xl shadow-lg" onClick={() => selectedItem?.id && setConfirmAction({ type: 'rejected', coll: 'Users', id: selectedItem.id, label: 'Reject Factory', targetName: selectedItem.name || 'Factory' })}>
                    <XCircle className="w-4 h-4 mr-2" /> Reject
                  </Button>
               </div>
             </div>
           </DialogHeader>
           <div className="flex-1 overflow-y-auto min-h-0 p-10 space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-6">
                    <h3 className="text-xl font-black text-primary border-b-2 border-primary/10 pb-2">Business Proof</h3>
                    <div className="p-6 bg-muted/30 rounded-3xl border space-y-6">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">GST Registration</Label>
                        <div className="flex items-center gap-3">
                           <p className="text-xl font-black font-mono tracking-widest">{selectedItem?.gst || "Not Provided"}</p>
                           {selectedItem?.gst && (
                             <div className="flex gap-1">
                               <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => copyToClipboard(selectedItem.gst)}><Copy className="w-4 h-4" /></Button>
                               <a href="https://services.gst.gov.in/services/listoftaxpayer" target="_blank" rel="noopener noreferrer">
                                 <Button variant="ghost" size="icon" className="h-8 w-8 text-primary"><ExternalLink className="w-4 h-4" /></Button>
                               </a>
                             </div>
                           )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Pinned Location</Label>
                        <p className="text-sm font-bold flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> {selectedItem?.location || "N/A"}</p>
                      </div>
                      <div className="space-y-1 border-t pt-4">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Contact Details</Label>
                        <div className="flex flex-col gap-2 mt-1">
                           <p className="text-sm font-bold flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /> {selectedItem?.phone || "N/A"}</p>
                           <p className="text-sm font-bold flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> {selectedItem?.email || "Not Provided"}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                       <Button variant="outline" className="rounded-xl font-bold h-12 gap-2 border-primary/20 text-primary" onClick={() => window.open(`tel:${selectedItem?.phone}`)}>
                          <PhoneCall className="w-4 h-4" /> Call Owner
                       </Button>
                       <Button variant="outline" className="rounded-xl font-bold h-12 gap-2 border-green-500 text-green-600" onClick={() => window.open(`https://wa.me/${selectedItem?.phone?.replace(/\D/g, '')}`)}>
                          <MessageCircle className="w-4 h-4" /> WhatsApp
                       </Button>
                    </div>
                 </div>
                 
                 <div className="space-y-6">
                   <h3 className="text-xl font-black text-primary border-b-2 border-primary/10 pb-2">Entrance Proof</h3>
                   <div className="aspect-video rounded-3xl overflow-hidden bg-muted border-4 border-muted shadow-lg relative group">
                      {selectedItem?.photo ? (
                        <img src={selectedItem.photo} alt="Gate Proof" className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-bold">No Photo Uploaded</div>
                      )}
                      <div className="absolute top-4 right-4"><Badge className="bg-white/90 text-primary font-black uppercase text-[9px] py-1 shadow-sm">Gate Photo</Badge></div>
                   </div>
                 </div>
               </div>

              {/* Company Profile Preview */}
              <div className="space-y-4">
                <h3 className="text-xl font-black text-primary border-b-2 border-primary/10 pb-2">Company Profile Details</h3>
                <div className="bg-muted/30 rounded-3xl border overflow-hidden">
                  {/* Cover / Logo Banner */}
                  <div className="h-20 bg-gradient-to-r from-primary/20 to-violet-500/20 relative">
                    <div className="absolute -bottom-8 left-6 w-16 h-16 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                      {selectedItem?.companyLogo || selectedItem?.logo ? (
                        <img src={selectedItem.companyLogo || selectedItem.logo} alt={selectedItem.name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <Building2 className="w-7 h-7 text-slate-300" />
                      )}
                    </div>
                  </div>
                  <div className="pt-12 px-6 pb-6 space-y-5">
                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Industry</Label>
                        <p className="text-sm font-bold mt-1">{selectedItem?.industry || <span className="text-muted-foreground italic">Not set</span>}</p>
                      </div>
                      <div>
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Company Size</Label>
                        <p className="text-sm font-bold mt-1">{selectedItem?.size || <span className="text-muted-foreground italic">Not set</span>}</p>
                      </div>
                      <div>
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Founded</Label>
                        <p className="text-sm font-bold mt-1">{selectedItem?.foundedYear || <span className="text-muted-foreground italic">Not set</span>}</p>
                      </div>
                      <div>
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Headquarters</Label>
                        <p className="text-sm font-bold mt-1">{selectedItem?.headquarters || selectedItem?.location || <span className="text-muted-foreground italic">Not set</span>}</p>
                      </div>
                    </div>
                    {/* Description */}
                    <div className="border-t pt-4">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">About the Company</Label>
                      {selectedItem?.description ? (
                        <p className="text-sm font-semibold text-slate-700 mt-2 leading-relaxed whitespace-pre-line">{selectedItem.description}</p>
                      ) : (
                        <p className="text-sm italic text-muted-foreground mt-2">No company description provided yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
           </div>
           <div className="p-6 border-t bg-slate-50 flex justify-end shrink-0">
              <Button variant="ghost" className="font-bold text-muted-foreground" onClick={() => setSelectedItem(null)}>Close Viewer</Button>
           </div>
        </DialogContent>
      </Dialog>

      {/* Job Approval Dialog - Fixed scrolling for full content visibility */}
      <Dialog open={!!selectedJob} onOpenChange={(o) => !o && setSelectedJob(null)}>
        <DialogContent className="max-w-4xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl h-[90vh] flex flex-col">
           <DialogHeader className="p-8 bg-primary text-white text-left shrink-0">
             <div className="flex flex-col md:flex-row justify-between items-start gap-4">
               <div>
               <div className="flex items-start gap-5">
                 {/* Logo */}
                 <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-[1rem] bg-white flex items-center justify-center text-primary font-black text-2xl shadow-sm overflow-hidden">
                    {selectedJobEmployer?.logo || selectedJob?.companyLogo ? (
                      <img src={selectedJobEmployer?.logo || selectedJob?.companyLogo} alt={selectedJob?.companyName} className="w-full h-full object-contain" />
                    ) : (
                      <Building2 className="w-8 h-8 md:w-10 md:h-10 text-primary/40" />
                    )}
                 </div>
                 <div>
                   <div className="flex items-center gap-3 mb-2">
                      <Badge variant="secondary" className="bg-white/20 text-white font-black border-none uppercase text-[10px] tracking-widest px-3 py-1">{selectedJob?.category}</Badge>
                      <Badge variant="secondary" className="bg-white/10 text-white font-bold border-none text-[10px]">{selectedJob?.workType}</Badge>
                   </div>
                   <DialogTitle className="text-3xl font-black font-headline tracking-tight">{selectedJob?.jobTitle}</DialogTitle>
                   <DialogDescription className="text-primary-foreground/80 font-bold mt-1 uppercase text-xs tracking-widest flex items-center gap-2">
                      <Building2 className="w-3 h-3" /> {selectedJob?.companyName}
                   </DialogDescription>
                 </div>
               </div>
               </div>
               <div className="flex gap-2">
                   <Button 
                     disabled={!isCompanyApproved} 
                     className={cn(
                       "font-black rounded-xl h-12 shadow-lg transition-all",
                       isCompanyApproved 
                         ? "bg-white text-primary hover:bg-white/90 active:scale-95" 
                         : "bg-white/40 text-primary/40 cursor-not-allowed opacity-60"
                     )}
                     onClick={() => setConfirmAction({ type: 'approved', coll: 'Jobs', id: selectedJob.id, label: 'Approve Job', targetName: selectedJob.jobTitle })}
                   >
                     <CheckCircle className="w-4 h-4 mr-2" /> Approve Listing
                   </Button>
                   <Button variant="destructive" className="font-bold rounded-xl h-12 shadow-lg" onClick={() => setConfirmAction({ type: 'rejected', coll: 'Jobs', id: selectedJob.id, label: 'Reject Job', targetName: selectedJob.jobTitle })}>
                     <XCircle className="w-4 h-4 mr-2" /> Reject
                   </Button>
                </div>
             </div>
           </DialogHeader>
           
           <ScrollArea className="flex-1">
             <div className="p-10 space-y-12">
                 {!isCompanyApproved && (
                    <div className="bg-red-50 border-2 border-red-200 text-red-800 p-6 rounded-[2rem] flex items-start gap-4 shadow-sm">
                       <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                       <div>
                          <h4 className="font-black text-sm uppercase tracking-tight">Warning: Company Verification Pending</h4>
                          <p className="text-xs font-semibold text-red-700 mt-1">
                             The company "{selectedJob?.companyName || 'This factory'}" is currently {selectedJobEmployer?.status ? selectedJobEmployer.status.toUpperCase() : 'PENDING'} approval. 
                             You must approve the company's registration details in the "Verify Companies" or "Factories" tab before you can approve this job listing.
                          </p>
                       </div>
                    </div>
                 )}

                 {/* Workspace Photos */}
                 {((selectedJobEmployer?.photos?.inside && selectedJobEmployer.photos.inside.length > 0) || (selectedJobEmployer?.photos?.outside && selectedJobEmployer.photos.outside.length > 0)) && (
                   <div className="space-y-6">
                      <h3 className="text-xl font-black text-primary flex items-center gap-2 border-b-2 border-primary/10 pb-2 uppercase tracking-tight"><Camera className="w-6 h-6" /> Workspace Photos</h3>
                      <div className="bg-white rounded-[2rem] border-2 shadow-sm p-6 overflow-hidden">
                        <CompanyPhotosCarousel
                          logo={selectedJobEmployer?.logo || selectedJob?.companyLogo}
                          insidePhotos={selectedJobEmployer?.photos?.inside || []}
                          outsidePhotos={selectedJobEmployer?.photos?.outside || []}
                          companyName={selectedJob?.companyName}
                        />
                      </div>
                   </div>
                 )}

                {/* Interview Schedule - Prominent amber section */}
                {(selectedJob?.interviewStartDate || selectedJob?.interviewTimings) && (
                   <div className="space-y-6 bg-amber-50/80 p-8 rounded-[2rem] border-2 border-dashed border-amber-300 shadow-inner">
                      <h3 className="text-xl font-black text-amber-900 flex items-center gap-3 uppercase tracking-widest"><Zap className="w-6 h-6 fill-amber-500 text-amber-500" /> {t.interviewSchedule}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-600 shadow-sm"><CalendarIcon className="w-6 h-6" /></div>
                            <div>
                               <Label className="text-[10px] font-black text-amber-800/60 uppercase tracking-widest">{t.interviewDates}</Label>
                               <p className="text-xl font-black text-amber-900">
                                  {(() => {
                                    const start = parseInterviewDate(selectedJob.interviewStartDate);
                                    if (!start) return "Dates Not Set";
                                    const startStr = format(start, "dd MMM");
                                    const end = parseInterviewDate(selectedJob.interviewEndDate);
                                    if (!end || end.getTime() === start.getTime()) return startStr;
                                    return `${startStr} to ${format(end, "dd MMM yyyy")}`;
                                  })()}
                               </p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-600 shadow-sm"><Clock className="w-6 h-6" /></div>
                            <div>
                               <Label className="text-[10px] font-black text-amber-800/60 uppercase tracking-widest">{t.interviewTimings}</Label>
                               <p className="text-xl font-black text-amber-900">{selectedJob?.interviewTimings || "Not Specified"}</p>
                            </div>
                         </div>
                      </div>
                   </div>
                )}

                {/* Classification Section */}
                <div className="space-y-6">
                   <h3 className="text-lg font-black text-primary flex items-center gap-2 border-b-2 border-primary/10 pb-2 uppercase tracking-tight"><Tags className="w-5 h-5" /> Industrial Classification</h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-4 bg-muted/20 rounded-2xl border border-dashed text-center">
                         <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.categoryLabel}</Label>
                         <p className="text-lg font-black">{selectedJob?.category}</p>
                      </div>
                      <div className="p-4 bg-muted/20 rounded-2xl border border-dashed text-center">
                         <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.departmentLabel}</Label>
                         <p className="text-lg font-black">{selectedJob?.department}</p>
                      </div>
                      <div className="p-4 bg-muted/20 rounded-2xl border border-dashed text-center">
                         <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.designationLabel}</Label>
                         <p className="text-lg font-black text-primary">{selectedJob?.designation}</p>
                      </div>
                   </div>
                </div>

                {/* Core Job Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-6">
                      <h3 className="text-lg font-black text-primary flex items-center gap-2 border-b-2 border-primary/10 pb-2 uppercase tracking-tight"><Briefcase className="w-5 h-5" /> Basic Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Total Openings</Label>
                            <p className="text-xl font-black">{selectedJob?.openings} Vacancies</p>
                         </div>
                         <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Min Experience</Label>
                            <p className="text-xl font-black">{selectedJob?.experienceRequired}+ Years</p>
                         </div>
                         <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Gender Preference</Label>
                            <p className="text-xl font-black capitalize">{selectedJob?.genderPreference}</p>
                         </div>
                         <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Work Type</Label>
                            <p className="text-xl font-black capitalize">{selectedJob?.workType}</p>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <h3 className="text-lg font-black text-primary flex items-center gap-2 border-b-2 border-primary/10 pb-2 uppercase tracking-tight"><IndianRupee className="w-5 h-5" /> Salary & Payout</h3>
                      <div className="space-y-4">
                         <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Monthly Salary Range</Label>
                            <p className="text-2xl font-black text-primary">₹ {selectedJob?.salaryMin?.toLocaleString()} - {selectedJob?.salaryMax?.toLocaleString()}</p>
                         </div>
                         <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Payout Timing</Label>
                            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 font-black text-primary">
                               {selectedJob?.payoutSchedule || "Not Specified"}
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Logistics */}
                <div className="space-y-6">
                   <h3 className="text-lg font-black text-primary flex items-center gap-2 border-b-2 border-primary/10 pb-2 uppercase tracking-tight"><MapPin className="w-5 h-5" /> Logistics</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Factory Location</Label>
                        <p className="text-base font-black flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> {selectedJob?.location}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Shift Timing</Label>
                        <p className="text-base font-black flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> {selectedJob?.shiftTiming}</p>
                      </div>
                   </div>
                </div>

                {/* Benefits Section */}
                <div className="space-y-6">
                   <h3 className="text-lg font-black text-primary flex items-center gap-2 border-b-2 border-primary/10 pb-2 uppercase tracking-tight"><Heart className="w-5 h-5" /> Benefits Provided</h3>
                   <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {[
                        { id: 'esi', label: 'ESI / EPF', icon: <ShieldCheck className="w-4 h-4" /> },
                        { id: 'transport', label: 'Factory Bus', icon: <Bus className="w-4 h-4" /> },
                        { id: 'teaCash', label: 'Tea Cash', icon: <Coffee className="w-4 h-4" /> },
                        { id: 'food', label: 'Free Food', icon: <ShoppingBag className="w-4 h-4" /> },
                        { id: 'accommodation', label: 'Hostel', icon: <Home className="w-4 h-4" /> },
                      ].map(benefit => (
                         <div key={benefit.id} className={cn(
                            "flex items-center gap-3 p-4 rounded-xl border-2 transition-all font-bold text-xs",
                            selectedJob?.benefits?.[benefit.id] ? "bg-green-50 border-green-500 text-green-700" : "bg-white border-muted text-muted-foreground opacity-40"
                         )}>
                            {benefit.icon} {benefit.label}
                         </div>
                      ))}
                      <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed bg-muted/10 font-bold text-xs">
                         🎁 Bonus: {selectedJob?.benefits?.bonus || "8.33%"}
                      </div>
                   </div>
                </div>

                {/* Description */}
                <div className="space-y-4">
                   <Label className="text-[10px] font-black uppercase text-muted-foreground">Detailed Job Requirements</Label>
                   <div className="bg-muted/30 p-8 rounded-[2rem] border-2 border-dashed italic text-sm font-medium leading-relaxed whitespace-pre-line text-muted-foreground">
                      "{selectedJob?.description || "No detailed description provided."}"
                   </div>
                </div>

                {/* Company Details Section */}
                {(selectedItem?.industry || selectedItem?.size || selectedItem?.foundedYear || selectedItem?.headquarters || selectedItem?.description) && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-black text-primary border-b-2 border-primary/10 pb-2">Company Details</h3>
                    <div className="p-6 bg-muted/30 rounded-3xl border space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {selectedItem?.industry && (
                          <div>
                            <Label className="text-[10px] font-black uppercase text-muted-foreground">Industry</Label>
                            <p className="text-sm font-bold mt-1">{selectedItem.industry}</p>
                          </div>
                        )}
                        {selectedItem?.size && (
                          <div>
                            <Label className="text-[10px] font-black uppercase text-muted-foreground">Company Size</Label>
                            <p className="text-sm font-bold mt-1">{selectedItem.size}</p>
                          </div>
                        )}
                        {selectedItem?.foundedYear && (
                          <div>
                            <Label className="text-[10px] font-black uppercase text-muted-foreground">Founded</Label>
                            <p className="text-sm font-bold mt-1">{selectedItem.foundedYear}</p>
                          </div>
                        )}
                        {selectedItem?.headquarters && (
                          <div>
                            <Label className="text-[10px] font-black uppercase text-muted-foreground">Headquarters</Label>
                            <p className="text-sm font-bold mt-1">{selectedItem.headquarters}</p>
                          </div>
                        )}
                      </div>
                      {selectedItem?.description && (
                        <div className="border-t pt-4">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">Company Description</Label>
                          <p className="text-sm font-semibold text-slate-700 mt-2 leading-relaxed whitespace-pre-line">{selectedItem.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Profile Change Diff Section */}
                {changeRequest && changeRequest.changedFields && changeRequest.changedFields.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-black text-amber-700 border-b-2 border-amber-200 pb-2 flex-1">Profile Update — Changes Requested</h3>
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-amber-200">{changeRequest.changedFields.length} field(s) changed</span>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 space-y-4">
                      <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-4">Review all changes carefully before approving or rejecting.</p>
                      {changeRequest.changedFields.map((change: any) => (
                        <div key={change.field} className="border border-amber-200 rounded-2xl overflow-hidden">
                          <div className="bg-amber-100 px-4 py-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-800">{change.field}</span>
                          </div>
                          <div className="grid grid-cols-2 divide-x divide-amber-200">
                            <div className="p-4 bg-red-50">
                              <p className="text-[10px] font-black uppercase text-red-500 mb-1">Before</p>
                              <p className="text-sm font-semibold text-red-700 whitespace-pre-line">{String(change.oldValue) || <span className="italic text-red-400">empty</span>}</p>
                            </div>
                            <div className="p-4 bg-green-50">
                              <p className="text-[10px] font-black uppercase text-green-600 mb-1">After</p>
                              <p className="text-sm font-semibold text-green-800 whitespace-pre-line">{String(change.newValue) || <span className="italic text-green-400">empty</span>}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
             </div>
           </ScrollArea>
           
           <DialogFooter className="p-6 bg-muted/30 border-t shrink-0">
              <Button variant="ghost" className="font-bold text-muted-foreground" onClick={() => setSelectedJob(null)}>Close Approval Viewer</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Safety Center Incident Review Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={(o) => !o && setSelectedReport(null)}>
        <DialogContent className="max-w-3xl rounded-[2.5rem] p-0 border-none shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader className="p-8 bg-slate-900 text-white text-left sticky top-0 z-10">
            <div className="flex justify-between items-start gap-4">
              <div>
                <DialogTitle className="text-2xl font-black flex items-center gap-2">
                  <ShieldAlert className="w-7 h-7 text-red-500" /> Safety Center: Incident Review
                </DialogTitle>
                <DialogDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">
                  Target Name: {selectedReport?.targetName} • Type: {selectedReport?.targetType?.toUpperCase()}
                </DialogDescription>
              </div>
              <Badge className={cn(
                "font-black border-none px-3 py-1 text-xs",
                selectedReport?.status === 'blocked' ? "bg-red-500 text-white" :
                selectedReport?.status === 'resolved' ? "bg-green-500 text-white" :
                selectedReport?.status === 'under_review' ? "bg-purple-500 text-white" :
                "bg-amber-500 text-white"
              )}>
                {selectedReport?.status ? selectedReport.status.toUpperCase() : 'PENDING'}
              </Badge>
            </div>
          </DialogHeader>

          <div className="p-8 space-y-6">
              {/* Report metadata grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-3xl border">
                <div>
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Reported By</Label>
                  <p className="text-sm font-black text-slate-800">{selectedReport?.reportedByName}</p>
                  <p className="text-xs font-semibold text-muted-foreground">{selectedReport?.reportedByPhone}</p>
                </div>
                <div>
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Reason Category</Label>
                  <p className="text-sm font-black text-red-600">{selectedReport?.reason}</p>
                </div>
                <div>
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Submission Date</Label>
                  <p className="text-sm font-black text-slate-800">{safeFormatDate(selectedReport?.createdAt)}</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Detailed Description of Incident</Label>
                <div className="bg-slate-50 p-6 rounded-3xl border text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-line">
                  {selectedReport?.description || "No additional description provided by the reporter."}
                </div>
              </div>

              {/* Screenshot Evidence Section */}
              {selectedReport?.screenshot && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Screenshot Evidence</Label>
                  <div className="aspect-video rounded-3xl overflow-hidden bg-muted border-4 border-slate-100 shadow-md max-w-lg">
                    <img src={selectedReport.screenshot} alt="Incident Evidence" className="w-full h-full object-contain" />
                  </div>
                </div>
              )}
            </div>

          <DialogFooter className="p-6 bg-slate-50 border-t flex flex-col sm:flex-row flex-wrap gap-4 justify-between sticky bottom-0 z-10">
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                className="rounded-xl font-bold h-12 text-slate-650 flex-1 sm:flex-none"
                onClick={() => handleUpdateReportStatus(selectedReport.id, "rejected", undefined, "reject_report")}
              >
                Reject Report
              </Button>
              <Button 
                variant="outline" 
                className="rounded-xl font-bold h-12 text-indigo-600 border-indigo-200 flex-1 sm:flex-none"
                onClick={() => handleUpdateReportStatus(selectedReport.id, "resolved", undefined, "approve_report")}
              >
                Approve Report
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                className="rounded-xl font-bold h-12 text-amber-600 border-amber-200 flex-1 sm:flex-none"
                onClick={() => handleUpdateReportStatus(selectedReport.id, "resolved", selectedReport.targetId, "warn_user")}
              >
                Warn Target
              </Button>
              <Button 
                variant="outline" 
                className="rounded-xl font-bold h-12 text-purple-600 border-purple-200 flex-1 sm:flex-none"
                onClick={() => handleUpdateReportStatus(selectedReport.id, "under_review", selectedReport.targetId, "suspend_user")}
              >
                Suspend Target
              </Button>
              <Button 
                variant="destructive" 
                className="rounded-xl font-black h-12 px-6 shadow-md flex-1 sm:flex-none"
                onClick={() => handleUpdateReportStatus(selectedReport.id, "blocked", selectedReport.targetId, "block_user")}
              >
                Permanently Block Target
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Designation Dialog */}
      <Dialog open={isDesignationDialogOpen} onOpenChange={(o) => { setIsDesignationDialogOpen(o); if (!o) setEditingDesignation(null); }}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden" style={{ boxShadow: '0 24px 80px rgba(37, 99, 235, 0.2), inset 0 1px 0 rgba(255,255,255,0.9)' }}>
          <DialogHeader className="p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white text-left">
            <DialogTitle className="text-xl font-black font-headline tracking-tight">
              {editingDesignation ? "Edit Designation" : "Add Designation"}
            </DialogTitle>
            <DialogDescription className="text-blue-200 font-bold text-xs uppercase tracking-wider mt-1">
              {editingDesignation ? "Update the designation details below." : "Add a new job designation to the platform."}
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-5 bg-white">
            <div className="space-y-1.5">
              <Label className="font-bold text-sm text-slate-700">Designation Title <span className="text-red-500">*</span></Label>
              <Input
                value={newDesignation.title}
                onChange={e => setNewDesignation({...newDesignation, title: e.target.value})}
                placeholder="e.g. Software Engineer"
                className="h-11 rounded-xl font-semibold clay-input"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-bold text-sm text-slate-700">Hiring Category</Label>
              <Select value={newDesignation.category} onValueChange={v => {
                const defaultDept = DEPARTMENTS[v as 'Staff' | 'Worker'][0];
                setNewDesignation({...newDesignation, category: v, department: defaultDept});
              }}>
                <SelectTrigger className="h-11 rounded-xl font-semibold clay-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-lg">
                  {DESIGNATION_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat} className="font-semibold">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-bold text-sm text-slate-700">Department</Label>
              <Select value={newDesignation.department} onValueChange={v => setNewDesignation({...newDesignation, department: v})}>
                <SelectTrigger className="h-11 rounded-xl font-semibold clay-input">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-lg">
                  {(DEPARTMENTS[newDesignation.category as 'Staff' | 'Worker'] || []).map(dept => (
                    <SelectItem key={dept} value={dept} className="font-semibold">{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-bold text-sm text-slate-700">Status</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewDesignation({...newDesignation, isActive: true})}
                  className={cn(
                    "flex-1 h-10 text-xs font-bold transition-all rounded-xl",
                    newDesignation.isActive ? "bg-green-50 border border-green-400 text-green-700 font-extrabold" : "border border-slate-200 text-slate-400 hover:border-slate-300 bg-white"
                  )}
                >
                  ● Active
                </button>
                <button
                  type="button"
                  onClick={() => setNewDesignation({...newDesignation, isActive: false})}
                  className={cn(
                    "flex-1 h-10 text-xs font-bold transition-all rounded-xl",
                    !newDesignation.isActive ? "bg-slate-100 border border-slate-400 text-slate-600 font-extrabold" : "border border-slate-200 text-slate-400 hover:border-slate-300 bg-white"
                  )}
                >
                  ○ Inactive
                </button>
              </div>
            </div>
          </div>
          <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 gap-2 shrink-0">
            <Button variant="ghost" onClick={() => { setIsDesignationDialogOpen(false); setEditingDesignation(null); }} className="rounded-full font-bold text-slate-500 flex-1">Cancel</Button>
            <Button onClick={handleSaveDesignation} className="bg-blue-600 hover:bg-blue-700 text-white font-black h-11 px-6 rounded-full clay-btn flex-1">
              {editingDesignation ? "Save Changes" : "Add Designation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Confirmation Alerts */}
      <AlertDialog open={!!confirmAction} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl overflow-hidden max-w-sm p-0">
          <AlertDialogHeader className="p-6 bg-primary text-white text-left">
            <AlertDialogTitle className="font-headline flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" /> 
              {confirmAction?.type === 'delete' ? 'Delete Record' : 
               confirmAction?.type === 'dismiss' ? 'Dismiss Report' : 
               'Change Status'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/80 font-medium">
              Are you sure you want to {confirmAction?.type === 'delete' ? 'delete this record' : confirmAction?.type === 'dismiss' ? 'dismiss this report' : `mark as ${confirmAction?.label}`}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="p-4 bg-muted/30">
            <AlertDialogCancel className="rounded-xl border-primary/20 text-primary hover:bg-primary/5 font-bold h-11 w-full m-0">Cancel Action</AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeAction} 
              className={cn(
                "rounded-xl font-bold text-white shadow-lg h-11 w-full ml-2",
                confirmAction?.type === 'delete' || confirmAction?.type === 'rejected' || confirmAction?.type === 'suspended' ? 'bg-red-500 hover:bg-red-600' : 
                'bg-primary hover:bg-primary/90'
              )}
            >
              Confirm Update
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                    placeholder="e.g. Violation of terms, filled offline, duplicate, etc."
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
    </div>
  );
}
