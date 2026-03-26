'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/icons';

const ADMIN_EMAIL = 'ahsan.khan@mitwpu.edu.in';

function AdminSignInForm() {
  const [email, setEmail] = useState('ahsan.khan@mitwpu.edu.in');
  const [password, setPassword] = useState('123456');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if the user is the admin
      if (user.email === ADMIN_EMAIL) {
        router.push('/admin');
      } else {
        toast({
          title: "Access Denied",
          description: "This account does not have administrative privileges.",
          variant: "destructive",
        });
        await auth.signOut();
      }
    } catch (error: any) {
       toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
        <form onSubmit={handleSignIn}>
          <CardHeader className="text-center">
             <div className="flex justify-center mb-4">
               <Logo className="w-10 h-10 text-primary" />
             </div>
            <CardTitle className="text-xl sm:text-2xl flex items-center justify-center gap-2">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                Admin Login
            </CardTitle>
            <CardDescription>
              Enter your administrative credentials to access the panel.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
               <div className="flex items-center">
                 <Label htmlFor="password">Password</Label>
               </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login as Admin
            </Button>
             <div className="text-center text-sm">
              Not an admin?{' '}
              <Link href="/signin" className="underline">
                Login as a user
              </Link>
            </div>
          </CardFooter>
        </form>
    </Card>
  );
}

export default function AdminSignInPage() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return isClient ? <AdminSignInForm /> : null;
}
