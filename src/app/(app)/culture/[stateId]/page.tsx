
'use client';

import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { statesData } from '@/lib/states-data';
import { Button } from '@/components/ui/button';
import { GenZToggle } from '@/components/genz-toggle';
import { SOSButton } from '@/components/sos-button';
import { motion, Variants } from 'framer-motion';
import { GlassCard } from '@/components/glass-card';

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { 
        opacity: 1, 
        y: 0, 
        transition: { 
            type: 'spring' as const, 
            damping: 20, 
            stiffness: 100 
        } 
    }
};

export default function StateCulturePage() {
    const params = useParams();
    const stateId = params.stateId as string;
    const state = statesData.find(s => s.id === stateId);

    if (!state) {
        notFound();
    }

    return (
        <div className="h-full flex flex-col bg-background/50">
            <header className="border-b border-white/10 p-4 md:p-6 flex items-center justify-between backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <SidebarTrigger className="md:hidden" />
                    <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-primary/10">
                        <Link href="/culture">
                            <ArrowLeft className="w-5 h-5" />
                            <span className="sr-only">Back</span>
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black italic tracking-tight">{state.name}</h1>
                        <p className="text-xs md:text-sm text-muted-foreground font-medium uppercase tracking-widest">Cultural Explorer</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <SOSButton />
                    <GenZToggle />
                    <ThemeToggle />
                </div>
            </header>

            <main className="flex-1 overflow-auto">
                <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="space-y-12 md:space-y-20"
                    >
                        {state.entries.map((entry, index) => (
                            <motion.div key={index} variants={itemVariants}>
                                <GlassCard 
                                    interactive={false}
                                    className="border-white/10 overflow-hidden shadow-2xl rounded-[2.5rem]"
                                >
                                    <div className="p-8 md:p-12 space-y-8">
                                        <div className="space-y-4">
                                            <h2 className="text-3xl md:text-5xl font-black italic tracking-tightest leading-tight">
                                                {entry.title}
                                            </h2>
                                            <div className="h-1.5 w-20 bg-primary rounded-full" />
                                        </div>

                                        {entry.youtubeUrl && (
                                            <div className="aspect-video overflow-hidden rounded-3xl border border-white/10 shadow-inner group">
                                                <iframe
                                                    className="w-full h-full grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700"
                                                    src={entry.youtubeUrl}
                                                    title={`Cultural video for ${entry.title}`}
                                                    frameBorder="0"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                    allowFullScreen
                                                ></iframe>
                                            </div>
                                        )}

                                        <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/90 font-medium leading-relaxed tracking-tight whitespace-pre-wrap">
                                            {entry.description}
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
