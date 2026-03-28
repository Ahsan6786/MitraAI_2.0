
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp, doc, updateDoc, getDocs, documentId } from 'firebase/firestore';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Loader2, CheckCircle, Clock, XCircle, Ban, CalendarClock, ShieldQuestion } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GenZToggle } from '@/components/genz-toggle';
import { SOSButton } from '@/components/sos-button';
import { cn } from '@/lib/utils';

interface Booking {
    id: string;
    counsellor_name: string;
    counsellor_avatar?: string;
    appointment_date: string;
    appointment_time: string;
    appointment_status: 'Pending' | 'Confirmed' | 'Rejected' | 'Cancelled';
    is_anonymous: boolean;
    student_code?: string;
    createdAt: Timestamp;
}

import { GlassCard } from '@/components/glass-card';
import { motion, AnimatePresence } from 'framer-motion';

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

const AppointmentCard = ({ booking, onCancel }: { booking: Booking, onCancel: (id: string) => void }) => {
    const { toast } = useToast();
    const avatarUrl = booking.counsellor_avatar || 'https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg';

    const statusConfig = {
        Pending: { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', icon: Clock, glow: 'shadow-[0_0_15px_rgba(251,191,36,0.2)]' },
        Confirmed: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', icon: CheckCircle, glow: 'shadow-[0_0_15px_rgba(52,211,153,0.2)]' },
        Rejected: { color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20', icon: XCircle, glow: '' },
        Cancelled: { color: 'text-zinc-400', bg: 'bg-zinc-400/10', border: 'border-zinc-400/20', icon: Ban, glow: '' },
    };

    const config = statusConfig[booking.appointment_status];
    const StatusIcon = config.icon;

    return (
        <motion.div variants={itemVariants}>
            <GlassCard className={cn(
                "p-6 flex flex-col md:flex-row items-start md:items-center gap-6 group hover:border-white/20 transition-all duration-500 overflow-hidden relative",
                config.glow
            )}>
                <div className="absolute top-0 right-0 p-4">
                     <div className={cn("px-3 py-1.5 rounded-full border flex items-center gap-2 backdrop-blur-md", config.bg, config.border)}>
                        <StatusIcon className={cn("w-3 h-3 absolute -left-1.5 -top-1.5", config.color)} />
                        <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", config.color)}>{booking.appointment_status}</span>
                    </div>
                </div>

                <div className="flex items-center gap-6 flex-1">
                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-tr from-primary/30 to-transparent rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Avatar className="w-16 h-16 rounded-2xl border-2 border-white/10 shadow-xl relative z-10">
                            <AvatarImage src={avatarUrl} alt={booking.counsellor_name} />
                            <AvatarFallback className="bg-white/5 text-xl font-black">{booking.counsellor_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </div>
                    
                    <div className="space-y-1">
                        <h3 className="text-white text-xl font-black italic tracking-tight group-hover:text-primary transition-colors">{booking.counsellor_name}</h3>
                        <div className="flex items-center gap-3 text-muted-foreground/60 text-xs font-bold uppercase tracking-widest">
                            <CalendarClock className="w-3.5 h-3.5 text-primary" />
                            <span>{booking.appointment_date}</span>
                            <span className="w-1 h-1 bg-white/20 rounded-full" />
                            <span>{booking.appointment_time}</span>
                        </div>
                        {booking.is_anonymous && booking.student_code && (
                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-primary/5 border border-primary/10 mt-2">
                                <ShieldQuestion className="w-3 h-3 text-primary"/>
                                <span className="text-[10px] text-primary font-black uppercase tracking-widest">Hash: {booking.student_code}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto pt-6 md:pt-0 border-t md:border-t-0 border-white/5">
                    {booking.appointment_status === 'Pending' && (
                        <>
                            <Button variant="ghost" size="sm" onClick={() => onCancel(booking.id)} className="h-11 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/10 hover:text-rose-400">Cancel Request</Button>
                            <Button variant="secondary" size="sm" className="h-11 rounded-xl text-[10px] font-black uppercase tracking-widest px-6">View Details</Button>
                        </>
                    )}
                    {booking.appointment_status === 'Confirmed' && (
                        <>
                            <Button variant="ghost" size="sm" className="h-11 rounded-xl text-[10px] font-black uppercase tracking-widest">Change Time</Button>
                            <Button size="sm" className="h-11 rounded-xl bg-white text-black hover:bg-white/90 text-[10px] font-black uppercase tracking-widest px-8 shadow-xl">Attend Session</Button>
                        </>
                    )}
                    {(booking.appointment_status === 'Rejected' || booking.appointment_status === 'Cancelled') && (
                        <Button size="sm" asChild className="h-11 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest px-8">
                            <Link href="/booking">Re-engage</Link>
                        </Button>
                    )}
                </div>
            </GlassCard>
        </motion.div>
    );
};

export default function MyAppointmentsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchBookings = async () => {
            setIsLoading(true);
            try {
                const userBookingsQuery = query(
                    collection(db, 'bookings'),
                    where('student_id', '==', user.uid)
                );
                
                const anonymousBookingIds = JSON.parse(localStorage.getItem('anonymousBookingIds') || '[]');
                let anonymousBookings: Booking[] = [];
                if (anonymousBookingIds.length > 0) {
                    const anonymousBookingsQuery = query(
                        collection(db, 'bookings'),
                        where(documentId(), 'in', anonymousBookingIds)
                    );
                    const anonymousSnapshot = await getDocs(anonymousBookingsQuery);
                    anonymousBookings = anonymousSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
                }

                const unsubscribe = onSnapshot(userBookingsQuery, (snapshot) => {
                    const userBookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
                    const allBookings = [...userBookings, ...anonymousBookings];
                    const uniqueBookings = Array.from(new Map(allBookings.map(item => [item.id, item])).values());
                    
                    uniqueBookings.sort((a, b) => {
                        if (a.createdAt && b.createdAt) {
                            return b.createdAt.toMillis() - a.createdAt.toMillis();
                        }
                        return 0;
                    });

                    setBookings(uniqueBookings);
                    setIsLoading(false);
                }, (error) => {
                    console.error("Firestore snapshot error:", error);
                    setIsLoading(false);
                });

                return () => unsubscribe();

            } catch (error) {
                 console.error("Error fetching bookings:", error);
                 setIsLoading(false);
            }
        };

        fetchBookings();
    }, [user]);

    const handleCancelBooking = async (bookingId: string) => {
        try {
            const bookingRef = doc(db, 'bookings', bookingId);
            await updateDoc(bookingRef, {
                appointment_status: 'Cancelled'
            });
            toast({ title: "Session Cancelled", description: "Your appointment request has been removed." });
        } catch (error) {
            console.error("Error cancelling booking: ", error);
            toast({ title: "Error", description: "Could not cancel the request.", variant: "destructive" });
        }
    };

    const upcomingBookings = bookings.filter(b => b.appointment_status === 'Pending' || b.appointment_status === 'Confirmed');
    const pastBookings = bookings.filter(b => b.appointment_status === 'Rejected' || b.appointment_status === 'Cancelled');
    
    const pending = upcomingBookings.filter(b => b.appointment_status === 'Pending');
    const confirmed = upcomingBookings.filter(b => b.appointment_status === 'Confirmed');

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
                        <h1 className="text-xl md:text-2xl font-black italic tracking-tighter text-white">My Sessions</h1>
                        <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground/60">Calendar Synced</span>
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
                <div className="max-w-5xl mx-auto space-y-12">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <h1 className="text-3xl md:text-5xl font-black italic tracking-tightest leading-tight text-white capitalize">
                            Track Your <span className="text-primary italic">Journey.</span>
                        </h1>
                        <p className="text-base md:text-lg text-muted-foreground/80 font-medium leading-relaxed max-w-2xl">
                            Monitor your counselling sessions and progress within your secure schedule.
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
                    ) : (
                         <Tabs defaultValue="upcoming" className="w-full">
                            <TabsList className="bg-white/5 border border-white/10 p-1.5 rounded-2xl h-14 md:h-16 w-full max-w-sm">
                                <TabsTrigger value="upcoming" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-black text-white text-[10px] font-black uppercase tracking-widest transition-all">Upcoming</TabsTrigger>
                                <TabsTrigger value="past" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-black text-white text-[10px] font-black uppercase tracking-widest transition-all">Past Sessions</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="upcoming" className="mt-12 focus-visible:ring-0">
                                {upcomingBookings.length === 0 ? (
                                    <GlassCard className="text-center p-16 max-w-lg mx-auto space-y-8">
                                        <div className="bg-primary/10 p-6 rounded-[2rem] w-fit mx-auto">
                                            <CalendarClock className="w-12 h-12 text-primary opacity-60"/>
                                        </div>
                                        <div className="space-y-4">
                                            <h3 className="text-2xl font-black italic tracking-tight text-white">No Sessions Yet</h3>
                                            <p className="text-muted-foreground font-medium">You currently have no active sessions scheduled.</p>
                                            <Button asChild className="h-12 rounded-xl bg-white text-black hover:bg-white/90 font-black italic px-8 shadow-xl mt-4"><Link href="/booking">Book a Session</Link></Button>
                                        </div>
                                    </GlassCard>
                                ) : (
                                    <motion.div 
                                        variants={containerVariants}
                                        initial="hidden"
                                        animate="visible"
                                        className="space-y-12"
                                    >
                                        {pending.length > 0 && (
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1 h-6 bg-amber-400 rounded-full" />
                                                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-400/80">Pending Confirmation</h2>
                                                </div>
                                                <div className="space-y-4">
                                                    {pending.map(booking => <AppointmentCard key={booking.id} booking={booking} onCancel={handleCancelBooking} />)}
                                                </div>
                                            </div>
                                        )}
                                        {confirmed.length > 0 && (
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1 h-6 bg-emerald-400 rounded-full" />
                                                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400/80">Active Engagements</h2>
                                                </div>
                                                <div className="space-y-4">
                                                    {confirmed.map(booking => <AppointmentCard key={booking.id} booking={booking} onCancel={handleCancelBooking} />)}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </TabsContent>
                            
                            <TabsContent value="past" className="mt-12 focus-visible:ring-0">
                               {pastBookings.length === 0 ? (
                                    <GlassCard className="text-center p-16 max-w-lg mx-auto space-y-8">
                                        <div className="bg-white/5 p-6 rounded-[2rem] w-fit mx-auto">
                                            <CalendarClock className="w-12 h-12 text-muted-foreground/40"/>
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-black italic tracking-tight text-white">Archives Empty</h3>
                                            <p className="text-muted-foreground font-medium">Historical session data will be preserved here once protocols are completed.</p>
                                        </div>
                                    </GlassCard>
                                ) : (
                                    <motion.div 
                                        variants={containerVariants}
                                        initial="hidden"
                                        animate="visible"
                                        className="space-y-4"
                                    >
                                        {pastBookings.map(booking => <AppointmentCard key={booking.id} booking={booking} onCancel={handleCancelBooking} />)}
                                    </motion.div>
                                )}
                            </TabsContent>
                        </Tabs>
                    )}
                </div>
            </main>
        </div>
    );
}
