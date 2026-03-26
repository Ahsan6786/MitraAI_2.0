
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { updateProfile } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User, Bot, MapPin, Edit, Phone, CalendarIcon } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { GenZToggle } from '@/components/genz-toggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { allIndianStates } from '@/lib/states-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SOSButton } from '@/components/sos-button';


import { GlassCard } from '@/components/glass-card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
    const { user, loading, reloadUser } = useAuth();
    const { toast } = useToast();
    const [displayName, setDisplayName] = useState('');
    const [age, setAge] = useState('');
    const [companionName, setCompanionName] = useState('');
    const [state, setState] = useState('');
    const [city, setCity] = useState('');
    const [emergencyContactName, setEmergencyContactName] = useState('');
    const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || '');
            setPhotoPreview(user.photoURL);
            const fetchProfileData = async () => {
                const userDocRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setCompanionName(data.companionName || '');
                    setAge(data.age ? String(data.age) : '');
                    setState(data.state || '');
                    setCity(data.city || '');
                    setEmergencyContactName(data.emergencyContactName || '');
                    setEmergencyContactPhone(data.emergencyContactPhone || '');
                }
                setIsLoadingData(false);
            };
            fetchProfileData();
        } else if (!loading) {
            setIsLoadingData(false);
        }
    }, [user, loading]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        const currentUser = auth.currentUser;
        if (!currentUser) {
             toast({ title: "Not authenticated", variant: "destructive" });
            return;
        }
        if (!displayName.trim() || !age.trim()) {
            toast({ title: "Name and Age are required", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            let photoURL = currentUser.photoURL;
            if (photoFile) {
                const filePath = `profile-pictures/${currentUser.uid}/${photoFile.name}`;
                const storageRef = ref(storage, filePath);
                const snapshot = await uploadBytes(storageRef, photoFile);
                photoURL = await getDownloadURL(snapshot.ref);
                setPhotoPreview(photoURL); 
            }
            await updateProfile(currentUser, { displayName, photoURL });
            const userDocRef = doc(db, 'users', currentUser.uid);
            await setDoc(userDocRef, { 
                companionName: companionName.trim(),
                state: state.trim(),
                city: city.trim(),
                age: parseInt(age, 10),
                displayName: displayName.trim(),
                email: currentUser.email,
                photoURL: photoURL || null,
                emergencyContactName: emergencyContactName.trim(),
                emergencyContactPhone: emergencyContactPhone.trim(),
            }, { merge: true });
            await reloadUser();
            toast({ title: "Protocol Updated", description: "Your core parameters have been synchronized." });
            setPhotoFile(null);
        } catch (error: any) {
            console.error("Error updating profile:", error);
            toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading || isLoadingData) {
        return (
            <div className="flex justify-center items-center h-screen bg-background">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-t-2 border-primary animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-primary/20 animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    const userAvatarFallback = user?.displayName?.[0] || user?.email?.[0] || 'U';

    return (
        <div className="h-full flex flex-col relative bg-background/50 overflow-hidden">
            {/* Dynamic Background Blobs */}
            <div className="absolute inset-0 pointer-events-none -z-10">
                <motion.div 
                    animate={{ 
                        scale: [1, 1.3, 1],
                        rotate: [0, -90, 0],
                        opacity: [0.05, 0.12, 0.05]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-1/4 -left-1/4 w-[70rem] h-[70rem] bg-indigo-500/10 rounded-full blur-[160px]" 
                />
                <motion.div 
                    animate={{ 
                        scale: [1.3, 1, 1.3],
                        rotate: [-90, 0, -90],
                        opacity: [0.03, 0.08, 0.03]
                    }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-1/4 -right-1/4 w-[70rem] h-[70rem] bg-primary/20 rounded-full blur-[160px]" 
                />
            </div>

            <header className="h-24 shrink-0 px-6 md:px-10 border-b border-white/10 flex items-center justify-between bg-background/40 backdrop-blur-3xl sticky top-0 z-50">
                <div className="flex items-center gap-5">
                    <SidebarTrigger className="h-12 w-12 rounded-2xl border border-white/10 hover:bg-primary/10 hover:border-primary/20 transition-all active:scale-95" />
                    <div className="hidden sm:block h-10 w-px bg-white/5 mx-2" />
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-black italic tracking-tighter text-white uppercase">Profile</h1>
                        <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground/60">Biometric Sync Active</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <SOSButton />
                    <GenZToggle />
                    <ThemeToggle />
                </div>
            </header>

            <main className="flex-1 overflow-auto p-6 md:p-12 lg:p-16 flex justify-center items-start">
                <div className="w-full max-w-4xl space-y-12">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center space-y-4"
                    >
                        <h1 className="text-5xl md:text-6xl font-black italic tracking-tightest leading-tight text-white capitalize">
                            Identity <span className="text-primary italic">Forge.</span>
                        </h1>
                        <p className="text-lg text-muted-foreground/80 font-medium leading-relaxed max-w-2xl mx-auto">
                            Configure your persona and localize your clinical environment for a tailored therapeutic experience.
                        </p>
                    </motion.div>

                    <form onSubmit={handleUpdateProfile} className="space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column: Avatar & Core Identity */}
                            <div className="lg:col-span-1 space-y-8">
                                <GlassCard className="p-8 flex flex-col items-center gap-6 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                    <div className="relative">
                                        <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                                        <Avatar className="w-40 h-40 border-4 border-white/10 shadow-2xl relative z-10 rounded-[2.5rem]">
                                            <AvatarImage src={photoPreview || undefined} className="object-cover" />
                                            <AvatarFallback className="text-5xl font-black bg-white/5">{userAvatarFallback.toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="absolute -bottom-2 -right-2 rounded-2xl h-12 w-12 bg-white text-black hover:bg-white/90 border-none shadow-xl z-20 active:scale-90 transition-transform"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Edit className="w-5 h-5"/>
                                        </Button>
                                        <Input 
                                            type="file" 
                                            ref={fileInputRef}
                                            className="hidden" 
                                            accept="image/png, image/jpeg"
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                    <div className="text-center space-y-1 relative z-10">
                                        <h3 className="text-xl font-black italic text-white tracking-tight">{displayName || 'Anonymous User'}</h3>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">{user?.email}</p>
                                    </div>
                                </GlassCard>

                                <GlassCard className="p-6 space-y-6">
                                    <div className="flex items-center gap-3">
                                        <Bot className="w-4 h-4 text-primary" />
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Companion Protocol</h4>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="companionName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Assigned Designation</Label>
                                            <Input
                                                id="companionName"
                                                className="h-12 bg-white/5 border-white/10 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all font-bold"
                                                value={companionName}
                                                onChange={(e) => setCompanionName(e.target.value)}
                                                placeholder="e.g., Mitra"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>
                                </GlassCard>
                            </div>

                            {/* Right Column: Detailed Parameters */}
                            <div className="lg:col-span-2 space-y-8">
                                <GlassCard className="p-8 space-y-8">
                                    <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                                        <User className="w-5 h-5 text-primary" />
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Personnel Data</h4>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="displayName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">FullName</Label>
                                            <Input
                                                id="displayName"
                                                className="h-12 bg-white/5 border-white/10 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all font-bold"
                                                value={displayName}
                                                onChange={(e) => setDisplayName(e.target.value)}
                                                placeholder="Enter identifier"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="age" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Chronological Age</Label>
                                            <Input
                                                id="age"
                                                type="number"
                                                className="h-12 bg-white/5 border-white/10 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all font-bold"
                                                value={age}
                                                onChange={(e) => setAge(e.target.value)}
                                                placeholder="Years"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="state" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Localized State</Label>
                                            <Select onValueChange={setState} value={state} disabled={isSubmitting}>
                                                <SelectTrigger id="state" className="h-12 bg-white/5 border-white/10 rounded-xl focus:border-primary/50 font-bold">
                                                    <SelectValue placeholder="Select Zone" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-zinc-900 border-white/10 text-white rounded-xl">
                                                    {allIndianStates.filter(s => s.id !== 'india').map(s => (
                                                        <SelectItem key={s.id} value={s.name} className="focus:bg-primary/20 rounded-lg">{s.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="city" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Sector (City)</Label>
                                            <Input
                                                id="city"
                                                className="h-12 bg-white/5 border-white/10 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all font-bold"
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                                placeholder="Enter City"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>
                                </GlassCard>

                                <GlassCard className="p-8 space-y-8 border-rose-500/20 bg-rose-500/5 hover:border-rose-500/30 transition-colors">
                                    <div className="flex items-center gap-3 border-b border-rose-500/10 pb-6">
                                        <Phone className="w-5 h-5 text-rose-400" />
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-400">Emergency Override</h4>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="emergencyContactName" className="text-[10px] font-black uppercase tracking-widest text-rose-400/60 ml-1">Contact Alias</Label>
                                            <Input
                                                id="emergencyContactName"
                                                className="h-12 bg-white/5 border-white/10 rounded-xl focus:border-rose-500/50 focus:ring-rose-500/20 transition-all font-bold"
                                                value={emergencyContactName}
                                                onChange={(e) => setEmergencyContactName(e.target.value)}
                                                placeholder="e.g., Guardian"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="emergencyContactPhone" className="text-[10px] font-black uppercase tracking-widest text-rose-400/60 ml-1">Direct Frequency (Phone)</Label>
                                            <Input
                                                id="emergencyContactPhone"
                                                type="tel"
                                                className="h-12 bg-white/5 border-white/10 rounded-xl focus:border-rose-500/50 focus:ring-rose-500/20 transition-all font-bold"
                                                value={emergencyContactPhone}
                                                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                                                placeholder="+91 XXXXX XXXXX"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-400/40 text-center">Primary node for SOS trigger events</p>
                                </GlassCard>

                                <Button 
                                    type="submit" 
                                    disabled={isSubmitting} 
                                    className="w-full h-16 rounded-[1.25rem] bg-white text-black hover:bg-white/90 font-black italic text-xl shadow-2xl transition-all active:scale-[0.98] group"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                    ) : (
                                        <span className="group-hover:tracking-widest transition-all duration-500">SYNCHRONIZE PARAMETERS</span>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
