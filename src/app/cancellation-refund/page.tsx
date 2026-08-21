"use client";

import { Header } from "@/components/layout/Header";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, ShieldAlert, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CancellationRefundPage() {
  const { language, t } = useLanguage();
  const router = useRouter();

  const content = {
    English: {
      title: "Cancellation & Refunds",
      lastUpdated: "Last Updated: June 2026",
      intro: "Our policy regarding cancellations and refunds for premium hiring packs.",
      sections: [
        {
          title: "1. Job Credits",
          text: "Hiring packs purchased on NexPride.in provide job credits that never expire. Once a credit is used to publish a job, it cannot be refunded or cancelled."
        },
        {
          title: "2. Eligibility for Refund",
          text: "Refunds are only eligible if a technical error occurred during the transaction or if a plan was purchased but no credits from that plan have been used yet."
        },
        {
          title: "3. Refund Process",
          text: "Eligible refunds are processed back to the original payment source via Razorpay within 5-7 business days."
        },
        {
          title: "4. Policy for Workers",
          text: "Since our platform is 100% free for workers and staff seekers, there are no payment transactions or refund policies applicable to them."
        }
      ]
    },
    Tamil: {
      title: "ரத்து மற்றும் ரீஃபண்ட்",
      lastUpdated: "கடைசியாக புதுப்பிக்கப்பட்டது: June 2026",
      intro: "பிரீமியம் ஹையரிங் பேக்குகளுக்கான ரத்து மற்றும் பணத்தைத் திரும்பப் பெறுதல் (ரீஃபண்ட்) கொள்கை.",
      sections: [
        {
          title: "1. வேலை கிரெடிட்கள்",
          text: "NexPride.in இல் வாங்கப்பட்ட ஹையரிங் பேக்குகள் காலாவதியாகாத வேலை கிரெடிட்களை வழங்குகின்றன. ஒரு வேலைப் பதிவை வெளியிட ஒரு கிரெடிட் பயன்படுத்தப்பட்டால், அதை ரத்து செய்யவோ அல்லது பணத்தைத் திரும்பப் பெறவோ முடியாது."
        },
        {
          title: "2. ரீஃபண்ட் தகுதி",
          text: "பணப்பரிமாற்றத்தின் போது தொழில்நுட்ப கோளாறு ஏற்பட்டாலோ அல்லது ஒரு திட்டம் வாங்கப்பட்டு அதில் இருந்து எந்த கிரெடிட்களும் பயன்படுத்தப்படாமல் இருந்தாலோ மட்டுமே ரீஃபண்ட் வழங்கப்படும்."
        },
        {
          title: "3. ரீஃபண்ட் செயல்முறை",
          text: "தகுதியுள்ள ரீஃபண்ட் கோரிக்கைகள் 5-7 வேலை நாட்களுக்குள் ரேஸர்பே (Razorpay) வழியாக உங்கள் வங்கிக் கணக்கிற்குத் திருப்பி அனுப்பப்படும்."
        },
        {
          title: "4. தொழிலாளர்களுக்கான கொள்கை",
          text: "எங்கள் தளம் தொழிலாளர்கள் மற்றும் நிர்வாகப் பணியாளர்களுக்கு 100% இலவசம் என்பதால், அவர்களுக்கு எந்தவொரு கட்டணப் பரிமாற்றமும் ரீஃபண்ட் கொள்கைகளும் பொருந்தாது."
        }
      ]
    },
    Hindi: {
      title: "रद्द करना और धनवापसी",
      lastUpdated: "अंतिम अद्यतन: June 2026",
      intro: "प्रीमियम हायरिंग पैक के लिए रद्दीकरण और धनवापसी (रिफंड) के संबंध में हमारी नीति।",
      sections: [
        {
          title: "1. जॉब क्रेडिट",
          text: "NexPride.in पर खरीदे गए हायरिंग पैक जॉब क्रेडिट प्रदान करते हैं जो कभी समाप्त नहीं होते हैं। एक बार जब किसी नौकरी को प्रकाशित करने के लिए क्रेडिट का उपयोग कर लिया जाता है, तो उसे वापस या रद्द नहीं किया जा सकता है।"
        },
        {
          title: "2. धनवापसी के लिए पात्रता",
          text: "धनवापसी केवल तभी संभव है जब लेनदेन के दौरान कोई तकनीकी त्रुटि हुई हो या यदि कोई प्लान खरीदा गया हो लेकिन उस प्लान का कोई भी क्रेडिट अभी तक उपयोग नहीं किया गया हो।"
        },
        {
          title: "3. धनवापसी प्रक्रिया",
          text: "पात्र धनवापसी 5-7 कार्य दिवसों के भीतर Razorpay के माध्यम से मूल भुगतान स्रोत पर वापस भेज दी जाती है।"
        },
        {
          title: "4. श्रमिकों के लिए नीति",
          text: "चूंकि हमारा प्लेटफॉर्म श्रमिकों और स्टाफ चाहने वालों के लिए 100% मुफ्त है, इसलिए उन पर कोई भुगतान लेनदेन या धनवापसी नीतियां लागू नहीं होती हैं।"
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
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600">
            <RefreshCw className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-extrabold font-headline text-primary">{currentContent.title}</h1>
          <p className="text-muted-foreground font-medium">{currentContent.lastUpdated}</p>
        </div>

        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/30 p-8 border-b">
            <CardTitle className="text-xl font-bold flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-amber-600" /> {currentContent.intro}
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
            <h4 className="font-bold text-primary">Need a refund?</h4>
            <p className="text-sm text-muted-foreground font-medium">
              If you believe you are eligible for a refund due to a technical error, please contact our support team with your Order ID. <Link href="/support" className="text-primary underline">Contact Support</Link>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
