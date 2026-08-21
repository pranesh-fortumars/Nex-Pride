
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Heart } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Global Branded Splash Overlay */}
      <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center animate-out fade-out duration-500 fill-mode-forwards pointer-events-none">
        <div className="flex flex-col items-center gap-6">
          <div className="w-40 h-40 bg-primary/5 rounded-[2.5rem] flex items-center justify-center shadow-inner animate-pulse">
            <Heart className="w-20 h-20 text-primary fill-primary" />
          </div>
          <div className="space-y-1 text-center">
            <h1 className="text-3xl font-bold text-primary tracking-tight font-headline">NexPride.in</h1>
            <p className="text-[12px] text-muted-foreground uppercase font-bold tracking-[0.3em] animate-pulse">Connecting Diverse Talent...</p>
          </div>
        </div>
      </div>

      {/* Header Skeleton */}
      <div className="border-b h-16 w-full flex items-center px-4 md:px-8 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <Skeleton className="h-6 w-32 hidden sm:block" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>
      </div>

      <main className="flex-grow">
        <div className="bg-primary/5 py-12 px-4 md:py-20">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-12 w-3/4 mx-auto md:mx-0" />
            <Skeleton className="h-6 w-1/2 mx-auto md:mx-0" />
            <div className="mt-8 flex flex-col md:flex-row gap-4 max-w-2xl bg-white p-3 rounded-2xl shadow-lg border border-primary/10">
              <Skeleton className="h-14 flex-1 rounded-xl" />
              <Skeleton className="h-14 flex-1 rounded-xl" />
              <Skeleton className="h-14 w-full md:w-32 rounded-xl" />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border border-border/50 rounded-2xl p-6 space-y-6 shadow-sm bg-white">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-4/5 rounded-md" />
                    <Skeleton className="h-4 w-1/2 rounded-md" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center gap-2"><Skeleton className="h-4 w-4 rounded-full" /><Skeleton className="h-3 w-full rounded-md" /></div>
                  <div className="flex items-center gap-2"><Skeleton className="h-4 w-4 rounded-full" /><Skeleton className="h-3 w-full rounded-md" /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
