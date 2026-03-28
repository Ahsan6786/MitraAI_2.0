
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Loader2, FileText, Download, PenSquare, FileQuestion, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Logo } from '@/components/icons';
import { GenZToggle } from '@/components/genz-toggle';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SOSButton } from '@/components/sos-button';


const ADMIN_UID = 'ADMIN'; // A special UID for the admin/doctor

interface JournalReport {
    id: string;
    type: 'journal';
    createdAt: Timestamp;
    mood: string;
    content: string;
    doctorReport: string;
}

interface QuestionnaireReport {
    id: string;
    type: 'questionnaire';
    createdAt: Timestamp;
    testName: string;
    score: number;
    result: { level: string; recommendation: string; };
    doctorFeedback: string;
}

type Report = JournalReport | QuestionnaireReport;

interface Message {
    id: string;
    text: string;
    senderId: string;
    createdAt: Timestamp;
}

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

const ReportCard = ({ report }: { report: Report }) => {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownloadPdf = async () => {
        setIsDownloading(true);
        const reportElement = document.getElementById(`report-${report.id}`);
        if (!reportElement) {
            setIsDownloading(false);
            return;
        }

        const canvas = await html2canvas(reportElement, {
            scale: 2,
            useCORS: true,
        });
        const imgData = canvas.toDataURL('image/png');

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const canvasAspectRatio = canvasWidth / canvasHeight;
        
        let finalPdfWidth = pdfWidth;
        let finalPdfHeight = pdfWidth / canvasAspectRatio;

        if (finalPdfHeight > pdfHeight) {
            finalPdfHeight = pdfHeight;
            finalPdfWidth = pdfHeight * canvasAspectRatio;
        }

        const x = (pdfWidth - finalPdfWidth) / 2;
        const y = (pdfHeight - finalPdfHeight) / 2;

        pdf.addImage(imgData, 'PNG', x, y, finalPdfWidth, finalPdfHeight);
        pdf.save(`MitraAI_Report_${report.createdAt.toDate().toLocaleDateString()}.pdf`);
        setIsDownloading(false);
    };
    
    const title = report.type === 'journal' 
        ? `Journal Recovery Report` 
        : `${report.testName} Assessment`;

    const dateStr = report.createdAt.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    return (
        <GlassCard interactive={false} className="border-white/10 overflow-hidden shadow-2xl rounded-[2.5rem]">
             {/* PDF Export Template */}
            <div 
              id={`report-${report.id}`} 
              className="absolute -left-[9999px] w-[800px] bg-[#0d131a] text-white p-12"
            >
                <div className="flex items-center gap-4 mb-12 border-b border-white/10 pb-8">
                   <Logo className="w-12 h-12 text-primary"/>
                   <div>
                        <h1 className="text-3xl font-black italic tracking-tighter">MitraAI Reports</h1>
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Certified Wellness Report</p>
                   </div>
                </div>
                <div className="mb-12">
                    <h2 className="text-4xl font-black italic tracking-tight mb-2">{title}</h2>
                    <p className="text-sm font-bold text-primary uppercase tracking-widest">Released: {dateStr}</p>
                </div>
                <div className="space-y-10">
                    {report.type === 'journal' ? (
                        <>
                            <div className="bg-white/5 p-8 rounded-3xl border border-white/5">
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Your Entry</h3>
                                <p className="text-xl font-medium italic leading-relaxed text-gray-200">"{report.content}"</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary mb-4">Analysis</h3>
                                <div className="text-lg leading-relaxed text-gray-300 whitespace-pre-wrap">{report.doctorReport}</div>
                            </div>
                        </>
                    ) : (
                         <>
                            <div className="bg-white/5 p-8 rounded-3xl border border-white/5">
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Assessment Score</h3>
                                {report.result && <p className="text-2xl font-black italic text-white"><span className="text-primary">{report.result.level}:</span> {report.result.recommendation}</p>}
                                <p className="text-sm font-bold text-muted-foreground mt-2">Score: {report.score}</p>
                            </div>
                             <div>
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary mb-4">Clinical Guidance</h3>
                                <div className="text-lg leading-relaxed text-gray-300 whitespace-pre-wrap">{report.doctorFeedback}</div>
                            </div>
                        </>
                    )}
                </div>
                <div className="mt-20 pt-8 border-t border-white/5 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-muted-foreground/40">Confidential Soul Ally Assessment • {new Date().getFullYear()}</p>
                </div>
            </div>

            <div className="p-5 sm:p-8 md:p-10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10 pb-8 border-b border-white/5">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-primary">Verified Report</span>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-black italic tracking-tighter text-white">{title}</h3>
                        <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-2">Archived on {dateStr}</p>
                    </div>
                    <Button 
                        onClick={handleDownloadPdf} 
                        disabled={isDownloading} 
                        className="rounded-full bg-primary hover:bg-primary/90 text-white font-black italic px-8 h-12 shadow-xl shadow-primary/20 transition-all active:scale-95"
                    >
                        {isDownloading ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Download className="mr-2 h-5 w-5"/>}
                        Export PDF
                    </Button>
                </div>
                
                <div className="grid gap-10 lg:grid-cols-2">
                     {report.type === 'journal' ? (
                        <>
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                    <PenSquare className="w-4 h-4"/>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Self Reflection</span>
                                </div>
                                <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 relative overflow-hidden group">
                                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <MessageSquare className="w-12 h-12" />
                                     </div>
                                     <p className="text-lg font-medium italic text-gray-300 leading-relaxed relative z-10">"{report.content}"</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-primary mb-2">
                                    <FileText className="w-4 h-4"/>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Specialist Review</span>
                                </div>
                                <div className="p-2 space-y-4">
                                    <p className="text-gray-200 font-medium leading-relaxed whitespace-pre-wrap">{report.doctorReport}</p>
                                </div>
                            </div>
                        </>
                    ) : (
                         <>
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                    <FileQuestion className="w-4 h-4"/>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Initial Assessment</span>
                                </div>
                                <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5">
                                     {report.result && (
                                        <div className="space-y-2">
                                            <p className="text-2xl font-black italic text-white tracking-tight">{report.result.level}</p>
                                            <p className="text-sm font-medium text-gray-400 leading-relaxed">{report.result.recommendation}</p>
                                        </div>
                                     )}
                                     <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Score index</span>
                                        <span className="text-xl font-black italic text-primary">{report.score}</span>
                                     </div>
                                </div>
                            </div>
                             <div className="space-y-4">
                                <div className="flex items-center gap-2 text-primary mb-2">
                                    <FileText className="w-4 h-4"/>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Doctor Feedback</span>
                                </div>
                                <div className="p-2">
                                    <p className="text-gray-200 font-medium leading-relaxed whitespace-pre-wrap">{report.doctorFeedback}</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </GlassCard>
    );
};

function UserMessages() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, `conversations/${user.uid}/messages`), orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        await addDoc(collection(db, `conversations/${user.uid}/messages`), {
            text: newMessage,
            senderId: user.uid,
            senderName: user.displayName || user.email,
            createdAt: serverTimestamp(),
        });
        setNewMessage('');
    };

    return (
        <GlassCard interactive={false} className="border-white/10 mt-16 rounded-[3rem] overflow-hidden shadow-2xl">
            <div className="p-5 sm:p-8 md:p-10">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <div>
                             <h3 className="text-2xl font-black italic tracking-tight text-white">Chat with Doctor</h3>
                             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Send a message</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-col h-[500px]">
                    <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
                        <div className="space-y-6 pb-4">
                            {isLoading && (
                                <div className="flex justify-center p-8">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary/20" />
                                </div>
                            )}
                            {messages.map((msg, idx) => {
                                const isMe = msg.senderId !== ADMIN_UID;
                                return (
                                    <motion.div 
                                        key={msg.id} 
                                        initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={cn('flex items-end gap-3', isMe ? 'justify-end' : 'justify-start')}
                                    >
                                        {!isMe && (
                                            <Avatar className="w-10 h-10 border-2 border-primary/20 bg-background">
                                                <AvatarFallback className="text-primary font-black">DR</AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div className={cn(
                                            "max-w-[80%] rounded-3xl p-4 text-sm font-medium leading-relaxed shadow-lg",
                                            isMe ? "bg-primary text-white rounded-br-none" : "bg-white/5 text-gray-200 border border-white/10 rounded-bl-none"
                                        )}>
                                            {msg.text}
                                            <div className={cn(
                                                "text-[8px] font-black uppercase mt-2 opacity-40",
                                                isMe ? "text-right" : "text-left"
                                            )}>
                                                {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        {isMe && (
                                            <Avatar className="w-10 h-10 border-2 border-primary/20 bg-background">
                                                <AvatarFallback className="text-primary font-black">{user?.displayName?.[0] || 'U'}</AvatarFallback>
                                            </Avatar>
                                        )}
                                    </motion.div>
                                );
                            })}
                             {messages.length === 0 && !isLoading && (
                                <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground/30">
                                    <MessageSquare className="w-12 h-12 mb-4 opacity-10" />
                                    <p className="text-xs font-black uppercase tracking-widest">No messages currently archived</p>
                                </div>
                             )}
                        </div>
                    </ScrollArea>
                    
                    <form onSubmit={handleSendMessage} className="flex items-center gap-3 pt-6 border-t border-white/5">
                        <Input 
                            value={newMessage} 
                            onChange={(e) => setNewMessage(e.target.value)} 
                            placeholder="Type a message..." 
                            className="flex-1 bg-white/5 border-white/10 rounded-full px-6 h-12 text-sm font-medium focus-visible:ring-primary/40 focus:bg-white/10 transition-all" 
                        />
                        <Button type="submit" size="icon" className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
                            <Send className="w-5 h-5" />
                        </Button>
                    </form>
                </div>
            </div>
        </GlassCard>
    );
}

export default function ReportsPage() {
    const { user } = useAuth();
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const journalsQuery = query(
            collection(db, 'journalEntries'),
            where('userId', '==', user.uid),
            where('reviewed', '==', true)
        );
        const questionnairesQuery = query(
            collection(db, 'questionnaires'),
            where('userId', '==', user.uid),
            where('reviewed', '==', true)
        );

        const unsubJournals = onSnapshot(journalsQuery, (snapshot) => {
            const journalReports = snapshot.docs.map(doc => ({ id: doc.id, type: 'journal', ...doc.data() } as JournalReport));
            setReports(prev => {
                const otherReports = prev.filter(r => r.type !== 'journal');
                return [...journalReports, ...otherReports].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
            });
            setIsLoading(false);
        });

        const unsubQuestionnaires = onSnapshot(questionnairesQuery, (snapshot) => {
            const questionnaireReports = snapshot.docs.map(doc => ({ id: doc.id, type: 'questionnaire', ...doc.data() } as QuestionnaireReport));
            setReports(prev => {
                const otherReports = prev.filter(r => r.type !== 'questionnaire');
                return [...questionnaireReports, ...otherReports].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
            });
            setIsLoading(false);
        });

        return () => {
            unsubJournals();
            unsubQuestionnaires();
        };

    }, [user]);

    return (
        <div className="h-full flex flex-col bg-background/50">
            <header className="border-b border-white/10 p-4 md:p-6 flex items-center justify-between backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <SidebarTrigger className="md:hidden" />
                    <div className="flex-1">
                      <h1 className="text-lg sm:text-xl md:text-2xl font-black italic tracking-tight">Nexus Reports</h1>
                      <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-medium uppercase tracking-widest leading-none mt-1">Expert Clinical Oversight</p>
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
            
            <main className="flex-1 overflow-auto bg-gradient-to-b from-transparent to-primary/5">
                <div className="max-w-5xl mx-auto px-4 py-12 md:py-20">
                     <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 md:mb-16 text-center lg:text-left"
                    >
                        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black italic tracking-tighter text-white mb-4">Journey Reports</h1>
                        <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl leading-relaxed">
                            A secure archive of your progress, reviewed by our specialists.
                        </p>
                    </motion.div>
                    
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
                            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">Authenticating Nexus Feed</p>
                        </div>
                    ) : reports.length === 0 ? (
                        <Card className="w-full text-center bg-black/40 border-dashed border-white/10 rounded-[3rem] p-16">
                            <div className="mx-auto bg-primary/10 rounded-full p-6 w-fit mb-8 border border-primary/20">
                                <FileText className="w-12 h-12 text-primary" />
                            </div>
                            <h3 className="text-2xl font-black italic text-white mb-2">No Reports Published</h3>
                            <p className="text-muted-foreground font-medium max-w-sm mx-auto">
                                Once our specialists review your journey milestones, your certified reports will materialize here.
                            </p>
                        </Card>
                    ) : (
                        <motion.div 
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className="space-y-12"
                        >
                            {reports.map(report => (
                                <motion.div key={report.id} variants={itemVariants}>
                                    <ReportCard report={report} />
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                    
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        <UserMessages />
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
