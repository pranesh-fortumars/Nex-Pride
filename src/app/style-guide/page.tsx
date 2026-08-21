"use client";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Palette, Type, Square, MousePointer2, CreditCard, CheckCircle2 } from "lucide-react";

export default function StyleGuidePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-grow p-4 md:p-12 max-w-5xl mx-auto w-full space-y-16">
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold font-headline text-primary">Design System & Assets</h1>
          <p className="text-xl text-muted-foreground">The visual foundation for NexTirupur.in - clean, professional, and accessible.</p>
        </div>

        {/* Typography Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-primary">
            <Type className="w-6 h-6" />
            <h2 className="text-2xl font-bold font-headline">Typography</h2>
          </div>
          <Separator />
          <div className="grid gap-8">
            <div className="space-y-2">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Headline Font (Inter Bold/ExtraBold)</p>
              <h1 className="text-5xl font-extrabold font-headline">The quick brown fox jumps over the lazy dog.</h1>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Body Font (Inter Regular)</p>
              <p className="text-lg leading-relaxed">
                NexTirupur is built using the Inter font family. It is designed for high legibility and a modern aesthetic, making it perfect for both industrial dashboards and consumer job feeds.
              </p>
            </div>
          </div>
        </section>

        {/* Colors Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-primary">
            <Palette className="w-6 h-6" />
            <h2 className="text-2xl font-bold font-headline">Color Palette</h2>
          </div>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <ColorCard name="Primary Blue" hex="#0F52BA" variable="--primary" bg="bg-primary" text="text-white" />
            <ColorCard name="Accent Blue" hex="#0EA5E9" variable="--accent" bg="bg-accent" text="text-white" />
            <ColorCard name="Background" hex="#FFFFFF" variable="--background" bg="bg-white" text="text-black" border />
            <ColorCard name="Secondary" hex="#F1F5F9" variable="--secondary" bg="bg-secondary" text="text-black" />
          </div>
        </section>

        {/* Buttons Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-primary">
            <MousePointer2 className="w-6 h-6" />
            <h2 className="text-2xl font-bold font-headline">Button Components</h2>
          </div>
          <Separator />
          <div className="flex flex-wrap gap-4 items-center">
            <Button variant="default" size="lg">Primary Action</Button>
            <Button variant="outline" size="lg">Secondary Action</Button>
            <Button variant="secondary" size="lg">Muted Action</Button>
            <Button variant="default" size="lg" className="bg-accent text-white hover:bg-accent/90">Accent Action</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="link">Link Style</Button>
          </div>
        </section>

        {/* Cards Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-primary">
            <CreditCard className="w-6 h-6" />
            <h2 className="text-2xl font-bold font-headline">Card Patterns</h2>
          </div>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-l-4 border-primary">
              <CardHeader>
                <CardTitle className="font-headline">Standard Container</CardTitle>
                <CardDescription>Used for dashboard widgets and job listings.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">This is a standard card component with a primary blue left border for visual emphasis.</p>
              </CardContent>
            </Card>

            <Card className="bg-primary text-white">
              <CardHeader>
                <CardTitle className="font-headline text-white">Emphasis Card</CardTitle>
                <CardDescription className="text-primary-foreground/80">Great for call-to-actions.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="bg-white text-primary hover:bg-white/90 font-bold w-full">Apply Now</Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Inputs & Badges Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-primary">
            <Square className="w-6 h-6" />
            <h2 className="text-2xl font-bold font-headline">UI Elements</h2>
          </div>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <Label className="font-bold">Form Input</Label>
              <Input placeholder="Enter your mobile number..." className="h-12 border-primary/20" />
              <p className="text-xs text-muted-foreground italic">Standard input with 0.75rem border radius.</p>
            </div>
            <div className="space-y-4">
              <Label className="font-bold">Status Badges</Label>
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline" className="border-primary text-primary">Verified</Badge>
                <Badge className="bg-green-500 hover:bg-green-600">Success</Badge>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-muted p-8 rounded-3xl text-center space-y-4 border">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold font-headline">Ready for Deployment</h2>
          <p className="text-muted-foreground max-w-md mx-auto">This template ensures consistency across the entire NexTirupur platform.</p>
        </section>
      </main>
    </div>
  );
}

function ColorCard({ name, hex, variable, bg, text, border = false }: { name: string, hex: string, variable: string, bg: string, text: string, border?: boolean }) {
  return (
    <div className={`p-4 rounded-xl border ${border ? 'border-border' : 'border-transparent'} flex flex-col gap-4 shadow-sm`}>
      <div className={`w-full h-24 rounded-lg ${bg} shadow-inner`} />
      <div>
        <h4 className="font-bold text-sm">{name}</h4>
        <p className="text-xs font-mono text-muted-foreground">{hex}</p>
        <p className="text-[10px] font-mono text-muted-foreground/60">{variable}</p>
      </div>
    </div>
  );
}
