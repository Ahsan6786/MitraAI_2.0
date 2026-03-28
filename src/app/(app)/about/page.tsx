
'use client';

import { useState, useEffect } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Users, Heart, BrainCircuit, ShieldCheck, Handshake, FileQuestion, Info, Sparkles, Globe, Zap, Target } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { GenZToggle } from '@/components/genz-toggle';

import { SOSButton } from '@/components/sos-button';
import { GlassCard } from '@/components/glass-card';
import { motion, AnimatePresence } from 'framer-motion';

function AboutPageContent() {
    return (
        <div className="min-h-screen flex flex-col bg-black text-white selection:bg-primary selection:text-black relative overflow-hidden">
            {/* Background Blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div 
                    animate={{ 
                        x: [0, 100, 0], 
                        y: [0, 50, 0],
                        scale: [1, 1.2, 1]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[120px]" 
                />
                <motion.div 
                    animate={{ 
                        x: [0, -80, 0], 
                        y: [0, 120, 0],
                        scale: [1, 1.1, 1]
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
                        <h1 className="text-xl font-black italic tracking-tighter leading-none uppercase">About MitraAI</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mt-1">Our Mission & Vision</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <GenZToggle />
                    <ThemeToggle />
                    <SOSButton />
                </div>
            </header>

            <main className="flex-1 relative z-10 overflow-auto p-6 md:p-12 lg:p-20">
                <div className="mx-auto max-w-6xl space-y-24">
                    {/* Hero Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <GlassCard className="p-10 md:p-20 rounded-[4rem] border-white/10 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
                            <div className="relative z-10 space-y-8 max-w-3xl">
                                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10">
                                    <Sparkles className="w-4 h-4 text-primary" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Your Soul Ally</span>
                                </div>
                                <h1 className="text-6xl md:text-7xl lg:text-8xl font-black italic tracking-tightest leading-none uppercase">
                                    NOT JUST<br/>
                                    <span className="text-primary">AN APP.</span>
                                </h1>
                                <p className="text-xl md:text-2xl text-muted-foreground font-medium leading-relaxed">
                                    MitraAI is your personal companion for emotional support and self-discovery. We build technology that listens, understands, and heals.
                                </p>
                            </div>
                        </GlassCard>
                    </motion.div>

                    {/* Vision & Mission Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Heart,
                                title: "Our Vision",
                                description: "We believe mental health is as important as physical health. Making emotional wellness accessible, private, and stigma-free for everyone.",
                                color: "text-rose-500"
                            },
                            {
                                icon: Handshake,
                                title: "Our Mission",
                                description: "Empower individuals through AI-driven insights, encouraging early support and building stronger emotional connections.",
                                color: "text-blue-500"
                            },
                            {
                                icon: BrainCircuit,
                                title: "How It Works",
                                description: "Using state-of-the-art AI to analyze text and tone, providing gentle, data-driven insights to help you reflect over time.",
                                color: "text-primary"
                            }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 + 0.5 }}
                            >
                                <GlassCard className="h-full p-8 rounded-[2.5rem] border-white/10 hover:border-primary/40 transition-all duration-500 group">
                                    <div className={`w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10 group-hover:bg-primary/10 transition-all`}>
                                        <item.icon className={`w-6 h-6 ${item.color}`} />
                                    </div>
                                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-white mb-4">{item.title}</h3>
                                    <p className="text-sm text-muted-foreground font-medium leading-relaxed italic">
                                        "{item.description}"
                                    </p>
                                </GlassCard>
                            </motion.div>
                        ))}
                    </div>

                    {/* Clinical Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <GlassCard className="p-10 md:p-16 rounded-[3.5rem] border-white/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
                                <ShieldCheck className="w-48 h-48 text-white" />
                            </div>
                            <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
                                <div className="space-y-6 flex-1">
                                    <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
                                        CLINICALLY<br/>
                                        <span className="text-primary">VALIDATED.</span>
                                    </h2>
                                    <p className="text-muted-foreground font-medium leading-relaxed italic">
                                        MitraAI utilizes the <strong className="text-white">Geriatric Depression Scale (GDS-15)</strong>, a widely recognized instrument developed at Stanford University.
                                    </p>
                                    <div className="flex flex-wrap gap-4">
                                        <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest">Stanford Model</div>
                                        <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest">Medical Standard</div>
                                    </div>
                                </div>
                                <div className="flex-1 text-sm text-muted-foreground leading-relaxed italic border-l border-white/5 pl-8 hidden md:block">
                                    "While not a diagnostic tool, GDS is a clinically validated instrument used by doctors worldwide to guide wellness journeys. We prioritize accuracy and credibility."
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>

                    {/* Why MitraAI */}
                    <div className="space-y-12">
                        <div className="text-center space-y-2">
                            <h2 className="text-4xl font-black italic tracking-tightest uppercase">Why MitraAI?</h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 italic">Core Pillars of Support</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { title: "Safe Space", desc: "Judgment-free AI companion.", icon: Zap },
                                { title: "Track Progress", desc: "Visualize your emotional trends.", icon: Globe },
                                { title: "Early Awareness", desc: "Notice signs before they overwhelm.", icon: Info },
                                { title: "Pro Support", desc: "Share reports with experts.", icon: FileQuestion },
                                { title: "Personal Growth", desc: "Mindful games and activities.", icon: Target },
                                { title: "Privacy First", desc: "Your data is strictly confidential.", icon: ShieldCheck }
                            ].map((feature, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <div className="p-6 bg-white/5 border border-white/10 rounded-2.5rem hover:bg-white/10 transition-all group flex items-start gap-4 h-full">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-all">
                                            <feature.icon className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-black italic uppercase text-sm text-white">{feature.title}</h4>
                                            <p className="text-xs text-muted-foreground font-medium italic">{feature.desc}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Founders */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        <GlassCard className="p-12 md:p-20 rounded-[4rem] border-white/10 text-center space-y-8 relative overflow-hidden">
                            <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full translate-y-1/2 scale-150" />
                            <div className="relative z-10 space-y-6">
                                <h2 className="text-3xl font-black italic tracking-tighter uppercase">PulseCoders Team</h2>
                                <p className="text-lg text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed italic">
                                    "Founded by a group of passionate innovators, we believe technology should heal. Our team envisions MitraAI as a global companion for anyone feeling lost, anxious, or alone. Nobody has to fight their battles alone."
                                </p>
                                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-black italic uppercase text-xs tracking-widest shadow-2xl">
                                    Innovation For Good
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>

                    <footer className="text-center space-y-4 pb-20">
                        <div className="w-12 h-1 bg-white/10 mx-auto rounded-full" />
                        <p className="text-xs text-muted-foreground font-medium italic max-w-md mx-auto">
                            MitraAI is a supportive companion, not a replacement for professional therapy. We're here for you 24/7.
                        </p>
                    </footer>
                </div>
            </main>
        </div>
    );
}

export default function AboutPage() {
    return <AboutPageContent />;
}
