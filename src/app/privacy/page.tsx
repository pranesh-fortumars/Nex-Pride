"use client";

import { Header } from "@/components/layout/Header";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, Eye, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  const { language, t } = useLanguage();
  const router = useRouter();

  const content = {
    English: {
      title: "Privacy Policy",
      lastUpdated: "Last Updated: June 2026",
      intro: "Your privacy is important to us. This policy explains how we collect and use your data.",
      sections: [
        {
          title: "1. Data Collection",
          text: "We collect your phone number, name, and professional details to help you find jobs or workers."
        },
        {
          title: "2. How We Use Data",
          text: "Your contact details are shared only with registered and verified employers/workers when you apply for a job."
        },
        {
          title: "3. Data Security",
          text: "We use standard encryption to protect your information. We do not sell your personal data to third parties."
        },
        {
          title: "4. User Control",
          text: "You can update your profile or delete your account at any time through the platform settings."
        }
      ]
    },
    Tamil: {
      title: "தனியுரிமைக் கொள்கை",
      lastUpdated: "கடைசியாக புதுப்பிக்கப்பட்டது: June 2026",
      intro: "உங்கள் தனியுரிமை எங்களுக்கு முக்கியமானது. உங்கள் தரவை நாங்கள் எவ்வாறு சேகரிக்கிறோம் மற்றும் பயன்படுத்துகிறோம் என்பதை இந்தக் கொள்கை விளக்குகிறது.",
      sections: [
        {
          title: "1. தரவு சேகரிப்பு",
          text: "உங்களுக்கு வேலை அல்லது தொழிலாளர்களைக் கண்டறிய உதவ, உங்கள் தொலைபேசி எண், பெயர் மற்றும் தொழில்முறை விவரங்களை நாங்கள் சேகரிக்கிறோம்."
        },
        {
          title: "2. தரவை எவ்வாறு பயன்படுத்துகிறோம்",
          text: "நீங்கள் ஒரு வேலைக்கு விண்ணப்பிக்கும்போது மட்டுமே உங்கள் தொடர்பு விவரங்கள் பதிவு செய்யப்பட்ட மற்றும் சரிபார்க்கப்பட்ட முதலாளிகளுடன்/தொழிலாளர்களுடன் பகிரப்படும்."
        },
        {
          title: "3. தரவு பாதுகாப்பு",
          text: "உங்கள் தகவலைப் பாதுகாக்க நாங்கள் குறியாக்க முறையைப் பயன்படுத்துகிறோம். உங்கள் தனிப்பட்ட தரவை மூன்றாம் தரப்பினருக்கு நாங்கள் விற்பனை செய்ய மாட்டோம்."
        },
        {
          title: "4. பயனர் கட்டுப்பாடு",
          text: "தளத்தின் அமைப்புகள் மூலம் எந்த நேரத்திலும் உங்கள் சுயவிவரத்தைப் புதுப்பிக்கலாம் அல்லது உங்கள் கணக்கை நீக்கலாம்."
        }
      ]
    },
    Hindi: {
      title: "गोपनीयता नीति",
      lastUpdated: "अंतिम अद्यतन: June 2026",
      intro: "आपकी गोपनीयता हमारे लिए महत्वपूर्ण है। यह नीति बताती है कि हम आपके डेटा को कैसे एकत्र और उपयोग करते हैं।",
      sections: [
        {
          title: "1. डेटा संग्रह",
          text: "नौकरी या श्रमिक खोजने में आपकी मदद करने के लिए हम आपका फोन नंबर, नाम और पेशेवर विवरण एकत्र करते हैं।"
        },
        {
          title: "2. हम डेटा का उपयोग करते हैं",
          text: "जब आप किसी नौकरी के लिए आवेदन करते हैं, तो आपका संपर्क विवरण केवल पंजीकृत और सत्यापित नियोक्ताओं/श्रमिकों के साथ साझा किया जाता है।"
        },
        {
          title: "3. डेटा सुरक्षा",
          text: "हम आपकी जानकारी की सुरक्षा के लिए एन्क्रिप्शन का उपयोग करते हैं। हम आपका व्यक्तिगत डेटा तीसरे पक्ष को नहीं बेचते हैं।"
        },
        {
          title: "4. उपयोगकर्ता नियंत्रण",
          text: "आप किसी भी समय प्लेटफ़ॉर्म सेटिंग्स के माध्यम से अपनी प्रोफ़ाइल अपडेट कर सकते हैं या अपना खाता हटा सकते हैं।"
        }
      ]
    }
  };

  const currentContent = content[language as keyof typeof content] || content.English;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-grow p-4 md:p-8 max-w-4xl mx-auto w-full space-y-8">
        <Button variant="ghost" onClick={() => router.back()} className="font-bold text-primary gap-2">
          <ArrowLeft className="w-4 h-4" /> {t.backToPrev}
        </Button>

        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-accent/5 rounded-full flex items-center justify-center mx-auto mb-4 text-accent">
            <Lock className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-extrabold font-headline text-primary">{currentContent.title}</h1>
          <p className="text-muted-foreground font-medium">{currentContent.lastUpdated}</p>
        </div>

        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/30 p-8 border-b">
            <CardTitle className="text-xl font-bold flex items-center gap-3">
              <Eye className="w-6 h-6 text-accent" /> {currentContent.intro}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-10">
            {currentContent.sections.map((section, idx) => (
              <div key={idx} className="space-y-3">
                <h3 className="text-xl font-bold text-primary">{section.title}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">{section.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="bg-primary/5 p-8 rounded-3xl flex items-start gap-4 border border-primary/10">
          <ShieldAlert className="w-12 h-12 text-primary shrink-0" />
          <div className="space-y-2">
            <h4 className="font-bold text-primary">Your trust is our priority.</h4>
            <p className="text-sm text-muted-foreground font-medium">
              We focus on connecting diverse talent with inclusive workplaces safely. Your data is never used for advertising or spam. Need help? <Link href="/support" className="text-primary underline">Contact Support</Link>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
