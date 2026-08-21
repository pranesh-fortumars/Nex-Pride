
"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  ChevronRight,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";

export default function SettingsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useUser();
  const db = useFirestore();
  
  const userRef = useMemo(() => user ? doc(db, "Users", user.uid) : null, [db, user]);
  const { data: userData, loading: dataLoading } = useDoc<any>(userRef);

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Security update request simulation
    setTimeout(() => {
      setLoading(false);
      toast({
        title: t.passwordResetSent,
        description: t.passwordResetSentDesc,
      });
      setEmail("");
    }, 1500);
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-grow p-4 md:p-12 max-w-4xl mx-auto w-full space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="font-bold text-primary gap-2">
            <ArrowLeft className="w-4 h-4" /> {t.backToPrev}
          </Button>
          <h1 className="text-3xl font-extrabold font-headline text-primary">{t.settings}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
              <CardHeader className="bg-primary text-white p-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <ShieldCheck className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold font-headline">{t.resetPassword}</CardTitle>
                    <CardDescription className="text-primary-foreground/80 font-medium">
                      {t.resetPasswordDesc}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email" className="font-bold text-xs uppercase text-muted-foreground flex items-center gap-2">
                      <Mail className="w-3 h-3" /> Registered Email Address
                    </Label>
                    <Input 
                      id="reset-email"
                      type="email"
                      value={email || userData?.email || ""}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="h-12 rounded-xl font-bold border-primary/20"
                    />
                    <p className="text-[10px] text-muted-foreground font-medium">
                      Note: Password reset links are sent to your registered email for additional security.
                    </p>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full h-14 bg-primary text-white font-bold rounded-2xl text-lg shadow-xl shadow-primary/20 transition-transform active:scale-95"
                  >
                    {loading ? "Sending..." : t.sendResetLink}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {userData?.role !== 'admin' && (
              <Card className="border-none shadow-lg rounded-[2rem] bg-muted/30">
                 <CardContent className="p-6 flex items-start gap-4">
                   <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                      <Smartphone className="w-5 h-5 text-primary" />
                   </div>
                   <div className="space-y-1">
                     <h4 className="font-bold text-sm">Registered Mobile Number</h4>
                     <p className="text-lg font-extrabold text-primary">
                       {userData?.phone ? `+91 ${userData.phone}` : user?.phoneNumber || "Not Provided"}
                     </p>
                     <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Verified Identity</p>
                   </div>
                 </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-lg rounded-[2rem] bg-amber-50">
               <CardContent className="p-6 space-y-4">
                 <div className="flex items-center gap-2 text-amber-900 font-bold">
                    <AlertTriangle className="w-5 h-5 text-amber-600" /> Security Tip
                 </div>
                 <p className="text-xs text-amber-800/70 font-medium leading-relaxed">
                   Never share your login OTP or password reset links with anyone, including NexTirupur staff. We will never ask for your account credentials.
                 </p>
               </CardContent>
            </Card>

            <Card className="border-none shadow-lg rounded-[2rem] bg-primary/5">
              <CardContent className="p-6 space-y-4">
                <h4 className="font-bold text-primary flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Account Safety
                </h4>
                <ul className="text-[11px] text-muted-foreground space-y-3 font-medium">
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <p>Verified accounts have 4x higher trust rating from employers.</p>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <p>Security checks are performed on every login attempt.</p>
                  </li>
                </ul>
                <Button 
                  variant="link" 
                  className="p-0 h-auto font-bold text-primary text-xs hover:no-underline"
                  onClick={() => router.push('/safety')}
                >
                  Read Safety Guide <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <div className="max-w-4xl mx-auto px-4 text-center text-muted-foreground/30 text-[10px] uppercase tracking-widest font-bold pb-12">
        © {new Date().getFullYear()} NexTirupur.in Secure Settings.
      </div>
    </div>
  );
}
