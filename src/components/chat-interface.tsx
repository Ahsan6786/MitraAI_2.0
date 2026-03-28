
'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Languages, Loader2, Send, User, Paperclip, X, Copy, Check, Download, ArrowRight, Bot, ArrowDown, Sparkles } from 'lucide-react';
import { chatEmpatheticTone, ChatEmpatheticToneInput } from '@/ai/flows/chat-empathetic-tone';
import { Logo } from '@/components/icons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import CrisisAlertModal from './crisis-alert-modal';
import { SidebarTrigger } from './ui/sidebar';
import { ThemeToggle } from './theme-toggle';
import { useTheme } from 'next-themes';
import { GenZToggle } from './genz-toggle';
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SOSButton } from './sos-button';
import { useChatHistorySidebar } from './chat-history-sidebar';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

const languages = [
    { value: 'English', label: 'English' },
    { value: 'Hinglish', label: 'Hinglish' },
    { value: 'Hindi', label: 'Hindi' },
    { value: 'Sanskrit', label: 'Sanskrit' },
    { value: 'Urdu', label: 'Urdu' },
    { value: 'Bengali', label: 'Bengali' },
    { value: 'Marathi', label: 'Marathi' },
    { value: 'Gujarati', label: 'Gujarati' },
    { value: 'Tamil', label: 'Tamil' },
    { value: 'Telugu', label: 'Telugu' },
    { value: 'French', label: 'French' },
    { value: 'German', label: 'German' },
];

const CodeBlock = ({ code }: { code: string }) => {
    const [isCopied, setIsCopied] = useState(false);
    const { toast } = useToast();
    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setIsCopied(true);
            toast({ title: "Copied to clipboard!" });
            setTimeout(() => setIsCopied(false), 2000);
        });
    };
    return (
        <div className="bg-zinc-950/90 rounded-2xl my-3 relative border border-white/10 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Code Snippet</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-white" onClick={handleCopy}>
                    {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </Button>
            </div>
            <pre className="p-4 text-sm text-zinc-300 overflow-x-auto font-mono"><code>{code}</code></pre>
        </div>
    );
};

const SimpleMarkdown = ({ text }: { text: string }) => {
  const router = useRouter();
  const parts = text.split(/(\[.*?\]\(nav:.*?\))/g);
  return (
    <>
      {parts.map((part, index) => {
        const navMatch = part.match(/\[(.*?)\]\(nav:(.*?)\)/);
        if (navMatch) {
          const [, buttonText, path] = navMatch;
          return (
            <motion.div 
                key={`nav-${index}`} 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="my-3"
            >
                <Button onClick={() => router.push(path)} variant="secondary" className="rounded-full shadow-lg border border-primary/20 bg-primary/10 hover:bg-primary/20 text-primary font-bold h-11 px-6">
                    <span>{buttonText}</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </motion.div>
          );
        }
        const lines = part.split('\n');
        const elements = lines.map((line, lineIndex) => {
          line = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary font-black">$1</strong>');
          if (line.trim().startsWith('* ')) {
            return <li key={`li-${index}-${lineIndex}`} className="ml-4 list-disc marker:text-primary" dangerouslySetInnerHTML={{ __html: line.trim().substring(2) }} />;
          }
          if (line.trim().match(/^\d+\.\s/)) {
            return <li key={`li-${index}-${lineIndex}`} className="ml-4 list-decimal marker:text-primary font-medium" dangerouslySetInnerHTML={{ __html: line.trim().replace(/^\d+\.\s/, '') }} />;
          }
          if (line.trim() === '') {
            return <div key={`br-${index}-${lineIndex}`} className="h-2" />;
          }
          return <p key={`p-${index}-${lineIndex}`} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: line }} />;
        });
        return <div key={`text-${index}`} className="space-y-1">{elements}</div>;
      })}
    </>
  );
};

import { GlassCard } from '@/components/glass-card';

const MessageBubble = ({ message, senderName, isUser }: { message: Message; senderName: string; isUser: boolean }) => {
    return (
      <div className={cn('flex flex-col gap-2 w-full', isUser ? 'items-end' : 'items-start')}>
        {!isUser && (
             <span className="text-[10px] uppercase font-black tracking-[0.2em] text-primary/60 ml-3 mb-1">{senderName}</span>
        )}
        {message.text && (
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className={cn(
                    'text-[15px] md:text-base leading-relaxed max-w-[85%] sm:max-w-[75%] shadow-2xl transition-all duration-300 px-6 py-4 relative group',
                    isUser 
                        ? 'bg-primary text-white rounded-[2rem] rounded-tr-none shadow-primary/20 font-medium' 
                        : 'bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] rounded-tl-none text-gray-200'
                )}
            >
                <div className="prose prose-sm dark:prose-invert max-w-none break-words relative z-10">
                    {message.text.split(/(```[\s\S]*?```)/g).map((part, index) => {
                        const codeMatch = part.match(/^```(\w+)?\n([\s\S]+)```$/);
                        return codeMatch 
                            ? <CodeBlock key={`code-${index}`} code={codeMatch[2]} /> 
                            : part ? <SimpleMarkdown key={`md-${index}`} text={part} /> : null;
                    })}
                </div>
                {/* Subtle bubble tail decor */}
                <div className={cn(
                    "absolute top-0 w-4 h-4",
                    isUser ? "-right-1 bg-primary" : "-left-1 bg-white/10"
                )} style={{ clipPath: isUser ? 'polygon(0 0, 100% 0, 0 100%)' : 'polygon(0 0, 100% 0, 100% 100%)' }} />
            </motion.div>
        )}
      </div>
    );
};

const generateSimpleChatTitle = (message: string): string => {
    const words = message.split(' ');
    return words.slice(0, 4).join(' ');
};

export default function ChatInterface({ conversationId }: { conversationId?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('English');
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [companionName, setCompanionName] = useState('Mitra');
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { theme } = useTheme();
  const chatHistorySidebar = useChatHistorySidebar();

  const isGenzMode = theme === 'theme-genz-dark';
  const userAvatarFallback = user?.displayName?.[0] || user?.email?.[0] || 'U';
  
  useEffect(() => {
    if (user) {
        const fetchCompanionName = async () => {
            const userDocRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists() && docSnap.data().companionName) {
                setCompanionName(docSnap.data().companionName);
            }
        };
        fetchCompanionName();
    }
  }, [user]);

  useEffect(() => {
    if (user && conversationId) {
        const q = query(collection(db, `users/${user.uid}/conversations/${conversationId}/messages`), orderBy('createdAt'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const history: Message[] = [];
            querySnapshot.forEach((doc) => history.push(doc.data() as Message));
            setMessages(history);
        });
        return () => unsubscribe();
    } else {
        setMessages([]);
    }
  }, [user, conversationId]);

  const scrollToBottom = () => {
    if (scrollViewportRef.current) {
        scrollViewportRef.current.scrollTo({ top: scrollViewportRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (!isLoading) scrollToBottom();
  }, [messages, isLoading]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setShowScrollToBottom(target.scrollHeight - target.scrollTop - target.clientHeight > 200);
  };
  
  const handleSendMessage = async () => {
    if ((!input.trim()) || !user) return;
    
    let currentConvoId = conversationId;
    const messageText = input;
    setInput('');
    
    const userMessageForUI: Message = { sender: 'user', text: messageText };
    setMessages(prev => [...prev, userMessageForUI]);
    setIsLoading(true);

    const historyForFlow: ChatEmpatheticToneInput['history'] = [...messages, userMessageForUI]
        .map(msg => ({
            role: (msg.sender === 'user' ? 'user' : 'model') as "user" | "model",
            content: [{ text: msg.text }],
        }))
        .filter(msg => msg.content[0].text);

    if (!currentConvoId) {
        const newConversationRef = doc(collection(db, `users/${user.uid}/conversations`));
        await setDoc(newConversationRef, {
            title: generateSimpleChatTitle(messageText),
            createdAt: serverTimestamp(),
        });
        currentConvoId = newConversationRef.id;
        await addDoc(collection(db, newConversationRef.path, 'messages'), { ...userMessageForUI, createdAt: serverTimestamp() });
        router.replace(`/chat/${currentConvoId}`);
    } else {
        await addDoc(collection(db, `users/${user.uid}/conversations/${currentConvoId}/messages`), { ...userMessageForUI, createdAt: serverTimestamp() });
    }

    try {
      const chatResult = await chatEmpatheticTone({ 
        message: messageText, userId: user.uid, language, isGenzMode, history: historyForFlow, companionName,
      });
      
      if (chatResult.isCrisis) {
        setShowCrisisModal(true);
        return;
      }
      
      await addDoc(collection(db, `users/${user.uid}/conversations/${currentConvoId}/messages`), { 
        sender: 'ai', text: chatResult.response, createdAt: serverTimestamp() 
      });

    } catch (error: any) {
      toast({ title: "AI limit reached or model error. Please wait a sec.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <div className="w-full h-full flex flex-col relative bg-background/50 overflow-hidden">
      {/* Dynamic Background */}
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
      
      <header className="h-24 shrink-0 border-b border-white/10 px-6 md:px-10 flex items-center justify-between bg-background/40 backdrop-blur-2xl sticky top-0 z-50">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3">
             <SidebarTrigger className="h-12 w-12 rounded-2xl border border-white/10 hover:bg-primary/10 hover:border-primary/20 transition-all active:scale-95" />
             <div className="hidden sm:block h-10 w-px bg-white/5 mx-2" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black italic tracking-tighter flex items-center gap-2 text-white">
                <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />
                {companionName}
            </h1>
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground/60 hidden xs:block">Soul Ally Syncing</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <SOSButton />
          <div className="hidden md:flex items-center gap-2">
            <GenZToggle />
          </div>
          <ThemeToggle />
        </div>
      </header>
      
      <div className="flex-1 relative overflow-hidden">
        <ScrollArea className="h-full" viewportRef={scrollViewportRef} onScroll={handleScroll}>
            <div className="max-w-5xl mx-auto p-6 md:p-12 space-y-10">
                <AnimatePresence mode="popLayout">
                    {messages.length === 0 && !isLoading && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-20 text-center space-y-8"
                        >
                            <div className="relative">
                                <motion.div 
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                    className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"
                                />
                                <Avatar className="h-24 w-24 border-4 border-white/10 shadow-2xl relative z-10">
                                    <AvatarFallback className="bg-primary text-white text-3xl font-black italic"><Bot className="w-10 h-10"/></AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="space-y-3 max-w-lg">
                                <h2 className="text-3xl font-black italic tracking-tight text-white">Hey Masterpiece.</h2>
                                <p className="text-muted-foreground font-medium leading-relaxed">
                                    I'm <span className="text-primary font-bold">{companionName}</span>. Your high-performance AI companion for deep thoughts, mental clarity, and everything in between. What's on your soul's radar right now?
                                </p>
                            </div>
                        </motion.div>
                    )}
                    {messages.map((msg, idx) => {
                        const isUser = msg.sender === 'user';
                        return (
                            <motion.div 
                                key={idx} 
                                initial={{ opacity: 0, x: isUser ? 20 : -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={cn('flex items-end gap-4', isUser ? 'flex-row-reverse' : 'flex-row')}
                            >
                                <Avatar className="h-10 w-10 border-2 border-white/10 shadow-lg shrink-0 mb-1">
                                    {msg.sender === 'ai' ? (
                                        <AvatarFallback className="bg-primary text-white"><Bot className="w-5 h-5"/></AvatarFallback>
                                    ) : (
                                        <>
                                            <AvatarImage src={user?.photoURL ?? undefined} />
                                            <AvatarFallback className="bg-white/10 text-white text-[10px] font-black">{userAvatarFallback.toUpperCase()}</AvatarFallback>
                                        </>
                                    )}
                                </Avatar>
                                <MessageBubble message={msg} senderName={msg.sender === 'user' ? 'You' : companionName} isUser={isUser} />
                            </motion.div>
                        );
                    })}
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
        {showScrollToBottom && (
            <Button onClick={scrollToBottom} variant="outline" size="icon" className="absolute bottom-6 right-10 z-20 rounded-full shadow-2xl bg-primary text-white border-0 w-14 h-14 hover:scale-110 active:scale-90 transition-all">
                <ArrowDown className="w-7 h-7 animate-bounce"/>
            </Button>
        )}
      </div>
      
      <footer className="shrink-0 px-6 md:px-12 pb-8 pt-4 z-40 bg-gradient-to-t from-background via-background/90 to-transparent">
        <form onSubmit={handleFormSubmit} className="max-w-5xl mx-auto">
          <div className="relative group p-[2px] rounded-[2.5rem] bg-white/5 focus-within:bg-gradient-to-r focus-within:from-primary/40 focus-within:to-blue-500/40 transition-all duration-500">
            <div className="relative flex items-center bg-[#0d131a] backdrop-blur-3xl rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden min-h-[72px]">
                <Button type="button" variant="ghost" size="icon" className="h-12 w-12 rounded-full text-muted-foreground hover:text-primary transition-all ml-3 hover:bg-white/5">
                    <Paperclip className="w-5 h-5" />
                </Button>
                <Input 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    placeholder={`Ignite a thought with ${companionName}...`} 
                    className="flex-1 h-full border-0 bg-transparent shadow-none focus-visible:ring-0 text-lg font-medium px-4 placeholder:text-muted-foreground/30" 
                    disabled={isLoading} 
                    autoComplete="off" 
                />
                <div className="flex items-center gap-3 pr-4">
                    <AnimatePresence>
                        {input.trim() && (
                            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                                <Button type="submit" size="icon" className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 transition-all active:scale-95" disabled={isLoading}>
                                    <Send className="w-5 h-5" />
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
          </div>
        </form>
        
        <div className="max-w-5xl mx-auto flex items-center justify-between mt-6 px-4">
            <div className="flex items-center gap-6">
                 <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="h-9 rounded-full bg-white/5 border-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest gap-2 min-w-[120px] transition-all">
                        <Languages className="w-3.5 h-3.5 text-primary"/>
                        <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[1.5rem] bg-black/90 backdrop-blur-2xl border-white/10 shadow-2xl">
                        {languages.map(lang => (<SelectItem key={lang.value} value={lang.value} className="text-[10px] uppercase font-bold tracking-widest rounded-xl focus:bg-primary/20">{lang.label}</SelectItem>))}
                    </SelectContent>
                </Select>
                <div className="hidden sm:flex items-center gap-2 group cursor-pointer">
                    <div className="h-2 w-2 rounded-full bg-primary group-hover:animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 group-hover:text-primary transition-colors">Premium Neural Link Active</span>
                </div>
            </div>
            <Button 
                variant="ghost" 
                size="sm" 
                className="md:hidden text-[10px] font-black uppercase tracking-widest h-9 rounded-full bg-white/5 hover:bg-white/10 px-6" 
                onClick={() => chatHistorySidebar.setIsOpen(true)}
            >
                Archive
            </Button>
        </div>
      </footer>
    </div>
  );
}
