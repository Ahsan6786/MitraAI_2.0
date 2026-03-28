
'use client';

import { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Loader2, Send, User, MessageCircleHeart, Smile, Frown, Meh, Sparkles, Zap, Shield, Brain } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { predictChatMood } from '@/ai/flows/predict-chat-mood';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { GenZToggle } from '@/components/genz-toggle';
import { SOSButton } from '@/components/sos-button';
import { GlassCard } from '@/components/glass-card';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: number;
  sender: 'user';
  text: string;
  mood?: string;
  timestamp: Date;
}

const MoodIcon = ({ mood }: { mood: string | undefined }) => {
  if (!mood) return null;
  const moodLower = mood.toLowerCase();
  if (moodLower.includes('happy') || moodLower.includes('joy')) {
    return <Smile className="w-4 h-4 text-emerald-400" />;
  }
  if (moodLower.includes('sad') || moodLower.includes('depressed')) {
    return <Frown className="w-4 h-4 text-blue-400" />;
  }
  if (moodLower.includes('anxious') || moodLower.includes('stressed') || moodLower.includes('worried')) {
    return <Meh className="w-4 h-4 text-amber-400" />;
  }
  return <Meh className="w-4 h-4 text-white/40" />;
};

export default function MoodChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth',
        });
      }
    }
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !user) return;

    const messageText = input;
    setInput('');
    setIsLoading(true);

    try {
      const result = await predictChatMood({ message: messageText });
      const userMessage: Message = {
        id: Date.now(),
        sender: 'user',
        text: messageText,
        mood: result.mood,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      
    } catch (error) {
      console.error('Error getting mood analysis:', error);
       const userMessage: Message = {
        id: Date.now(),
        sender: 'user',
        text: messageText,
        mood: "Error",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      toast({
          title: "NEURAL_LINK_ERROR",
          description: "Sync failed. Signal lost in transit.",
          variant: "destructive"
      })
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <div className="h-screen flex flex-col bg-black text-white selection:bg-primary selection:text-black relative overflow-hidden">
      {/* Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ 
                x: [0, 50, 0], 
                y: [0, 100, 0],
                scale: [1, 1.2, 1]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" 
          />
          <motion.div 
            animate={{ 
                x: [0, -40, 0], 
                y: [0, 80, 0],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[100px]" 
          />
      </div>

      <header className="z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl px-6 h-20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
            <SidebarTrigger className="text-white/60 hover:text-white transition-colors" />
            <div className="h-8 w-px bg-white/10 hidden md:block" />
            <div className="flex flex-col">
              <h1 className="text-xl font-black italic tracking-tighter leading-none uppercase">Neural_Uplink.</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mt-1 hidden xs:block">Real-time Sentiment Stream</p>
            </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
             <div className="hidden md:block">
                <GenZToggle />
            </div>
            <ThemeToggle />
            <SOSButton />
        </div>
      </header>

      <main className="flex-1 relative z-10 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="mx-auto max-w-4xl p-6 md:p-12 space-y-12 pb-32">
            {messages.length === 0 ? (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center pt-20 text-center space-y-8"
                >
                    <div className="relative">
                        <motion.div 
                            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"
                        />
                        <div className="relative w-24 h-24 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-center">
                            <Brain className="w-12 h-12 text-primary" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-3xl sm:text-4xl font-black italic tracking-tightest uppercase text-white">Initialize_Session.</h2>
                        <p className="text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed">
                            Transmit your current neural state. Our synthetic core will analyze the sentiment frequency in real-time.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg mt-8">
                        {['I feel incredibly motivated today!', 'Feeling a bit overwhelmed lately.'].map((text, i) => (
                            <Button 
                                key={i}
                                variant="ghost" 
                                onClick={() => setInput(text)}
                                className="h-auto p-6 bg-white/5 border border-white/10 rounded-2xl text-left flex flex-col items-start gap-2 hover:bg-white/10 hover:border-white/20 transition-all group"
                            >
                                <Zap className="w-4 h-4 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                                <p className="text-xs font-medium text-white/60 group-hover:text-white transition-colors">{text}</p>
                            </Button>
                        ))}
                    </div>
                </motion.div>
            ) : (
                <div className="space-y-10">
                    <AnimatePresence initial={false}>
                        {messages.map((message) => (
                            <motion.div 
                                key={message.id}
                                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                className="flex flex-col items-end gap-4"
                            >
                                <div className="flex items-start gap-4">
                                     <div className="flex flex-col items-end gap-2">
                                        <div className="bg-white text-black px-6 py-4 rounded-[2rem] rounded-tr-none shadow-2xl">
                                            <p className="text-sm md:text-base font-medium italic tracking-tight">{message.text}</p>
                                        </div>
                                        <span className="text-[10px] font-black italic uppercase text-white/20 mr-2">
                                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <Avatar className="w-10 h-10 border border-white/10 bg-white shadow-xl">
                                        <AvatarFallback className="text-black font-black italic text-xs">
                                            {user?.email ? user.email[0].toUpperCase() : <User className="w-4 h-4" />}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>

                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <GlassCard className="px-4 py-2 flex items-center gap-3 rounded-full hover:scale-105" interactive={false}>
                                        <MoodIcon mood={message.mood} />
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Mood:</span>
                                            <span className="text-[10px] font-black italic uppercase text-white">[{message.mood}]</span>
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    
                    {isLoading && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-3 text-primary/60"
                        >
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">AI_Processing...</span>
                        </motion.div>
                    )}
                </div>
            )}
          </div>
        </ScrollArea>
      </main>

      <footer className="absolute bottom-0 left-0 right-0 z-50 p-6 md:p-10 pointer-events-none">
        <div className="mx-auto max-w-4xl w-full pointer-events-auto">
            <GlassCard className="p-2 rounded-[2.5rem] border-white/10 shadow-3xl bg-black/60 backdrop-blur-3xl overflow-hidden group focus-within:border-primary/50 transition-all">
                <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                    <div className="pl-6 text-white/20 group-focus-within:text-primary transition-colors">
                        <MessageCircleHeart className="w-5 h-5" />
                    </div>
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your state of mind..."
                        className="flex-1 h-14 bg-transparent border-none focus-visible:ring-0 text-white font-medium placeholder:text-white/20 text-lg px-4"
                        disabled={isLoading}
                        autoComplete="off"
                    />
                    <Button 
                        type="submit" 
                        disabled={isLoading || !input.trim()}
                        className={cn(
                            "h-12 w-12 rounded-2xl transition-all active:scale-90 mr-1",
                            input.trim() ? "bg-white text-black hover:bg-white/90" : "bg-white/5 text-white/20"
                        )}
                        size="icon"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5 fill-current" />}
                    </Button>
                </form>
            </GlassCard>
        </div>
      </footer>
    </div>
  );
}
