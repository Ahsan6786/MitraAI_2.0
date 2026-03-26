'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BarChart, LineChart, LayoutDashboard } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Bar, BarChart as RechartsBarChart, Line, LineChart as RechartsLineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { subDays, format, eachDayOfInterval, startOfDay } from 'date-fns';
import { ThemeToggle } from '@/components/theme-toggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GenZToggle } from '@/components/genz-toggle';
import SectionIntroAnimation from '@/components/section-intro-animation';
import { SOSButton } from '@/components/sos-button';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { GlassCard } from '@/components/glass-card';

interface JournalEntry {
    id: string;
    createdAt: Timestamp;
    mood: string;
}

const moodToValue = (mood: string): number => {
    const lowerMood = mood.toLowerCase();
    if (lowerMood.includes('happy') || lowerMood.includes('joyful') || lowerMood.includes('excited')) return 5;
    if (lowerMood.includes('good') || lowerMood.includes('calm')) return 4;
    if (lowerMood.includes('neutral')) return 3;
    if (lowerMood.includes('anxious') || lowerMood.includes('stressed')) return 2;
    if (lowerMood.includes('sad') || lowerMood.includes('angry')) return 1;
    return 3;
};

const valueToEmoji = (value: number): string => {
    switch (value) {
        case 1: return '😔';
        case 2: return '😟';
        case 3: return '😐';
        case 4: return '😊';
        case 5: return '😄';
        default: return '';
    }
};

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

function DashboardPageContent() {
    const { user } = useAuth();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [moodFrequencyData, setMoodFrequencyData] = useState<any[]>([]);
    const [moodTrendData7, setMoodTrendData7] = useState<any[]>([]);
    const [moodTrendData30, setMoodTrendData30] = useState<any[]>([]);

    useEffect(() => {
        if (user) {
            const thirtyDaysAgo = subDays(new Date(), 30);
            const q = query(
                collection(db, 'journalEntries'),
                where('userId', '==', user.uid),
                where('createdAt', '>=', thirtyDaysAgo),
                orderBy('createdAt', 'desc')
            );

            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const entriesData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                } as JournalEntry));
                setEntries(entriesData);
                setIsLoading(false);
            }, (error) => {
                console.error("Error fetching entries: ", error);
                setIsLoading(false);
            });

            return () => unsubscribe();
        } else {
             setIsLoading(false);
        }
    }, [user]);
    
    useEffect(() => {
        if (entries.length > 0) {
            const moodCounts = entries.reduce((acc, entry) => {
                const mood = entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1);
                acc[mood] = (acc[mood] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const frequencyData = Object.keys(moodCounts).map(mood => ({
                name: mood,
                count: moodCounts[mood],
            }));
            setMoodFrequencyData(frequencyData);

            const processTrendData = (days: number) => {
                const interval = eachDayOfInterval({
                    start: subDays(new Date(), days - 1),
                    end: new Date()
                });

                const dailyAverages = new Map<string, { total: number; count: number }>();

                entries.forEach(entry => {
                    const entryDate = startOfDay(entry.createdAt.toDate());
                    const entryDateString = format(entryDate, 'yyyy-MM-dd');
                    if (dailyAverages.has(entryDateString)) {
                        const current = dailyAverages.get(entryDateString)!;
                        current.total += moodToValue(entry.mood);
                        current.count += 1;
                    } else {
                        dailyAverages.set(entryDateString, { total: moodToValue(entry.mood), count: 1 });
                    }
                });

                return interval.map(date => {
                    const dateString = format(date, 'yyyy-MM-dd');
                    const dayData = dailyAverages.get(dateString);
                    return {
                        name: format(date, days === 7 ? 'EEE' : 'MMM d'),
                        mood: dayData ? parseFloat((dayData.total / dayData.count).toFixed(2)) : null,
                    };
                });
            }
            
            setMoodTrendData7(processTrendData(7));
            setMoodTrendData30(processTrendData(30));
        }
    }, [entries]);

    return (
        <div className="h-full flex flex-col bg-background/50">
            <header className="border-b border-white/10 p-4 md:p-6 flex items-center justify-between backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <SidebarTrigger className="md:hidden" />
                    <div>
                        <h1 className="text-xl md:text-2xl font-black italic tracking-tight">Wellness Dashboard</h1>
                        <p className="text-xs md:text-sm text-muted-foreground font-medium uppercase tracking-widest">Visualize Your Journey</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <SOSButton />
                    <GenZToggle />
                    <ThemeToggle />
                </div>
            </header>

            <main className="flex-1 overflow-auto p-4 md:p-8">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                ) : entries.length === 0 ? (
                    <div className="flex justify-center items-center h-[calc(100vh-200px)]">
                        <GlassCard className="text-center p-12 max-w-lg">
                            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <LineChart className="w-10 h-10 text-primary animate-pulse"/>
                            </div>
                            <h2 className="text-2xl font-black italic mb-2 tracking-tight">Awaiting Your First Entry</h2>
                            <p className="text-muted-foreground font-medium mb-8">
                                Start adding journal entries to see your mood patterns visualized here. Your soul ally is ready to analyze.
                            </p>
                            <Button asChild className="rounded-full px-8">
                                <Link href="/journal">Go to Journal</Link>
                            </Button>
                        </GlassCard>
                    </div>
                ) : (
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="max-w-7xl mx-auto space-y-8"
                    >
                        <motion.div variants={itemVariants}>
                            <GlassCard interactive={false} className="p-1 border-white/10 overflow-hidden">
                                <div className="p-6">
                                    <Tabs defaultValue="weekly">
                                        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                                            <div className="space-y-1">
                                                <h2 className="text-xl font-black italic tracking-tight">Mood Trends</h2>
                                                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Progress Visualization</p>
                                            </div>
                                            <TabsList className="bg-background/20 backdrop-blur-md border border-white/10 rounded-full p-1 h-auto">
                                                <TabsTrigger value="weekly" className="rounded-full px-6 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-xs uppercase tracking-widest">7 Days</TabsTrigger>
                                                <TabsTrigger value="monthly" className="rounded-full px-6 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-xs uppercase tracking-widest">30 Days</TabsTrigger>
                                            </TabsList>
                                        </div>
                                        <TabsContent value="weekly">
                                            <div className="w-full h-[400px]">
                                                <ResponsiveContainer>
                                                    <RechartsLineChart data={moodTrendData7} margin={{ top: 20, right: 30, left: -10, bottom: 5 }}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.1)" />
                                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600}} dy={10} />
                                                        <YAxis domain={[0.5, 5.5]} ticks={[1,2,3,4,5]} tickFormatter={valueToEmoji} axisLine={false} tickLine={false} width={50} />
                                                        <Tooltip
                                                            contentStyle={{
                                                                background: 'rgba(0,0,0,0.8)',
                                                                backdropFilter: 'blur(10px)',
                                                                border: '1px solid rgba(255,255,255,0.1)',
                                                                borderRadius: '20px',
                                                                padding: '12px'
                                                            }}
                                                            itemStyle={{ color: '#fff', fontWeight: 800 }}
                                                        />
                                                        <Line type="monotone" dataKey="mood" stroke="hsl(var(--primary))" strokeWidth={4} connectNulls dot={{r: 6, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8, strokeWidth: 0}} />
                                                    </RechartsLineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </TabsContent>
                                        <TabsContent value="monthly">
                                             <div className="w-full h-[400px]">
                                                 <ResponsiveContainer>
                                                    <RechartsLineChart data={moodTrendData30} margin={{ top: 20, right: 30, left: -10, bottom: 5 }}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.1)" />
                                                        <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} interval="preserveStartEnd" dy={10} />
                                                        <YAxis domain={[0.5, 5.5]} ticks={[1,2,3,4,5]} tickFormatter={valueToEmoji} axisLine={false} tickLine={false} width={50} />
                                                        <Tooltip
                                                            contentStyle={{
                                                                background: 'rgba(0,0,0,0.8)',
                                                                backdropFilter: 'blur(10px)',
                                                                border: '1px solid rgba(255,255,255,0.1)',
                                                                borderRadius: '20px'
                                                            }}
                                                        />
                                                        <Line type="monotone" dataKey="mood" stroke="hsl(var(--primary))" strokeWidth={3} connectNulls dot={false} activeDot={{r: 6}} />
                                                    </RechartsLineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            </GlassCard>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <motion.div variants={itemVariants} className="md:col-span-2">
                                <GlassCard interactive={false} className="border-white/10 p-8 h-full">
                                    <div className="flex flex-col h-full">
                                        <div className="mb-8">
                                            <h2 className="text-xl font-black italic tracking-tight flex items-center gap-2">
                                                <BarChart className="w-6 h-6 text-primary"/>
                                                Mood Frequency
                                            </h2>
                                            <p className="text-xs text-muted-foreground font-bold mt-1 uppercase tracking-widest">30-Day Distribution</p>
                                        </div>
                                        <div className="flex-1 min-h-[300px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RechartsBarChart data={moodFrequencyData}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.1)" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontWeight: 600}} dy={10} />
                                                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                                                    <Tooltip 
                                                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                                        contentStyle={{
                                                            background: 'rgba(0,0,0,0.8)',
                                                            backdropFilter: 'blur(10px)',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            borderRadius: '20px'
                                                        }}
                                                    />
                                                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[12, 12, 0, 0]} />
                                                </RechartsBarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>

                            <motion.div variants={itemVariants}>
                                <GlassCard interactive={false} className="border-white/10 p-8 h-full bg-primary/5">
                                    <h2 className="text-lg font-black italic tracking-tight mb-4">Quick Insights</h2>
                                    <div className="space-y-6">
                                        <div className="p-4 rounded-3xl bg-background/40 border border-white/10">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Most Frequent Mood</p>
                                            <p className="text-2xl font-black italic text-primary">
                                                {moodFrequencyData.sort((a,b) => b.count - a.count)[0]?.name || '---'}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-3xl bg-background/40 border border-white/10">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Entries</p>
                                            <p className="text-2xl font-black italic text-secondary">
                                                {entries.length}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-3xl bg-primary/20 border border-primary/20">
                                            <p className="text-sm font-bold text-primary-foreground leading-snug">
                                                "Your emotional awareness is growing. You're doing great!"
                                            </p>
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </main>
        </div>
    );
}

export default function DashboardPage() {
    const [isClient, setIsClient] = useState(false);
    const [showIntro, setShowIntro] = useState(true);
    const SESSION_KEY = 'hasSeenDashboardIntro';

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
            icon={<LayoutDashboard className="w-full h-full" />}
            title="Dashboard"
            subtitle="Visualize your mood patterns."
        />;
    }

    return <DashboardPageContent />;
}
