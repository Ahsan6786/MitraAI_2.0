'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, runTransaction, increment } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, CalendarPlus, Mail, Phone, Calendar as CalendarIcon, AlertTriangle } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { GenZToggle } from '@/components/genz-toggle';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SOSButton } from '@/components/sos-button';
import { ToastAction } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/glass-card';
import { motion, AnimatePresence } from 'framer-motion';

interface Counsellor {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
}

const issueTypes = [
    "Stress",
    "Depression",
    "Academic Pressure",
    "Relationship Issues",
    "Sleep Issues",
    "Other"
];

const TOKEN_COST = 50;

// Generates a user-friendly random code
const generateStudentCode = () => {
    const adjectives = ["Brave", "Calm", "Wise", "Kind", "Strong", "Happy", "Proud"];
    const nouns = ["Lion", "Eagle", "River", "Star", "Tree", "Fox", "Wolf"];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(100 + Math.random() * 900);
    return `${adjective}${noun}${number}`;
}

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

function BookingDialog({ counsellor, user, isOpen, onOpenChange }: { counsellor: Counsellor | null, user: any, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [hour, setHour] = useState('');
    const [minute, setMinute] = useState('');
    const [ampm, setAmPm] = useState('');
    const [issueType, setIssueType] = useState('');
    const [notes, setNotes] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isBooking, setIsBooking] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const resetForm = () => {
        setDate(undefined);
        setHour('');
        setMinute('');
        setAmPm('');
        setIssueType('');
        setNotes('');
        setIsAnonymous(false);
    };

    const handleBooking = async () => {
        if (!counsellor || !user || !date || !hour || !minute || !ampm || !issueType) {
            toast({ title: 'Please fill all required fields.', variant: 'destructive' });
            return;
        }
        setIsBooking(true);

        const studentCode = isAnonymous ? generateStudentCode() : null;
        const userDocRef = doc(db, 'users', user.uid);
        const bookingsCollectionRef = collection(db, 'bookings');

        try {
            const bookingDocRef = await runTransaction(db, async (transaction) => {
                if (!isAnonymous) {
                    const userDoc = await transaction.get(userDocRef);
                    if (!userDoc.exists()) {
                        throw "User document not found.";
                    }
                    const currentTokens = userDoc.data().tokens || 0;
                    if (currentTokens < TOKEN_COST) {
                        throw new Error("Insufficient tokens.");
                    }
                    transaction.update(userDocRef, { tokens: increment(-TOKEN_COST) });
                }
                
                const time = `${hour}:${minute} ${ampm}`;
                const newBooking = {
                    student_id: isAnonymous ? null : user.uid,
                    student_email: isAnonymous ? null : user.email,
                    student_phone: isAnonymous ? null : (user.phoneNumber || null),
                    student_code: studentCode,
                    counsellor_id: counsellor.id,
                    counsellor_name: counsellor.name,
                    counsellor_email: counsellor.email,
                    counsellor_avatar: counsellor.avatarUrl || null,
                    appointment_date: format(date, 'yyyy-MM-dd'),
                    appointment_time: time,
                    appointment_status: 'Pending',
                    is_anonymous: isAnonymous,
                    issue_type: issueType,
                    meet_link: null,
                    student_notes: notes,
                    counsellor_notes: null,
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp(),
                };
                
                const newBookingRef = doc(bookingsCollectionRef);
                transaction.set(newBookingRef, newBooking);
                return newBookingRef;
            });
            
            let toastDescription = 'Your request has been sent to the counsellor.';
            if (isAnonymous && studentCode) {
                toastDescription += ` Your anonymous code is ${studentCode}. Please save it.`;
                const anonymousBookingIds = JSON.parse(localStorage.getItem('anonymousBookingIds') || '[]');
                anonymousBookingIds.push(bookingDocRef.id);
                localStorage.setItem('anonymousBookingIds', JSON.stringify(anonymousBookingIds));
            } else {
                 toastDescription += ` ${TOKEN_COST} tokens have been deducted.`;
            }

            toast({ title: 'Appointment Booked!', description: toastDescription });
            onOpenChange(false);
            resetForm();
        } catch (error: any) {
            console.error('Error booking appointment:', error);
            if (error.message.includes("Insufficient tokens")) {
                toast({
                    title: "Insufficient Tokens",
                    description: "You need 50 tokens for this. Please ask your doctor for a recharge.",
                    variant: "destructive",
                    action: <ToastAction altText="Message Doctor" onClick={() => router.push('/reports')}>Message Doctor</ToastAction>,
                });
            } else {
                 toast({ 
                    title: 'Booking Failed', 
                    description: error.message, 
                    variant: 'destructive' 
                });
            }
        } finally {
            setIsBooking(false);
        }
    };

    if (!counsellor) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl bg-black/90 backdrop-blur-3xl border-white/10 p-0 overflow-hidden rounded-[2.5rem]">
                <div className="p-8 pt-10 space-y-8 relative">
                    <div className="absolute top-0 right-0 p-8">
                        <div className="bg-primary/10 px-4 py-2 rounded-full backdrop-blur-md border border-primary/20">
                             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{TOKEN_COST} Tokens</span>
                        </div>
                    </div>

                    <DialogHeader className="text-left">
                        <DialogTitle className="text-3xl font-black italic tracking-tight text-white capitalize">Secure your <span className="text-primary italic">Session.</span></DialogTitle>
                        <DialogDescription className="text-base text-muted-foreground/80 font-medium pt-2">
                            Select a preferred timeline to connect with {counsellor.name}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                            <div className="space-y-0.5">
                                <Label htmlFor="anonymous-mode" className="text-sm font-bold text-white">Ghost Mode</Label>
                                <p className="text-[10px] text-muted-foreground font-medium">Keep your identity completely anonymous.</p>
                            </div>
                            <Switch id="anonymous-mode" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                        </div>

                        {isAnonymous && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-start gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4"
                            >
                                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500 mt-0.5"/>
                                <p className="text-xs text-amber-200/70 font-medium leading-relaxed">
                                    Your profile details will be masked. You'll receive a unique hash code to track the status. Tokens are waived for anonymous sessions.
                                </p>
                            </motion.div>
                        )}

                        <div className="grid gap-4">
                            <Select onValueChange={setIssueType} value={issueType}>
                                <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/5 text-white font-medium hover:bg-white/10 transition-all">
                                    <SelectValue placeholder="What's on your mind?" />
                                </SelectTrigger>
                                <SelectContent className="rounded-[1.5rem] bg-black/95 backdrop-blur-3xl border-white/10">
                                    {issueTypes.map(type => <SelectItem key={type} value={type} className="rounded-xl focus:bg-primary/20">{type}</SelectItem>)}
                                </SelectContent>
                            </Select>

                            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "h-14 rounded-2xl bg-white/5 border-white/5 justify-start text-left font-medium hover:bg-white/10 transition-all",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-3 h-5 w-5 text-primary" />
                                        {date ? format(date, "PPP") : <span>Select Date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 rounded-[2rem] bg-black/95 backdrop-blur-3xl border-white/10 overflow-hidden shadow-2xl">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={(selectedDate) => {
                                            setDate(selectedDate);
                                            setIsCalendarOpen(false);
                                        }}
                                        disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                                        initialFocus
                                        className="p-4"
                                    />
                                </PopoverContent>
                            </Popover>

                            <div className="grid grid-cols-3 gap-3">
                                <Select onValueChange={setHour} value={hour}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/5 text-white font-medium hover:bg-white/10"><SelectValue placeholder="HH" /></SelectTrigger>
                                    <SelectContent className="rounded-2xl bg-black border-white/10">
                                        {Array.from({ length: 12 }, (_, i) => <SelectItem key={i+1} value={(i + 1).toString().padStart(2, '0')} className="rounded-lg">{(i + 1).toString().padStart(2, '0')}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select onValueChange={setMinute} value={minute}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/5 text-white font-medium hover:bg-white/10"><SelectValue placeholder="MM" /></SelectTrigger>
                                    <SelectContent className="rounded-2xl bg-black border-white/10">
                                        {['00', '15', '30', '45'].map(m => <SelectItem key={m} value={m} className="rounded-lg">{m}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select onValueChange={setAmPm} value={ampm}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/5 text-white font-medium hover:bg-white/10"><SelectValue placeholder="AM/PM" /></SelectTrigger>
                                    <SelectContent className="rounded-2xl bg-black border-white/10">
                                        <SelectItem value="AM" className="rounded-lg">AM</SelectItem>
                                        <SelectItem value="PM" className="rounded-lg">PM</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Textarea 
                                placeholder="Any context for the counsellor? (optional)" 
                                className="min-h-[120px] rounded-2xl bg-white/5 border-white/5 text-white font-medium placeholder:text-muted-foreground/40 resize-none focus-visible:ring-primary/20" 
                                value={notes} 
                                onChange={e => setNotes(e.target.value)} 
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isBooking} className="flex-1 h-14 rounded-2xl text-muted-foreground font-black italic hover:bg-white/5">Cancel</Button>
                        <Button type="submit" onClick={handleBooking} disabled={isBooking} className="flex-[2] h-14 rounded-2xl bg-white text-black hover:bg-white/90 font-black italic shadow-xl transition-all active:scale-95">
                            {isBooking ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CalendarPlus className="mr-2 h-5 w-5" />}
                            Book Appointment
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default function BookingPage() {
    const { user } = useAuth();
    const [counsellors, setCounsellors] = useState<Counsellor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCounsellor, setSelectedCounsellor] = useState<Counsellor | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        const fetchCounsellors = async () => {
            try {
                const q = query(collection(db, 'counsellors'), where('status', '==', 'approved'));
                const querySnapshot = await getDocs(q);
                const newNames = ["Dr. Rajesh Joshi", "Dr. Vivek Patil"];
                
                const counsellorsData = querySnapshot.docs.map((doc, index) => {
                    const data = doc.data();
                    const avatarUrl = 'https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg';
                    return { 
                        id: doc.id, 
                        ...data,
                        name: newNames[index] || data.name,
                        avatarUrl 
                    } as Counsellor
                });
                
                setCounsellors(counsellorsData);
            } catch (error) {
                console.error("Error fetching counsellors:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCounsellors();
    }, []);

    const handleBookClick = (counsellor: Counsellor) => {
        setSelectedCounsellor(counsellor);
        setIsDialogOpen(true);
    };
    
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
                        <h1 className="text-2xl font-black italic tracking-tighter text-white">Booking Center</h1>
                        <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground/60">Registry Portal Online</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <SOSButton />
                    <GenZToggle />
                    <ThemeToggle />
                </div>
            </header>

            <main className="flex-1 overflow-auto p-6 md:p-12 lg:p-16">
                 <div className="max-w-6xl mx-auto space-y-16">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center space-y-4 max-w-3xl mx-auto"
                    >
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black italic tracking-tightest leading-tight text-white capitalize">
                            Professional <span className="text-primary italic">Soul Care.</span>
                        </h1>
                        <p className="text-xl text-muted-foreground/80 font-medium leading-relaxed">
                            Connect with verified clinical trauma specialists for immersive psychological support and therapy sessions.
                        </p>
                    </motion.div>

                    {isLoading ? (
                        <div className="flex justify-center items-center py-24">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full border-t-2 border-primary animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 animate-pulse" />
                                </div>
                            </div>
                        </div>
                    ) : counsellors.length === 0 ? (
                        <GlassCard className="text-center p-16 max-w-lg mx-auto space-y-8">
                            <div className="bg-primary/10 p-6 rounded-[2rem] w-fit mx-auto">
                                <CalendarPlus className="w-12 h-12 text-primary opacity-60"/>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black italic tracking-tight text-white">No Specialists Available</h3>
                                <p className="text-muted-foreground font-medium">All clinical channels are currently busy. Please monitor the portal for upcoming availability.</p>
                            </div>
                        </GlassCard>
                    ) : (
                        <motion.div 
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
                        >
                            {counsellors.map(c => (
                                <motion.div key={c.id} variants={itemVariants}>
                                    <GlassCard className="h-full flex flex-col group hover:border-primary/30 transition-all duration-500 relative overflow-hidden">
                                        <div className="absolute -right-8 -top-8 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                                        
                                        <div className="p-8 flex flex-col h-full space-y-8 relative z-10">
                                            <div className="flex items-center gap-5">
                                                <div className="relative">
                                                     <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-transparent rounded-[1.5rem] opacity-20 group-hover:opacity-40 transition-opacity" />
                                                     <Avatar className="w-16 h-16 rounded-2xl border-2 border-white/10 shadow-lg relative z-10">
                                                        <AvatarImage src={c.avatarUrl} alt={c.name} />
                                                        <AvatarFallback className="bg-white/5 text-xl font-black">{c.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black italic tracking-tight text-white group-hover:text-primary transition-colors">{c.name}</h3>
                                                    <p className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground/60">Clinical Specialist</p>
                                                </div>
                                            </div>

                                            <div className="space-y-4 pt-4 border-t border-white/5">
                                                <div className="flex items-center gap-3 text-sm text-muted-foreground/80 group-hover:text-white transition-colors">
                                                    <div className="bg-white/5 p-2 rounded-lg"><Mail className="w-4 h-4 text-primary" /></div>
                                                    <span className="font-medium">{c.email}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-muted-foreground/80 group-hover:text-white transition-colors">
                                                    <div className="bg-white/5 p-2 rounded-lg"><Phone className="w-4 h-4 text-primary" /></div>
                                                    <span className="font-medium">{c.phone}</span>
                                                </div>
                                            </div>

                                            <div className="pt-6 mt-auto">
                                                <Button 
                                                    className="w-full h-14 rounded-2xl bg-white text-black hover:bg-white/90 shadow-xl font-black italic transition-all group-hover:scale-[1.02] active:scale-95" 
                                                    onClick={() => handleBookClick(c)}
                                                >
                                                    Request Access
                                                </Button>
                                            </div>
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                 </div>
            </main>

            <BookingDialog 
                counsellor={selectedCounsellor}
                user={user}
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
             />
        </div>
    );
}
