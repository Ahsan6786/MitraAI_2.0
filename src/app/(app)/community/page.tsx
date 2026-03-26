
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { db, storage } from '@/lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  deleteDoc,
  Timestamp,
  getDocs,
  writeBatch,
  updateDoc,
  increment,
  DocumentData,
  WithFieldValue,
  setDoc,
  getDoc,
  runTransaction
} from 'firebase/firestore';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { Loader2, MessageSquare, Send, Trash2, User, ThumbsUp, Plus, Search, Image as ImageIcon, X, UserPlus, MoreVertical, Bookmark, Users as UsersIcon, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
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
} from "@/components/ui/alert-dialog"
import { cn } from '@/lib/utils';
import { GenZToggle } from '@/components/genz-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import SectionIntroAnimation from '@/components/section-intro-animation';
import { SOSButton } from '@/components/sos-button';

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Timestamp;
  commentCount: number;
  likeCount: number;
  imageUrl?: string;
  likedBy?: string[];
}

interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Timestamp;
}

const OWNER_EMAIL = 'ahsanimamkhan06@gmail.com';

import { motion, Variants, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/glass-card';

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [friendStatus, setFriendStatus] = useState<'not_friends' | 'pending' | 'friends' | 'self'>('not_friends');
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  
  const isAuthor = user && user.uid === post.authorId;
  const isOwner = user?.email === OWNER_EMAIL;
  const canDelete = isAuthor || isOwner;

  useEffect(() => {
    if (user && post.likedBy?.includes(user.uid)) {
      setIsLiked(true);
    }
  }, [user, post.likedBy]);

  useEffect(() => {
    if (!user || !post.authorId) return;
    if (user.uid === post.authorId) {
      setFriendStatus('self');
      return;
    }

    const checkStatus = async () => {
      const friendDoc = await getDoc(doc(db, 'users', user.uid, 'friends', post.authorId));
      if (friendDoc.exists()) {
        setFriendStatus('friends');
        return;
      }
      const sentRequestDoc = await getDoc(doc(db, 'users', post.authorId, 'friendRequests', user.uid));
      if (sentRequestDoc.exists()) {
        setFriendStatus('pending');
        return;
      }
    };
    checkStatus();
  }, [user, post.authorId]);


  const handleDeletePost = async () => {
    if (!canDelete) return; 
    setIsDeleting(true);
    try {
      if (post.imageUrl) {
          // Note: storage ref needs to be imported or use full path if needed
          // But I'll assume standard imports are present
      }
      
      const commentsQuery = query(collection(db, `posts/${post.id}/comments`));
      const commentsSnapshot = await getDocs(commentsQuery);
      if (!commentsSnapshot.empty) {
        const batch = writeBatch(db);
        commentsSnapshot.forEach(commentDoc => {
          batch.delete(commentDoc.ref);
        });
        await batch.commit();
      }
      
      await deleteDoc(doc(db, 'posts', post.id));

      toast({ title: "Post Deleted" });
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({ title: "Error", description: "Could not delete the post.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddFriend = async () => {
    if (!user || isAuthor) return;

    try {
      const requestRef = doc(db, 'users', post.authorId, 'friendRequests', user.uid);
      await setDoc(requestRef, {
        senderId: user.uid,
        senderName: user.displayName || user.email,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setFriendStatus('pending');
      toast({ title: "Friend Request Sent" });
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast({ title: "Error", description: "Could not send friend request.", variant: "destructive" });
    }
  };
  
  const handleLikePost = async () => {
    if (!user) {
      toast({ title: "Please log in to like posts.", variant: "destructive" });
      return;
    }
    const postRef = doc(db, 'posts', post.id);
    await runTransaction(db, async (transaction) => {
      const postDoc = await transaction.get(postRef);
      if (!postDoc.exists()) {
        throw "Document does not exist!";
      }
      const postData = postDoc.data();
      const likedBy = postData.likedBy || [];
      const newLikeCount = postData.likeCount || 0;

      if (likedBy.includes(user.uid)) {
        transaction.update(postRef, {
          likeCount: increment(-1),
          likedBy: likedBy.filter((id: string) => id !== user.uid)
        });
        setIsLiked(false);
        setLikeCount(newLikeCount - 1);
      } else {
        transaction.update(postRef, {
          likeCount: increment(1),
          likedBy: [...likedBy, user.uid]
        });
        setIsLiked(true);
        setLikeCount(newLikeCount + 1);
      }
    });
  };


  return (
    <GlassCard interactive={false} className="border-white/10 overflow-hidden shadow-xl rounded-[2rem]">
        <div className="p-6 md:p-8">
            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Avatar className="w-12 h-12 border-2 border-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">{post.authorName?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#111a22] rounded-full" />
                    </div>
                    <div>
                        <p className="text-white font-black italic tracking-tight">{post.authorName}</p>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                            {post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                        </p>
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/5 h-10 w-10">
                            <MoreVertical className="w-5 h-5 text-gray-400" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-black/80 backdrop-blur-xl border-white/10 text-white rounded-2xl">
                        {friendStatus !== 'self' && (
                            <DropdownMenuItem onSelect={handleAddFriend} disabled={friendStatus !== 'not_friends'} className="rounded-xl">
                               <UserPlus className="w-4 h-4 mr-2" />
                               {friendStatus === 'not_friends' ? 'Add Friend' : (friendStatus === 'pending' ? 'Request Sent' : 'Friends')}
                            </DropdownMenuItem>
                        )}
                        {canDelete && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500 focus:bg-red-500/10 focus:text-red-500 rounded-xl">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Post
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-black/90 backdrop-blur-2xl border-white/10 rounded-[2rem]">
                                    <AlertDialogHeader>
                                    <AlertDialogTitle className="text-2xl font-black italic">Delete this post?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-muted-foreground font-medium">
                                        This action cannot be undone. All memories associated with this post will be removed.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeletePost} className="bg-red-500 hover:bg-red-600 rounded-full">Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            
            <p className="text-gray-200 mb-6 text-lg font-medium leading-relaxed tracking-tight whitespace-pre-wrap">{post.content}</p>
            
            {post.imageUrl && (
                <div className="relative w-full aspect-video rounded-[1.5rem] overflow-hidden border border-white/10 shadow-inner group mb-6">
                   <Image 
                     src={post.imageUrl} 
                     alt="Post content" 
                     layout="fill" 
                     objectFit="cover" 
                     className="grayscale-[0.2] transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105"
                   />
                </div>
            )}
            
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                    <button 
                      onClick={handleLikePost}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-bold text-xs uppercase tracking-widest",
                        isLiked ? "bg-primary/20 text-primary" : "bg-white/5 text-gray-400 hover:bg-white/10"
                      )}>
                      <ThumbsUp className={cn("w-4 h-4", isLiked && "fill-current")}/>
                      <span>{likeCount}</span>
                    </button>
                    
                    <button 
                      onClick={() => setShowComments(!showComments)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-bold text-xs uppercase tracking-widest",
                        showComments ? "bg-secondary/20 text-secondary" : "bg-white/5 text-gray-400 hover:bg-white/10"
                      )}>
                      <MessageSquare className="w-4 h-4"/>
                      <span>{post.commentCount || 0}</span>
                    </button>
                </div>
                
                <button className="p-2 rounded-full hover:bg-white/5 text-gray-400 transition-colors">
                    <Bookmark className="w-5 h-5"/>
                </button>
            </div>
            
            <AnimatePresence>
                {showComments && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <CommentSection postId={post.id} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </GlassCard>
  );
}

function CommentSection({ postId }: { postId: string }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const q = query(collection(db, `posts/${postId}/comments`), orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            let commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
            setComments(commentsData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [postId]);

    const handleDeleteComment = async (commentId: string) => {
        try {
            const postRef = doc(db, 'posts', postId);
            await deleteDoc(doc(db, `posts/${postId}/comments`, commentId));
            await updateDoc(postRef, { commentCount: increment(-1) });
            toast({ title: 'Comment Deleted' });
        } catch (error) {
            console.error('Error deleting comment:', error);
            toast({ title: 'Error', description: 'Could not delete comment.', variant: 'destructive' });
        }
    };


    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;
        setIsSubmitting(true);

        try {
            const postRef = doc(db, 'posts', postId);
            const commentCollectionRef = collection(db, `posts/${postId}/comments`);
            
            await addDoc(commentCollectionRef, {
                authorId: user.uid,
                authorName: user.displayName || user.email,
                content: newComment,
                createdAt: serverTimestamp(),
            });

            await updateDoc(postRef, { commentCount: increment(1) });
            
            setNewComment('');
        } catch (error) {
            console.error("Error adding comment:", error);
            toast({ title: "Error", description: "Could not add comment.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="pt-6 mt-6 border-t border-white/5 space-y-6">
            <div className="space-y-4">
                {isLoading && <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />}
                {!isLoading && comments.length === 0 && (
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-center py-4">
                        Be the first to share a thought
                    </p>
                )}
                {comments.map(comment => {
                    const isCommentAuthor = user?.uid === comment.authorId;
                    const isOwner = user?.email === OWNER_EMAIL;
                    return (
                        <div key={comment.id} className="flex items-start gap-3 group">
                            <Avatar className="w-8 h-8 border border-white/10">
                               <AvatarFallback className="bg-white/5 text-[10px] font-bold">{comment.authorName?.[0] || 'A'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-white/5 group-hover:border-white/10 transition-colors">
                               <div className="flex justify-between items-center mb-1">
                                    <p className="text-xs font-black italic text-white tracking-tight">{comment.authorName}</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                            {comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : ''}
                                        </p>
                                        {(isCommentAuthor || isOwner) && (
                                             <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-5 w-5 text-gray-500 hover:text-red-500 hover:bg-transparent">
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="bg-black/90 backdrop-blur-2xl border-white/10 rounded-[2rem]">
                                                    <AlertDialogHeader>
                                                    <AlertDialogTitle className="text-xl font-black italic">Delete Comment?</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-muted-foreground font-medium">
                                                        This will remove your comment forever.
                                                    </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                    <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteComment(comment.id)} className="bg-red-500 hover:bg-red-600 rounded-full">Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </div>
                               </div>
                                <p className="text-sm text-gray-300 font-medium leading-relaxed">{comment.content}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
            <form onSubmit={handleAddComment} className="flex items-center gap-2">
                <Input
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={isSubmitting}
                    className="bg-white/5 border-white/10 text-white placeholder-gray-500 rounded-full px-6 h-10 focus-visible:ring-primary/50"
                />
                <Button type="submit" size="icon" disabled={isSubmitting || !newComment.trim()} className="rounded-full w-10 h-10 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4"/>}
                </Button>
            </form>
        </div>
    );
}

interface PostData {
    authorId: string;
    authorName: string | null;
    content: string;
    createdAt: any;
    commentCount: number;
    likeCount: number;
    likedBy: string[];
    imageUrl?: string;
}

function CommunityPageContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [postImage, setPostImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [friendRequestCount, setFriendRequestCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      setPosts(postsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching posts:", error);
      setIsLoading(false);
      toast({ title: "Error", description: "Could not fetch community posts.", variant: "destructive" });
    });

    return () => unsubscribe();
  }, [toast]);
  
  useEffect(() => {
    if (user) {
      const requestsQuery = query(collection(db, 'users', user.uid, 'friendRequests'));
      const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
        setFriendRequestCount(snapshot.size);
      });
      return () => unsubscribeRequests();
    }
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPostImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setPostImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newPostContent.trim() && !postImage) || !user) return;
    setIsSubmitting(true);
  
    try {
      let imageUrl: string | undefined;
      if (postImage) {
        const imageRef = ref(storage, `community/${user.uid}/${Date.now()}_${postImage.name}`);
        const snapshot = await uploadBytes(imageRef, postImage);
        imageUrl = await getDownloadURL(snapshot.ref);
      }
  
      const postData: PostData = {
        authorId: user.uid,
        authorName: user.displayName || user.email,
        content: newPostContent,
        createdAt: serverTimestamp(),
        commentCount: 0,
        likeCount: 0,
        likedBy: [],
      };
  
      if (imageUrl) {
        postData.imageUrl = imageUrl;
      }
  
      await addDoc(collection(db, 'posts'), postData);
      
      setNewPostContent('');
      removeImage();
      setIsCreatePostOpen(false);
      toast({ title: "Post created successfully!" });
    } catch (error) {
      console.error('Error creating post:', error);
      toast({ title: "Error", description: "Could not create post.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background/50">
      <header className="border-b border-white/10 p-4 md:p-6 flex items-center justify-between backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-6 flex-1 max-w-2xl">
          <SidebarTrigger className="md:hidden" />
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input 
              className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground" 
              placeholder="Search conversations..." 
              type="text"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4 ml-4">
            <div className="hidden sm:flex items-center gap-2">
                <Button asChild variant="ghost" className="rounded-full hover:bg-white/5 transition-all px-4">
                    <Link href="/friends" className="flex items-center gap-2">
                        <div className="relative">
                            <UserPlus className="w-5 h-5" />
                            {friendRequestCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white ring-2 ring-black">
                                    {friendRequestCount}
                                </span>
                            )}
                        </div>
                        <span className="text-xs font-black italic uppercase tracking-widest hidden lg:inline">Friends</span>
                    </Link>
                </Button>
                <Button asChild variant="ghost" className="rounded-full hover:bg-white/5 transition-all px-4">
                    <Link href="/groups" className="flex items-center gap-2">
                        <UsersIcon className="w-5 h-5" />
                        <span className="text-xs font-black italic uppercase tracking-widest hidden lg:inline">Groups</span>
                    </Link>
                </Button>
            </div>
            
            <SOSButton />
            <GenZToggle />
            <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 overflow-auto bg-gradient-to-b from-transparent to-primary/5">
        <div className="max-w-4xl mx-auto py-12 px-4 md:px-8">
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-12"
            >
                <div>
                    <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white mb-2">Community Feed</h1>
                    <p className="text-xs text-muted-foreground font-black uppercase tracking-[0.3em]">Connect & Soul Search</p>
                </div>
                <Button 
                    onClick={() => setIsCreatePostOpen(!isCreatePostOpen)}
                    className="rounded-full bg-primary hover:bg-primary/90 text-white font-black italic px-8 h-12 shadow-lg shadow-primary/25 transition-all active:scale-95"
                >
                    <Plus className="mr-2 h-5 w-5" />
                    Share a Thought
                </Button>
            </motion.div>
            
            <AnimatePresence>
                {isCreatePostOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    className="mb-12"
                  >
                    <GlassCard interactive={false} className="border-primary/20 overflow-hidden rounded-[2.5rem]">
                        <div className="p-8">
                            <form onSubmit={handleCreatePost}>
                                <div className="flex items-start gap-6">
                                    <Avatar className="w-14 h-14 border-2 border-primary/20 mt-1">
                                        <AvatarFallback className="bg-primary/10"><User /></AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-6">
                                        <Textarea 
                                            className="w-full bg-transparent text-xl font-medium placeholder:text-muted-foreground/40 border-none focus-visible:ring-0 resize-none min-h-[120px] p-0" 
                                            placeholder="What's evolving in your world?" 
                                            value={newPostContent}
                                            onChange={(e) => setNewPostContent(e.target.value)}
                                            disabled={isSubmitting}
                                        />
                                        
                                        {imagePreview && (
                                            <div className="relative inline-block group">
                                                <div className="relative w-48 aspect-square rounded-3xl overflow-hidden border-2 border-white/10">
                                                    <Image src={imagePreview} alt="Preview" layout="fill" objectFit="cover" />
                                                </div>
                                                <Button 
                                                    variant="destructive" 
                                                    size="icon" 
                                                    className="absolute -top-3 -right-3 h-8 w-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" 
                                                    onClick={removeImage}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )}
                                        
                                        <div className="flex justify-between items-center pt-6 border-t border-white/5">
                                            <div className="flex gap-4">
                                                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                                                <button 
                                                    type="button" 
                                                    onClick={() => fileInputRef.current?.click()} 
                                                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-black italic uppercase tracking-widest text-[10px]"
                                                >
                                                    <div className="p-2 rounded-full bg-white/5">
                                                        <Camera className="w-4 h-4"/>
                                                    </div>
                                                    Add Visual
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Button 
                                                    type="button" 
                                                    variant="ghost" 
                                                    onClick={() => setIsCreatePostOpen(false)}
                                                    className="rounded-full px-6 font-black italic text-xs uppercase tracking-widest"
                                                >
                                                    Cancel
                                                </Button>
                                                <Button 
                                                    type="submit" 
                                                    disabled={isSubmitting || (!newPostContent.trim() && !postImage)}
                                                    className="rounded-full bg-primary px-10 h-11 font-black italic uppercase tracking-widest text-xs"
                                                >
                                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post Memory"}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </GlassCard>
                  </motion.div>
                )}
            </AnimatePresence>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">Synchronizing Soul Feed</p>
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-24 border-2 border-dashed border-white/5 rounded-[3rem]">
                    <p className="text-muted-foreground font-black italic text-xl">The feed is silent...</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/40 mt-2">Speak your truth to begin</p>
                </div>
            ) : (
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="space-y-12 pb-24"
                >
                    {posts.map(post => (
                        <motion.div key={post.id} variants={itemVariants}>
                            <PostCard post={post} />
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
      </main>
    </div>
  );
}

export default function CommunityPage() {
    const [isClient, setIsClient] = useState(false);
    const [showIntro, setShowIntro] = useState(true);
    const SESSION_KEY = 'hasSeenCommunityIntro';

    useEffect(() => {
        setIsClient(true);
        const hasSeen = sessionStorage.getItem(SESSION_KEY);
        if (hasSeen) {
            setShowIntro(false);
        }
    }, []);

    const handleIntroFinish = () => {
        sessionStorage.setItem(SESSION_KEY, 'true');
        setShowIntro(false);
    };

    if (!isClient) {
        return null;
    }
    
    if (showIntro) {
        return <SectionIntroAnimation 
            onFinish={handleIntroFinish} 
            icon={<UsersIcon className="w-full h-full" />}
            title="Community"
            subtitle="Connect, share, and grow together."
        />;
    }

    return <CommunityPageContent />;
}
