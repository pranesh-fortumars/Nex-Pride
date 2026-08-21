
"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { User, Mail, Lock, ArrowRight, Calendar as CalendarIcon, CheckCircle2, UserCircle, Building2, ShieldCheck, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useAuth, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, differenceInYears } from "date-fns";
import { cn } from "@/lib/utils";
import { UserRole } from "@/lib/types";

export default function SignupPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();

  const [step, setStep] = useState<"details" | "role-select">("details");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    dob: null as string | null,
  });

  useState(() => {
    if (typeof window !== "undefined") {
      const emailParam = new URLSearchParams(window.location.search).get("email");
      if (emailParam) {
        formData.email = emailParam;
      }
    }
  });

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.dob) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please fill in all details." });
      return;
    }
    
    const age = differenceInYears(new Date(), new Date(formData.dob));
    if (age < 18) {
      toast({ 
        variant: "destructive", 
        title: "Age Restriction", 
        description: "You must be at least 18 years old to join NexPride." 
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({ variant: "destructive", title: "Passwords Mismatch", description: "Please check your password confirmation." });
      return;
    }
    if (formData.password.length < 6) {
      toast({ variant: "destructive", title: "Weak Password", description: "Password must be at least 6 characters." });
      return;
    }
    setStep("role-select");
  };

  const handleRoleSignup = async (role: UserRole) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      const userRef = doc(db, "Users", user.uid);
      const userData = {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        role: role,
        dob: formData.dob || null, 
        status: role === 'employer' ? 'pending' : 'approved',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        onboarded: false
      };

      await setDoc(userRef, userData, { merge: true });

      localStorage.setItem('sim_is_logged_in', 'true');
      localStorage.setItem('sim_user_role', role);

      toast({ title: "Account Created!", description: `Welcome to NexPride, ${formData.name}.` });
      
      if (role === 'admin') router.push("/admin/dashboard");
      else if (role === 'employer') router.push("/employer/dashboard");
      else router.push("/seeker/onboarding");

    } catch (error: any) {
      console.error("Signup Error:", error);
      let msg = "Failed to create account. Please try again.";
      if (error.code === 'auth/email-already-in-use') msg = "An account with this email already exists.";
      
      toast({ variant: "destructive", title: "Signup Failed", description: msg });
      
      if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
          path: `Users/${auth.currentUser?.uid}`,
          operation: 'write',
        });
        errorEmitter.emit('permission-error', permissionError);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4 py-12">
        <Card className="w-full max-w-lg shadow-2xl border-primary/10 rounded-[2.5rem] overflow-hidden">
          <CardHeader className="space-y-2 text-center bg-muted/20 pb-8 pt-10">
            <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-2 text-primary shadow-inner">
              {step === "details" ? <UserCircle className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
            </div>
            <CardTitle className="text-3xl font-extrabold font-headline text-primary">
              {step === "details" ? "Create Account" : "Select Your Tier"}
            </CardTitle>
            <CardDescription className="text-base font-medium">
              {step === "details" ? "Join India's premiere inclusive job hub" : "Tell us how you'll use NexPride"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-10">
            {step === "details" ? (
              <form onSubmit={handleDetailsSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="font-bold flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" /> Full Name
                  </Label>
                  <Input 
                    id="signup-name" 
                    placeholder="Enter your legal or preferred name" 
                    className="h-14 rounded-2xl font-bold"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="font-bold flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" /> Email Address
                  </Label>
                  <Input 
                    id="signup-email" 
                    type="email"
                    placeholder="name@example.com" 
                    className="h-14 rounded-2xl font-bold"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-bold flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-primary" /> Date of Birth (Above 18 Only)
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full h-14 justify-start text-left font-bold rounded-2xl", !formData.dob && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dob ? format(new Date(formData.dob), "dd-MM-yyyy") : "Select birth date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                      <Calendar 
                        mode="single" 
                        captionLayout="dropdown"
                        startMonth={new Date(1950, 0)}
                        endMonth={new Date(new Date().getFullYear() - 18, 11)}
                        selected={formData.dob ? new Date(formData.dob) : undefined} 
                        onSelect={d => setFormData({ ...formData, dob: d?.toISOString() || null })} 
                        initialFocus 
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-pass" className="font-bold flex items-center gap-2">
                      <Lock className="w-4 h-4 text-primary" /> Password
                    </Label>
                    <Input 
                      id="signup-pass" 
                      type="password"
                      placeholder="••••••••" 
                      className="h-14 rounded-2xl font-bold"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-conf" className="font-bold flex items-center gap-2">
                      <Lock className="w-4 h-4 text-primary" /> Confirm
                    </Label>
                    <Input 
                      id="signup-conf" 
                      type="password"
                      placeholder="••••••••" 
                      className="h-14 rounded-2xl font-bold"
                      value={formData.confirmPassword}
                      onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-14 bg-primary text-white font-black rounded-2xl text-lg shadow-xl shadow-primary/20">
                  Select Role <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </form>
            ) : (
              <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center gap-2 border-2 hover:border-primary hover:bg-primary/5 rounded-[2rem] transition-all group"
                  onClick={() => handleRoleSignup('job_seeker')}
                  disabled={loading}
                >
                  <User className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                  <span className="font-black text-xl">{t.jobSeeker}</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center gap-2 border-2 hover:border-accent hover:bg-accent/5 rounded-[2rem] transition-all group"
                  onClick={() => handleRoleSignup('employer')}
                  disabled={loading}
                >
                  <Building2 className="w-8 h-8 text-accent group-hover:scale-110 transition-transform" />
                  <span className="font-black text-xl">{t.companyOwner}</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-16 flex items-center justify-center gap-3 border-2 hover:border-destructive hover:bg-destructive/5 rounded-[2rem] transition-all group"
                  onClick={() => handleRoleSignup('admin')}
                  disabled={loading}
                >
                  <ShieldAlert className="w-6 h-6 text-destructive group-hover:scale-110 transition-transform" />
                  <span className="font-black">{t.superAdmin}</span>
                </Button>
                
                <Button variant="ghost" onClick={() => setStep("details")} className="font-bold text-muted-foreground" disabled={loading}>
                  Back to Details
                </Button>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4 text-center pb-12 pt-0 px-8">
            <p className="text-sm font-medium text-muted-foreground">
              Already have an account? <Link href="/auth/login" className="text-primary font-bold hover:underline">Login here</Link>
            </p>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
