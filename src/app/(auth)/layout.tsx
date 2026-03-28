export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full bg-background flex flex-col items-center justify-center p-4 md:p-8 overflow-x-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-72 h-72 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="w-full flex justify-center relative z-10">
        {children}
      </div>
    </div>
  );
}
