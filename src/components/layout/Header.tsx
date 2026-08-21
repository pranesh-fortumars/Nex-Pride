"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  UserCircle, Menu, Globe, ChevronDown, LayoutDashboard, 
  Search, Home, LogOut, Settings, User as UserIcon, Heart, X 
} from "lucide-react";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { LanguageKey } from "@/lib/translations";
import { UserRole } from "@/lib/types";
import { usePathname, useRouter } from "next/navigation";
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { cn } from "@/lib/utils";
import NotificationBell from "@/components/NotificationBell";

export function Header() {
  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const auth = useAuth();
  
  const [userRole, setUserRole] = useState<UserRole>('job_seeker');
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 10);
      // Hide when scrolling down past 80px, show when scrolling up
      if (currentY > 80) {
        setHidden(currentY > lastY);
      } else {
        setHidden(false);
      }
      lastY = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const savedRole = localStorage.getItem('sim_user_role') as UserRole;
    if (savedRole) {
      setUserRole(savedRole);
    } else {
      if (pathname.includes('/admin/')) setUserRole('admin');
      else if (pathname.includes('/employer/')) setUserRole('employer');
      else setUserRole('job_seeker');
    }
  }, [pathname, user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('sim_is_logged_in');
      localStorage.removeItem('sim_user_role');
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const getDashboardLink = () => {
    if (userRole === 'admin') return '/admin/dashboard';
    if (userRole === 'employer') return '/employer/dashboard';
    return '/seeker/dashboard';
  };

  const getProfileLink = () => {
    if (userRole === 'employer') return '/employer/profile';
    if (userRole === 'job_seeker') return '/seeker/profile';
    return getDashboardLink();
  };

  const isLoggedIn = !!user;
  const showEmployerOptions = isLoggedIn && userRole === 'employer';

  const navLinks = [
    { href: '/jobs', label: t.findJobs },
    ...(showEmployerOptions ? [
      { href: '/employer/post-job', label: t.hireTalent },
    ] : []),
  ];

  const isHomePage = pathname === '/';

  return (
    <>
      {!isHomePage && <div className="h-[80px] w-full shrink-0 pointer-events-none" aria-hidden="true" />}
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 pt-3 pointer-events-none transition-transform duration-300 ease-in-out",
          hidden ? "-translate-y-[110%]" : "translate-y-0"
        )}
      >
      <header className={cn(
        "pointer-events-auto w-full max-w-7xl mx-auto transition-all duration-300 rounded-2xl border",
        scrolled
          ? "backdrop-blur-xl bg-white/90 border-violet-200/60 shadow-[0_8px_32px_rgba(124,58,237,0.15),0_2px_8px_rgba(124,58,237,0.08)]"
          : "backdrop-blur-md bg-white/60 border-white/40 shadow-[0_4px_24px_rgba(124,58,237,0.08)]"
      )}>
      <div className="flex h-14 items-center justify-between px-4 sm:px-5">
        
        {/* Logo + Nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-all duration-200 clay-icon">
              <Heart className="text-violet-600 fill-violet-600" style={{width:'18px',height:'18px'}} />
            </div>
            <span className="text-xl font-black tracking-tight">
              <span className="text-slate-900">Nex</span><span className="text-violet-600">Pride</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm font-semibold">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all duration-150 relative group",
                  pathname === link.href
                    ? "text-violet-600 bg-violet-50"
                    : "text-slate-600 hover:text-violet-600 hover:bg-violet-50/60"
                )}
              >
                {navLinks.find(l => l.href === link.href)?.label}
                {pathname === link.href && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-violet-600 rounded-full" />
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Language switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hidden md:flex items-center gap-1.5 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg font-semibold transition-all">
                <Globe className="w-4 h-4" />
                <span className="text-xs">{language === 'Tamil' ? 'தமிழ்' : language === 'Hindi' ? 'हिन्दी' : 'EN'}</span>
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl p-1 shadow-lg border-violet-100 min-w-[140px]">
              <DropdownMenuItem onClick={() => setLanguage('English')} className="rounded-lg font-semibold text-sm cursor-pointer">🇬🇧 English</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('Tamil')} className="rounded-lg font-semibold text-sm cursor-pointer">🇮🇳 தமிழ்</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('Hindi')} className="rounded-lg font-semibold text-sm cursor-pointer">🇮🇳 हिन्दी</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Auth */}
          {isLoggedIn ? (
            <div className="flex items-center gap-1">
              <NotificationBell userId={user?.uid} />
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 p-0 hover:bg-violet-50 transition-all ring-2 ring-transparent hover:ring-violet-200">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    <UserCircle className="w-5 h-5" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-xl shadow-xl border-violet-100">
                <div className="px-3 py-2 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                  {userRole === 'admin' ? '⚡ ' + t.admin : userRole === 'employer' ? '🏢 ' + t.employer : '👤 ' + t.member}
                </div>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem onClick={() => router.push(getDashboardLink())} className="rounded-lg font-semibold text-sm gap-2 cursor-pointer">
                  <LayoutDashboard className="w-4 h-4 text-violet-600" /> {t.dashboard}
                </DropdownMenuItem>
                {userRole !== 'admin' && (
                  <DropdownMenuItem onClick={() => router.push(getProfileLink())} className="rounded-lg font-semibold text-sm gap-2 cursor-pointer">
                    <UserIcon className="w-4 h-4 text-violet-600" /> {t.profile}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => router.push('/settings')} className="rounded-lg font-semibold text-sm gap-2 cursor-pointer">
                  <Settings className="w-4 h-4 text-violet-600" /> {t.settings}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem className="text-red-500 hover:bg-red-50 rounded-lg font-semibold text-sm gap-2 cursor-pointer" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" /> {t.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login" className="hidden md:flex">
                <Button className="clay-card bg-white hover:bg-violet-50 text-slate-700 transition-all text-xs font-bold h-9 px-4 rounded-full border border-slate-200 flex items-center justify-center shadow-sm">
                  {t.loginBtn}
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button className="bg-violet-600 hover:bg-violet-700 text-white font-black h-8 md:h-9 px-3 md:px-5 rounded-full transition-all duration-200 text-[10px] md:text-xs clay-btn whitespace-nowrap">
                  {t.joinFree}
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 hover:bg-violet-50 rounded-lg transition-all">
                <Menu className="h-5 w-5 text-slate-600" />
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="w-full p-0 border-none shadow-2xl rounded-b-[2rem] overflow-hidden clay-card">
              <div className="flex flex-col bg-white py-6 px-4 max-h-[90vh] overflow-y-auto overscroll-contain">
                <SheetHeader className="pb-4 border-b border-slate-100 text-left flex flex-row items-center justify-between">
                  <SheetTitle className="font-extrabold text-lg flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
                      <Heart className="w-4 h-4 text-white fill-white" />
                    </div>
                    <span><span className="text-slate-900 font-black">Nex</span><span className="text-violet-600 font-black">Pride</span></span>
                  </SheetTitle>
                </SheetHeader>
                
                <div className="flex flex-col gap-4 py-6">
                  <SheetClose asChild>
                    <Link href="/" className={cn("flex items-center gap-3 p-2 rounded-xl font-semibold text-sm transition-all", pathname === '/' ? 'text-violet-600' : 'text-slate-700 hover:text-violet-600')}>
                      <Home className="w-4 h-4" /> {t.home}
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/jobs" className={cn("flex items-center gap-3 p-2 rounded-xl font-semibold text-sm transition-all", pathname === '/jobs' ? 'text-violet-600' : 'text-slate-700 hover:text-violet-600')}>
                      <Search className="w-4 h-4" /> {t.findJobs}
                    </Link>
                  </SheetClose>
                  {isLoggedIn && (
                    <>
                      <SheetClose asChild>
                        <Link href={getDashboardLink()} className="flex items-center gap-3 p-2 rounded-xl font-semibold text-sm text-slate-700 hover:text-violet-600 transition-all">
                          <LayoutDashboard className="w-4 h-4 text-violet-600" /> {t.dashboard}
                        </Link>
                      </SheetClose>
                      {userRole !== 'admin' && (
                        <SheetClose asChild>
                          <Link href={getProfileLink()} className="flex items-center gap-3 p-2 rounded-xl font-semibold text-sm text-slate-700 hover:text-violet-600 transition-all">
                            <UserIcon className="w-4 h-4 text-violet-600" /> {t.profile}
                          </Link>
                        </SheetClose>
                      )}
                    </>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3">{t.languageLabel}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['English', 'Tamil', 'Hindi'] as LanguageKey[]).map(lang => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={cn(
                          "text-xs font-bold p-2 rounded-lg border transition-all",
                          language === lang ? 'bg-violet-50 border-violet-200 text-violet-600' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        )}
                      >
                        {lang === 'Tamil' ? 'தமிழ்' : lang === 'Hindi' ? 'हिन्दी' : 'English'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2">
                  {!isLoggedIn ? (
                    <SheetClose asChild>
                      <Link href="/auth/login" className="block w-full">
                        <Button className="w-full bg-violet-600 hover:bg-violet-700 font-bold h-11 rounded-xl text-white shadow-sm transition-all">
                          {t.loginMobileBtn}
                        </Button>
                      </Link>
                    </SheetClose>
                  ) : (
                    <Button variant="ghost" className="w-full text-red-500 font-bold h-11 hover:bg-red-50 rounded-xl transition-all justify-start" onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" /> {t.logout}
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
    </div>
    </>
  );
}