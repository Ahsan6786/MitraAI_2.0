
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { GenZToggle } from '@/components/genz-toggle';
import { SOSButton } from '@/components/sos-button';
import { Button } from '@/components/ui/button';
import { Loader2, Coins, CheckCircle2, Trophy, ArrowRight, Zap, Target, Star, Brain } from 'lucide-react';
import { tasksData, Task } from '@/lib/tasks-data';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/glass-card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface UserTaskStatus {
    [taskId: string]: {
        completed: boolean;
        completedAt?: Timestamp;
        rewarded?: boolean;
    };
}

const TaskCard = ({ task, status, onComplete, index }: { task: Task, status: { completed: boolean, rewarded?: boolean, completedAt?: Timestamp }, onComplete: (task: Task) => Promise<void>, index: number }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleAction = async () => {
        setIsSubmitting(true);
        if (task.actionUrl) {
            await onComplete(task);
            router.push(task.actionUrl);
        } else {
            await onComplete(task);
        }
        setIsSubmitting(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
        >
            <GlassCard className="h-full flex flex-col p-8 rounded-[2.5rem] border-white/10 group hover:border-primary/40 transition-all duration-500 overflow-hidden relative">
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity">
                    <Target className="w-24 h-24 text-white" />
                </div>

                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                             <Zap className="w-6 h-6 text-white group-hover:text-primary transition-colors" />
                        </div>
                        <Badge variant="outline" className="bg-white/5 border-white/10 text-[10px] font-black italic tracking-widest uppercase py-1 px-3">
                            {task.reward} TOKENS
                        </Badge>
                    </div>

                    <div className="space-y-2 mb-8">
                        <h3 className="text-xl font-black italic uppercase tracking-tighter text-white group-hover:text-primary transition-colors">
                            {task.title.toUpperCase()}
                        </h3>
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed line-clamp-2">
                            {task.description}
                        </p>
                    </div>

                    <div className="mt-auto">
                        {status.rewarded ? (
                            <div className="flex items-center gap-3 text-emerald-400 font-black italic text-[10px] tracking-widest uppercase bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl">
                                <CheckCircle2 className="w-4 h-4" />
                                SESSION_CALIBRATED_&_REWARDED
                            </div>
                        ) : status.completed ? (
                            <div className="flex items-center gap-3 text-amber-400 font-black italic text-[10px] tracking-widest uppercase bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                PENDING_NEURAL_VERIFICATION
                            </div>
                        ) : (
                            <Button 
                                onClick={handleAction} 
                                disabled={isSubmitting} 
                                className="w-full h-14 bg-white text-black font-black italic uppercase tracking-widest text-xs rounded-2xl transition-all active:scale-95 hover:bg-white/90"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        {task.actionUrl ? 'EXECUTE_PROTOCOL' : 'MARK_AS_RESOLVED'}
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </GlassCard>
        </motion.div>
    );
};

function RewardsPageContent() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [taskStatuses, setTaskStatuses] = useState<UserTaskStatus>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const tasksRef = collection(db, `users/${user.uid}/tasks`);
        const unsubscribe = onSnapshot(tasksRef, (snapshot) => {
            const statuses: UserTaskStatus = {};
            snapshot.forEach(doc => {
                statuses[doc.id] = doc.data() as { completed: boolean, rewarded: boolean, completedAt: Timestamp };
            });
            setTaskStatuses(statuses);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const handleCompleteTask = async (task: Task) => {
        if (!user) return;
        const taskRef = doc(db, `users/${user.uid}/tasks`, task.id);
        try {
            await setDoc(taskRef, {
                completed: true,
                completedAt: serverTimestamp(),
                rewarded: false,
            }, { merge: true });

            toast({
                title: "PROTOCOL_SUBMITTED",
                description: "Submission logged. Awaiting neural verification.",
            });
        } catch (error: any) {
            console.error("Error completing task:", error);
            toast({ title: "SYNC_ERROR", description: "Verification signal lost.", variant: "destructive" });
        }
    };
    
    return (
        <div className="min-h-screen flex flex-col bg-black text-white selection:bg-primary selection:text-black relative overflow-hidden">
            {/* Background Blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div 
                    animate={{ 
                        x: [0, 80, 0], 
                        y: [0, 120, 0],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px]" 
                />
            </div>

            <header className="sticky top-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl px-6 h-20 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-6">
                    <SidebarTrigger className="text-white/60 hover:text-white transition-colors" />
                    <div className="h-8 w-px bg-white/10 hidden md:block" />
                    <div className="flex flex-col">
                        <h1 className="text-xl font-black italic tracking-tighter leading-none uppercase">Rewards_Station.</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mt-1">Activity Calibration Hub</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <GenZToggle />
                    <ThemeToggle />
                    <SOSButton />
                </div>
            </header>

            <main className="flex-1 relative z-10 overflow-auto p-6 md:p-12 lg:p-20">
                <div className="mx-auto max-w-6xl space-y-20">
                     {/* Stats Hero */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <GlassCard className="p-10 md:p-16 rounded-[4rem] border-white/10 relative overflow-hidden group">
                           <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                                <div className="space-y-8">
                                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10">
                                        <Trophy className="w-5 h-5 text-amber-400" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Elite_Contributor</span>
                                    </div>
                                    <h1 className="text-6xl md:text-7xl lg:text-8xl font-black italic tracking-tightest leading-none uppercase">
                                        EARN.<br/>
                                        <span className="text-primary">EVOLVE.</span>
                                    </h1>
                                    <p className="text-xl text-muted-foreground font-medium max-w-md leading-relaxed">
                                        Complete neural benchmarks to optimize your standing within the MitraAI collective.
                                    </p>
                                </div>
                                <div className="flex justify-center md:justify-end">
                                    <div className="relative group">
                                        <motion.div 
                                            animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
                                            transition={{ duration: 4, repeat: Infinity }}
                                            className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"
                                        />
                                        <div className="relative w-64 h-64 bg-white/5 border border-white/10 rounded-[4rem] flex flex-col items-center justify-center p-8 backdrop-blur-xl group-hover:border-primary/40 transition-all duration-700">
                                            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-4">
                                                <Coins className="w-8 h-8 text-primary" />
                                            </div>
                                            <span className="text-5xl font-black italic tracking-tighter text-white">READY</span>
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mt-2">To Analyze submissions</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>

                    <div className="space-y-12">
                         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
                            <div>
                                <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-1">Available Missions</h2>
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Active Calibrations</p>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 italic">Syncing_Task_Stream...</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {tasksData.map((task, i) => (
                                    <TaskCard 
                                        key={task.id} 
                                        task={task} 
                                        status={taskStatuses[task.id] || { completed: false, rewarded: false }} 
                                        onComplete={handleCompleteTask} 
                                        index={i}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function RewardsPage() {
    return (
        <RewardsPageContent />
    )
}
