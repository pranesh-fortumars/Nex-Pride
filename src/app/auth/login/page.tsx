
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Phone as PhoneIcon, ArrowRight, ArrowLeft, ShieldCheck, User, Building2,
  ShieldAlert, Heart, Mail, Lock, Eye, EyeOff, Sparkles
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserRole } from "@/lib/types";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useAuth, useUser, useFirestore } from "@/firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  signInWithEmailAndPassword
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();

  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [step, setStep] = useState<"phone" | "otp" | "role-select">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && method === 'phone' && !window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          'callback': () => { },
          'expired-callback': () => {
            if (window.recaptchaVerifier) window.recaptchaVerifier.clear();
            window.recaptchaVerifier = null;
          }
        });
      } catch (e) {
        console.debug("Recaptcha initialization hidden");
      }
    }
  }, [auth, method]);

  const handleDummyLogin = async (role: UserRole) => {
    setLoading(true);
    localStorage.setItem('sim_is_logged_in', 'true');
    localStorage.setItem('sim_user_role', role);
    toast({ title: `Quick Access: Logged in as ${role.replace('_', ' ')}` });
    if (role === 'admin' || role === 'superadmin') router.push("/admin/dashboard");
    else if (role === 'employer') router.push("/employer/dashboard");
    else {
      const isOnboarded = localStorage.getItem('sim_seeker_onboarded') === 'true';
      router.push(isOnboarded ? "/seeker/dashboard" : "/seeker/onboarding");
    }
    setLoading(false);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length === 10) {
      setLoading(true);
      try {
        const formattedPhone = `+91${phone}`;
        const appVerifier = window.recaptchaVerifier;
        if (!appVerifier) throw new Error("Recaptcha not initialized");
        const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
        setConfirmationResult(result);
        setStep("otp");
      } catch (error: any) {
        toast({ variant: "destructive", title: "Verification Error", description: error.message || "Failed to send OTP." });
        // Clear recaptcha on failure to allow retry
        if (window.recaptchaVerifier) {
          try { window.recaptchaVerifier.clear(); } catch(e) {}
          window.recaptchaVerifier = null;
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6 && confirmationResult) {
      setLoading(true);
      try {
        const result = await confirmationResult.confirm(otp);
        const user = result.user;
        const userDocRef = doc(db, "Users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          localStorage.setItem('sim_is_logged_in', 'true');
          localStorage.setItem('sim_user_role', data.role);
          if (data.role === 'admin' || data.role === 'superadmin') router.push("/admin/dashboard");
          else if (data.role === 'employer') router.push("/employer/dashboard");
          else router.push(data.onboarded ? "/seeker/dashboard" : "/seeker/onboarding");
        } else {
          setStep("role-select");
        }
      } catch (error: any) {
        toast({ variant: "destructive", title: "Invalid OTP", description: "The code you entered is incorrect." });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Mock intercept for demo
    if (email === "tester@example.com" || email === "admin@example.com") {
      const role = email === "admin@example.com" ? "admin" : "employer";
      setTimeout(() => {
        handleDummyLogin(role);
      }, 500);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDocRef = doc(db, "Users", user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        localStorage.setItem('sim_is_logged_in', 'true');
        localStorage.setItem('sim_user_role', data.role);
        if (data.role === 'admin' || data.role === 'superadmin') router.push("/admin/dashboard");
        else if (data.role === 'employer') router.push("/employer/dashboard");
        else router.push(data.onboarded ? "/seeker/dashboard" : "/seeker/onboarding");
      } else {
        setStep("role-select");
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      let desc = "Invalid email or password.";
      if (error.code === "auth/user-not-found") desc = "No user account found with this email.";
      else if (error.code === "auth/wrong-password") desc = "Incorrect password.";
      else if (error.code === "auth/invalid-credential") desc = "Invalid email or password.";
      else if (error.message) desc = error.message;

      toast({ variant: "destructive", title: "Login Failed", description: desc });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    const userRef = doc(db, "Users", user.uid);
    const userData = {
      uid: user.uid,
      phone: user.phoneNumber || (method === 'phone' ? `+91${phone}` : null),
      email: user.email || (method === 'email' ? email : null),
      role: role,
      status: role === 'employer' ? 'incomplete' : 'approved',
      onboarded: false,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };
    setDoc(userRef, userData, { merge: true })
      .then(() => {
        localStorage.setItem('sim_is_logged_in', 'true');
        localStorage.setItem('sim_user_role', role);
        if (role === 'admin' || role === 'superadmin') router.push("/admin/dashboard");
        else if (role === 'employer') router.push("/employer/dashboard");
        else router.push("/seeker/onboarding");
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: userRef.path, operation: 'write', requestResourceData: userData }));
      })
      .finally(() => setLoading(false));
  };

  // ── RENDER ──
  return (
    <div className="min-h-screen flex">
      <div id="recaptcha-container" />

      {/* ── LEFT PANEL (desktop only) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-violet-600 via-violet-700 to-violet-900 flex-col justify-between p-12 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute bottom-0 -left-16 w-72 h-72 rounded-full bg-white/5" />
          <div className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full bg-white/5" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-2xl font-extrabold text-white tracking-tight">NexPride</span>
          </Link>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-white/20">
              <Sparkles className="w-3.5 h-3.5" /> India's Pride Platform
            </div>
            <h2 className="text-4xl font-black text-white leading-tight">
              Your Career,<br />Your <span className="text-violet-200">Identity</span>,<br />Celebrated.
            </h2>
            <p className="text-violet-200 text-base font-medium leading-relaxed max-w-sm">
              Connecting LGBTQ+ talent with verified inclusive employers across India. Safe, private, and professional.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-3">
            {[
              { icon: ShieldCheck, text: "100% verified inclusive employers" },
              { icon: User, text: "Privacy-first profiles" },
              { icon: Building2, text: "1,200+ companies hiring now" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white/90 font-medium text-sm">{text}</span>
              </div>
            ))}
          </div>

          {/* Testimonial card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
            <p className="text-white/90 font-medium text-sm italic leading-relaxed">
              "NexPride helped me find a job where I can be completely myself. The verification system gave me confidence the employer was genuinely inclusive."
            </p>
            <div className="flex items-center gap-2.5 mt-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-300 to-violet-500 flex items-center justify-center text-white text-xs font-bold">AP</div>
              <div>
                <div className="text-white text-xs font-bold">Aarav Patel</div>
                <div className="text-violet-300 text-xs">Software Developer, Bangalore</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <div className="h-0.5 rainbow-line rounded-full mb-4 opacity-60" />
          <p className="text-violet-300 text-xs font-medium">© 2026 NexPride.in · Built with Pride 🏳️‍🌈</p>
        </div>
      </div>

      {/* ── RIGHT PANEL (form) ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 bg-slate-50 min-h-screen">
        {/* Mobile logo & Back Button */}
        <div className="lg:hidden mb-8 flex items-center justify-between w-full">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full shrink-0">
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-xl font-extrabold"><span className="text-slate-900">Nex</span><span className="text-violet-600">Pride</span></span>
          </div>
          <div className="w-10 shrink-0" /> {/* Spacer for visual centering */}
        </div>

        <div className="w-full max-w-sm">
          {step === "role-select" ? (
            /* Role selection */
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Join as...</h1>
                <p className="text-slate-500 text-sm mt-1">Select your role to continue</p>
              </div>
              <div className="grid gap-3">
                <button
                  onClick={() => handleRoleSelect('job_seeker')}
                  disabled={loading}
                  className="flex items-center gap-4 p-5 rounded-2xl border-2 border-slate-200 hover:border-violet-400 hover:bg-violet-50 transition-all group text-left active:scale-98"
                >
                  <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center group-hover:bg-violet-600 transition-all">
                    <User className="w-6 h-6 text-violet-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-violet-600 transition-colors">{t.jobSeeker}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Find inclusive jobs</div>
                  </div>
                </button>
                <button
                  onClick={() => handleRoleSelect('employer')}
                  disabled={loading}
                  className="flex items-center gap-4 p-5 rounded-2xl border-2 border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-all group text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center group-hover:bg-violet-500 transition-all">
                    <Building2 className="w-6 h-6 text-violet-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-violet-600 transition-colors">{t.companyOwner}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Post inclusive jobs</div>
                  </div>
                </button>
                <button
                  onClick={() => handleRoleSelect('admin')}
                  disabled={loading}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-dashed border-slate-200 hover:border-red-300 hover:bg-red-50 transition-all group text-left"
                >
                  <ShieldAlert className="w-5 h-5 text-red-400 group-hover:text-red-500" />
                  <span className="font-semibold text-sm text-slate-500 group-hover:text-red-500 transition-colors">{t.superAdmin}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Phone / OTP / Email forms */
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {step === "otp" ? "Enter OTP" : "Welcome back"}
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                  {step === "otp"
                    ? `Code sent to +91 ${phone}`
                    : method === 'phone' ? "Sign in with your mobile number" : "Sign in with your email"
                  }
                </p>
              </div>

              {method === "phone" ? (
                <>
                  {step === "phone" && (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="phone" className="font-semibold text-sm text-slate-700">Mobile Number</Label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3.5 text-sm font-bold text-slate-500 border-r border-slate-200 pr-3">+91</span>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="9876543210"
                            className="pl-16 h-12 rounded-xl border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 font-bold text-lg tracking-wider transition-all"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                            required
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold h-12 rounded-xl shadow-md shadow-violet-200 transition-all active:scale-95"
                        disabled={phone.length !== 10 || loading}
                      >
                        {loading ? "Sending..." : "Send OTP"} <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                      <button type="button" onClick={() => setMethod("email")} className="w-full text-xs font-semibold text-violet-600 hover:underline py-1">
                        Login with Email instead
                      </button>
                    </form>
                  )}

                  {step === "otp" && (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="otp" className="font-semibold text-sm text-slate-700">6-digit OTP</Label>
                        <Input
                          id="otp"
                          type="text"
                          maxLength={6}
                          placeholder="000000"
                          className="h-14 text-center text-3xl tracking-[1rem] font-black rounded-xl border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 bg-slate-50 transition-all"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                          required
                          autoFocus
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold h-12 rounded-xl shadow-md shadow-violet-200 transition-all active:scale-95"
                        disabled={otp.length !== 6 || loading}
                      >
                        {loading ? "Verifying..." : "Verify OTP"}
                      </Button>
                      <button type="button" onClick={() => setStep("phone")} className="w-full text-xs font-semibold text-violet-600 hover:underline py-1">
                        {t.changePhone}
                      </button>
                    </form>
                  )}
                </>
              ) : (
                /* Email form */
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email" className="font-semibold text-sm text-slate-700">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="name@example.com"
                        className="pl-10 h-12 rounded-xl border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 font-medium transition-all"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="login-pass" className="font-semibold text-sm text-slate-700">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="login-pass"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10 h-12 rounded-xl border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 font-medium transition-all [&::-ms-reveal]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold h-12 rounded-xl shadow-md shadow-violet-200 transition-all active:scale-95"
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Log In"} <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                  <button type="button" onClick={() => setMethod("phone")} className="w-full text-xs font-semibold text-violet-600 hover:underline py-1">
                    Login with Mobile OTP instead
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Register link */}
          <p className="mt-6 text-center text-sm font-medium text-slate-500">
            New to NexPride?{" "}
            <Link href="/auth/signup" className="text-violet-600 font-bold hover:underline">Create account</Link>
          </p>

          {/* Demo quick access */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-center text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3">Quick Demo Access</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { role: 'job_seeker' as UserRole, label: 'Seeker', icon: User, color: 'violet' },
                { role: 'employer' as UserRole, label: 'Employer', icon: Building2, color: 'violet' },
                { role: 'admin' as UserRole, label: 'Admin', icon: ShieldAlert, color: 'red' },
              ].map(({ role, label, icon: Icon, color }) => (
                <button
                  key={role}
                  onClick={() => handleDummyLogin(role)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-bold transition-all active:scale-95",
                    color === 'violet' && "border-violet-100 hover:border-violet-300 hover:bg-violet-50 text-slate-500 hover:text-violet-600",
                    color === 'red' && "border-red-100 hover:border-red-300 hover:bg-red-50 text-slate-500 hover:text-red-500",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
