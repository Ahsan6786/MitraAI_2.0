
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mic, Square, Bot, Camera, User, Languages } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { predictLiveMood } from '@/ai/flows/predict-live-mood';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GenZToggle } from '@/components/genz-toggle';
import { SOSButton } from '@/components/sos-button';
import { db } from '@/lib/firebase';
import { doc, runTransaction, increment } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { ToastAction } from '@/components/ui/toast';
import { GlassCard } from '@/components/glass-card';
import { motion, AnimatePresence } from 'framer-motion';


interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: any) => void;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const SpeechRecognition =
  typeof window !== 'undefined' 
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;

interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
}

const languageToSpeechCode: Record<string, string> = {
    English: 'en-US',
    Hindi: 'hi-IN',
    Hinglish: 'en-IN',
};

const TOKEN_COST = 10;

export default function LiveMoodPage() {
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [language, setLanguage] = useState('English');
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const recognitionRef = useRef<any>(null);
    const { toast } = useToast();
    const { user } = useAuth();
    const router = useRouter();
    const scrollViewportRef = useRef<HTMLDivElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        if (scrollViewportRef.current) {
          scrollViewportRef.current.scrollTo({ top: scrollViewportRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [chatMessages, isProcessing]);
    
    useEffect(() => {
        const getCameraPermission = async () => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setHasCameraPermission(false);
                toast({
                    variant: 'destructive',
                    title: 'System Incompatibility',
                    description: 'Your neural interface does not support visual input standard.',
                });
                return;
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                streamRef.current = stream;
                setHasCameraPermission(true);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (error) {
                console.error('Error accessing camera:', error);
                setHasCameraPermission(false);
                toast({
                    variant: 'destructive',
                    title: 'Input Blocked',
                    description: 'Please authorize visual sensor access for mood calibration.',
                });
            }
        };
        getCameraPermission();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (recognitionRef.current) {
                recognitionRef.current.abort();
                recognitionRef.current = null;
            }
        };
    }, [toast]);


    const captureFrame = (): string => {
        if (!videoRef.current || !canvasRef.current) return '';
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL('image/jpeg');
        }
        return '';
    };

    const processMood = useCallback(async (transcript: string) => {
        if (!transcript.trim() || !user) {
            setIsProcessing(false);
            return;
        }

        setIsProcessing(true);
        const photoDataUri = captureFrame();
        const userMessage: ChatMessage = { sender: 'user', text: transcript };
        setChatMessages(prev => [...prev, userMessage]);

        if (!photoDataUri) {
            toast({ title: 'Sensor Failure', description: 'Could not capture visual data.', variant: 'destructive' });
            setIsProcessing(false);
            return;
        }
        
        const userDocRef = doc(db, 'users', user.uid);

        try {
            await runTransaction(db, async (transaction) => {
                const userDoc = await transaction.get(userDocRef);
                if (!userDoc.exists()) throw "User document does not exist!";
                
                const currentTokens = userDoc.data().tokens || 0;
                if (currentTokens < TOKEN_COST) throw new Error("Insufficient neural energy.");

                transaction.update(userDocRef, { tokens: increment(-TOKEN_COST) });
            });
            
            const result = await predictLiveMood({ photoDataUri, description: transcript, language });
            const aiMessage: ChatMessage = { sender: 'ai', text: result.response };
            setChatMessages(prev => [...prev, aiMessage]);
            toast({ title: 'Transaction Confirmed', description: `${TOKEN_COST} energy units utilized.`});

        } catch (error: any) {
            console.error('Error predicting live mood:', error);
            const errorMessage: ChatMessage = { sender: 'ai', text: "Spectral interference detected. Initialization failed." };
            setChatMessages(prev => [...prev, errorMessage]);

            if (error.message.includes("Insufficient neural energy")) {
                 toast({
                    title: "Energy Depleted",
                    description: "Consult your technical specialist for a core recharge.",
                    variant: "destructive",
                    action: <ToastAction altText="Contact" onClick={() => router.push('/reports')}>Contact Tech</ToastAction>,
                });
            } else {
                toast({ title: 'AI Calibration Error', description: error.message, variant: 'destructive' });
            }
        } finally {
             setIsProcessing(false);
             setTimeout(() => {
                startListeningRef.current?.();
             }, 800);
        }
    }, [language, toast, user, router]);
    
    const startListening = useCallback(() => {
        if (!SpeechRecognition) {
            toast({ title: 'Interface Unsupported', description: 'Speech matrix not found.', variant: 'destructive' });
            return;
        }
        if (isRecording || isProcessing) return;

        setIsRecording(true);
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = languageToSpeechCode[language] || 'en-US';
        
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            processMood(transcript);
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        recognition.onerror = (event: any) => {
            if (event.error !== 'aborted' && event.error !== 'no-speech') {
                toast({ title: 'Receiver Error', description: `Noise interference: ${event.error}`, variant: 'destructive' });
            }
            setIsRecording(false);
        };
        
        recognition.start();
    }, [isRecording, isProcessing, language, toast, processMood]);

    const startListeningRef = useRef(startListening);
    useEffect(() => {
        startListeningRef.current = startListening;
    }, [startListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.abort();
            setIsRecording(false);
        }
    }, []);

    const handleMicClick = () => {
        if (isRecording) {
            stopListening();
        } else {
            startListening();
        }
    };

    return (
        <div className="h-full flex flex-col relative bg-background/50 overflow-hidden">
            {/* Spectral Background Blobs */}
            <div className="absolute inset-0 pointer-events-none -z-10">
                <motion.div 
                    animate={{ 
                        scale: isRecording ? [1, 1.4, 1] : [1, 1.2, 1],
                        opacity: isRecording ? [0.05, 0.15, 0.05] : [0.03, 0.08, 0.03],
                        rotate: [0, 180, 360]
                    }}
                    transition={{ duration: isRecording ? 5 : 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70rem] h-[70rem] bg-primary/20 rounded-full blur-[180px]" 
                />
            </div>

            <header className="h-24 shrink-0 px-6 md:px-10 border-b border-white/10 flex items-center justify-between bg-background/40 backdrop-blur-3xl sticky top-0 z-50">
                <div className="flex items-center gap-5">
                    <SidebarTrigger className="h-12 w-12 rounded-2xl border border-white/10 hover:bg-primary/10 hover:border-primary/20 transition-all active:scale-95" />
                    <div className="hidden sm:block h-10 w-px bg-white/5 mx-2" />
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-black italic tracking-tighter text-white uppercase">Spectrum</h1>
                        <div className="flex items-center gap-2">
                             <div className={cn("w-1.5 h-1.5 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(var(--primary),0.8)]", isRecording ? "bg-rose-500 animate-ping" : "bg-primary animate-pulse")} />
                            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground/60">{isRecording ? 'Sensor Monitoring' : 'Live Uplink Active'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl">
                        <Languages className="w-4 h-4 text-primary/60" />
                        <Select value={language} onValueChange={setLanguage} disabled={isRecording || isProcessing}>
                            <SelectTrigger className="w-[100px] border-none bg-transparent h-6 p-0 focus:ring-0 text-[10px] font-black uppercase tracking-widest text-white">
                                <SelectValue placeholder="Protocol" />
                            </SelectTrigger>
                            <SelectContent className="bg-black/90 backdrop-blur-3xl border-white/10 rounded-xl overflow-hidden shadow-2xl">
                                <SelectItem value="English" className="text-[10px] font-black uppercase tracking-widest focus:bg-primary/20">English</SelectItem>
                                <SelectItem value="Hindi" className="text-[10px] font-black uppercase tracking-widest focus:bg-primary/20">Hindi</SelectItem>
                                <SelectItem value="Hinglish" className="text-[10px] font-black uppercase tracking-widest focus:bg-primary/20">Hinglish</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <SOSButton />
                    <GenZToggle />
                    <ThemeToggle />
                </div>
            </header>

             <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Left Side: Neural Optic Sensor */}
                <div className="w-full lg:w-[45%] p-6 flex flex-col min-h-[400px]">
                    <GlassCard className="flex-1 flex flex-col rounded-[2.5rem] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5 pointer-events-none" />
                        
                        <div className="p-8 flex items-center justify-between relative z-10 border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                                    <Camera className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">Optical Relay</p>
                                    <p className="text-xl font-black italic text-white tracking-tightest">Vision <span className="text-primary italic">Matrix.</span></p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                <span className="text-[9px] font-black text-white/40 tracking-widest uppercase">HD STREAM</span>
                            </div>
                        </div>

                        <CardContent className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
                            <div className="relative w-full aspect-video rounded-[2rem] overflow-hidden border border-white/10 group-hover:border-primary/30 transition-all duration-500 shadow-2xl">
                                <video ref={videoRef} className="w-full h-full object-cover scale-[1.05]" autoPlay muted playsInline />
                                
                                {/* HUD Overlay */}
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-primary/40 rounded-tl-xl" />
                                    <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-primary/40 rounded-tr-xl" />
                                    <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-primary/40 rounded-bl-xl" />
                                    <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-primary/40 rounded-br-xl" />
                                    
                                    <AnimatePresence>
                                        {(isRecording || isProcessing) && (
                                            <motion.div 
                                                initial={{ top: '0%' }}
                                                animate={{ top: '100%' }}
                                                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                                                className="absolute left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_rgba(var(--primary),0.8)] z-10"
                                            />
                                        )}
                                    </AnimatePresence>
                                </div>

                                {hasCameraPermission === false && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-xl p-10 text-center">
                                        <div className="space-y-6">
                                            <div className="p-6 rounded-full bg-rose-500/10 border border-rose-500/20 w-fit mx-auto">
                                                <Camera className="w-12 h-12 text-rose-500" />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-black italic tracking-tight text-white uppercase">Sensor offline</h3>
                                                <p className="text-muted-foreground font-medium text-sm">Please authorize spectral optic access for neural calibration.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </GlassCard>
                </div>
                
                {/* Right Side: Neural Chat Uplink */}
                <div className="flex-1 flex flex-col p-6 space-y-6">
                    <GlassCard className="flex-1 flex flex-col rounded-[2.5rem] relative overflow-hidden">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                                    <Bot className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">Cognitive Link</p>
                                    <p className="text-xl font-black italic text-white tracking-tightest">Soul <span className="text-primary italic">Ally.</span></p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Cost: 10E</span>
                            </div>
                        </div>

                        <ScrollArea className="flex-1" viewportRef={scrollViewportRef}>
                            <div className="p-8 space-y-8">
                                <AnimatePresence initial={false}>
                                    {chatMessages.length === 0 && !isProcessing && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex flex-col items-center justify-center py-20 text-center space-y-8"
                                        >
                                            <div className="relative">
                                                <motion.div 
                                                    animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                                                    transition={{ duration: 10, repeat: Infinity }}
                                                    className="absolute inset-0 bg-primary/10 rounded-3xl blur-2xl" 
                                                />
                                                <div className="relative p-8 bg-white/5 border border-white/10 rounded-[2rem]">
                                                    <Bot className="w-16 h-16 text-primary shadow-2xl" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-black italic tracking-tight text-white uppercase">Uplink Ready</h3>
                                                <p className="text-muted-foreground/60 font-medium text-sm max-w-xs uppercase tracking-widest leading-loose">State your frequency or project your intention into the matrix.</p>
                                            </div>
                                        </motion.div>
                                    )}

                                    {chatMessages.map((msg, index) => (
                                        <motion.div 
                                            key={index} 
                                            initial={{ opacity: 0, x: msg.sender === 'user' ? 20 : -20, filter: 'blur(10px)' }}
                                            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                                            className={cn('flex items-start gap-4', msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row')}
                                        >
                                            <Avatar className="h-10 w-10 mt-1 border border-white/10 rounded-xl">
                                                <AvatarFallback className="bg-white/5 font-black text-xs uppercase italic">
                                                    {msg.sender === 'ai' ? <Bot className="w-5 h-5 text-primary" /> : (user?.email?.[0].toUpperCase() ?? 'U')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className={cn(
                                                'relative max-w-[80%] rounded-[1.5rem] px-6 py-4 shadow-xl border',
                                                msg.sender === 'user' 
                                                    ? 'bg-white text-black border-white font-medium self-end italic' 
                                                    : 'bg-white/5 text-white border-white/10 backdrop-blur-sm self-start leading-relaxed'
                                            )}>
                                                {msg.text}
                                                <div className={cn(
                                                    "absolute top-4 w-4 h-4 rotate-45 border-r border-b",
                                                    msg.sender === 'user' 
                                                        ? "-right-1.5 bg-white border-white" 
                                                        : "-left-1.5 bg-white/5 border-white/10"
                                                )} />
                                            </div>
                                        </motion.div>
                                    ))}

                                    {isProcessing && (
                                        <motion.div 
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-start gap-4"
                                        >
                                            <Avatar className="h-10 w-10 mt-1 border border-white/10 rounded-xl bg-white/5 flex items-center justify-center">
                                                <Bot className="w-5 h-5 text-primary animate-pulse" />
                                            </Avatar>
                                            <div className="bg-primary/10 border border-primary/20 rounded-[1.5rem] px-6 py-4 flex items-center gap-3">
                                                <div className="flex gap-1.5">
                                                    {[0, 1, 2].map(i => (
                                                        <motion.div 
                                                            key={i}
                                                            animate={{ y: [0, -5, 0] }}
                                                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                                                            className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.8)]"
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/80">Calibrating...</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </ScrollArea>
                    </GlassCard>

                    <footer className="flex flex-col items-center gap-6 pt-4">
                        <div className="relative group">
                            <AnimatePresence>
                                {isRecording && (
                                    <motion.div 
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                        className="absolute -inset-8 bg-rose-500 rounded-full blur-3xl pointer-events-none" 
                                    />
                                )}
                            </AnimatePresence>
                            
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleMicClick}
                                disabled={hasCameraPermission !== true || isProcessing}
                                className={cn(
                                    "relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl border-[6px]",
                                    isRecording 
                                        ? "bg-rose-500 border-rose-400/20 text-white" 
                                        : "bg-white border-white/10 text-black hover:bg-white/90"
                                )}
                            >
                                {isRecording ? <Square className="w-10 h-10 fill-current" /> : <Mic className="w-12 h-12" />}
                            </motion.button>
                        </div>
                        
                        <div className="flex flex-col items-center gap-1.5">
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-[0.4em] transition-colors duration-500",
                                isRecording ? "text-rose-400" : (isProcessing ? "text-primary" : "text-white/40")
                            )}>
                                {isRecording ? 'STREAMING ACTIVE' : (isProcessing ? 'CALIBRATING MATRIX' : 'INITIALIZE UPLINK')}
                            </span>
                            {!isRecording && !isProcessing && <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                    animate={{ left: ['-100%', '100%'] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="relative w-1/2 h-full bg-primary/40 rounded-full" 
                                />
                            </div>}
                        </div>
                    </footer>
                </div>
            </main>
            <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
    );
}
