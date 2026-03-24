
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
        <div className="h-full px-4 py-6 flex flex-col gap-6">
             <Button 
                onClick={handleNewChat} 
                className="w-full rounded-full h-12 bg-primary shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all gap-2 font-bold italic tracking-tight"
            >
                <Plus className="h-5 w-5" />
                New Chat
            </Button>

            <div className="space-y-4 flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 px-2 text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">
                    <History className="w-3 h-3" />
                    Recent History
                </div>
                
                <ScrollArea className="flex-1 -mx-2 px-2">
                    <div className="space-y-2 py-1">
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
                                        <div className="flex items-center gap-2 glass p-1.5 rounded-full border-primary/20">
                                            <Input 
                                                value={renameValue} 
                                                onChange={e => setRenameValue(e.target.value)}
                                                className="h-8 rounded-full border-none bg-transparent focus-visible:ring-0 text-sm"
                                                autoFocus
                                            />
                                            <Button size="icon" className="h-8 w-8 rounded-full shrink-0" onClick={handleConfirmRename}><Check className="w-4 h-4"/></Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full shrink-0" onClick={handleCancelRename}><X className="w-4 h-4"/></Button>
                                        </div>
                                    ) : (
                                        <>
                                            <Link
                                                href={`/chat/${convo.id}`}
                                                className={cn(
                                                    "w-full h-11 justify-start px-4 flex items-center gap-3 text-sm font-medium rounded-full transition-all duration-300",
                                                    currentConversationId === convo.id 
                                                        ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" 
                                                        : "hover:bg-accent border border-transparent"
                                                )}
                                                onClick={handleLinkClick}
                                            >
                                                <div className={cn(
                                                    "h-2 w-2 rounded-full",
                                                    currentConversationId === convo.id ? "bg-primary animate-pulse" : "bg-muted-foreground/30"
                                                )} />
                                                <span className="truncate flex-1 tracking-tight">{convo.title}</span>
                                            </Link>
                                            <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-accent/80 backdrop-blur-md p-1 rounded-full">
                                                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full hover:text-primary transition-colors" onClick={() => handleStartRename(convo)}><Edit className="w-3.5 h-3.5"/></Button>
                                                 <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5"/></Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent className="rounded-[2rem] glass backdrop-blur-3xl border-border/40">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle className="text-2xl font-black italic tracking-tighter">Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription className="text-muted-foreground leading-relaxed">
                                                                This will permanently erase all memories from this specific conversation. This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter className="gap-2">
                                                            <AlertDialogCancel className="rounded-full border-border/50">Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(convo.id)} className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete Memory</AlertDialogAction>
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
                
                <div className="pt-4 border-t border-border/40 mt-auto">
                    <div className="bg-primary/5 rounded-[1.5rem] p-4 border border-primary/10 group cursor-pointer hover:bg-primary/10 transition-colors">
                        <div className="flex items-center gap-3 mb-1">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-xs font-black uppercase tracking-widest text-primary">Pro Tips</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug">
                            Try <strong>Gen Z Mode</strong> in your settings for a more expressive vibe. ✨
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
                <SheetContent side="left" className="p-0 w-80 rounded-r-[2rem] glass border-none">
                    <SheetHeader className="p-6 border-b border-border/40">
                        <SheetTitle className="text-2xl font-black italic tracking-tighter">My History</SheetTitle>
                    </SheetHeader>
                    <SidebarContent currentConversationId={currentConversationId} />
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <aside className="h-full w-72 bg-muted/20 border-r border-border/40 flex-col hidden md:flex sticky top-0">
            <SidebarContent currentConversationId={currentConversationId} />
        </aside>
    );
}
