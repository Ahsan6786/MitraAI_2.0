
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, setDoc, getDoc, writeBatch, serverTimestamp, query } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, UserCheck, UserX, Check, X } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GenZToggle } from '@/components/genz-toggle';
import { SOSButton } from '@/components/sos-button';

interface FriendRequest {
  id: string;
  senderName: string;
}

interface Friend {
  id: string;
  displayName: string;
  email: string;
}

import { GlassCard } from '@/components/glass-card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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

export default function FriendsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const requestsQuery = query(collection(db, 'users', user.uid, 'friendRequests'));
    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
      const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest));
      setRequests(reqs);
    });

    const friendsQuery = query(collection(db, 'users', user.uid, 'friends'));
    const unsubscribeFriends = onSnapshot(friendsQuery, (snapshot) => {
      const frs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Friend));
      setFriends(frs);
      setIsLoading(false);
    });

    return () => {
      unsubscribeRequests();
      unsubscribeFriends();
    };
  }, [user]);

  const handleRequest = async (senderId: string, accept: boolean) => {
    if (!user) return;
    const requestRef = doc(db, 'users', user.uid, 'friendRequests', senderId);

    if (accept) {
      try {
        const batch = writeBatch(db);
        const senderDoc = await getDoc(doc(db, 'users', senderId));
        const currentUserDoc = await getDoc(doc(db, 'users', user.uid));
        const senderData = senderDoc.data();
        const currentUserData = currentUserDoc.data();

        const senderName = senderData?.displayName || senderData?.email || 'Unknown User';
        const senderEmail = senderData?.email || 'No email';
        const currentUserName = currentUserData?.displayName || user.displayName || user.email;
        const currentUserEmail = currentUserData?.email || user.email;

        const currentUserFriendRef = doc(db, 'users', user.uid, 'friends', senderId);
        batch.set(currentUserFriendRef, {
            displayName: senderName,
            email: senderEmail,
            addedAt: serverTimestamp(),
        });
        
        const senderFriendRef = doc(db, 'users', senderId, 'friends', user.uid);
        batch.set(senderFriendRef, {
            displayName: currentUserName,
            email: currentUserEmail,
            addedAt: serverTimestamp(),
        });

        batch.delete(requestRef);
        await batch.commit();
        toast({ title: 'Security Clearance Granted', description: `${senderName} is now in your connection network.` });
      } catch (error: any) {
        console.error("Error accepting friend request:", error);
        toast({ title: 'Error', description: error.message || 'Could not facilitate connection.', variant: 'destructive' });
      }
    } else {
      try {
        await deleteDoc(requestRef);
        toast({ title: 'Request Handled', description: 'The connection request has been archived.' });
      } catch (error) {
         console.error("Error rejecting friend request:", error);
         toast({ title: 'Error', description: 'Could not process rejection.', variant: 'destructive' });
      }
    }
  };
  
  const handleRemoveFriend = async (friendId: string) => {
    if (!user) return;
    try {
        const batch = writeBatch(db);
        const currentUserFriendRef = doc(db, 'users', user.uid, 'friends', friendId);
        batch.delete(currentUserFriendRef);
        const friendUserRef = doc(db, 'users', friendId, 'friends', user.uid);
        batch.delete(friendUserRef);
        await batch.commit();
        toast({ title: 'Node Disconnected', description: 'The connection has been successfully severed.' });
    } catch(error) {
        console.error("Error removing friend:", error);
        toast({ title: 'Error', description: 'Could not terminate connection.', variant: 'destructive' });
    }
  };

  return (
    <div className="h-full flex flex-col relative bg-background/50 overflow-hidden">
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

        <header className="h-24 shrink-0 px-6 md:px-10 border-b border-white/10 flex items-center justify-between bg-background/40 backdrop-blur-3xl sticky top-0 z-50">
            <div className="flex items-center gap-5">
                <SidebarTrigger className="h-12 w-12 rounded-2xl border border-white/10 hover:bg-primary/10 hover:border-primary/20 transition-all active:scale-95" />
                <div className="hidden sm:block h-10 w-px bg-white/5 mx-2" />
                <div className="flex flex-col">
                    <h1 className="text-2xl font-black italic tracking-tighter text-white uppercase">Network</h1>
                    <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                        <span className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground/60">Social Grid Online</span>
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
                    className="space-y-4"
                >
                    <h1 className="text-4xl md:text-5xl font-black italic tracking-tightest leading-tight text-white capitalize">
                        Community <span className="text-primary italic">Nexus.</span>
                    </h1>
                    <p className="text-lg text-muted-foreground/80 font-medium leading-relaxed max-w-2xl">
                        Manage your social nodes and filter inbound connection requests within your secure therapeutic network.
                    </p>
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
                ) : (
                    <Tabs defaultValue="friends" className="w-full">
                        <TabsList className="bg-white/5 border border-white/10 p-1.5 rounded-2xl h-16 max-w-md">
                            <TabsTrigger value="friends" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-black text-white text-[10px] font-black uppercase tracking-widest transition-all">Connections ({friends.length})</TabsTrigger>
                            <TabsTrigger value="requests" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-black text-white text-[10px] font-black uppercase tracking-widest transition-all">Inbound ({requests.length})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="friends" className="mt-12 focus-visible:ring-0">
                             {friends.length === 0 ? (
                                <GlassCard className="text-center p-16 max-w-lg mx-auto space-y-8">
                                    <div className="bg-white/5 p-6 rounded-[2rem] w-fit mx-auto">
                                        <User className="w-12 h-12 text-muted-foreground/40"/>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black italic tracking-tight text-white">Network Isolated</h3>
                                        <p className="text-muted-foreground font-medium">No verified connections established in the current sector.</p>
                                    </div>
                                </GlassCard>
                            ) : (
                                <motion.div 
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                >
                                    {friends.map(friend => (
                                        <motion.div key={friend.id} variants={itemVariants}>
                                            <GlassCard className="p-4 flex items-center justify-between group hover:border-white/20 transition-all duration-500">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="h-14 w-14 rounded-2xl border border-white/10">
                                                        <AvatarFallback className="bg-white/5 font-black text-xl">{friend.displayName?.[0] || 'U'}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="space-y-0.5">
                                                        <p className="font-black italic text-white tracking-tight text-lg group-hover:text-primary transition-colors">{friend.displayName}</p>
                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">{friend.email}</p>
                                                    </div>
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-10 w-10 rounded-xl hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                                                    onClick={() => handleRemoveFriend(friend.id)}
                                                >
                                                    <UserX className="w-5 h-5"/>
                                                </Button>
                                            </GlassCard>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </TabsContent>

                        <TabsContent value="requests" className="mt-12 focus-visible:ring-0">
                            {requests.length === 0 ? (
                                <GlassCard className="text-center p-16 max-w-lg mx-auto space-y-8">
                                    <div className="bg-white/5 p-6 rounded-[2rem] w-fit mx-auto">
                                        <UserCheck className="w-12 h-12 text-muted-foreground/40"/>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black italic tracking-tight text-white">Queue Empty</h3>
                                        <p className="text-muted-foreground font-medium">No pending validation requests detected in the buffer.</p>
                                    </div>
                                </GlassCard>
                            ) : (
                                <motion.div 
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="space-y-4"
                                >
                                    {requests.map(req => (
                                        <motion.div key={req.id} variants={itemVariants}>
                                            <GlassCard className="p-5 flex items-center justify-between group hover:border-white/20 transition-all duration-500">
                                                <div className="flex items-center gap-5">
                                                     <Avatar className="h-14 w-14 rounded-2xl border border-white/10">
                                                        <AvatarFallback className="bg-white/5 font-black text-xl">{req.senderName?.[0] || 'U'}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-black italic text-white tracking-tight text-lg">{req.senderName}</p>
                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Connection Request Initiated</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <Button 
                                                        size="sm" 
                                                        className="h-11 px-6 rounded-xl bg-white text-black hover:bg-white/90 font-black italic text-[10px] tracking-widest transition-all active:scale-95"
                                                        onClick={() => handleRequest(req.id, true)}
                                                    >
                                                        <Check className="w-4 h-4 mr-2"/>
                                                        VALIDATE
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className="h-11 px-6 rounded-xl border border-white/10 hover:bg-rose-500/10 hover:text-rose-400 font-black italic text-[10px] tracking-widest transition-all active:scale-95"
                                                        onClick={() => handleRequest(req.id, false)}
                                                    >
                                                        <X className="w-4 h-4 mr-2"/>
                                                        ARCHIVE
                                                    </Button>
                                                </div>
                                            </GlassCard>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </div>
        </main>
    </div>
  );
}
