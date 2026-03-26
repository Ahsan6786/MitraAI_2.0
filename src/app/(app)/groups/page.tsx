
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, onSnapshot, getDoc, query, where } from 'firebase/firestore';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { GenZToggle } from '@/components/genz-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquarePlus, Users, Loader2, UserPlus, Search } from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SOSButton } from '@/components/sos-button';
import { GlassCard } from '@/components/glass-card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Friend {
  id: string;
  displayName: string;
  email: string;
}

interface Group {
    id: string;
    name: string;
    memberCount: number;
}

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

function CreateGroupDialog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [groupName, setGroupName] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user || !isOpen) return;

    const friendsQuery = query(collection(db, 'users', user.uid, 'friends'));
    const unsubscribe = onSnapshot(friendsQuery, (snapshot) => {
      const friendsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Friend));
      setFriends(friendsData);
    });

    return () => unsubscribe();
  }, [user, isOpen]);

  const handleNextStep = () => {
    if (groupName.trim()) {
      setStep(2);
    }
  };

  const handleFriendSelect = (friendId: string) => {
    setSelectedFriends(prev =>
      prev.includes(friendId) ? prev.filter(id => id !== friendId) : [...prev, friendId]
    );
  };
  
  const resetState = () => {
      setGroupName('');
      setSelectedFriends([]);
      setStep(1);
      setIsOpen(false);
  };

  const handleCreateGroup = async () => {
    if (!user || !groupName.trim() || selectedFriends.length === 0) {
        toast({ title: 'Validation Required', description: 'Please provide a group name and select at least one friend.', variant: 'destructive' });
        return;
    }
    setIsLoading(true);
    
    try {
        const members = [user.uid, ...selectedFriends];
        await addDoc(collection(db, 'groups'), {
            name: groupName,
            createdBy: user.uid,
            admins: [user.uid],
            createdAt: serverTimestamp(),
            members: members,
        });

        toast({ title: 'Neural Node Created', description: `Secured encrypted channel "${groupName}" is now active.`});
        resetState();
    } catch (error) {
        console.error("Error creating group:", error);
        toast({ title: 'Encryption Failed', description: 'Could not establish group channel.', variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetState(); setIsOpen(open); }}>
      <DialogTrigger asChild>
        <Button className="h-12 px-6 rounded-2xl bg-white text-black hover:bg-white/90 font-black italic text-xs tracking-widest shadow-2xl transition-all active:scale-95">
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          ESTABLISH NODE
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-black/90 backdrop-blur-3xl border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        <DialogHeader className="p-8 pb-4">
          <DialogTitle className="text-2xl font-black italic tracking-tighter text-white uppercase">Initialize Group</DialogTitle>
          <DialogDescription className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">
            {step === 1 ? 'Step 01: Identification' : 'Step 02: Synchronization'}
          </DialogDescription>
        </DialogHeader>

        <div className="px-8 py-4">
            <AnimatePresence mode="wait">
                {step === 1 ? (
                    <motion.div 
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="space-y-2">
                             <Label htmlFor="group-name" className="text-[10px] font-black uppercase tracking-widest text-primary/80">Designation</Label>
                             <Input
                                id="group-name"
                                placeholder="Group Identity Pattern..."
                                className="h-14 bg-white/5 border-white/10 rounded-2xl focus:border-primary/50 focus:ring-primary/20 transition-all font-medium"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                             />
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                    >
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary/80">Available Connections</Label>
                        <ScrollArea className="h-64 pr-4">
                            <div className="space-y-3">
                                {friends.map(friend => (
                                    <div 
                                        key={friend.id} 
                                        onClick={() => handleFriendSelect(friend.id)}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group",
                                            selectedFriends.includes(friend.id) 
                                                ? "bg-primary/10 border-primary/30" 
                                                : "bg-white/5 border-white/10 hover:border-white/20"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 rounded-xl border border-white/10">
                                                <AvatarFallback className="bg-white/5 font-black text-sm">{friend.displayName?.[0] || 'U'}</AvatarFallback>
                                            </Avatar>
                                            <div className="space-y-0.5">
                                                <p className="font-black italic text-white tracking-tight text-sm line-clamp-1">{friend.displayName}</p>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">{friend.email}</p>
                                            </div>
                                        </div>
                                        <Checkbox
                                            checked={selectedFriends.includes(friend.id)}
                                            onCheckedChange={() => handleFriendSelect(friend.id)}
                                            className="rounded-lg border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                        />
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        <DialogFooter className="p-8 pt-4 gap-3">
          {step === 1 ? (
            <Button 
                onClick={handleNextStep} 
                disabled={!groupName.trim()}
                className="w-full h-12 rounded-2xl bg-primary text-black font-black italic text-xs tracking-widest hover:bg-primary/90 transition-all"
            >
              PROCEED
            </Button>
          ) : (
            <>
              <Button 
                variant="ghost" 
                onClick={() => setStep(1)}
                className="flex-1 h-12 rounded-2xl border border-white/10 font-black italic text-xs tracking-widest text-white hover:bg-white/5"
              >
                BACK
              </Button>
              <Button 
                onClick={handleCreateGroup} 
                disabled={isLoading || selectedFriends.length === 0}
                className="flex-[2] h-12 rounded-2xl bg-primary text-black font-black italic text-xs tracking-widest hover:bg-primary/90 transition-all active:scale-95"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                INITIALIZE
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
      if (!user) return;
      
      const groupsQuery = query(collection(db, 'groups'), where('members', 'array-contains', user.uid));
      const unsubscribe = onSnapshot(groupsQuery, (snapshot) => {
          const groupsData = snapshot.docs.map(doc => ({
              id: doc.id,
              name: doc.data().name,
              memberCount: doc.data().members.length,
          } as Group));
          setGroups(groupsData);
          setIsLoading(false);
      });
      
      return () => unsubscribe();
  }, [user]);

  return (
    <div className="h-full flex flex-col relative bg-background/50 overflow-hidden">
        {/* Dynamic Background Blobs */}
        <div className="absolute inset-0 pointer-events-none -z-10">
            <motion.div 
                animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 0],
                    opacity: [0.03, 0.08, 0.03]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[60rem] bg-primary/20 rounded-full blur-[150px]" 
            />
        </div>

        <header className="h-24 shrink-0 px-6 md:px-10 border-b border-white/10 flex items-center justify-between bg-background/40 backdrop-blur-3xl sticky top-0 z-50">
            <div className="flex items-center gap-5">
                <SidebarTrigger className="h-12 w-12 rounded-2xl border border-white/10 hover:bg-primary/10 hover:border-primary/20 transition-all active:scale-95" />
                <div className="hidden sm:block h-10 w-px bg-white/5 mx-2" />
                <div className="flex flex-col">
                    <h1 className="text-2xl font-black italic tracking-tighter text-white uppercase flex items-center gap-3">
                        Collective
                    </h1>
                    <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                        <span className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground/60">Peer Sync Active</span>
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
                    className="flex flex-col md:flex-row md:items-end justify-between gap-8"
                >
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-5xl font-black italic tracking-tightest leading-tight text-white capitalize">
                            Neural <span className="text-primary italic">Collectives.</span>
                        </h1>
                        <p className="text-lg text-muted-foreground/80 font-medium leading-relaxed max-w-xl">
                            Synchronize with your support nodes through encrypted group communication channels.
                        </p>
                    </div>
                    <CreateGroupDialog />
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
                ) : groups.length === 0 ? (
                    <GlassCard className="text-center p-20 max-w-2xl mx-auto space-y-8">
                        <div className="bg-white/5 p-8 rounded-[3rem] w-fit mx-auto">
                            <Users className="w-16 h-16 text-muted-foreground/20"/>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black italic tracking-tight text-white uppercase">Void Detected</h3>
                            <p className="text-muted-foreground font-medium max-w-sm mx-auto">No collective nodes registered in your neural network. Initialize a new group to begin synchronization.</p>
                        </div>
                    </GlassCard>
                ) : (
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                        {groups.map(group => (
                            <motion.div key={group.id} variants={itemVariants}>
                                <Link href={`/groups/${group.id}`}>
                                    <GlassCard className="p-8 group hover:border-primary/30 transition-all duration-500 relative overflow-hidden active:scale-[0.98]">
                                        <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                                        
                                        <div className="relative flex items-start justify-between">
                                            <div className="space-y-6">
                                                <div className="p-3 bg-white/5 rounded-2xl w-fit border border-white/10 group-hover:border-primary/20 transition-colors">
                                                    <Users className="w-6 h-6 text-primary" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-2xl font-black italic tracking-tighter text-white group-hover:text-primary transition-colors">{group.name}</h3>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">{group.memberCount} Mapped Nodes</span>
                                                        <div className="w-1 h-1 rounded-full bg-white/10" />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400/60">Active</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="h-10 w-10 rounded-full border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all">
                                                <Search className="w-4 h-4 text-primary" />
                                            </div>
                                        </div>
                                    </GlassCard>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </main>
    </div>
  );
}
