
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Loader2, Newspaper, Sparkles, RefreshCw, ArrowLeft, Brain, Zap, Globe, Share2 } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { generateAiNews, GenerateAiNewsOutput } from '@/ai/flows/generate-ai-news';
import { generateImage } from '@/ai/flows/generate-image';
import { useToast } from '@/hooks/use-toast';
import { GenZToggle } from '@/components/genz-toggle';
import SectionIntroAnimation from '@/components/section-intro-animation';
import { SOSButton } from '@/components/sos-button';
import { GlassCard } from '@/components/glass-card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface NewsArticle {
    id: number;
    text: GenerateAiNewsOutput;
    imageUrl: string;
    timestamp: Date;
}

const BATCH_SIZE = 3;

function NewsPageContent() {
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [isGenerating, setIsGenerating] = useState(true);
    const [isGeneratingMore, setIsGeneratingMore] = useState(false);
    const { toast } = useToast();

    const generateAndAddArticles = useCallback(async (count: number) => {
        const isInitialLoad = articles.length === 0;
        if (isInitialLoad) {
            setIsGenerating(true);
        } else {
            setIsGeneratingMore(true);
        }

        try {
            const articlePromises = Array.from({ length: count }).map(async (_, index) => {
                const newsText = await generateAiNews();
                const imageResult = await generateImage({ prompt: newsText.imagePrompt });
                return {
                    id: Date.now() + index,
                    text: newsText,
                    imageUrl: imageResult.imageUrl,
                    timestamp: new Date(),
                };
            });

            const newArticles = await Promise.all(articlePromises);
            setArticles(prev => [...prev, ...newArticles]);

        } catch (error) {
            console.error("Failed to generate AI news:", error);
            toast({
                title: "SYNC_INTERRUPTED",
                description: "Collective intelligence downlink failed. Retrying signal.",
                variant: "destructive",
            });
        } finally {
            setIsGenerating(false);
            setIsGeneratingMore(false);
        }
    }, [toast, articles.length]);
    
    useEffect(() => {
        if (articles.length === 0) {
           generateAndAddArticles(BATCH_SIZE);
        }
    }, []);

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
                    className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px]" 
                />
            </div>

            <header className="sticky top-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl px-6 h-20 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-6">
                    <SidebarTrigger className="text-white/60 hover:text-white transition-colors" />
                    <div className="h-8 w-px bg-white/10 hidden md:block" />
                    <div className="flex flex-col">
                    <h1 className="text-xl font-black italic tracking-tighter leading-none uppercase">Collective_Intelligence.</h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mt-1">Global AI Sentiment Feed</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <GenZToggle />
                    <ThemeToggle />
                    <SOSButton />
                </div>
            </header>

            <main className="flex-1 relative z-10 overflow-auto p-6 md:p-12 lg:p-20">
                <div className="mx-auto max-w-5xl space-y-16">
                    {isGenerating && articles.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-40 text-center space-y-8">
                             <div className="relative">
                                <motion.div 
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"
                                />
                                <Loader2 className="w-16 h-16 animate-spin text-primary relative z-10" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-2xl font-black italic uppercase tracking-tightest">Synchronizing_Hub...</p>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Aggregating global sentiment data</p>
                            </div>
                        </div>
                    )}
                    
                    <div className="space-y-24">
                        <AnimatePresence>
                            {articles.map((article, index) => (
                                <motion.div 
                                    key={article.id}
                                    initial={{ opacity: 0, y: 40 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <GlassCard className="p-0 rounded-[3rem] overflow-hidden group border-white/10 hover:border-primary/30 transition-all duration-700">
                                        <div className="grid grid-cols-1 lg:grid-cols-12">
                                            <div className="lg:col-span-5 relative h-80 lg:h-auto group-hover:scale-105 transition-transform duration-700">
                                                <Image src={article.imageUrl} alt={article.text.headline} layout="fill" objectFit="cover" className="grayscale group-hover:grayscale-0 transition-all duration-700" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent lg:bg-gradient-to-r" />
                                                <div className="absolute top-6 left-6 flex gap-2">
                                                    <Badge className="bg-white text-black font-black italic text-[8px] tracking-widest uppercase py-1 px-3 rounded-full">AI_EXCLUSIVE</Badge>
                                                </div>
                                            </div>
                                            <div className="lg:col-span-7 p-8 md:p-12 flex flex-col justify-between space-y-8">
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-4 text-primary/60">
                                                        <Globe className="w-4 h-4" />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">{article.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                    </div>
                                                    <h2 className="text-3xl md:text-5xl font-black italic tracking-tightest leading-tight text-white group-hover:text-primary transition-colors uppercase">
                                                        {article.text.headline}
                                                    </h2>
                                                    <div className="prose prose-invert prose-sm font-medium leading-relaxed text-white/60 line-clamp-4">
                                                        {article.text.article}
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                    <Button variant="ghost" className="text-xs font-black italic tracking-widest text-primary hover:text-white transition-colors group/btn">
                                                        READ_FULL_TRANSCRIPT 
                                                        <ArrowLeft className="ml-2 h-4 w-4 rotate-180 group-hover/btn:translate-x-2 transition-transform" />
                                                    </Button>
                                                    <div className="flex gap-2">
                                                        <Button size="icon" variant="ghost" className="h-10 w-10 border border-white/10 rounded-xl hover:bg-white/5 text-white/40 hover:text-white">
                                                            <Share2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {!isGenerating && articles.length > 0 && (
                         <div className="text-center py-12">
                            <Button 
                                onClick={() => generateAndAddArticles(BATCH_SIZE)}
                                disabled={isGeneratingMore}
                                variant="ghost"
                                className="h-16 px-12 rounded-2.5rem border border-white/10 font-black italic text-xs tracking-widest text-white hover:bg-white/5 transition-all active:scale-95"
                            >
                                {isGeneratingMore ? (
                                    <Loader2 className="mr-3 h-5 w-5 animate-spin"/>
                                ) : (
                                    <RefreshCw className="mr-3 h-5 w-5"/>
                                )}
                                {isGeneratingMore ? 'EXPANDING_NEURAL_NETWORK...' : 'EXPAND_INTELLIGENCE_FEED'}
                            </Button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function NewsPage() {
    const [isClient, setIsClient] = useState(false);
    const [showIntro, setShowIntro] = useState(true);
    const SESSION_KEY = 'hasSeenNewsIntro';

    useEffect(() => {
        setIsClient(true);
        const hasSeen = sessionStorage.getItem(SESSION_KEY);
        if (hasSeen) {
            setShowIntro(false);
        }
    }, []);

    const handleIntroFinish = () => {
        sessionStorage.setItem(SESSION_KEY, 'true');
        setShowIntro(false);
    };

    if (!isClient) {
        return null;
    }
    
    if (showIntro) {
        return <SectionIntroAnimation 
            onFinish={handleIntroFinish} 
            icon={<Globe className="w-full h-full" />}
            title="Collective Intelligence"
            subtitle="The global pulse of AI sentiment."
        />;
    }

    return <NewsPageContent />;
}
