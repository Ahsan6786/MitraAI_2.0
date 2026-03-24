
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookHeart, MessageSquare, MicVocal, ShieldCheck, LogOut, FileText, Puzzle, Phone, LayoutDashboard, Info, HeartPulse, Sparkles, Trophy, Newspaper, User, Users, Star, Camera, UserCheck, CalendarPlus, CalendarClock, Menu, LandPlot, Smile, ChevronDown, Stethoscope, PenSquare, UserPlus, ArrowRight, Coins, Palette, Code, Wand2 } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { ChatHistoryProvider } from '@/hooks/use-chat-history';
import { GenZToggle } from '@/components/genz-toggle';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Sheet } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUsageTracker } from '@/hooks/use-usage-tracker';
import TimeUpScreen from '@/components/time-up-screen';
import UsageTracker from '@/components/usage-tracker';
import { ThemeToggle } from '@/components/theme-toggle';

const ADMIN_EMAIL = 'ahsan.khan@mitwpu.edu.in';

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();
  const sidebar = useSidebar();
  const [userType, setUserType] = useState<'user' | 'admin' | 'counsellor' | null>(null);
  const [showFeatureHint, setShowFeatureHint] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [userTokens, setUserTokens] = useState<number | null>(null);
  const isMobile = useIsMobile();
  const { usage, timeLimitExceeded } = useUsageTracker();

  const professionalHelpPaths = ['/reports', '/booking', '/my-appointments', '/screening-tools'];
  const isProfessionalHelpActive = professionalHelpPaths.some(p => pathname.startsWith(p));
  const [isProfessionalHelpOpen, setIsProfessionalHelpOpen] = useState(isProfessionalHelpActive);

  const emotionsDiaryPaths = ['/journal', '/live-mood'];
  const isEmotionsDiaryActive = emotionsDiaryPaths.some(p => pathname.startsWith(p));
  const [isEmotionsDiaryOpen, setIsEmotionsDiaryOpen] = useState(isEmotionsDiaryActive);


  useEffect(() => {
    setIsProfessionalHelpOpen(isProfessionalHelpActive);
    setIsEmotionsDiaryOpen(isEmotionsDiaryActive);
  }, [isProfessionalHelpActive, isEmotionsDiaryActive]);

  // Effect for the feature hint animation
  useEffect(() => {
    const hasSeenFeatureHint = sessionStorage.getItem('hasSeenFeatureHint');
    if (!hasSeenFeatureHint && !isMobile) {
      const timer = setTimeout(() => {
        setShowFeatureHint(true);
      }, 2000); // Show after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [isMobile]);


  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          setUserTokens(doc.data().tokens);
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleHintClick = () => {
    sessionStorage.setItem('hasSeenFeatureHint', 'true');
    setShowFeatureHint(false);
    sidebar?.setOpenMobile(true);
  };

  useEffect(() => {
    if (!loading && user) {
      const checkUserType = async () => {
        if (user.email === ADMIN_EMAIL) {
          setUserType('admin');
          return;
        }
        const counsellorDoc = await getDoc(doc(db, 'counsellors', user.uid));
        if (counsellorDoc.exists() && counsellorDoc.data().status === 'approved') {
          setUserType('counsellor');
          return;
        }
        setUserType('user');
      };
      checkUserType();
    }
  }, [user, loading, router, pathname]);

  const handleSignOut = async () => {
    await signOut(auth);
    // Redirect to the appropriate sign-in page
    if (pathname.startsWith('/counsellor')) {
      router.push('/counsellor-signin');
    } else {
      router.push('/signin');
    }
  };

  const handleLinkClick = () => {
    if (sidebar?.openMobile) {
      sidebar.setOpenMobile(false);
    }
  };


  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading application...</div>
      </div>
    );
  }

  if (timeLimitExceeded) {
    return <TimeUpScreen />;
  }

  const userDisplayName = user.displayName || user.email;
  const userAvatarFallback = user.displayName?.[0] || user.email?.[0] || 'U';


  return (
    <>
      <Sidebar className="border-r border-border/40 bg-sidebar/40 backdrop-blur-3xl overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-[80px]" />
        </div>
        <SidebarHeader className="border-b border-border/20 pb-6 mb-2 relative z-10 px-4 pt-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="bg-primary p-2 rounded-2xl group-hover:rotate-12 transition-transform shadow-lg shadow-primary/20">
                <Logo className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black italic tracking-tightest leading-none">MitraAI</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mt-1">Premium AI</span>
              </div>
            </Link>
            {userType === 'user' && <UsageTracker />}
          </div>
        </SidebarHeader>
        <SidebarContent className="px-3 relative z-10">
          <SidebarMenu>
            {userType === 'admin' && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/admin'}>
                  <Link href="/admin" onClick={handleLinkClick}>
                    <ShieldCheck />
                    <span>Admin Panel</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {userType === 'counsellor' && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/counsellor'}>
                  <Link href="/counsellor" onClick={handleLinkClick}>
                    <UserCheck />
                    <span>Counsellor Panel</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {userType === 'user' && (
              <>
                {/* Highlighted & Reordered Items */}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/chat' || pathname.startsWith('/chat/')}>
                    <Link href="/chat" onClick={handleLinkClick} className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <MessageSquare />
                        <span>MitraGPT</span>
                      </div>
                      <Trophy className="w-4 h-4 text-amber-500" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/talk'}>
                    <Link href="/talk" onClick={handleLinkClick} className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Phone />

                      </div>
                      <Trophy className="w-4 h-4 text-amber-500" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith('/culture')}>
                    <Link href="/culture" onClick={handleLinkClick} className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <LandPlot />
                        <span>Our Culture</span>
                      </div>
                      <Trophy className="w-4 h-4 text-amber-500" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith('/community') || pathname.startsWith('/groups') || pathname.startsWith('/friends')}>
                    <Link href="/community" onClick={handleLinkClick} className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Users />
                        <span>Community</span>
                      </div>
                      <Trophy className="w-4 h-4 text-amber-500" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Professional Help Section */}
                <Collapsible open={isProfessionalHelpOpen} onOpenChange={setIsProfessionalHelpOpen}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={isProfessionalHelpActive}
                      className="w-full justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Stethoscope />
                        <span>Professional Help</span>
                      </div>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform',
                          isProfessionalHelpOpen && 'rotate-180'
                        )}
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="pl-6 pt-1 space-y-1">
                      <SidebarMenuButton asChild isActive={pathname === '/screening-tools'}>
                        <Link href="/screening-tools" onClick={handleLinkClick}>
                          <FileText />
                          <span>Screening Tools</span>
                        </Link>
                      </SidebarMenuButton>
                      <SidebarMenuButton asChild isActive={pathname === '/booking'}>
                        <Link href="/booking" onClick={handleLinkClick}>
                          <CalendarPlus />
                          <span>Book Appointment</span>
                        </Link>
                      </SidebarMenuButton>
                      <SidebarMenuButton asChild isActive={pathname === '/my-appointments'}>
                        <Link href="/my-appointments" onClick={handleLinkClick}>
                          <CalendarClock />
                          <span>My Appointments</span>
                        </Link>
                      </SidebarMenuButton>
                      <SidebarMenuButton asChild isActive={pathname === '/reports'}>
                        <Link href="/reports" onClick={handleLinkClick}>
                          <FileText />
                          <span>Doctor's Reports</span>
                        </Link>
                      </SidebarMenuButton>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Emotions Diary Section */}
                <Collapsible open={isEmotionsDiaryOpen} onOpenChange={setIsEmotionsDiaryOpen}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={isEmotionsDiaryActive}
                      className="w-full justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <BookHeart />
                        <span>Emotions Diary</span>
                      </div>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform',
                          isEmotionsDiaryOpen && 'rotate-180'
                        )}
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="pl-6 pt-1 space-y-1">
                      <SidebarMenuButton asChild isActive={pathname === '/journal'}>
                        <Link href="/journal" onClick={handleLinkClick}>
                          <PenSquare />
                          <span>Journal</span>
                        </Link>
                      </SidebarMenuButton>
                      <SidebarMenuButton asChild isActive={pathname === '/live-mood'}>
                        <Link href="/live-mood" onClick={handleLinkClick}>
                          <Camera />
                          <span>Live Mood Analysis</span>
                        </Link>
                      </SidebarMenuButton>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Rest of the items */}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/dashboard'}>
                    <Link href="/dashboard" onClick={handleLinkClick}>
                      <LayoutDashboard />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/news'}>
                    <Link href="/news" onClick={handleLinkClick}>
                      <Newspaper />
                      <span>AI News</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/therapy'}>
                    <Link href="/therapy" onClick={handleLinkClick}>
                      <Sparkles />
                      <span>360° VR Therapy</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/affirmations'}>
                    <Link href="/affirmations" onClick={handleLinkClick}>
                      <Sparkles />
                      <span>Affirmations</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/mindful-games'}
                  >
                    <Link href="/mindful-games" onClick={handleLinkClick}>
                      <Puzzle />
                      <span>Mindful Games</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/rewards'}>
                    <Link href="/rewards" onClick={handleLinkClick}>
                      <Trophy />
                      <span>Rewards</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/about'}
                  >
                    <Link href="/about" onClick={handleLinkClick}>
                      <Info />
                      <span>About MitraAI</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t border-border/20 p-4 relative z-10">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4 p-3 rounded-[1.5rem] bg-background/40 border border-border/20 shadow-sm">
              <Avatar className="h-10 w-10 border-2 border-background shadow-md">
                <AvatarImage src={user.photoURL ?? undefined} />
                <AvatarFallback className="font-bold bg-primary text-white">{userAvatarFallback.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-black italic tracking-tight truncate">{userDisplayName}</span>
                {userType === 'user' && userTokens !== null && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                    <Coins className="w-3 h-3 text-amber-500 animate-pulse" />
                    <span>{userTokens} Tokens</span>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="ghost" size="sm" asChild className="rounded-full justify-start h-10 px-4 hover:bg-primary/10 hover:text-primary transition-all">
                <Link href="/profile" onClick={handleLinkClick}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="rounded-full justify-start h-10 px-4 hover:bg-destructive/10 hover:text-destructive transition-all">
                <LogOut className="mr-2 h-4 w-4" />
                Exit
              </Button>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <Sheet open={sidebar?.openMobile} onOpenChange={sidebar?.setOpenMobile}>
        <SidebarInset>
          <div className="flex flex-col h-full relative">
            <div className="flex-1">
              {children}
            </div>
            { /* Floating button container */}
            <div className="fixed bottom-6 left-4 z-50 flex flex-col items-start gap-3">
              <div className="flex items-center gap-3">
                <ThemeToggle open={isThemeMenuOpen} onOpenChange={setIsThemeMenuOpen} />
                <Button
                  onClick={() => setIsThemeMenuOpen(true)}
                  className="rounded-full shadow-lg h-12 bg-primary text-primary-foreground hidden md:flex"
                >
                  <Palette className="h-5 w-5 mr-2" />
                  Customize!
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => sidebar?.setOpenMobile(true)}
                        size="icon"
                        className="rounded-full shadow-lg h-12 w-12 hidden md:flex"
                      >
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Explore Features</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Explore Features</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {showFeatureHint && !isMobile && (
                  <div
                    className="flex items-center gap-2 bg-primary text-primary-foreground rounded-full p-2 pr-4 shadow-lg cursor-pointer animate-in fade-in-50"
                    onClick={handleHintClick}
                  >
                    <ArrowRight className="h-5 w-5 animate-point-right" />
                    <span className="text-sm font-medium">Explore Features</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SidebarInset>
      </Sheet>
    </>
  );
}


export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <ChatHistoryProvider>
          <AppLayoutContent>{children}</AppLayoutContent>
        </ChatHistoryProvider>
      </SidebarProvider>
    </AuthProvider>
  );
}
