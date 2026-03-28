
'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/icons';
import { 
  Bot, HeartPulse, Mic, Globe, Instagram, Mail, 
  PlayCircle, ArrowRight, Sparkles, Zap, Shield, ChevronLeft
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { GenZToggle } from '@/components/genz-toggle';
import IntroAnimation from '@/components/intro-animation';

// --- Hero Section ---
function ModernHero() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={containerRef} className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-32 pb-16">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] animate-pulse delay-700" />
      
      <motion.div 
        style={{ y: y1, opacity }}
        className="container relative z-10 px-6 max-w-5xl flex flex-col items-center text-center"
      >
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tightest mb-6 bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent italic leading-[0.95]"
        >
          Meet Your <br />
          <span className="text-primary italic">Soul Ally</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-2xl text-lg md:text-xl text-muted-foreground/80 mb-10 leading-relaxed"
        >
          MitraAI is the world's fastest empathetic companion. Experience real-time support that actually hears you.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-6 sm:px-0 mt-4"
        >
          <Button size="lg" className="h-14 sm:h-16 px-8 sm:px-12 text-lg sm:text-xl rounded-full shadow-2xl shadow-primary/30 group w-full sm:w-auto flex items-center justify-center" asChild>
            <Link href="/signup">
              Start Your Journey
              <ArrowRight className="ml-2 w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-2 transition-transform" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="h-14 sm:h-16 px-8 sm:px-12 text-lg sm:text-xl rounded-full bg-background/50 backdrop-blur-3xl border-border/50 w-full sm:w-auto" asChild>
            <Link href="#tutorial">
              <PlayCircle className="mr-2 w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              Watch Demo
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
}

// --- Feature Section ---
function ModernFeatures() {
  const features = [
    {
      icon: <Bot className="w-12 h-12" />,
      title: 'MitraGPT',
      description: 'Human-like dialogue that evolves as you do.',
      color: 'bg-blue-500/20 text-blue-500'
    },
    {
      icon: <HeartPulse className="w-12 h-12" />,
      title: 'Mood Matrix',
      description: 'Visualize your emotional patterns instantly.',
      color: 'bg-rose-500/20 text-rose-500'
    },
    {
      icon: <Mic className="w-12 h-12" />,
      title: 'Voice Soul',
      description: '0.8s latency. Just talk, we listen.',
      color: 'bg-emerald-500/20 text-emerald-500'
    },
    {
      icon: <Globe className="w-12 h-12" />,
      title: 'Multilingual',
      description: 'Support in 20+ native tongues.',
      color: 'bg-amber-500/20 text-amber-500'
    }
  ];

  return (
    <section id="features" className="py-32 relative overflow-hidden bg-muted/20">
      <div className="container px-6 max-w-7xl mx-auto flex flex-col items-center">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 w-full">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
            >
              <Card className="h-full border-border/50 bg-background/50 backdrop-blur-3xl rounded-[2rem] sm:rounded-[3rem] hover:border-primary/50 transition-all duration-500 group shadow-lg hover:shadow-2xl hover:-translate-y-2">
                <CardContent className="pt-8 sm:pt-12 pb-6 sm:pb-10 flex flex-col items-center text-center px-6 sm:px-8">
                  <div className={cn("mb-6 sm:mb-8 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] transition-all duration-500 group-hover:rotate-6", feature.color)}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black mb-3 sm:mb-4 italic tracking-tight">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-medium">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- Trust Section ---
function TrustSection() {
    return (
        <section className="py-32 relative overflow-hidden">
            <div className="container px-6 max-w-7xl mx-auto flex flex-col items-center">
                <div className="grid lg:grid-cols-2 gap-24 items-center w-full">
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="text-center lg:text-left flex flex-col items-center lg:items-start"
                    >
                        <div className="text-primary font-black italic tracking-widest text-xs mb-4 uppercase">Science First</div>
                        <h2 className="text-4xl md:text-7xl font-black mb-6 sm:mb-8 italic tracking-tightest leading-none">Built on <br className="hidden md:block" /> Proven Science.</h2>
                        <p className="text-xl text-muted-foreground/80 mb-10 leading-relaxed font-medium">
                            Ground your healing in methodology. We integrate clinical standards like the Stanford GDS into a seamless AI companion experience.
                        </p>
                        <div className="space-y-6 w-full">
                            {[
                                { icon: <Shield className="w-5 h-5" />, text: "HIPAA-ready Encryption" },
                                { icon: <Zap className="w-5 h-5" />, text: "Sub-second Responses" },
                                { icon: <HeartPulse className="w-5 h-5" />, text: "Empathetic Core" }
                            ].map((item, i) => (
                                <motion.div 
                                    key={i} 
                                    whileHover={{ x: 10 }}
                                    className="flex items-center gap-4 text-foreground/80 font-bold glass-dark bg-zinc-900/5 dark:bg-zinc-100/5 px-6 py-4 rounded-full border border-border/20 justify-center lg:justify-start"
                                >
                                    <div className="bg-primary/20 p-2.5 rounded-full text-primary shadow-sm">{item.icon}</div>
                                    <span className="tracking-tight">{item.text}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative w-full max-w-xl mx-auto"
                    >
                        <div className="absolute inset-0 bg-primary/20 blur-[120px] opacity-30 animate-pulse" />
                        <Card className="relative overflow-hidden border-primary/20 bg-background/40 backdrop-blur-3xl shadow-3xl rounded-[2.5rem] sm:rounded-[4rem] p-8 sm:p-14">
                            <div className="mb-10 flex items-center justify-between">
                                <div className="flex gap-1.5">
                                    {[1, 2, 3, 4, 5].map(i => <Sparkles key={i} className="w-5 h-5 text-amber-500 fill-amber-500" />)}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">Stanford GDS</span>
                            </div>
                            <blockquote className="text-2xl sm:text-3xl font-black italic mb-8 sm:mb-10 leading-snug tracking-tighter">
                                "The first step to healing is being accurately heard."
                            </blockquote>
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center font-black text-white shadow-xl italic">SC</div>
                                <div>
                                    <div className="font-black italic text-xl tracking-tighter">Science Center</div>
                                    <div className="text-xs uppercase font-bold tracking-widest text-muted-foreground opacity-60">Global Standard</div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

function MainContent() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-background selection:bg-primary/30 min-h-screen overflow-x-hidden">
      <header className={cn(
        "fixed top-4 inset-x-4 z-50 h-20 transition-all duration-700 max-w-7xl mx-auto",
        isScrolled ? "translate-y-2 px-4" : "px-6"
      )}>
        <div className={cn(
            "w-full h-full rounded-full border transition-all duration-700 flex items-center px-4 sm:px-8",
            isScrolled ? "bg-background/80 backdrop-blur-3xl border-border/50 shadow-2xl h-16" : "bg-transparent border-transparent"
        )}>
            <Link href="#" className="flex items-center gap-3 group">
              <div className="bg-primary p-2 rounded-2xl group-hover:rotate-12 transition-transform shadow-lg shadow-primary/20">
              <Logo className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tightest italic hidden sm:block">MitraAI</span>
            </Link>
            
            <nav className="ml-auto flex items-center gap-2 sm:gap-4">
               <div className="hidden lg:flex items-center gap-6 mr-6">
                 <Link href="#features" className="text-sm font-black uppercase tracking-widest hover:text-primary transition-colors">Features</Link>
                 <Link href="#tutorial" className="text-sm font-black uppercase tracking-widest hover:text-primary transition-colors">Demo</Link>
               </div>
              <div className="hidden md:flex items-center gap-2">
                <GenZToggle />
              </div>
              <ThemeToggle />
              <Button variant="ghost" className="rounded-full px-4 sm:px-6 font-black uppercase tracking-widest text-xs hidden sm:flex" asChild>
                <Link href="/signin">Sign In</Link>
              </Button>
              <Button className="rounded-full px-4 sm:px-8 font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-xl shadow-primary/20 h-10 sm:h-11" asChild>
                <Link href="/signup">Join Now</Link>
              </Button>
            </nav>
        </div>
      </header>

      <main className="relative z-10 w-full overflow-x-hidden">
        <ModernHero />
        <ModernFeatures />
        <TrustSection />

        {/* Tutorial Section */}
        <section id="tutorial" className="py-32 bg-muted/20 relative overflow-hidden">
            <div className="container px-6 max-w-5xl mx-auto flex flex-col items-center">
                <motion.div 
                     initial={{ opacity: 0, scale: 0.95 }}
                     whileInView={{ opacity: 1, scale: 1 }}
                     viewport={{ once: true }}
                     className="w-full aspect-video rounded-[4rem] overflow-hidden border-[12px] border-background shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] dark:shadow-[0_40px_100px_-20px_rgba(255,255,255,0.05)] relative group"
                >
                     <iframe
                        className="w-full h-full"
                        src="https://www.youtube.com/embed/pu0Ekbo13Dg"
                        title="MitraAI Tutorial"
                        frameBorder="0"
                        allowFullScreen
                    />
                </motion.div>
            </div>
        </section>

        {/* Team/Founder Section */}
        <section className="py-32">
            <div className="container px-6 max-w-7xl mx-auto flex flex-col items-center">
                <Card className="w-full rounded-[4rem] bg-zinc-950 dark:bg-zinc-900 border-none relative overflow-hidden text-white shadow-3xl">
                    <div className="absolute -top-32 -right-32 w-[30rem] h-[30rem] bg-primary/20 rounded-full blur-[140px] animate-pulse" />
                    <CardContent className="p-10 md:p-20 relative z-10 flex flex-col lg:flex-row items-center gap-12 text-center lg:text-left">
                        <div className="flex-1 order-2 lg:order-1">
                            <h2 className="text-4xl md:text-6xl font-black mb-8 italic tracking-tightest leading-none text-glow uppercase">Built by an Mitian.</h2>
                            <p className="text-lg md:text-xl text-zinc-400 leading-relaxed mb-10 font-medium">
                                Designed and developed by <span className="text-white">Ahsan Imam Khan</span> from <span className="text-primary">MIT Pune</span>. Driven by the belief that technology should empower human wellness and elite emotional support.
                            </p>
                            <Button size="lg" className="bg-white text-black hover:bg-zinc-200 h-14 px-10 rounded-full text-base font-black uppercase tracking-widest italic group">
                                Meet the Developer
                                <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform" />
                            </Button>
                        </div>
                        <div className="flex justify-center order-1 lg:order-2">
                            <div className="w-56 h-56 md:w-72 md:h-72 rounded-full border-4 border-white/5 flex items-center justify-center p-8 bg-white/5 backdrop-blur-3xl shadow-2xl overflow-hidden relative group">
                                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity blur-3xl" />
                                <Logo className="w-full h-full text-white relative z-10 transition-transform duration-700 group-hover:scale-110" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 text-center relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-screen h-screen bg-primary/5 -z-10 blur-[150px]" />
            <div className="container px-6 max-w-4xl mx-auto flex flex-col items-center">
                <h2 className="text-4xl md:text-8xl font-black mb-8 sm:mb-10 italic tracking-tightest leading-[0.8]">Your Path <br/><span className="text-primary italic">Starts Here.</span></h2>
                <Button size="lg" className="rounded-full h-16 px-12 text-xl shadow-3xl shadow-primary/40 group relative overflow-hidden active:scale-95 transition-all" asChild>
                    <Link href="/signup">
                        <span className="relative z-10">Get Started Now</span>
                        <Zap className="ml-3 w-5 h-5 fill-current relative z-10 group-hover:scale-125 transition-transform" />
                    </Link>
                </Button>
            </div>
        </section>
      </main>

      <footer className="py-16 border-t border-border/40 bg-muted/10">
        <div className="container px-6 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
             <Link href="#" className="flex items-center gap-3">
                <Logo className="h-6 w-6 text-primary" />
                <span className="text-2xl font-black tracking-tightest italic">MitraAI</span>
            </Link>
            <div className="flex flex-wrap justify-center gap-10 text-[10px] font-black uppercase tracking-[0.2em] opacity-50">
                <Link href="#" className="hover:opacity-100 hover:text-primary transition-all">Privacy</Link>
                <Link href="#" className="hover:opacity-100 hover:text-primary transition-all">Terms</Link>
                <Link href="#" className="hover:opacity-100 hover:text-primary transition-all">Careers</Link>
                <Link href="#" className="hover:opacity-100 hover:text-primary transition-all">Contact</Link>
            </div>
            <div className="flex gap-4">
                <Button variant="outline" size="icon" asChild className="h-12 w-12 rounded-full glass border-border/50 hover:border-primary/50 transition-all">
                    <Link href="https://instagram.com/mitra____ai" target="_blank"><Instagram className="w-5 h-5" /></Link>
                </Button>
                <Button variant="outline" size="icon" asChild className="h-12 w-12 rounded-full glass border-border/50 hover:border-primary/50 transition-all">
                    <Link href="mailto:mitraai0001@gmail.com"><Mail className="w-5 h-5" /></Link>
                </Button>
            </div>
        </div>
        <div className="container px-6 max-w-7xl mx-auto text-center mt-16 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/30">
           &copy; {new Date().getFullYear()} MitraAI. Built with ❤️ for Inner Wellness.
        </div>
      </footer>
    </div>
  );
}

export default function LandingPage() {
    const [isClient, setIsClient] = useState(false);
    const [showIntro, setShowIntro] = useState(true);

    useEffect(() => {
        setIsClient(true);
        const hasSeenIntro = sessionStorage.getItem('hasSeenIntro');
        if (hasSeenIntro) setShowIntro(false);
    }, []);

    const handleIntroFinish = () => {
        sessionStorage.setItem('hasSeenIntro', 'true');
        setShowIntro(false);
    };

    if (!isClient) return null;

    if (showIntro) {
        return <IntroAnimation onFinish={handleIntroFinish} />;
    }
    
    return <MainContent />;
}
