
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { FirebaseClientProvider } from "@/firebase";
import { NavigationCleanup } from "@/components/layout/NavigationCleanup";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: 'NexPride.in | Inclusive Careers for All Identities',
  description: 'India\'s premiere job platform for the LGBTQ+ and Transgender community. Connecting diverse talent with verified inclusive workplaces.',
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
  }
};

export default function RootLayer({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen bg-background text-foreground overflow-x-hidden flex flex-col">
        <FirebaseClientProvider>
          <LanguageProvider>
            <NavigationCleanup />
            <div className="flex-1 flex flex-col">
              {children}
            </div>
            <Footer />
            <Toaster />
          </LanguageProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
