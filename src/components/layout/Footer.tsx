"use client";

import Link from "next/link";
import { Heart, Linkedin, Twitter, Instagram, Youtube } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

const SOCIALS = [
  { href: "https://linkedin.com", label: "LinkedIn", icon: <Linkedin className="w-4 h-4" /> },
  { href: "https://twitter.com", label: "Twitter / X", icon: <Twitter className="w-4 h-4" /> },
  { href: "https://instagram.com", label: "Instagram", icon: <Instagram className="w-4 h-4" /> },
  { href: "https://youtube.com", label: "YouTube", icon: <Youtube className="w-4 h-4" /> },
];

export function Footer() {
  const { t } = useLanguage();

  const QUICK_LINKS = [
    { href: "/", label: t.aboutUs },
    { href: "/support", label: t.supportHelp },
  ];

  const LEGAL_LINKS = [
    { href: "/privacy", label: t.privacyPolicyLink },
    { href: "/terms", label: t.termsOfServiceLink },
    { href: "/safety", label: t.safetyLink },
  ];

  return (
    <footer
      className="relative mt-8 border-t border-violet-100/60"
      style={{ background: "linear-gradient(180deg, #f9f7ff 0%, #f3eeff 100%)" }}
    >
      {/* Rainbow top accent line */}
      <div
        className="h-[3px] w-full"
        style={{
          background:
            "linear-gradient(90deg, #ff6b6b, #ffa500, #ffdd00, #4ade80, #3b82f6, #a855f7, #ec4899)",
        }}
      />

      <div className="max-w-5xl mx-auto px-6 py-6 md:py-8">
        {/* Top section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 md:gap-10 mb-6 md:mb-8">

          {/* Brand */}
          <div className="flex-shrink-0 md:w-1/3">
            <Link href="/" className="flex items-center gap-2 mb-3 group w-fit">
              <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center shadow group-hover:scale-105 transition-transform">
                <Heart className="text-white fill-white w-4 h-4" />
              </div>
              <span className="text-lg font-black tracking-tight">
                <span className="text-slate-900">Nex</span>
                <span className="text-violet-600">Pride</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 font-medium mb-5 leading-relaxed">
              Inclusive careers for everyone.
            </p>
            {/* Social icons */}
            <div className="flex gap-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  title={s.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-xl bg-white border border-violet-100 flex items-center justify-center text-violet-500 hover:bg-violet-600 hover:text-white hover:-translate-y-0.5 transition-all duration-200 shadow-sm"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Divider (mobile) */}
          <div className="h-px bg-violet-100 md:hidden" />

          {/* Links grid */}
          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-6 md:gap-16 md:w-2/3 md:justify-end">
            {/* Quick Links */}
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
                {t.quickLinks}
              </p>
              <ul className="space-y-2">
                {QUICK_LINKS.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-slate-600 hover:text-violet-600 font-medium transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
                {t.legalLinks}
              </p>
              <ul className="space-y-2">
                {LEGAL_LINKS.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-slate-600 hover:text-violet-600 font-medium transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-violet-200 to-transparent mb-4" />

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400 font-medium">
            © 2026 NexPride. All rights reserved.
          </p>
          <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
            Built with{" "}
            <Heart className="inline w-3 h-3 text-violet-500 fill-violet-500" />
            {" "}pride for the community.
          </p>
        </div>
      </div>
    </footer>
  );
}
