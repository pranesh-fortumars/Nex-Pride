"use client";

import { Header } from "@/components/layout/Header";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, ShieldCheck, Scale } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TermsOfServicePage() {
  const { language, t } = useLanguage();
  const router = useRouter();

  const content = {
    English: {
      title: "Terms of Service",
      lastUpdated: "Last Updated: June 2026",
      intro: "Welcome to NexPride. By using our platform, you agree to the following terms.",
      sections: [
        {
          title: "1. Eligibility",
          text: "You must be at least 18 years old to use this service. Job seekers must provide accurate personal information."
        },
        {
          title: "2. User Accounts",
          text: "You are responsible for maintaining the confidentiality of your account and mobile OTP. NexPride is not liable for unauthorized access."
        },
        {
          title: "3. Employer Obligations",
          text: "Employers must post genuine job openings. False advertising or asking for money from job seekers will lead to immediate account termination."
        },
        {
          title: "4. No Placement Fees",
          text: "NexPride is a connecting platform. We do not guarantee jobs and do not charge placement fees to workers."
        }
      ]
    },
    Tamil: {
      title: "சேவை விதிமுறைகள்",
      lastUpdated: "கடைசியாக புதுப்பிக்கப்பட்டது: June 2026",
      intro: "NexPride-க்கு வரவேற்கிறோம். எங்களது தளத்தைப் பயன்படுத்துவதன் மூலம், பின்வரும் விதிமுறைகளை நீங்கள் ஏற்கிறீர்கள்.",
      sections: [
        {
          title: "1. தகுதி",
          text: "இந்த சேவையைப் பயன்படுத்த உங்களுக்கு குறைந்தபட்சம் 18 வயது இருக்க வேண்டும். வேலை தேடுபவர்கள் துல்லியமான தகவல்களை வழங்க வேண்டும்."
        },
        {
          title: "2. பயனர் கணக்குகள்",
          text: "உங்கள் கணக்கு மற்றும் மொபைல் OTP-யை பாதுகாப்பாக வைத்திருப்பது உங்கள் பொறுப்பு. உங்கள் கணக்கின் தவறான பயன்பாட்டிற்கு NexPride பொறுப்பல்ல."
        },
        {
          title: "3. முதலாளிகளின் கடமைகள்",
          text: "நிஜமான வேலை வாய்ப்புகளை மட்டுமே பதிவிட வேண்டும். பொய்யான விளம்பரங்கள் அல்லது வேலைக்காக பணம் கேட்டால் கணக்கு உடனடியாக முடக்கப்படும்."
        },
        {
          title: "4. வேலைக்கான கட்டணம் இல்லை",
          text: "NexPride ஒரு இணைப்புத் தளம் மட்டுமே. நாங்கள் வேலைக்கு உத்தரவாதம் அளிக்க மாட்டோம் மற்றும் தொழிலாளர்களிடம் எந்த கட்டணமும் வசூலிப்பதில்லை."
        }
      ]
    },
    Hindi: {
      title: "सेवा की शर्तें",
      lastUpdated: "अंतिम अद्यतन: June 2026",
      intro: "NexPride में आपका स्वागत है। हमारे प्लेटफ़ॉर्म का उपयोग करके, आप निम्नलिखित शर्तों से सहमत होते हैं।",
      sections: [
        {
          title: "1. पात्रता",
          text: "इस सेवा का उपयोग करने के लिए आपकी आयु कम से कम 18 वर्ष होनी चाहिए। नौकरी चाहने वालों को सटीक व्यक्तिगत जानकारी देनी होगी।"
        },
        {
          title: "2. उपयोगकर्ता खाते",
          text: "अपने खाते और मोबाइल OTP की गोपनीयता बनाए रखना आपकी जिम्मेदारी है। NexPride अनधिकृत पहुंच के लिए उत्तरदायी नहीं है।"
        },
        {
          title: "3. नियोक्ता के दायित्व",
          text: "नियोक्ताओं को वास्तविक नौकरी की रिक्तियां पोस्ट करनी चाहिए। झूठे विज्ञापन या नौकरी चाहने वालों से पैसे मांगने पर खाता तुरंत बंद कर दिया जाएगा।"
        },
        {
          title: "4. कोई प्लेसमेंट शुल्क नहीं",
          text: "NexPride एक कनेक्टिंग प्लेटफॉर्म है। हम नौकरियों की गारंटी नहीं देते हैं और श्रमिकों से प्लेसमेंट शुल्क नहीं लेते हैं।"
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
          <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
            <Scale className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-extrabold font-headline text-primary">{currentContent.title}</h1>
          <p className="text-muted-foreground font-medium">{currentContent.lastUpdated}</p>
        </div>

        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/30 p-8 border-b">
            <CardTitle className="text-xl font-bold flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-primary" /> {currentContent.intro}
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

        <div className="bg-muted/30 p-8 rounded-3xl text-center space-y-4">
          <h4 className="font-bold text-lg">{t.supportTitle}</h4>
          <p className="text-muted-foreground">{t.supportDesc}</p>
          <Link href="/support">
            <Button className="bg-primary text-white font-bold h-11 rounded-xl px-8">{t.contactSupport}</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
