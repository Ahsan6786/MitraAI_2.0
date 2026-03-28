
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { screeningToolsData } from '@/lib/screening-tools';
import Link from 'next/link';
import { ArrowRight, FileQuestion } from 'lucide-react';
import { GenZToggle } from '@/components/genz-toggle';
import { SOSButton } from '@/components/sos-button';

import { GlassCard } from '@/components/glass-card';
import { motion } from 'framer-motion';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring" as const,
            stiffness: 100
        }
    }
};

export default function ScreeningToolsPage() {
    return (
        <div className="h-full flex flex-col relative bg-background/50 overflow-hidden">
            {/* Dynamic Background Blobs */}
            <div className="absolute inset-0 pointer-events-none -z-10">
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        opacity: [0.05, 0.1, 0.05]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-1/4 -right-1/4 w-[60rem] h-[60rem] bg-primary/20 rounded-full blur-[150px]" 
                />
                <motion.div 
                    animate={{ 
                        scale: [1.2, 1, 1.2],
                        rotate: [90, 0, 90],
                        opacity: [0.03, 0.08, 0.03]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-1/4 -left-1/4 w-[60rem] h-[60rem] bg-blue-500/10 rounded-full blur-[150px]" 
                />
            </div>

            <header className="h-24 shrink-0 px-6 md:px-10 border-b border-white/10 flex items-center justify-between bg-background/40 backdrop-blur-3xl sticky top-0 z-50">
                <div className="flex items-center gap-5">
                    <SidebarTrigger className="h-12 w-12 rounded-2xl border border-white/10 hover:bg-primary/10 hover:border-primary/20 transition-all active:scale-95" />
                    <div className="hidden sm:block h-10 w-px bg-white/5 mx-2" />
                    <div className="flex flex-col">
                        <h1 className="text-xl md:text-2xl font-black italic tracking-tighter text-white">Self-Check Hub</h1>
                        <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground/60">Tools Ready</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <SOSButton />
                    <GenZToggle />
                    <ThemeToggle />
                </div>
            </header>

            <main className="flex-1 overflow-auto p-6 md:p-12">
                <div className="max-w-6xl mx-auto space-y-16">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center space-y-4 max-w-3xl mx-auto"
                    >
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black italic tracking-tightest leading-tight text-white capitalize">
                            Understand Your <span className="text-primary italic">Mind.</span>
                        </h1>
                        <p className="text-base md:text-xl text-muted-foreground/80 font-medium leading-relaxed">
                            Access validated mental health checks designed to provide rapid insights into your well-being.
                        </p>
                    </motion.div>

                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
                    >
                        {Object.values(screeningToolsData).map((tool) => (
                            <motion.div key={tool.id} variants={itemVariants}>
                                <GlassCard className="h-full flex flex-col group hover:border-primary/30 transition-all duration-500 relative overflow-hidden">
                                     <div className="absolute -right-8 -top-8 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                                    
                                    <div className="p-8 flex flex-col h-full space-y-6 relative z-10">
                                        <div className="flex items-start justify-between">
                                            <div className="bg-primary/10 p-4 rounded-2xl group-hover:bg-primary/20 transition-colors">
                                                <FileQuestion className="w-8 h-8 text-primary" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 bg-white/5 px-3 py-1.5 rounded-full">
                                                {tool.questions_count} Metrics
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            <h3 className="text-2xl font-black italic tracking-tight text-white">{tool.name}</h3>
                                            <p className="text-xs text-muted-foreground leading-snug font-bold uppercase tracking-widest border-b border-white/5 pb-3">
                                                {tool.full_name}
                                            </p>
                                            <p className="text-muted-foreground/80 text-sm leading-relaxed font-medium">
                                                {tool.purpose}.
                                            </p>
                                        </div>

                                        <div className="pt-4 mt-auto">
                                            <Button asChild className="w-full h-14 rounded-2xl bg-white text-black hover:bg-white/90 shadow-xl font-black italic transition-all group-hover:scale-[1.02] active:scale-95">
                                                <Link href={`/questionnaire?test=${tool.id}`}>
                                                    Start Check <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        ))}
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-white/5 border border-white/5 text-center bg-gradient-to-r from-primary/5 to-transparent"
                    >
                        <p className="text-xs md:text-sm text-muted-foreground/60 font-medium">
                            <span className="text-primary font-bold">Important:</span> These checks are aids and do not replace professional medical advice. Always consult with a licensed professional for a full evaluation.
                        </p>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
