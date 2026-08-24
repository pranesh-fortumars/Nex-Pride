"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Loader2, Plus } from "lucide-react";

interface ManageAdminsTabProps {
  newAdminData: any;
  setNewAdminData: (data: any) => void;
  isAdminCreating: boolean;
  handleCreateSuperAdmin: (e: React.FormEvent) => void;
}

export function ManageAdminsTab({
  newAdminData,
  setNewAdminData,
  isAdminCreating,
  handleCreateSuperAdmin
}: ManageAdminsTabProps) {
  return (
    <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-xl bg-white max-w-2xl mx-auto">
      <CardHeader className="bg-destructive/5 text-center p-8">
        <div className="w-16 h-16 bg-destructive rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <CardTitle className="text-2xl font-black text-destructive">Add Super Admin</CardTitle>
        <CardDescription className="font-bold text-slate-500 mt-1">Create a new administrator account</CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleCreateSuperAdmin} className="space-y-6">
          <div className="space-y-2">
            <Label className="font-bold text-xs uppercase text-slate-500">Full Name</Label>
            <Input 
              value={newAdminData.name}
              onChange={(e) => setNewAdminData({...newAdminData, name: e.target.value})}
              placeholder="John Doe"
              className="h-14 rounded-2xl font-bold" 
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bold text-xs uppercase text-slate-500">Email Address</Label>
            <Input 
              type="email"
              value={newAdminData.email}
              onChange={(e) => setNewAdminData({...newAdminData, email: e.target.value})}
              placeholder="admin@nexpride.in"
              className="h-14 rounded-2xl font-bold" 
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bold text-xs uppercase text-slate-500">Password</Label>
            <Input 
              type="password"
              value={newAdminData.password}
              onChange={(e) => setNewAdminData({...newAdminData, password: e.target.value})}
              placeholder="••••••••"
              className="h-14 rounded-2xl font-bold" 
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bold text-xs uppercase text-slate-500">Date of Birth</Label>
            <Input 
              type="date"
              value={newAdminData.dob}
              onChange={(e) => setNewAdminData({...newAdminData, dob: e.target.value})}
              className="h-14 rounded-2xl font-bold" 
              required
            />
          </div>
          <Button type="submit" disabled={isAdminCreating} className="w-full h-14 bg-destructive hover:bg-destructive/90 text-white font-black rounded-2xl shadow-lg mt-4">
            {isAdminCreating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
            {isAdminCreating ? "Creating..." : "Create Admin Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
