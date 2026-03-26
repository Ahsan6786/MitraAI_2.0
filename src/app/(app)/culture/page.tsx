
'use client';

import { useState, useEffect } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';
import { statesData, allIndianStates } from '@/lib/states-data';
import { cn } from '@/lib/utils';
import { GenZToggle } from '@/components/genz-toggle';
import CultureIntroAnimation from '@/components/culture-intro-animation';
import { SOSButton } from '@/components/sos-button';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/glass-card';
import { Map, MapPin, Sparkles, Compass, Hexagon, Globe } from 'lucide-react';

// Simple hash function to generate a color from a string
const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return "00000".substring(0, 6 - c.length) + c;
};

// A slightly different hash function for the second gradient color
const stringToColor2 = (str: string) => {
    let hash = 5381; // Different seed
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return "00000".substring(0, 6 - c.length) + c;
};

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    show: { opacity: 1, scale: 1, y: 0 }
};

function CulturePageContent() {
    const availableStateIds = new Set(statesData.map(s => s.id));

    return (
        <div className="min-h-screen flex flex-col bg-black text-white selection:bg-primary selection:text-black relative overflow-hidden">
            {/* Background Blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div 
                    animate={{ 
                        x: [0, 80, 0], 
                        y: [0, 120, 0],
                        scale: [1, 1.2, 1]
                    }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[10%] -left-[10%] w-[70%] h-[70%] bg-primary/10 rounded-full blur-[140px]" 
                />
                <motion.div 
                    animate={{ 
                        x: [0, -100, 0], 
                        y: [0, 50, 0],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-orange-500/10 rounded-full blur-[140px]" 
                />
            </div>

            <header className="sticky top-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl px-6 h-20 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-6">
                    <SidebarTrigger className="text-white/60 hover:text-white transition-colors" />
                    <div className="h-8 w-px bg-white/10 hidden md:block" />
                    <div className="flex flex-col">
                        <h1 className="text-xl font-black italic tracking-tighter leading-none uppercase">Collective_Soul.</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mt-1">Cultural Neural Network</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <GenZToggle />
                    <ThemeToggle />
                    <SOSButton />
                </div>
            </header>

            <main className="flex-1 relative z-10 overflow-auto p-6 md:p-12 lg:p-20">
                <div className="mx-auto max-w-7xl space-y-32">
                    {/* Hero Section */}
                    <div className="relative group">
                         <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-4xl space-y-10"
                        >
                            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                                <Globe className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">India // Infinite Spectrum</span>
                            </div>
                            
                            <h2 className="text-7xl md:text-9xl font-black italic tracking-tightest leading-[0.85] text-white uppercase">
                                THE HEART<br/>
                                <span className="text-primary">OF BHARAT.</span>
                            </h2>
                            
                            <p className="text-xl md:text-2xl text-muted-foreground font-medium leading-relaxed max-w-2xl">
                                Synchronize with the unique traditions, vibrant frequencies, and high-fidelity heritage that define each node of our collective consciousness.
                            </p>

                            <div className="flex flex-wrap gap-4 pt-4">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                                    <MapPin className="w-3 h-3 text-primary" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/60">28_STATES</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                                    <Compass className="w-3 h-3 text-primary" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/60">8_TERRITORIES</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                                    <Hexagon className="w-3 h-3 text-primary" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/60">ONE_SOUL</span>
                                </div>
                            </div>
                        </motion.div>
                        
                        {/* Decorative background element */}
                        <div className="absolute -top-20 -right-20 opacity-5 pointer-events-none hidden lg:block">
                            <Map className="w-[40rem] h-[40rem] text-white" />
                        </div>
                    </div>

                    {/* States Grid */}
                    <div className="space-y-16">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
                            <div>
                                <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-2">Regional Nodes</h2>
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Select a neural point to dekrypt heritage</p>
                            </div>
                        </div>

                        <motion.div 
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8"
                        >
                            {allIndianStates.map((state, i) => {
                                const isAvailable = availableStateIds.has(state.id);
                                const color1 = `#${stringToColor(state.name)}`;
                                const color2 = `#${stringToColor2(state.name)}`;
                                
                                return (
                                    <motion.div key={state.id} variants={itemVariants}>
                                        {isAvailable ? (
                                            <Link href={`/culture/${state.id}`} className="group block">
                                                <GlassCard 
                                                    className={cn(
                                                        "relative aspect-[4/5] flex flex-col items-center justify-center p-8 text-center border-white/5 overflow-hidden",
                                                        "hover:bg-white/10 hover:border-primary/40 transition-all duration-700 rounded-[3rem]"
                                                    )}
                                                >
                                                    <div 
                                                        className="w-20 h-20 rounded-[2rem] mb-6 flex items-center justify-center text-white font-black text-3xl shadow-2xl group-hover:scale-110 transition-transform duration-700 relative z-10"
                                                        style={{ background: `linear-gradient(135deg, ${color1}, ${color2})` }}
                                                    >
                                                      {state.name[0]}
                                                    </div>
                                                    <h3 className="text-lg font-black italic tracking-tighter uppercase mb-1 relative z-10 group-hover:text-primary transition-colors">{state.name}</h3>
                                                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30 relative z-10 group-hover:text-primary/60">DEKRYPT_NODE_ &rarr;</span>

                                                    {/* Background Pattern */}
                                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-700">
                                                        <Sparkles className="w-full h-full text-white p-10" />
                                                    </div>
                                                </GlassCard>
                                            </Link>
                                        ) : (
                                            <div className="opacity-30 grayscale cursor-not-allowed">
                                                <GlassCard 
                                                    interactive={false}
                                                    className="aspect-[4/5] flex flex-col items-center justify-center p-8 text-center border-white/5 rounded-[3rem]"
                                                >
                                                    <div 
                                                       className="w-16 h-16 rounded-[1.5rem] mb-6 flex items-center justify-center text-white/50 font-black text-2xl"
                                                       style={{ background: `linear-gradient(135deg, #222, #000)` }}
                                                    >
                                                       {state.name[0]}
                                                    </div>
                                                    <h3 className="text-sm font-black italic tracking-tighter uppercase text-white/40 mb-1">{state.name}</h3>
                                                    <span className="text-[7px] font-black uppercase tracking-widest text-white/20">NODE_OFFLINE</span>
                                                </GlassCard>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
}


export default function CulturePage() {
    const [isClient, setIsClient] = useState(false);
    const [showIntro, setShowIntro] = useState(true);

    useEffect(() => {
        setIsClient(true);
        const hasSeenIntro = sessionStorage.getItem('hasSeenCultureIntro');
        if (hasSeenIntro) {
            setShowIntro(false);
        }
    }, []);

    const handleIntroFinish = () => {
        sessionStorage.setItem('hasSeenCultureIntro', 'true');
        setShowIntro(false);
    };

    if (!isClient) {
        return null;
    }
    
    if (showIntro) {
        return <CultureIntroAnimation onFinish={handleIntroFinish} />;
    }

    return <CulturePageContent />;
}
