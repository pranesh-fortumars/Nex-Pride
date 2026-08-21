"use client";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  ShieldCheck, 
  AlertTriangle, 
  UserCheck, 
  Lock, 
  ArrowLeft, 
  Phone, 
  MapPin, 
  Camera, 
  Smartphone, 
  CheckCircle2, 
  Building2, 
  Search, 
  ExternalLink,
  MessageCircle,
  HelpCircle,
  AlertCircle,
  Star
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function SafetyTipsPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-grow py-12 px-4 max-w-5xl mx-auto space-y-12 w-full">
        {/* Hero Section */}
        <div className="space-y-4 text-center">
          <Link href="/jobs" className="inline-flex items-center text-primary font-bold hover:underline mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> {t.backToJobs}
          </Link>
          <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/20 rotate-3">
            <ShieldCheck className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-primary tracking-tight">
            {t.safetyPageTitle}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl mx-auto">
            {t.safetyPageSub}
          </p>
        </div>

        {/* 5-Point Verification Section */}
        <Card className="border-none shadow-xl bg-primary text-white overflow-hidden rounded-[2.5rem]">
          <CardHeader className="p-8 md:p-12 text-center border-b border-white/10">
            <CardTitle className="text-2xl md:text-3xl font-bold font-headline mb-2">{t.verificationPointsTitle}</CardTitle>
            <CardDescription className="text-primary-foreground/80 font-medium max-w-2xl mx-auto">
              {t.verificationPointsSub}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 md:p-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[
                { icon: <Building2 className="w-6 h-6" />, text: t.vPoint1 },
                { icon: <MapPin className="w-6 h-6" />, text: t.vPoint2 },
                { icon: <Building2 className="w-6 h-6" />, text: t.vPoint3 },
                { icon: <Camera className="w-6 h-6" />, text: t.vPoint4 },
                { icon: <Smartphone className="w-6 h-6" />, text: t.vPoint5 },
              ].map((point, idx) => (
                <div key={idx} className="flex flex-col items-center text-center space-y-3 group">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 group-hover:scale-110 transition-transform">
                    {point.icon}
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider leading-tight">{point.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Two Columns: Seekers vs Employers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Seeker Rules */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                <UserCheck className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold font-headline">{t.seekerSafetyRulesTitle}</h2>
            </div>
            
            <div className="space-y-4">
              {[
                { title: t.seekerRule1Title, desc: t.seekerRule1Desc, icon: "💰" },
                { title: t.seekerRule2Title, desc: t.seekerRule2Desc, icon: "📍" },
                { title: t.seekerRule3Title, desc: t.seekerRule3Desc, icon: "🛡️" },
                { title: t.seekerRule4Title, desc: t.seekerRule4Desc, icon: "📱" },
                { title: t.seekerRule5Title, desc: t.seekerRule5Desc, icon: "🏠" },
              ].map((rule, idx) => (
                <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden group">
                  <div className="flex">
                    <div className="w-16 bg-muted/30 flex items-center justify-center text-2xl group-hover:bg-accent group-hover:text-white transition-colors">{rule.icon}</div>
                    <CardContent className="p-5 flex-1">
                      <h4 className="font-bold text-primary mb-1">{rule.title}</h4>
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed">{rule.desc}</p>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Employer Rules */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                <Building2 className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold font-headline">{t.employerSafetyRulesTitle}</h2>
            </div>
            
            <div className="space-y-4">
               {[
                { title: t.employerRule1Title, desc: rule1DescFix(t.employerRule1Desc), icon: "🆔" },
                { title: t.employerRule2Title, desc: t.employerRule2Desc, icon: "💳" },
                { title: t.employerRule3Title, desc: t.employerRule3Desc, icon: "🔑" },
                { title: t.employerRule4Title, desc: t.employerRule4Desc, icon: "🚫" },
              ].map((rule, idx) => (
                <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden group">
                  <div className="flex">
                    <div className="w-16 bg-muted/30 flex items-center justify-center text-2xl group-hover:bg-green-600 group-hover:text-white transition-colors">{rule.icon}</div>
                    <CardContent className="p-5 flex-1">
                      <h4 className="font-bold text-primary mb-1">{rule.title}</h4>
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed">{rule.desc}</p>
                    </CardContent>
                  </div>
                </Card>
              ))}
              <div className="p-8 bg-green-50 rounded-3xl border border-dashed border-green-200 text-center space-y-4">
                 <Smartphone className="w-10 h-10 text-green-600 mx-auto" />
                 <h4 className="font-bold text-green-900">Need On-Site Support?</h4>
                 <p className="text-xs text-green-800/70 font-medium">Our community support team is here to help with safe hiring practices.</p>
                 <Link href="/support">
                  <Button variant="outline" size="sm" className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white font-bold rounded-xl">Contact Support Team</Button>
                 </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Reporting Section */}
        <Card className="border-none shadow-2xl bg-destructive text-destructive-foreground rounded-[2.5rem] overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-8 md:p-12 space-y-6">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <AlertCircle className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-extrabold font-headline">{t.reportSuspiciousTitle}</h2>
                <p className="text-destructive-foreground/80 font-medium">{t.reportSuspiciousSub}</p>
              </div>
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  <p className="text-sm font-bold">{t.reportWorkersInfo}</p>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  <p className="text-sm font-bold">{t.reportEmployersInfo}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 p-8 md:p-12 flex flex-col justify-center space-y-6 backdrop-blur-md border-l border-white/10">
               <div className="space-y-4">
                  <div className="bg-white p-6 rounded-2xl flex items-center justify-between group cursor-pointer" onClick={() => window.open('https://wa.me/919025404014')}>
                    <div>
                      <p className="text-[10px] font-bold text-destructive uppercase tracking-widest">Immediate Help</p>
                      <p className="text-lg font-extrabold text-primary">{t.whatsappSupport}</p>
                    </div>
                    <MessageCircle className="w-8 h-8 text-green-500 group-hover:scale-110 transition-transform" />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-white/20 p-4 rounded-xl flex items-center gap-3">
                      <HelpCircle className="w-5 h-5" />
                      <p className="text-xs font-bold uppercase tracking-wider">{t.supportHours}</p>
                    </div>
                    <Link href="/support" className="block">
                      <div className="bg-white/20 p-4 rounded-xl flex items-center gap-3 hover:bg-white/30 transition-colors">
                        <ExternalLink className="w-5 h-5" />
                        <p className="text-xs font-bold uppercase tracking-wider">{t.reportLink}</p>
                      </div>
                    </Link>
                  </div>
               </div>
            </div>
          </div>
        </Card>

        {/* The Golden Rule */}
        <div className="bg-muted/50 p-10 md:p-16 rounded-[3rem] text-center space-y-6 border border-dashed relative overflow-hidden">
          <Star className="absolute top-10 right-10 w-20 h-20 text-primary/5 -rotate-12" />
          <Star className="absolute bottom-10 left-10 w-20 h-20 text-primary/5 rotate-12" />
          
          <div className="inline-flex items-center gap-2 bg-primary text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-4">
            <Star className="w-3 h-3 fill-white" /> {t.goldenRuleTitle}
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold font-headline text-primary max-w-3xl mx-auto leading-tight italic">
            "{t.goldenRuleText}"
          </h2>
          <div className="pt-8">
            <Link href="/jobs">
               <Button size="lg" className="bg-primary text-white font-bold h-14 px-12 rounded-2xl shadow-xl shadow-primary/20 text-lg">
                 Browse Verified Jobs Now
               </Button>
            </Link>
          </div>
        </div>

        <div className="text-center text-muted-foreground/30 text-[10px] uppercase tracking-widest font-bold">
          © {new Date().getFullYear()} NexPride.in Trust & Safety Team.
        </div>
      </main>
    </div>
  );
}

// Helper to ensure text isn't empty or missing from translations
function rule1DescFix(desc: string) {
  return desc || "You must ask for a valid Government ID (Aadhaar, Voter ID, etc.) and verify it before confirming any hire.";
}
