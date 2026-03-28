
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader2, Mic, Square, Bot, Languages, Phone, User, Wand2, Sparkles, ChevronLeft } from 'lucide-react';
import { chatEmpatheticTone, ChatEmpatheticToneInput } from '@/ai/flows/chat-empathetic-tone';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { useToast } from '@/hooks/use-toast';
import CrisisAlertModal from '@/components/crisis-alert-modal';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GenZToggle } from '@/components/genz-toggle';

import { useAuth } from '@/hooks/use-auth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { db } from '@/lib/firebase';
import { doc, runTransaction, increment, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { ToastAction } from '@/components/ui/toast';
import Link from 'next/link';

const SpeechRecognition =
  (typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));

const languages = [
  { value: 'English', label: 'English', speechCode: 'en-US' },
  { value: 'Hinglish', label: 'Hinglish', speechCode: 'en-IN' },
  { value: 'Hindi', label: 'Hindi', speechCode: 'hi-IN' },
  { value: 'Bengali', label: 'Bengali', speechCode: 'bn-IN' },
  { value: 'Gujarati', label: 'Gujarati', speechCode: 'gu-IN' },
  { value: 'Kannada', label: 'Kannada', speechCode: 'kn-IN' },
  { value: 'Malayalam', label: 'Malayalam', speechCode: 'ml-IN' },
  { value: 'Marathi', label: 'Marathi', speechCode: 'mr-IN' },
  { value: 'Tamil', label: 'Tamil', speechCode: 'ta-IN' },
  { value: 'Telugu', label: 'Telugu', speechCode: 'te-IN' },
  { value: 'Urdu', label: 'Urdu', speechCode: 'ur-IN' },
  { value: 'Sanskrit', label: 'Sanskrit' },
  { value: 'French', label: 'French' },
  { value: 'German', label: 'German' },
];

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

const TOKEN_COST = 10;

function TalkPageContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [language, setLanguage] = useState('English');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [customVoiceId, setCustomVoiceId] = useState<string | null>(null);

  const recognitionRef = useRef<any | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const finalTranscriptRef = useRef<string>("");
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          setCustomVoiceId(doc.data().customVoiceId || null);
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTo({ top: scrollViewportRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatHistory, liveTranscript]);

  const handleAiResponse = async (messageText: string) => {
    if (!messageText.trim() || !user) {
      setIsLoading(false);
      return;
    };

    setChatHistory(prev => [...prev, { sender: 'user', text: messageText }]);
    setIsLoading(true);

    const userDocRef = doc(db, 'users', user.uid);

    try {
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        if (!userDoc.exists()) throw "User document does not exist!";

        const currentTokens = userDoc.data().tokens || 0;
        if (currentTokens < TOKEN_COST) throw new Error("Insufficient tokens.");

        transaction.update(userDocRef, { tokens: increment(-TOKEN_COST) });
      });

      const historyForFlow: ChatEmpatheticToneInput['history'] = chatHistory
        .map(msg => ({
          role: (msg.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
          content: [{ text: msg.text }],
        }))
        .filter(msg => msg.content?.[0]?.text);

      const result = await chatEmpatheticTone({
        message: messageText,
        userId: user.uid,
        language: language,
        history: historyForFlow,
      });

      if (result.isCrisis) {
        setShowCrisisModal(true);
        setIsLoading(false);
        return;
      }

      setChatHistory(prev => [...prev, { sender: 'ai', text: result.response }]);
      toast({ title: `${TOKEN_COST} tokens used.` });

      if (result.response.trim()) {
        const ttsResult = await textToSpeech({ text: result.response, voiceId: customVoiceId || undefined });
        if (ttsResult.audioDataUri) {
          const audio = new Audio(ttsResult.audioDataUri);
          audioRef.current = audio;
          audio.play().catch(e => console.error("Error playing audio:", e));
        }
      }
    } catch (error: any) {
      console.error('Error getting AI response:', error);
      const errorMessageText = "Sorry, I encountered an error. Please try again.";
      setChatHistory(prev => [...prev, { sender: 'ai', text: errorMessageText }]);

      if (error.message.includes("Insufficient tokens")) {
        toast({
          title: "Insufficient Tokens",
          description: "Please ask your doctor for a recharge.",
          variant: "destructive",
          action: <ToastAction altText="Message Doctor" onClick={() => router.push('/reports')}>Message Doctor</ToastAction>,
        });
      } else {
        toast({ title: "Error", description: error.message, variant: 'destructive' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const startRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsRecording(true);
    finalTranscriptRef.current = "";
    setLiveTranscript("");
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = languages.find(l => l.value === language)?.speechCode || 'en-US';

    recognition.onresult = (event: any) => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);

      let interimTranscript = '';
      let currentFinalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          currentFinalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      finalTranscriptRef.current += currentFinalTranscript;
      setLiveTranscript(finalTranscriptRef.current + interimTranscript);


      pauseTimerRef.current = setTimeout(() => {
        stopRecording();
      }, 1500);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        toast({
          title: "Voice Error",
          description: `Could not start voice recognition: ${event.error}`,
          variant: "destructive",
        });
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      recognitionRef.current = null;

      const finalTranscript = finalTranscriptRef.current;
      setLiveTranscript('');
      if (finalTranscript) {
        handleAiResponse(finalTranscript);
      }
    }

    recognition.start();
  };

  const handleMicClick = () => {
    if (!SpeechRecognition) {
      toast({
        title: "Browser Not Supported",
        description: "Your browser does not support the Web Speech API.",
        variant: "destructive",
      });
      return;
    }
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
      }
    };
  }, []);

  const getStatusText = () => {
    if (isRecording) return "Listening...";
    if (isLoading) return "Thinking...";
    if (chatHistory.length > 0) return "Continue talking...";
    return "Tap to start talking.";
  }

  const userAvatarFallback = user?.displayName?.[0] || user?.email?.[0] || 'U';

  return (
    <div className="relative h-svh flex flex-col bg-background/50 overflow-hidden">
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

      <CrisisAlertModal isOpen={showCrisisModal} onClose={() => setShowCrisisModal(false)} />

      <header className="h-24 shrink-0 px-6 md:px-10 border-b border-white/10 flex items-center justify-between bg-background/40 backdrop-blur-3xl sticky top-0 z-50">
        <div className="flex items-center gap-5">
          <SidebarTrigger className="h-12 w-12 rounded-2xl border border-white/10 hover:bg-primary/10 hover:border-primary/20 transition-all active:scale-95" />
          <div className="hidden sm:block h-10 w-px bg-white/5 mx-2" />
          <div className="flex flex-col">
            <h1 className="text-2xl font-black italic tracking-tighter flex items-center gap-2 text-white">
                <Phone className="w-5 h-5 text-primary fill-primary/20 animate-pulse" />
                Voice Talk
            </h1>
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground/60 hidden xs:block">Microphone On</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Select value={language} onValueChange={setLanguage} disabled={isRecording || isLoading}>
            <SelectTrigger className="h-10 rounded-full bg-white/5 border-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest gap-2 min-w-[120px] transition-all">
              <Languages className="w-4 h-4 text-primary" />
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent className="rounded-[1.5rem] bg-black/90 backdrop-blur-2xl border-white/10 shadow-2xl">
              {languages.map(lang => (
                <SelectItem key={lang.value} value={lang.value} className="text-[10px] uppercase font-bold tracking-widest rounded-xl focus:bg-primary/20">{lang.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2 sm:gap-3">
            <div className="hidden md:flex">
              <GenZToggle />
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative overflow-hidden px-6 md:px-12">
        <ScrollArea className="flex-1 py-10" viewportRef={scrollViewportRef}>
          <div className="max-w-4xl mx-auto space-y-10">
            <AnimatePresence mode="popLayout">
              {chatHistory.length === 0 && (
                <motion.div
                  key="empty-state"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-24 text-center space-y-8"
                >
                  <div className="relative">
                    <motion.div 
                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 5, repeat: Infinity }}
                        className="absolute inset-0 bg-primary/20 rounded-full blur-[40px]"
                    />
                    <div className="bg-[#0d131a] p-8 rounded-[3rem] border border-white/10 relative z-10 shadow-2xl">
                        <Bot className="w-20 h-20 text-primary opacity-80" />
                    </div>
                  </div>
                  <div className="space-y-4 max-w-lg">
                    <h2 className="text-3xl sm:text-4xl font-black italic tracking-tight text-white">Start talking.</h2>
                    <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                        Step into a friendly space. I'm here to listen to your voice, your emotions, and your journey.
                    </p>
                  </div>
                </motion.div>
              )}

              {chatHistory.map((msg, idx) => {
                const isUser = msg.sender === 'user';
                return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: isUser ? 20 : -20, y: 10 }}
                      animate={{ opacity: 1, x: 0, y: 0 }}
                      className={cn('flex items-end gap-4', isUser ? 'flex-row-reverse' : 'flex-row')}
                    >
                      <Avatar className="h-10 w-10 border-2 border-white/10 shadow-lg shrink-0 mb-1">
                        {msg.sender === 'ai' ? (
                          <AvatarFallback className="bg-primary text-white"><Bot className="w-5 h-5" /></AvatarFallback>
                        ) : (
                          <>
                            <AvatarImage src={user?.photoURL ?? undefined} />
                            <AvatarFallback className="bg-white/10 text-white text-[10px] font-black">{userAvatarFallback.toUpperCase()}</AvatarFallback>
                          </>
                        )}
                      </Avatar>
                      <div className={cn(
                        'text-[15px] md:text-base leading-relaxed max-w-[85%] sm:max-w-[75%] shadow-2xl transition-all duration-300 px-6 py-4 relative group',
                        isUser
                          ? 'bg-primary text-white rounded-[2rem] rounded-tr-none shadow-primary/20 font-medium'
                          : 'bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] rounded-tl-none text-gray-200'
                      )}>
                        <div className="relative z-10">{msg.text}</div>
                        <div className={cn(
                            "absolute top-0 w-4 h-4",
                            isUser ? "-right-1 bg-primary" : "-left-1 bg-white/10"
                        )} style={{ clipPath: isUser ? 'polygon(0 0, 100% 0, 0 100%)' : 'polygon(0 0, 100% 0, 100% 100%)' }} />
                      </div>
                    </motion.div>
              )})}

              {isRecording && liveTranscript && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-row-reverse items-end gap-4"
                >
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-1 shrink-0">
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-primary rounded-full" />
                  </div>
                  <div className="bg-primary/20 backdrop-blur-2xl border border-primary/20 text-white/90 px-6 py-3 rounded-[2rem] rounded-br-none text-sm font-semibold italic">
                    {liveTranscript}...
                  </div>
                </motion.div>
              )}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 pl-14"
                >
                  <div className="flex gap-2 p-4 rounded-[1.5rem] bg-white/5 border border-white/10 backdrop-blur-xl">
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }} className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.6 }} className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Immersive Bottom Controls */}
        <div className="h-64 shrink-0 flex flex-col items-center justify-center gap-6 sm:gap-8 z-10 bg-gradient-to-t from-background via-background/90 to-transparent">
          <div className="flex items-center gap-4 sm:gap-12">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                asChild
                variant="outline"
                size="icon"
                className="h-16 w-16 rounded-[2rem] bg-white/5 backdrop-blur-2xl border-white/5 hover:border-primary/20 hover:bg-white/10 transition-all shadow-xl group"
                >
                <Link href="/voice-lab"><Wand2 className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" /></Link>
                </Button>
            </motion.div>

            <div className="relative">
              <AnimatePresence>
                {isRecording && (
                  <>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: [1, 2.5, 1], opacity: [0, 0.2, 0] }}
                      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                      className="absolute inset-0 bg-primary rounded-full blur-[30px]"
                    />
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: [1, 2, 1], opacity: [0, 0.3, 0] }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: 0.5 }}
                      className="absolute inset-0 bg-primary rounded-full blur-[20px]"
                    />
                    <motion.div 
                        className="absolute -inset-8 border border-primary/20 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),1)]" />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                    onClick={handleMicClick}
                    disabled={isLoading}
                    className={cn(
                    "h-28 w-28 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-700 relative z-20 overflow-hidden group border-2",
                    isRecording 
                        ? "bg-red-500/10 border-red-500 text-red-500" 
                        : "bg-primary border-primary/20 text-white"
                    )}
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {isRecording 
                        ? <Square className="w-10 h-10 fill-current animate-pulse" /> 
                        : <Mic className="w-12 h-12 group-hover:rotate-12 transition-transform duration-500" />
                    }
                </Button>
              </motion.div>
            </div>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                variant="outline"
                size="icon"
                className="h-16 w-16 rounded-[2rem] bg-white/5 backdrop-blur-2xl border-white/5 hover:border-amber-500/20 hover:bg-white/10 transition-all shadow-xl group"
                onClick={() => router.push('/chat')}
                >
                <Sparkles className="w-6 h-6 text-amber-500/60 group-hover:text-amber-500 transition-colors" />
                </Button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-2"
          >
            <span className={cn(
                "text-[10px] font-black uppercase tracking-[0.4em] transition-all duration-700",
                isRecording ? "text-red-500" : "text-primary"
            )}>
                {getStatusText()}
            </span>
            <div className="h-1 w-48 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                    animate={isRecording ? { x: ["-100%", "100%"] } : { x: "-100%" }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary/50 to-transparent"
                />
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default function TalkPage() {
  return <TalkPageContent />;
}
