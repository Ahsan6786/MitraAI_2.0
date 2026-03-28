
'use client';

import { useState, useEffect } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { GenZToggle } from '@/components/genz-toggle';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowLeft, Wind, Waves, Laugh, Frown, Info, Play, Maximize2, Shield, Heart } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { SOSButton } from '@/components/sos-button';
import { GlassCard } from '@/components/glass-card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type Mood = 'stress' | 'anxiety' | 'sadness' | 'happiness';

interface TherapyVideo {
  id: string;
  title: string;
  description: string;
  mood: Mood;
  icon: React.ElementType;
  color: string;
}

const therapyVideos: TherapyVideo[] = [
  {
    id: '22pSycMdCl0',
    title: 'Forest Resonance',
    description: 'Calm your mind through high-quality forest immersion.',
    mood: 'stress',
    icon: Wind,
    color: 'emerald',
  },
  {
    id: 'jqq_ZdD5Zwg',
    title: 'Oceanic Frequency',
    description: 'Soothe your anxiety with the rhythmic sound of waves.',
    mood: 'anxiety',
    icon: Waves,
    color: 'blue',
  },
  {
    id: 'gphpd697fqQ',
    title: 'Serene Spectrum',
    description: 'Restore emotional equilibrium through curated natural visualization.',
    mood: 'sadness',
    icon: Frown,
    color: 'indigo',
  },
  {
    id: 'iEH061YSglk',
    title: 'Euphoria Protocol',
    description: 'Trigger positive neurochemical spikes with playful canine interaction.',
    mood: 'happiness',
    icon: Laugh,
    color: 'amber',
  },
];

function TherapyPageContent() {
  const [selectedVideo, setSelectedVideo] = useState<TherapyVideo | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-black text-white selection:bg-primary selection:text-black relative overflow-hidden">
      {/* Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ 
                x: [0, 100, 0], 
                y: [0, 50, 0],
                scale: [1, 1.3, 1]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[120px]" 
          />
          <motion.div 
            animate={{ 
                x: [0, -80, 0], 
                y: [0, 120, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[100px]" 
          />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl px-6 h-20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
            <SidebarTrigger className="text-white/60 hover:text-white transition-colors" />
            <div className="h-8 w-px bg-white/10 hidden md:block" />
            <div className="flex flex-col">
              <h1 className="text-xl font-black italic tracking-tighter leading-none">Relaxation Space</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400/60 mt-1">Peaceful Environments</p>
            </div>
        </div>
        <div className="flex items-center gap-4">
             <div className="hidden sm:block">
                <GenZToggle />
            </div>
            <ThemeToggle />
            <SOSButton />
        </div>
      </header>

      <main className="flex-1 relative z-10 overflow-auto p-6 md:p-12 lg:p-20">
        <div className="mx-auto max-w-7xl w-full">
             <AnimatePresence mode="wait">
                {selectedVideo ? (
                    <motion.div 
                        key="video-player"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="space-y-12 h-full"
                    >
                        <div className="flex items-center justify-between">
                            <Button 
                                variant="ghost" 
                                onClick={() => setSelectedVideo(null)} 
                                className="h-12 border border-white/10 rounded-2xl px-6 font-black italic text-xs tracking-widest text-white hover:bg-white/5 active:scale-95 transition-all"
                            >
                                <ArrowLeft className="mr-3 h-4 w-4" />
                                BACK
                            </Button>
                            
                            <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl">
                                <Heart className="w-4 h-4 text-emerald-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Active_Healing: {selectedVideo.title.toUpperCase()}</span>
                            </div>
                        </div>
                        
                        <GlassCard className="aspect-video w-full rounded-[3rem] overflow-hidden p-0 border-white/5">
                            <iframe
                                className="w-full h-full"
                                src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1&modestbranding=1&rel=0`}
                                title={selectedVideo.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            ></iframe>
                        </GlassCard>

                        <div className="max-w-2xl space-y-4">
                             <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">{selectedVideo.title}</h2>
                             <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                                {selectedVideo.description}
                             </p>
                             <div className="flex items-center gap-6 pt-4">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-emerald-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Secure_Datalink</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Maximize2 className="w-4 h-4 text-emerald-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">360_Enabled</span>
                                </div>
                             </div>
                        </div>
                    </motion.div>
                    ) : (
                    <motion.div 
                        key="hub"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-24"
                    >
                        {/* Hero Section */}
                        <div className="max-w-3xl space-y-8">
                            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Healing Signals Online</span>
                            </div>
                            <h1 className="text-4xl md:text-8xl font-black italic tracking-tightest leading-none text-white uppercase">
                                RELAX.<br/>
                                <span className="text-emerald-400">BREATHE.</span><br/>
                                UNWIND.
                            </h1>
                            <p className="text-xl text-muted-foreground font-medium leading-relaxed max-w-2xl">
                                Access immersive 360° neural environments calibrated for emotional restoration. Professional VR equipment recommended for maximum efficacy.
                            </p>
                        </div>

                        {/* Critical Info */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <GlassCard className="p-8 border-emerald-500/20 bg-emerald-500/5 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6">
                                <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center shrink-0">
                                    <Info className="w-8 h-8 text-emerald-400" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-black italic uppercase text-white tracking-tight">Deployment Recommendation</h3>
                                    <p className="text-sm text-emerald-400/60 font-medium">To achieve total sensory immersion, please utilize a high-fidelity VR headset. Mobile users may enjoy 360° visuals through rotational tracking.</p>
                                </div>
                            </GlassCard>
                        </motion.div>

                        {/* Experience Grid */}
                        <div className="space-y-12">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase mb-1">Restoration Protocols</h2>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/60">Choose your journey</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {therapyVideos.map((video, i) => {
                                    const Icon = video.icon;
                                    return (
                                        <motion.div
                                            key={video.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.1 }}
                                        >
                                            <GlassCard 
                                                className="group relative h-80 flex flex-col p-10 rounded-[3rem] hover:bg-white/10 transition-all duration-700 cursor-pointer overflow-hidden border-white/5 hover:border-emerald-500/30" 
                                                onClick={() => setSelectedVideo(video)}
                                            >
                                                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="bg-emerald-400 text-black p-3 rounded-2xl">
                                                        <Play className="w-5 h-5 fill-current" />
                                                    </div>
                                                </div>
                                                
                                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-8 border border-white/10 group-hover:bg-emerald-400/10 group-hover:border-emerald-400/20 transition-all">
                                                    <Icon className="w-8 h-8 text-white group-hover:text-emerald-400 transition-colors" />
                                                </div>

                                                <div className="mt-auto space-y-4">
                                                    <div className="space-y-1">
                                                        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-emerald-400/60">{video.mood} // CALIBRATION</p>
                                                        <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white group-hover:text-emerald-400 transition-colors">{video.title}</h3>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-xs">
                                                        {video.description}
                                                    </p>
                                                    <div className="pt-2">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20 group-hover:text-white transition-colors">START JOURNEY //</span>
                                                    </div>
                                                </div>

                                                {/* Decorative background number */}
                                                <span className="absolute -bottom-10 -right-10 text-[12rem] font-black italic text-white/[0.02] pointer-events-none group-hover:text-emerald-500/[0.03] transition-colors">{i + 1}</span>
                                            </GlassCard>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
             </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default function TherapyPage() {
    return <TherapyPageContent />;
}
