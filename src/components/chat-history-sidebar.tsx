
'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MessageSquare, Edit, Trash2, Check, X, History, Sparkles } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { motion, AnimatePresence } from 'framer-motion';

// --- Context for Mobile Chat History Sidebar ---
interface ChatHistorySidebarContextType {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const ChatHistorySidebarContext = createContext<ChatHistorySidebarContextType | null>(null);

export function ChatHistorySidebarProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <ChatHistorySidebarContext.Provider value={{ isOpen, setIsOpen }}>
            {children}
        </ChatHistorySidebarContext.Provider>
    );
}

export function useChatHistorySidebar() {
    const context = useContext(ChatHistorySidebarContext);
    if (!context) {
        throw new Error('useChatHistorySidebar must be used within a ChatHistorySidebarProvider');
    }
    return context;
}
// --- End Context ---


interface Conversation {
    id: string;
    title: string;
}

function SidebarContent({ currentConversationId }: { currentConversationId?: string }) {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const chatHistorySidebar = useChatHistorySidebar();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');

    useEffect(() => {
        if (user) {
            const q = query(collection(db, `users/${user.uid}/conversations`), orderBy('createdAt', 'desc'));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const convos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
                setConversations(convos);
            });
            return () => unsubscribe();
        }
    }, [user]);

    const handleNewChat = () => {
        router.push('/chat');
        if (chatHistorySidebar.isOpen) {
            chatHistorySidebar.setIsOpen(false);
        }
    };
    
    const handleLinkClick = () => {
        if (chatHistorySidebar.isOpen) {
            chatHistorySidebar.setIsOpen(false);
        }
    }

    const handleStartRename = (convo: Conversation) => {
        setEditingId(convo.id);
        setRenameValue(convo.title);
    };

    const handleCancelRename = () => {
        setEditingId(null);
        setRenameValue('');
    };

    const handleConfirmRename = async () => {
        if (!editingId || !renameValue.trim() || !user) return;
        const conversationRef = doc(db, `users/${user.uid}/conversations`, editingId);
        await updateDoc(conversationRef, { title: renameValue.trim() });
        toast({ title: 'Chat renamed' });
        handleCancelRename();
    };

    const handleDelete = async (conversationId: string) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, `users/${user.uid}/conversations`, conversationId));
            toast({ title: "Conversation Deleted" });
            if (currentConversationId === conversationId) router.push('/chat');

            const messagesRef = collection(db, `users/${user.uid}/conversations/${conversationId}/messages`);
            const messagesSnapshot = await getDocs(messagesRef);
            if (!messagesSnapshot.empty) {
                const batch = writeBatch(db);
                messagesSnapshot.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
            }
        } catch (error) {
            console.error("Error deleting conversation: ", error);
            toast({ title: 'Error deleting conversation', variant: 'destructive' });
        }
    };
    
    return (
        <div className="h-full px-5 py-8 flex flex-col gap-8">
             <Button 
                onClick={handleNewChat} 
                className="w-full rounded-[1.5rem] h-14 bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all gap-3 font-black italic tracking-tight text-base"
            >
                <Plus className="h-5 w-5" />
                Initiate New
            </Button>

            <div className="space-y-6 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-[0.2em] text-primary/60">
                        <History className="w-4 h-4" />
                        Neural Archives
                    </div>
                </div>
                
                <ScrollArea className="flex-1 -mx-2 px-2">
                    <div className="space-y-3 py-2">
                        <AnimatePresence mode="popLayout">
                            {conversations.map((convo, idx) => (
                                <motion.div 
                                    key={convo.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group relative"
                                >
                                    {editingId === convo.id ? (
                                        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-3xl p-2 rounded-2xl border border-primary/30 shadow-lg">
                                            <Input 
                                                value={renameValue} 
                                                onChange={e => setRenameValue(e.target.value)}
                                                className="h-9 rounded-xl border-none bg-transparent focus-visible:ring-0 text-white font-medium text-sm"
                                                autoFocus
                                            />
                                            <div className="flex items-center gap-1">
                                                <Button size="icon" className="h-8 w-8 rounded-xl bg-primary hover:bg-primary/90" onClick={handleConfirmRename}><Check className="w-4 h-4 text-white"/></Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl text-muted-foreground hover:bg-white/5" onClick={handleCancelRename}><X className="w-4 h-4"/></Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <Link
                                                href={`/chat/${convo.id}`}
                                                className={cn(
                                                    "w-full h-14 justify-start px-5 flex items-center gap-4 text-sm font-semibold rounded-[1.2rem] transition-all duration-300 relative overflow-hidden group/link",
                                                    currentConversationId === convo.id 
                                                        ? "bg-white/10 text-white border border-white/20 shadow-xl" 
                                                        : "hover:bg-white/5 border border-transparent text-muted-foreground hover:text-white"
                                                )}
                                                onClick={handleLinkClick}
                                            >
                                                {currentConversationId === convo.id && (
                                                    <motion.div 
                                                        layoutId="active-pill"
                                                        className="absolute left-0 w-1.5 h-full bg-primary"
                                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                    />
                                                )}
                                                <MessageSquare className={cn(
                                                    "w-4 h-4 transition-colors",
                                                    currentConversationId === convo.id ? "text-primary" : "text-muted-foreground/40 group-hover/link:text-primary/60"
                                                )} />
                                                <span className="truncate flex-1 tracking-tight">{convo.title}</span>
                                            </Link>
                                            <div className="absolute top-1/2 right-3 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl hover:bg-white/10 hover:text-primary transition-colors" onClick={() => handleStartRename(convo)}><Edit className="w-4 h-4"/></Button>
                                                 <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl hover:bg-destructive/20 hover:text-destructive transition-colors"><Trash2 className="w-4 h-4"/></Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent className="rounded-[2.5rem] bg-[#0d131a] border border-white/10 backdrop-blur-3xl p-10">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle className="text-3xl font-black italic tracking-tighter text-white">Purge Neural Memory?</AlertDialogTitle>
                                                            <AlertDialogDescription className="text-muted-foreground text-lg leading-relaxed pt-2">
                                                                This will permanently erase all traces of this conversation from our secure cloud. This action is irreversible.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter className="pt-8 gap-4">
                                                            <AlertDialogCancel className="rounded-full h-14 px-8 border-white/10 bg-transparent text-white hover:bg-white/5">Abort</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(convo.id)} className="rounded-full h-14 px-8 bg-destructive text-white hover:bg-destructive/90 shadow-xl shadow-destructive/20">Purge Memory</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </ScrollArea>
                
                <div className="pt-6 border-t border-white/10 mt-auto">
                    <div className="bg-white/5 rounded-[2rem] p-6 border border-white/5 group cursor-pointer hover:bg-white/10 transition-all duration-500 relative overflow-hidden">
                        <motion.div 
                            className="absolute -right-10 -bottom-10 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"
                        />
                        <div className="flex items-center gap-3 mb-2 relative z-10">
                            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Pro Tip</span>
                        </div>
                        <p className="text-xs text-muted-foreground/80 leading-relaxed relative z-10">
                            Harness the power of <strong>Gen Z Mode</strong> in settings for a more authentic, soul-aligned vibe. ✨
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function ChatHistorySidebar({ currentConversationId }: { currentConversationId?: string }) {
    const isMobile = useIsMobile();
    const chatHistorySidebar = useChatHistorySidebar();
    
    if (isMobile) {
        return (
            <Sheet open={chatHistorySidebar.isOpen} onOpenChange={chatHistorySidebar.setIsOpen}>
                <SheetContent side="left" className="p-0 w-80 bg-background/80 backdrop-blur-3xl border-r-white/10">
                    <SheetHeader className="p-8 border-b border-white/10">
                        <SheetTitle className="text-3xl font-black italic tracking-tighter text-white">Archives</SheetTitle>
                    </SheetHeader>
                    <SidebarContent currentConversationId={currentConversationId} />
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <SidebarContent currentConversationId={currentConversationId} />
    );
}
