
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, RefreshCw, Heart, Share2 } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { generateAffirmation } from '@/ai/flows/generate-affirmation';
import { useToast } from '@/hooks/use-toast';
import { GenZToggle } from '@/components/genz-toggle';
import { SOSButton } from '@/components/sos-button';

interface LastEntry {
    mood: string;
    createdAt: Timestamp;
}

import { GlassCard } from '@/components/glass-card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function AffirmationsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [lastEntry, setLastEntry] = useState<LastEntry | null>(null);
    const [affirmation, setAffirmation] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (user) {
            const q = query(
                collection(db, 'journalEntries'),
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc'),
                limit(1)
            );

            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                if (!querySnapshot.empty) {
                    const latestDoc = querySnapshot.docs[0];
                    setLastEntry(latestDoc.data() as LastEntry);
                } else {
                    setLastEntry(null);
                }
                setIsLoading(false);
            }, (error) => {
                console.error("Error fetching last entry: ", error);
                toast({ title: "Error", description: "Could not fetch your latest mood.", variant: "destructive" });
                setIsLoading(false);
            });

            return () => unsubscribe();
        } else {
            setIsLoading(false);
        }
    }, [user, toast]);
    
    const handleGenerateAffirmation = useCallback(async () => {
        setIsGenerating(true);
        try {
            const mood = lastEntry?.mood || 'neutral';
            const result = await generateAffirmation({ mood });
            setAffirmation(result.affirmation);
        } catch (error) {
            console.error("Error generating affirmation: ", error);
            toast({ title: "Error", description: "Could not generate an affirmation.", variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    }, [lastEntry, toast]);
    
    useEffect(() => {
        if (!isLoading) {
           handleGenerateAffirmation();
        }
    }, [isLoading, handleGenerateAffirmation]);

    return (
        <div className="h-full flex flex-col relative bg-background/50 overflow-hidden">
            {/* Dynamic Background Blobs */}
            <div className="absolute inset-0 pointer-events-none -z-10">
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        opacity: [0.03, 0.08, 0.03]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[60rem] bg-primary/20 rounded-full blur-[150px]" 
                />
            </div>

            <header className="h-24 shrink-0 px-6 md:px-10 border-b border-white/10 flex items-center justify-between bg-background/40 backdrop-blur-3xl sticky top-0 z-50">
                <div className="flex items-center gap-5">
                    <SidebarTrigger className="h-12 w-12 rounded-2xl border border-white/10 hover:bg-primary/10 hover:border-primary/20 transition-all active:scale-95" />
                    <div className="hidden sm:block h-10 w-px bg-white/5 mx-2" />
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-black italic tracking-tighter text-white uppercase">Resonance</h1>
                        <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground/60">Neural Uplift Active</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <SOSButton />
                    <GenZToggle />
                    <ThemeToggle />
                </div>
            </header>

            <main className="flex-1 overflow-auto p-6 md:p-12 lg:p-16 flex flex-col items-center justify-center">
                 {isLoading ? (
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-t-2 border-primary animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-primary/20 animate-pulse" />
                        </div>
                    </div>
                ) : (
                    <div className="w-full max-w-5xl space-y-12">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center space-y-4"
                        >
                            <h1 className="text-5xl md:text-6xl font-black italic tracking-tightest leading-tight text-white capitalize">
                                Morning <span className="text-primary italic">Manifest.</span>
                            </h1>
                            <p className="text-lg text-muted-foreground/80 font-medium leading-relaxed max-w-2xl mx-auto italic">
                                "{lastEntry ? (
                                    <>
                                        Calibrating for your <span className="text-primary font-black uppercase tracking-widest">{lastEntry.mood}</span> state...
                                    </>
                                ) : "Initiating daily psychological alignment."}"
                            </p>
                        </motion.div>

                        <div className="relative mt-8 group">
                            <motion.div 
                                animate={{ scale: [1, 1.02, 1] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -inset-4 bg-gradient-to-r from-primary/10 via-blue-500/10 to-primary/10 rounded-[3rem] blur-2xl opacity-50" 
                            />
                            
                            <GlassCard className="mx-auto max-w-3xl rounded-[2.5rem] p-12 md:p-20 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                                
                                <div className="relative flex flex-col items-center justify-center text-center space-y-12">
                                    <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                                        <Sparkles className="h-8 w-8 text-primary shadow-2xl animate-pulse" />
                                    </div>

                                    <div className="min-h-[120px] flex items-center justify-center">
                                        <AnimatePresence mode="wait">
                                            {isGenerating ? (
                                                <motion.div 
                                                    key="loader"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="flex items-center gap-3"
                                                >
                                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">Generating Frequency</span>
                                                </motion.div>
                                            ) : (
                                                <motion.p 
                                                    key={affirmation}
                                                    initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                                    exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                                                    transition={{ duration: 0.8, ease: "circOut" }}
                                                    className="text-3xl md:text-4xl font-black italic tracking-tight text-white leading-tight"
                                                >
                                                    {affirmation}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center pt-8">
                                         <Button 
                                            onClick={handleGenerateAffirmation} 
                                            disabled={isGenerating} 
                                            size="lg" 
                                            className="h-16 px-10 rounded-2xl bg-white text-black hover:bg-white/90 font-black italic text-sm tracking-widest shadow-2xl transition-all active:scale-95 group overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-primary/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                                            <RefreshCw className={cn("mr-3 h-5 w-5 relative z-10", isGenerating && "animate-spin")} />
                                            <span className="relative z-10">REFRESH PROTOCOL</span>
                                        </Button>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="icon" className="h-16 w-16 rounded-2xl border-white/10 hover:bg-white/5 group transition-all">
                                                <Heart className="h-5 w-5 group-hover:text-rose-400 group-hover:fill-rose-400 transition-colors" />
                                            </Button>
                                            <Button variant="outline" size="icon" className="h-16 w-16 rounded-2xl border-white/10 hover:bg-white/5 group transition-all">
                                                <Share2 className="h-5 w-5 group-hover:text-primary transition-colors" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>

                        <div className="flex justify-center gap-8 opacity-40">
                            {['FOCUS', 'CLARITY', 'INTENT'].map((word) => (
                                <span key={word} className="text-[10px] font-black tracking-[0.8em] text-white select-none">{word}</span>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
