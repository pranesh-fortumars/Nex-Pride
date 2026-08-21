"use client";

import { useState, useMemo, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useFirestore, useCollection, useUser, useDoc } from "@/firebase";
import { collection, doc, updateDoc, query, deleteDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, Plus, Search, Settings2, Trash2, Loader2, ArrowLeft, Check, X, ShieldAlert } from "lucide-react";

const DESIGNATION_CATEGORIES = ["Staff", "Worker"];

const DEPARTMENTS = {
  Staff: [
    "MERCHANDISING", "FABRIC", "PRINT & EMBROIDERY", "PRODUCTION", "QUALITY", "HR & ADMIN", "ACCOUNTS & DOCS", "CAD & SAMPLING", "ERP/EDP", "STORE", "OTHERS"
  ],
  Worker: [
    "CUTTING", "SEWING", "CHECKING", "IRONING & PACKING", "KNITTING", "DYEING", "COMPACTING", "PRINT / EMBROIDERY", "OTHERS"
  ]
};

const DEFAULT_SIM_DESIGNATIONS = [
  { id: "sim-d-1", title: "Software Engineer", category: "Staff", department: "HR & ADMIN", isActive: true },
  { id: "sim-d-2", title: "Merchandising Assistant", category: "Staff", department: "MERCHANDISING", isActive: true },
  { id: "sim-d-3", title: "Senior Tailor", category: "Worker", department: "SEWING", isActive: true }
];

export default function DesignationsManagerPage() {
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

  // Read demo/simulation mode
  const [simRole, setSimRole] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSimRole(localStorage.getItem('sim_user_role'));
    }
  }, []);

  const isDemoAdmin = simRole === 'admin' || simRole === 'superadmin';
  const canQuery = isActuallyAdmin;

  // Firebase Collection Query
  const designationsQuery = useMemo(() => canQuery ? query(collection(db, "Designations")) : null, [db, canQuery]);
  const { data: rawDesignations, loading: designationsLoading } = useCollection<any>(designationsQuery);

  // Fallback to local state if not logged in as a real admin in Firestore
  const [localDesignations, setLocalDesignations] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sim_designations');
      if (saved) return JSON.parse(saved);
    }
    return DEFAULT_SIM_DESIGNATIONS;
  });

  useEffect(() => {
    if (canQuery && rawDesignations) {
      setLocalDesignations(rawDesignations);
    }
  }, [canQuery, rawDesignations]);

  // Helper to save designations in local storage for simulation mode
  const saveLocalDesignations = (newList: any[]) => {
    setLocalDesignations(newList);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sim_designations', JSON.stringify(newList));
    }
  };

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [newDesignation, setNewDesignation] = useState({ title: "", category: "Staff", department: "HR & ADMIN", isActive: true });

  const [loading, setLoading] = useState(false);

  // Filtered designations
  const filteredDesignations = useMemo(() => {
    return localDesignations
      .filter(d => {
        const titleMatch = (d.title || d.name || "").toLowerCase().includes(searchQuery.toLowerCase());
        const categoryMatch = categoryFilter === "all" || d.category === categoryFilter;
        return titleMatch && categoryMatch;
      })
      .sort((a, b) => (a.title || a.name || "").localeCompare(b.title || b.name || ""));
  }, [localDesignations, searchQuery, categoryFilter]);

  // Handlers
  const openAddDesignation = () => {
    setEditingItem(null);
    setNewDesignation({ title: "", category: "Staff", department: "HR & ADMIN", isActive: true });
    setIsDialogOpen(true);
  };

  const openEditDesignation = (d: any) => {
    setEditingItem(d);
    setNewDesignation({
      title: d.title || d.name || "",
      category: d.category || "Staff",
      department: d.department || "HR & ADMIN",
      isActive: d.isActive !== false
    });
    setIsDialogOpen(true);
  };

  const handleSaveDesignation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesignation.title.trim()) {
      toast({ variant: "destructive", title: "Title Required" });
      return;
    }

    setLoading(true);

    try {
      if (canQuery) {
        if (editingItem) {
          const docRef = doc(db, "Designations", editingItem.id);
          await updateDoc(docRef, {
            title: newDesignation.title.trim(),
            category: newDesignation.category,
            department: newDesignation.department,
            isActive: newDesignation.isActive,
            updatedAt: serverTimestamp()
          });
          toast({ title: "Designation Updated" });
        } else {
          const collRef = collection(db, "Designations");
          await addDoc(collRef, {
            title: newDesignation.title.trim(),
            category: newDesignation.category,
            department: newDesignation.department,
            isActive: newDesignation.isActive,
            createdAt: serverTimestamp()
          });
          toast({ title: "Designation Added" });
        }
      } else {
        // Simulated local updates for demo mode
        let updatedList;
        if (editingItem) {
          updatedList = localDesignations.map(item =>
            item.id === editingItem.id
              ? { 
                  ...item, 
                  title: newDesignation.title.trim(), 
                  category: newDesignation.category, 
                  department: newDesignation.department,
                  isActive: newDesignation.isActive 
                }
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
          updatedList = [...localDesignations, newItem];
          toast({ title: "Designation Added (Simulated)" });
        }
        saveLocalDesignations(updatedList);
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Error Saving", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (d: any) => {
    const nextActive = d.isActive === false;
    try {
      if (canQuery) {
        const docRef = doc(db, "Designations", d.id);
        await updateDoc(docRef, { isActive: nextActive });
        toast({ title: nextActive ? "Designation activated" : "Designation deactivated" });
      } else {
        const updatedList = localDesignations.map(item =>
          item.id === d.id ? { ...item, isActive: nextActive } : item
        );
        saveLocalDesignations(updatedList);
        toast({ title: nextActive ? "Activated (Simulated)" : "Deactivated (Simulated)" });
      }
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Failed to update status" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (canQuery) {
        const docRef = doc(db, "Designations", id);
        await deleteDoc(docRef);
        toast({ title: "Designation Deleted" });
      } else {
        const updatedList = localDesignations.filter(item => item.id !== id);
        saveLocalDesignations(updatedList);
        toast({ title: "Designation Deleted (Simulated)" });
      }
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Failed to delete designation" });
    }
  };

  const handleBack = () => {
    router.push("/admin/dashboard");
  };

  const pageLoading = authLoading || (canQuery && designationsLoading);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-50 flex flex-col">
      <Header />
      
      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
        {/* Back Button */}
        <div className="mb-4">
          <Button
            onClick={handleBack}
            variant="ghost"
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold gap-2 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </div>

        {/* Demo Mode Notice Banner */}
        {!isActuallyAdmin && isDemoAdmin && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl flex items-center gap-3 shadow-sm clay-card">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="text-sm font-semibold">
              You are currently viewing the <span className="font-bold">Designations Manager</span> in simulation mode. Changes are interactive and saved in local state.
            </div>
          </div>
        )}

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="clay-card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Designations Manager</h1>
            <p className="text-slate-500 text-sm mt-1">Configure the official designation roles available for employers and job seekers.</p>
          </div>
          <Button
            onClick={openAddDesignation}
            className="clay-btn bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-6 rounded-full gap-2 flex items-center"
          >
            <Plus className="w-5 h-5" /> Add Designation
          </Button>
        </motion.div>

        {/* Search / Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}
          className="clay-card p-4 flex flex-col md:flex-row gap-3 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search designations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-11 rounded-xl text-sm font-semibold clay-input bg-white w-full"
            />
          </div>

          <div className="w-full md:w-60">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-11 rounded-xl font-semibold clay-input bg-white">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {DESIGNATION_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Table/Data Wrapper */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
          className="clay-card overflow-hidden"
        >
          {pageLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-sm font-medium text-slate-500">Loading designations...</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-50/50 hover:bg-blue-50/50 border-b border-slate-100">
                  <TableHead className="font-semibold text-slate-600 text-sm py-4 pl-6">Designation Title</TableHead>
                  <TableHead className="font-semibold text-slate-600 text-sm py-4">Category</TableHead>
                  <TableHead className="font-semibold text-slate-600 text-sm py-4">Status</TableHead>
                  <TableHead className="font-semibold text-slate-600 text-sm py-4 text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDesignations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-48 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Tag className="w-8 h-8 text-slate-300" />
                        <span className="font-semibold">No designations found</span>
                        <span className="text-xs text-slate-400">Try adjusting your filters or search term</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDesignations.map((d, index) => (
                    <TableRow
                      key={d.id}
                      className="hover:bg-blue-50/30 transition-colors border-b border-slate-50"
                    >
                      <TableCell className="font-bold py-4 pl-6 text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 clay-icon">
                            <Tag className="w-4 h-4" />
                          </div>
                          <span>{d.title || d.name}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 clay-icon">
                          {d.category} • {d.department || "N/A"}
                        </span>
                      </TableCell>

                      <TableCell className="py-4">
                        <button
                          onClick={() => handleToggleActive(d)}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all shadow-sm",
                            d.isActive !== false
                              ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                              : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                          )}
                        >
                          <span className={cn("w-1.5 h-1.5 rounded-full", d.isActive !== false ? "bg-green-600" : "bg-slate-400")} />
                          {d.isActive !== false ? "Active" : "Inactive"}
                        </button>
                      </TableCell>

                      <TableCell className="py-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDesignation(d)}
                            className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 clay-icon transition-all"
                          >
                            <Settings2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(d.id)}
                            className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 clay-icon transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </motion.div>
      </main>

      {/* Add / Edit Dialog Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="p-0 border-none rounded-3xl overflow-hidden max-w-md w-full bg-slate-900/20 backdrop-blur-sm shadow-2xl flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full clay-card p-8 bg-white"
            style={{
              boxShadow: "0 24px 80px rgba(37, 99, 235, 0.2), inset 0 1px 0 rgba(255,255,255,0.9)"
            }}
          >
            <DialogHeader className="mb-6">
              <DialogTitle className="text-xl font-bold text-slate-900">
                {editingItem ? "Edit Designation" : "Add Designation"}
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-sm">
                Fill in the details to configure this job role option.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveDesignation} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Designation Title</Label>
                <Input
                  type="text"
                  placeholder="e.g. Frontend Engineer"
                  value={newDesignation.title}
                  onChange={e => setNewDesignation(prev => ({ ...prev, title: e.target.value }))}
                  className="clay-input w-full h-11"
                  required
                />
              </div>

               <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Hiring Category</Label>
                <Select
                  value={newDesignation.category}
                  onValueChange={v => {
                    const defaultDept = DEPARTMENTS[v as 'Staff' | 'Worker'][0];
                    setNewDesignation(prev => ({ ...prev, category: v, department: defaultDept }));
                  }}
                >
                  <SelectTrigger className="h-11 rounded-xl font-semibold clay-input bg-white w-full">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {DESIGNATION_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Department</Label>
                <Select
                  value={newDesignation.department}
                  onValueChange={v => setNewDesignation(prev => ({ ...prev, department: v }))}
                >
                  <SelectTrigger className="h-11 rounded-xl font-semibold clay-input bg-white w-full">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {(DEPARTMENTS[newDesignation.category as 'Staff' | 'Worker'] || []).map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNewDesignation(prev => ({ ...prev, isActive: !prev.isActive }))}
                  className={cn(
                    "w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none clay-icon",
                    newDesignation.isActive ? "bg-green-500" : "bg-slate-300"
                  )}
                >
                  <div
                    className={cn(
                      "bg-white w-5 h-5 rounded-full shadow-md transform duration-200",
                      newDesignation.isActive ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
                <span className="text-sm font-semibold text-slate-700">Active (Visible to users)</span>
              </div>

              <DialogFooter className="pt-4 flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                  className="clay-btn h-11 px-5 border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="clay-btn bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-6 gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingItem ? (
                    "Save Changes"
                  ) : (
                    "Add Role"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
