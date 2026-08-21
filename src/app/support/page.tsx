"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle2, 
  ArrowLeft,
  Headphones,
  ExternalLink
} from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";

export default function SupportPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  
  const db = useFirestore();
  const { data: supportConfig } = useDoc<any>(doc(db, "SystemConfig", "supportConfig"));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      toast({
        title: t.messageSent,
        description: t.messageSentDesc,
      });
    }, 1500);
  };

  const contactMethods = [
    {
      title: t.chatOnWhatsapp,
      desc: t.supportChatDesc,
      icon: <MessageCircle className="w-10 h-10 text-green-500" />,
      action: t.chatNow,
      link: "https://wa.me/919025404014",
      color: "bg-green-50"
    },
    {
      title: t.callUsNow,
      desc: t.supportCallDesc,
      icon: <Phone className="w-10 h-10 text-blue-500" />,
      action: t.callNum,
      link: "tel:+919025404014",
      color: "bg-blue-50"
    },
    {
      title: t.emailUs,
      desc: t.supportEmailDesc,
      icon: <Mail className="w-10 h-10 text-amber-500" />,
      action: "support@nexpride.in",
      link: "mailto:support@nexpride.in",
      color: "bg-amber-50"
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-grow p-4 md:p-8 max-w-6xl mx-auto w-full space-y-12">
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => router.back()} className="font-bold text-primary gap-2 hover:bg-primary/5 rounded-xl">
            <ArrowLeft className="w-4 h-4" /> {t.backToPrev}
          </Button>
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary shadow-inner">
              <Headphones className="w-12 h-12" />
            </div>
            <h1 className="text-4xl font-extrabold font-headline text-primary leading-tight">{t.supportPageTitle}</h1>
            <p className="text-xl text-muted-foreground font-medium">{t.supportSub}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {contactMethods.map((method, idx) => (
            <Card key={idx} className="flex flex-col h-full border-none shadow-lg overflow-hidden group hover:scale-[1.02] transition-all duration-300">
              <CardHeader className={`${method.color} pb-8 flex-grow flex flex-col items-start`}>
                <div className="mb-6 bg-white/60 p-3 rounded-2xl shadow-sm">{method.icon}</div>
                <CardTitle className="font-headline text-2xl mb-2">{method.title}</CardTitle>
                <CardDescription className="font-bold text-foreground/70 text-base leading-snug">{method.desc}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 bg-white mt-auto">
                <a href={method.link} target="_blank" rel="noopener noreferrer" className="block">
                  <Button className="w-full bg-white text-primary border-primary border-2 hover:bg-primary hover:text-white font-bold h-12 rounded-xl group-hover:shadow-md transition-all">
                    {method.action} <ExternalLink className="ml-2 w-4 h-4" />
                  </Button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8">
          <Card className="rounded-3xl shadow-xl border-none overflow-hidden h-full flex flex-col">
            <CardHeader className="bg-primary text-white p-8">
              <CardTitle className="text-2xl font-bold font-headline">{t.contactFormTitle}</CardTitle>
              <CardDescription className="text-primary-foreground/80 font-medium">
                {t.contactFormSub}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 flex-grow">
              {sent ? (
                <div className="text-center py-12 space-y-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold">{t.messageSent}</h3>
                    <p className="text-muted-foreground font-medium">{t.messageSentDesc}</p>
                  </div>
                  <Button variant="outline" onClick={() => setSent(false)} className="rounded-xl font-bold">Send Another Message</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="font-bold">{t.fullNameLabel}</Label>
                      <Input id="name" placeholder={t.fullNamePlaceholder} required className="h-12 rounded-xl border-primary/10" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="font-bold">{t.mobileNumber}</Label>
                      <Input id="phone" placeholder={t.mobilePlaceholder} required className="h-12 rounded-xl border-primary/10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="font-bold">{t.subjectLabel}</Label>
                    <Input id="subject" placeholder="e.g. Account Verification Issue" required className="h-12 rounded-xl border-primary/10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message" className="font-bold">{t.messageLabel}</Label>
                    <Textarea id="message" placeholder="Describe your issue in detail..." required className="min-h-[150px] rounded-xl border-primary/10" />
                  </div>
                  <Button disabled={sending} type="submit" className="w-full h-14 bg-primary text-white text-lg font-bold rounded-xl shadow-lg shadow-primary/20">
                    {sending ? "Sending..." : t.sendMessage} <Send className="ml-2 w-5 h-5" />
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-8">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold font-headline text-primary">Regional Presence</h2>
              <div className="grid gap-6">
                <div className="flex gap-4 p-6 bg-muted/30 rounded-2xl border border-dashed border-primary/20">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0 border border-primary/10">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{t.officeAddress}</h4>
                    {supportConfig?.officeAddress ? (
                      <p className="text-muted-foreground font-medium mt-1 leading-relaxed whitespace-pre-line">
                        {supportConfig.officeAddress}
                      </p>
                    ) : (
                      <p className="text-muted-foreground font-medium mt-1 leading-relaxed">
                        NexPride.in Hub,<br />
                        Opp. Old Bus Stand, Avinashi Road,<br />
                        Tirupur, Tamil Nadu - 641601
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 p-6 bg-muted/30 rounded-2xl border border-dashed border-primary/20">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0 border border-primary/10">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{t.officeHours}</h4>
                    <p className="text-muted-foreground font-medium mt-1 whitespace-pre-line">
                      {supportConfig?.officeHours || t.officeHoursVal}
                    </p>
                    <p className="text-xs text-primary font-bold mt-2 uppercase tracking-wider">Fastest response during these hours</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-accent/5 p-8 rounded-3xl border border-accent/20 space-y-4 mt-auto">
              <h4 className="font-bold text-lg text-accent flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> {t.verifiedSupportTitle}
              </h4>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                {t.verifiedSupportDesc}
              </p>
              <Link href="/safety">
                <Button variant="link" className="p-0 h-auto font-bold text-accent hover:no-underline">{t.readSafetyGuide} <ArrowLeft className="ml-2 w-4 h-4 rotate-180" /></Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center text-muted-foreground/30 text-[10px] uppercase tracking-widest font-bold pt-8">
          © {new Date().getFullYear()} NexPride.in. All rights reserved.
        </div>
      </main>
    </div>
  );
}
