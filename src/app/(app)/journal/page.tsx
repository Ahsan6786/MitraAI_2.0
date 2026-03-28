
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, doc, deleteDoc, Timestamp, getDoc, runTransaction, increment } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, BookHeart, Trash2, Mic, PenSquare, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { predictUserMood } from '@/ai/flows/predict-user-mood';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from 'next/link';
import { GenZToggle } from '@/components/genz-toggle';

import { SOSButton } from '@/components/sos-button';
import { useRouter } from 'next/navigation';
import { ToastAction } from '@/components/ui/toast';

import { motion, Variants, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/glass-card';

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

interface JournalEntry {
  id: string;
  createdAt: Timestamp;
  type: 'text';
  mood: string;
  content: string;
  userId: string;
  reviewed: boolean;
  doctorReport?: string;
}

const TOKEN_COST = 10;

const getMoodEmoji = (mood: string) => {
    const m = mood.toLowerCase();
    if (m.includes('happy') || m.includes('joyful')) return '😄';
    if (m.includes('good') || m.includes('calm')) return '😊';
    if (m.includes('neutral')) return '😐';
    if (m.includes('anxious') || m.includes('stressed')) return '😟';
    if (m.includes('sad') || m.includes('angry')) return '😔';
    return '✨';
};

function JournalEntryCard({ entry }: { entry: JournalEntry }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const { toast } = useToast();

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, 'journalEntries', entry.id));
            toast({ title: "Entry Deleted", description: "Your reflection has been safely removed." });
        } catch (error) {
            console.error("Error deleting entry:", error);
            toast({ title: "Error", description: "Could not delete the entry.", variant: "destructive" });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <GlassCard interactive={false} className="border-white/10 overflow-hidden shadow-lg rounded-[2rem]">
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            {entry.type === 'text' ? <PenSquare className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </div>
                        <div>
                            <p className="text-white font-black italic tracking-tight">{entry.createdAt?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{entry.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button variant="ghost" size="icon" className="rounded-full hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors" disabled={isDeleting}>
                                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-black/90 backdrop-blur-2xl border-white/10 rounded-[2rem]">
                            <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-black italic">Delete this reflection?</AlertDialogTitle>
                            <AlertDialogDescription className="font-medium">
                                This memory will be permanently removed from your journey.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 rounded-full">Delete Forever</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
                
                <p className="text-gray-200 italic font-medium leading-relaxed mb-6 line-clamp-4">"{entry.content}"</p>
                
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                        <span className="text-lg">{getMoodEmoji(entry.mood)}</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{entry.mood}</span>
                    </div>
                    
                    {entry.reviewed ? (
                        <Link href="/reports" className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-green-500 hover:text-green-400 transition-colors">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Clinical Review Ready</span>
                        </Link>
                    ) : (
                         <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                            <Loader2 className="w-3.5 h-3.5 animate-pulse" />
                            <span>Pending Review</span>
                        </div>
                    )}
                </div>
            </div>
        </GlassCard>
    )
}

function JournalPageContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [entry, setEntry] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'journalEntries'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const userEntries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JournalEntry));
        setEntries(userEntries);
        setIsLoadingEntries(false);
      }, (error) => {
        console.error("Error fetching journal entries:", error);
        toast({ title: "Error", description: "Could not fetch your journal entries.", variant: "destructive" });
        setIsLoadingEntries(false);
      });
      return () => unsubscribe();
    }
  }, [user, toast]);

  const handleSaveTextEntry = async () => {
    if (!entry.trim() || !user) return;
    setIsSubmitting(true);
    
    const userDocRef = doc(db, 'users', user.uid);

    try {
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        if (!userDoc.exists()) {
          throw "User document does not exist!";
        }
        const currentTokens = userDoc.data().tokens || 0;
        if (currentTokens < TOKEN_COST) {
          throw new Error("Insufficient tokens.");
        }

        transaction.update(userDocRef, { tokens: increment(-TOKEN_COST) });

        const moodResult = await predictUserMood({ journalEntry: entry });

        const newEntryRef = doc(collection(db, 'journalEntries'));
        transaction.set(newEntryRef, {
          userId: user.uid,
          userEmail: user.email,
          type: 'text',
          content: entry,
          mood: moodResult.mood,
          confidence: moodResult.confidence,
          createdAt: serverTimestamp(),
          reviewed: false,
          doctorReport: null,
        });

        toast({ title: "Reflection Saved", description: `Captured your mood as ${moodResult.mood}.` });
      });

      setEntry('');

    } catch (error: any) {
      console.error("Error saving entry:", error);
      if (error.message.includes("Insufficient tokens")) {
        toast({
            title: "Insufficient Energy",
            description: "Request a recharge to continue processing your soul-mate reflections.",
            variant: "destructive",
            action: <ToastAction altText="Recharge" onClick={() => router.push('/reports')}>Recharge</ToastAction>,
        });
      } else {
        toast({ title: "Error saving entry", description: error.message, variant: "destructive" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="h-full flex flex-col bg-background/50">
      <header className="border-b border-white/10 p-4 md:p-6 flex items-center justify-between backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <div>
              <h1 className="text-xl md:text-2xl font-black italic tracking-tight">Personal Journal</h1>
              <p className="text-xs md:text-sm text-muted-foreground font-medium uppercase tracking-widest">A Sacred Space for Your Soul</p>
            </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
            <SOSButton />
            <div className="hidden xs:block">
                <GenZToggle />
            </div>
            <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 md:p-10">
        <div className="max-w-7xl mx-auto grid gap-12 lg:grid-cols-5">
          {/* Left Column: Entry Form */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3 space-y-8"
          >
             <GlassCard interactive={false} className="border-primary/20 rounded-[3rem] overflow-hidden">
                <div className="p-8">
                    <div className="space-y-4 mb-8">
                        <h2 className="text-2xl sm:text-3xl font-black italic tracking-tighter flex items-center gap-3">
                            <PenSquare className="w-6 h-6 sm:w-8 sm:h-8 text-primary"/> 
                            What's unfolding within?
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                            Share your truth. Your journey is analyzed with care & precision.
                        </p>
                    </div>
                    
                    <div className="relative group">
                        <Textarea
                            placeholder="Pour your thoughts here..."
                            className="bg-white/5 border-2 border-white/10 rounded-[2rem] p-5 sm:p-8 text-base sm:text-lg font-medium min-h-[250px] sm:min-h-[400px] focus-visible:ring-primary/30 transition-all placeholder:text-muted-foreground/30 leading-relaxed"
                            value={entry}
                            onChange={(e) => setEntry(e.target.value)}
                            disabled={isSubmitting}
                        />
                        <div className="absolute bottom-6 right-6 sm:right-8 flex items-center gap-3 sm:gap-4 flex-wrap justify-end">
                             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">Cost: {TOKEN_COST} Energy</span>
                             <Button 
                                onClick={handleSaveTextEntry} 
                                disabled={isSubmitting || !entry.trim()}
                                className="rounded-full bg-primary hover:bg-primary/90 text-white font-black italic px-8 sm:px-10 h-11 sm:h-12 shadow-xl shadow-primary/20 transition-all active:scale-95 text-xs sm:text-sm"
                             >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Reflection"}
                            </Button>
                        </div>
                    </div>
                </div>
            </GlassCard>

             <motion.div 
                whileHover={{ y: -5 }}
                className="p-6 rounded-[2rem] bg-amber-500/10 border border-amber-500/20 backdrop-blur-3xl"
             >
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-500">
                        <AlertTriangle className="w-6 h-6"/>
                    </div>
                    <div>
                        <h3 className="text-lg font-black italic text-amber-500 tracking-tight mb-1">Clinical Support Pathway</h3>
                        <p className="text-sm text-amber-700/80 dark:text-amber-200/60 font-medium leading-relaxed">
                           Your reflections are securely shared with our network of certified specialists once saved. Clinical insights will appear in your <Link href="/reports" className="text-amber-600 dark:text-amber-400 font-bold underline decoration-2 underline-offset-4">Health Nexus</Link> within 24 hours.
                        </p>
                    </div>
                </div>
             </motion.div>
          </motion.div>

          {/* Right Column: Past Entries */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-8"
          >
            <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-black italic tracking-tight">Timeline</h2>
                <span className="bg-primary/20 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{entries.length} reflections</span>
            </div>
            
             <div className="max-h-[85vh] overflow-y-auto pr-2 custom-scrollbar">
                 {isLoadingEntries ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Recalling Memories</p>
                    </div>
                ) : entries.length === 0 ? (
                    <div className="text-center py-20 px-6 border-2 border-dashed border-white/5 rounded-[3rem]">
                        <BookHeart className="mx-auto w-16 h-16 text-muted-foreground/20 mb-6"/>
                        <h3 className="text-xl font-black italic text-muted-foreground mb-1">Silence Speaks</h3>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/40">
                            Begin your chronicle of growth
                        </p>
                    </div>
                ) : (
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="space-y-6"
                    >
                        {entries.map(e => (
                            <motion.div key={e.id} variants={itemVariants}>
                                <JournalEntryCard entry={e} />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
             </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default function JournalPage() {
    return <JournalPageContent />;
}

    

    