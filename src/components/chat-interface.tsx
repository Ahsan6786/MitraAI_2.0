
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

const MessageBubble = ({ message, senderName, isUser }: { message: Message; senderName: string; isUser: boolean }) => {
    return (
      <div className={cn('flex flex-col gap-2 w-full', isUser ? 'items-end text-right' : 'items-start text-left')}>
        {!isUser && (
             <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-2">{senderName}</span>
        )}
        {message.text && (
            <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                    'text-[15px] md:text-base leading-relaxed max-w-[90%] sm:max-w-[70%] shadow-xl transition-all duration-300 px-6 py-4',
                    isUser 
                        ? 'bg-primary text-primary-foreground rounded-t-[2rem] rounded-l-[2rem] rounded-br-[0.5rem] shadow-primary/20 font-medium' 
                        : 'bg-background glass border-border/40 rounded-t-[2rem] rounded-r-[2rem] rounded-bl-[0.5rem]'
                )}
            >
                <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                    {message.text.split(/(```[\s\S]*?```)/g).map((part, index) => {
                        const codeMatch = part.match(/^```(\w+)?\n([\s\S]+)```$/);
                        return codeMatch 
                            ? <CodeBlock key={`code-${index}`} code={codeMatch[2]} /> 
                            : part ? <SimpleMarkdown key={`md-${index}`} text={part} /> : null;
                    })}
                </div>
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
      {/* Background Glows */}
      <div className="absolute inset-0 pointer-events-none -z-10">
          <div className="absolute top-1/4 -right-1/4 w-[30rem] h-[30rem] bg-primary/5 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 -left-1/4 w-[30rem] h-[30rem] bg-blue-500/5 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      <CrisisAlertModal isOpen={showCrisisModal} onClose={() => setShowCrisisModal(false)} />
      
      <header className="h-20 shrink-0 border-b border-border/40 px-4 md:px-8 flex items-center justify-between bg-background/60 backdrop-blur-3xl sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="h-10 w-10 rounded-full border border-border/20 hover:bg-primary/10 transition-colors" />
          <div className="hidden sm:block h-8 w-px bg-border/50 mx-1" />
          <div>
            <h1 className="text-xl font-black italic tracking-tighter flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                {companionName}
            </h1>
            <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground">Premium AI Companion</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SOSButton />
          <GenZToggle />
          <ThemeToggle />
        </div>
      </header>
      
      <div className="flex-1 relative overflow-hidden">
        <ScrollArea className="h-full" viewportRef={scrollViewportRef} onScroll={handleScroll}>
            <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
                <AnimatePresence mode="popLayout">
                    {messages.length === 0 && !isLoading && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-4 pt-10"
                        >
                            <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-xl">
                                <AvatarFallback className="bg-primary text-white"><Bot className="w-6 h-6"/></AvatarFallback>
                            </Avatar>
                            <MessageBubble 
                                message={{sender: 'ai', text: `Hey! I'm ${companionName}. I'm here to listen, support, and chat about anything on your heart. How are you feeling right now?`}} 
                                senderName={companionName} 
                                isUser={false} 
                            />
                        </motion.div>
                    )}
                    {messages.map((msg, idx) => (
                        <div key={idx} className={cn('flex items-end gap-3', msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                            <Avatar className="h-10 w-10 border-2 border-background shadow-lg mb-1">
                                {msg.sender === 'ai' ? (
                                    <AvatarFallback className="bg-primary text-white"><Bot className="w-5 h-5"/></AvatarFallback>
                                ) : (
                                    <>
                                        <AvatarImage src={user?.photoURL ?? undefined} />
                                        <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-xs font-bold">{user?.email?.[0].toUpperCase()}</AvatarFallback>
                                    </>
                                )}
                            </Avatar>
                            <MessageBubble message={msg} senderName={msg.sender === 'user' ? 'You' : companionName} isUser={msg.sender === 'user'} />
                        </div>
                    ))}
                    {isLoading && (
                        <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 pl-14"
                        >
                            <div className="flex gap-1.5 p-3 rounded-2xl glass border-border/40">
                                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-primary rounded-full" />
                                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-primary rounded-full" />
                                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-primary rounded-full" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </ScrollArea>
        {showScrollToBottom && (
            <Button onClick={scrollToBottom} variant="outline" size="icon" className="absolute bottom-4 right-8 z-20 rounded-full shadow-2xl glass border-primary/20 text-primary w-12 h-12">
                <ArrowDown className="w-6 h-6 animate-bounce"/>
            </Button>
        )}
      </div>

      <footer className="shrink-0 px-4 md:px-8 pb-6 pt-4 z-40 bg-gradient-to-t from-background via-background/90 to-transparent">
        <form onSubmit={handleFormSubmit} className="max-w-4xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-[2rem] blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
          <div className="relative flex items-center bg-background/80 glass dark:bg-zinc-900/50 backdrop-blur-3xl rounded-[2rem] border border-border/40 transition-all shadow-2xl group-focus-within:border-primary/50 group-focus-within:shadow-primary/10 overflow-hidden">
             <Button type="button" variant="ghost" size="icon" className="h-14 w-14 rounded-full text-muted-foreground hover:text-primary transition-colors ml-1">
                <Paperclip className="w-5 h-5" />
             </Button>
             <Input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder={`Message ${companionName}...`} 
                className="flex-1 h-16 border-0 bg-transparent shadow-none focus-visible:ring-0 text-base px-0" 
                disabled={isLoading} 
                autoComplete="off" 
             />
             <div className="flex items-center gap-2 pr-4">
                <AnimatePresence>
                    {input.trim() && (
                        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}>
                            <Button type="submit" size="icon" className="h-11 w-11 rounded-full shadow-lg transition-all" disabled={isLoading}>
                                <Send className="w-5 h-5" />
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
             </div>
          </div>
        </form>
         <div className="max-w-4xl mx-auto flex items-center justify-between mt-4 px-2">
            <div className="flex items-center gap-4">
                 <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="h-8 rounded-full bg-background/50 border-border/50 text-[10px] font-black uppercase tracking-widest gap-2">
                        <Languages className="w-3 h-3 text-primary"/>
                        <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl glass backdrop-blur-3xl">
                        {languages.map(lang => (<SelectItem key={lang.value} value={lang.value} className="text-xs rounded-xl">{lang.label}</SelectItem>))}
                    </SelectContent>
                </Select>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/30 border border-border/50">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">AI Online</span>
                </div>
            </div>
            <Button variant="ghost" size="sm" className="md:hidden text-[10px] font-bold uppercase tracking-widest h-8" onClick={() => chatHistorySidebar.setIsOpen(true)}>
                Chat History
            </Button>
         </div>
      </footer>
    </div>
  );
}
