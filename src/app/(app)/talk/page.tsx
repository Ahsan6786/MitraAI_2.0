
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
import SectionIntroAnimation from '@/components/section-intro-animation';
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
    if (isRecording) return "Mitra is listening...";
    if (isLoading) return "Mitra is processing...";
    if (chatHistory.length > 0) return "Say something more...";
    return "Tap to start your journey.";
  }

  return (
    <div className="relative h-svh flex flex-col bg-background/50 overflow-hidden">
      {/* Animated Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <CrisisAlertModal isOpen={showCrisisModal} onClose={() => setShowCrisisModal(false)} />

      <header className="h-20 shrink-0 px-4 md:px-8 border-b border-border/40 flex items-center justify-between bg-background/60 backdrop-blur-3xl sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="hover:bg-primary/10 transition-colors h-11 w-11 rounded-full border border-border/20" />
        </div>

        <div className="flex items-center gap-3">
          <Select value={language} onValueChange={setLanguage} disabled={isRecording || isLoading}>
            <SelectTrigger className="rounded-full bg-background/50 border-border/50 h-10 w-auto gap-2 px-4 hover:border-primary/50 transition-all">
              <Languages className="w-4 h-4 text-primary" />
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-border/50 backdrop-blur-3xl bg-background/80">
              {languages.map(lang => (
                <SelectItem key={lang.value} value={lang.value} className="rounded-xl">{lang.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <GenZToggle />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex flex-col relative overflow-hidden px-4 md:px-8">
        <ScrollArea className="flex-1 py-8" viewportRef={scrollViewportRef}>
          <div className="max-w-3xl mx-auto space-y-6">
            <AnimatePresence mode="popLayout">
              {chatHistory.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-20"
                >
                  <div className="bg-primary/10 p-6 rounded-[3rem] w-fit mx-auto mb-12 shadow-2xl shadow-primary/10">
                    <Bot className="w-16 h-16 text-primary" />
                  </div>
                </motion.div>
              )}

              {chatHistory.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: msg.sender === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn('flex items-end gap-3', msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row')}
                >
                  <Avatar className="h-10 w-10 border-2 border-background shadow-lg">
                    {msg.sender === 'ai' ? (
                      <AvatarFallback className="bg-primary text-white"><Bot className="w-5 h-5" /></AvatarFallback>
                    ) : (
                      <>
                        <AvatarImage src={user?.photoURL ?? undefined} />
                        <AvatarFallback className="bg-zinc-200 dark:bg-zinc-800 text-xs font-bold">{user?.email?.[0].toUpperCase()}</AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <div className={cn(
                    'max-w-[85%] sm:max-w-[70%] px-6 py-4 text-sm md:text-base shadow-xl transition-all duration-300',
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground rounded-t-[2rem] rounded-l-[2rem] rounded-br-[0.5rem] shadow-primary/20'
                      : 'bg-background glass border-border/40 rounded-t-[2rem] rounded-r-[2rem] rounded-bl-[0.5rem]'
                  )}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}

              {isRecording && liveTranscript && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-row-reverse items-end gap-3"
                >
                  <Avatar className="h-8 w-8 opacity-50 shrink-0"><AvatarFallback>?</AvatarFallback></Avatar>
                  <div className="bg-primary/50 text-white backdrop-blur-xl px-6 py-3 rounded-[2rem] rounded-br-[0.5rem] text-sm italic opacity-80">
                    {liveTranscript}...
                  </div>
                </motion.div>
              )}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 text-primary font-bold text-sm bg-primary/5 w-fit px-4 py-2 rounded-full border border-primary/20"
                >
                  <Loader2 className="w-4 h-4 animate-spin" /> Thinking
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Bottom Controls */}
        <div className="h-48 shrink-0 flex flex-col items-center justify-center gap-6 z-10">
          <div className="flex items-center gap-4 sm:gap-8">
            <Button
              asChild
              variant="outline"
              size="icon"
              className="h-14 w-14 rounded-full bg-background/50 backdrop-blur-md border-border/50 hover:border-primary/50 transition-all shadow-lg"
            >
              <Link href="/voice-lab"><Wand2 className="w-5 h-5" /></Link>
            </Button>

            <div className="relative">
              {/* Recursive Pulse Rings */}
              <AnimatePresence>
                {isRecording && (
                  <>
                    <motion.div
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 2.2, opacity: 0 }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 bg-primary/30 rounded-full"
                    />
                    <motion.div
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 1.8, opacity: 0 }}
                      transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                      className="absolute inset-0 bg-primary/20 rounded-full"
                    />
                  </>
                )}
              </AnimatePresence>

              <Button
                onClick={handleMicClick}
                disabled={isLoading}
                className={cn(
                  "h-24 w-24 rounded-full shadow-2xl transition-all duration-500 relative z-20 group",
                  isRecording ? "bg-red-500 scale-110 hover:bg-red-600" : "bg-primary scale-100 hover:scale-105"
                )}
              >
                {isRecording ? <Square className="w-8 h-8 fill-white" /> : <Mic className="w-10 h-10 group-hover:scale-110 transition-transform" />}
              </Button>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-14 w-14 rounded-full bg-background/50 backdrop-blur-md border-border/50 hover:border-primary/50 transition-all shadow-lg"
              onClick={() => router.push('/chat')}
            >
              <Sparkles className="w-5 h-5 text-amber-500" />
            </Button>
          </div>

          <motion.div
            animate={isRecording ? { scale: [1, 1.05, 1], opacity: [0.6, 1, 0.6] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground transition-all duration-500"
          >
            {getStatusText()}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default function TalkPage() {
  const [isClient, setIsClient] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const SESSION_KEY = 'hasSeenTalkIntro';

  useEffect(() => {
    setIsClient(true);
    const hasSeen = sessionStorage.getItem(SESSION_KEY);
    if (hasSeen) setShowIntro(false);
  }, []);

  const handleIntroFinish = () => {
    sessionStorage.setItem(SESSION_KEY, 'true');
    setShowIntro(false);
  };

  if (!isClient) return null;

  if (showIntro) {
    return <SectionIntroAnimation
      onFinish={handleIntroFinish}
      icon={<Phone className="w-full h-full" />}
      title="Talk to Mitra"
      subtitle="Engage in a live, sub-second empathetic conversation."
    />;
  }

  return <TalkPageContent />;
}
