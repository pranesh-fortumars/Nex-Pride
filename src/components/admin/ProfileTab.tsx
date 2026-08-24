"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserIcon, Loader2, CheckCircle2 } from "lucide-react";

interface ProfileTabProps {
  userProfile: any;
  adminProfileData: any;
  setAdminProfileData: (data: any) => void;
  isProcessing: boolean;
  handleUpdateAdminProfile: () => void;
}

export function ProfileTab({
  userProfile,
  adminProfileData,
  setAdminProfileData,
  isProcessing,
  handleUpdateAdminProfile
}: ProfileTabProps) {
  return (
    <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-xl bg-white max-w-2xl mx-auto">
      <CardHeader className="bg-primary/5 text-center p-8">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg">
          <UserIcon className="w-8 h-8" />
        </div>
        <CardTitle className="text-2xl font-black text-primary">My Profile</CardTitle>
        <CardDescription className="font-bold text-slate-500 mt-1">Manage your administrator account details</CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={(e) => { e.preventDefault(); handleUpdateAdminProfile(); }} className="space-y-6">
          <div className="space-y-2">
            <Label className="font-bold text-xs uppercase text-slate-500">Email Address (Read Only)</Label>
            <Input value={userProfile?.email || ""} disabled className="h-14 rounded-2xl bg-slate-50 font-bold" />
          </div>
          <div className="space-y-2">
            <Label className="font-bold text-xs uppercase text-slate-500">Role</Label>
            <Input value={userProfile?.role === "superadmin" ? "Super Admin" : "Admin"} disabled className="h-14 rounded-2xl bg-slate-50 font-bold capitalize" />
          </div>
          <div className="space-y-2">
            <Label className="font-bold text-xs uppercase text-slate-500">Full Name</Label>
            <Input 
              value={adminProfileData.name}
              onChange={(e) => setAdminProfileData({...adminProfileData, name: e.target.value})}
              className="h-14 rounded-2xl font-bold" 
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bold text-xs uppercase text-slate-500">Date of Birth</Label>
            <Input 
              type="date"
              value={adminProfileData.dob ? new Date(adminProfileData.dob).toISOString().split('T')[0] : ""}
              onChange={(e) => setAdminProfileData({...adminProfileData, dob: e.target.value})}
              className="h-14 rounded-2xl font-bold" 
            />
          </div>
          <Button type="submit" disabled={isProcessing} className="w-full h-14 bg-primary text-white font-black rounded-2xl shadow-lg mt-4">
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
            {isProcessing ? "Saving..." : "Save Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
