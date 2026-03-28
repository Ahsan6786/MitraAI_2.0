'use client';

import { useState, useEffect, useRef } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Smartphone, Monitor, AlertCircle, Sparkles, SwitchCamera, Loader2, Pencil, ScanLine } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/theme-toggle';
import { GenZToggle } from '@/components/genz-toggle';

import { SOSButton } from '@/components/sos-button';
import { GlassCard } from '@/components/glass-card';
import { motion, AnimatePresence } from 'framer-motion';
import Script from 'next/script';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

// --- JARVIS AIR DRAW COMPONENT ---
function JarvisAirDraw({ isReady }: { isReady: boolean }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [mode, setMode] = useState('STANDBY');
    const [currentColor, setCurrentColor] = useState('#00f2ff');
    const isMobile = useIsMobile();
    
    useEffect(() => {
        if (!isReady) return;

        let active = true;
        let hands: any;
        let camera: any;
        let isDrawing = false;
        let isErasing = false;
        let lastX = 0;
        let lastY = 0;
        let smoothedX = 0;
        let smoothedY = 0;
        const EMA_ALPHA = 0.25;
        let gestureBuffer: string[] = [];
        const BUFFER_SIZE = 5;
        let stabilizedGesture = 'none';
        let currentColorIndex = 0;
        const colors = ['#00f2ff', '#39ff14', '#ff3131', '#fff01f', '#bc13fe'];
        let lastGesture = 'none';
        let gestureCooldown = 0;

        const initGame = async () => {
            if (typeof window === 'undefined' || !window.Hands || !window.Camera || !active) return;

            const videoElement = videoRef.current!;
            const canvasElement = canvasRef.current!;
            const canvasCtx = canvasElement.getContext('2d')!;
            const drawingCanvas = drawingCanvasRef.current!;
            const drawCtx = drawingCanvas.getContext('2d')!;

            const setupCanvas = () => {
                if (!active) return;
                const parent = drawingCanvas.parentElement;
                if (!parent) return;
                
                // Adjust for mobile vs desktop aspect ratio
                const width = parent.offsetWidth;
                const height = parent.offsetHeight;
                
                drawingCanvas.width = width;
                drawingCanvas.height = height;
                canvasElement.width = width;
                canvasElement.height = height;
                
                drawCtx.lineCap = 'round';
                drawCtx.lineJoin = 'round';
                drawCtx.lineWidth = isMobile ? 6 : 8;
                drawCtx.strokeStyle = colors[currentColorIndex];
                drawCtx.shadowBlur = 20;
                drawCtx.shadowColor = colors[currentColorIndex];
            };

            window.addEventListener('resize', setupCanvas);
            setupCanvas();

            const onResults = (results: any) => {
                if (!active) return;
                setIsLoaded(true);
                canvasCtx.save();
                canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
                
                if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                    const landmarks = results.multiHandLandmarks[0];
                    if (window.drawConnectors) {
                        window.drawConnectors(canvasCtx, landmarks, (window as any).HAND_CONNECTIONS, {color: 'rgba(0, 242, 255, 0.4)', lineWidth: 2});
                    }
                    detectGesture(landmarks);
                } else {
                    setMode('STANDBY');
                    isDrawing = false;
                    isErasing = false;
                }
                canvasCtx.restore();
            };

            const detectGesture = (landmarks: any) => {
                const indexUp = landmarks[8].y < landmarks[6].y;
                const middleUp = landmarks[12].y < landmarks[10].y;
                const ringUp = landmarks[16].y < landmarks[14].y;
                const pinkyUp = landmarks[20].y < landmarks[18].y;
                const thumbUp = landmarks[4].y < landmarks[3].y && landmarks[4].y < landmarks[2].y;

                let rawGesture = 'hover';
                if (!indexUp && !middleUp && !ringUp && !pinkyUp && !thumbUp) rawGesture = 'erase';
                else if (indexUp && middleUp && ringUp && pinkyUp) rawGesture = 'clearIntent';
                else if (thumbUp && !indexUp && !middleUp && !ringUp && !pinkyUp) rawGesture = 'thumb';
                else if (indexUp && middleUp && !ringUp && !pinkyUp) rawGesture = 'color';
                else if (indexUp && !middleUp) rawGesture = 'draw';

                gestureBuffer.push(rawGesture);
                if (gestureBuffer.length > BUFFER_SIZE) gestureBuffer.shift();
                
                const counts: any = {};
                gestureBuffer.forEach(g => counts[g] = (counts[g] || 0) + 1);
                stabilizedGesture = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

                const canvasRect = drawingCanvas.getBoundingClientRect();
                const videoWidth = isMobile ? 720 : 1280;
                const videoHeight = isMobile ? 1280 : 720;
                const canvasRatio = canvasRect.width / canvasRect.height;
                const videoRatio = videoWidth / videoHeight;
                
                let xOff = 0, yOff = 0, xScaling = 1, yScaling = 1;
                if (canvasRatio > videoRatio) {
                    xScaling = (videoRatio / canvasRatio);
                    xOff = (1 - xScaling) / 2;
                } else {
                    yScaling = (canvasRatio / videoRatio);
                    yOff = (1 - yScaling) / 2;
                }

                const mappedX = (1 - (landmarks[8].x - xOff) / xScaling) * drawingCanvas.width;
                const mappedY = ((landmarks[8].y - yOff) / yScaling) * drawingCanvas.height;
                
                const dist = Math.hypot(mappedX - smoothedX, mappedY - smoothedY);
                const dynamicAlpha = dist > 50 ? 0.6 : EMA_ALPHA; 
                
                smoothedX = dynamicAlpha * mappedX + (1 - dynamicAlpha) * (smoothedX || mappedX);
                smoothedY = dynamicAlpha * mappedY + (1 - dynamicAlpha) * (smoothedY || mappedY);

                const x = smoothedX;
                const y = smoothedY;
                
                if (gestureCooldown > 0) gestureCooldown--;

                if (stabilizedGesture === 'erase') {
                    setMode('ERASE');
                    drawCtx.globalCompositeOperation = 'destination-out';
                    drawCtx.beginPath();
                    drawCtx.arc(x, y, isMobile ? 20 : 30, 0, Math.PI * 2);
                    drawCtx.fill();
                    isDrawing = false;
                    isErasing = true;
                } 
                else if (stabilizedGesture === 'clearIntent') {
                    setMode('CLEAR?');
                    isDrawing = false;
                    isErasing = false;
                }
                else if (stabilizedGesture === 'thumb') {
                    if (lastGesture === 'clearIntent' && gestureCooldown === 0) {
                        drawCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
                        gestureCooldown = 30;
                        setMode('CLEARED');
                    } else {
                        setMode('READY');
                    }
                    isDrawing = false;
                    isErasing = false;
                }
                else if (stabilizedGesture === 'color') {
                    if (lastGesture !== 'color' && gestureCooldown === 0) {
                        currentColorIndex = (currentColorIndex + 1) % colors.length;
                        drawCtx.strokeStyle = colors[currentColorIndex];
                        drawCtx.shadowColor = colors[currentColorIndex];
                        setCurrentColor(colors[currentColorIndex]);
                        gestureCooldown = 40;
                    }
                    setMode('CHG COLOR');
                    isDrawing = false;
                    isErasing = false;
                }
                else if (stabilizedGesture === 'draw') {
                    setMode('DRAWING');
                    drawCtx.globalCompositeOperation = 'source-over';
                    if (!isDrawing || isErasing) {
                        lastX = x;
                        lastY = y;
                    }
                    drawCtx.beginPath();
                    drawCtx.lineWidth = isMobile ? 6 : 10;
                    drawCtx.moveTo(lastX, lastY);
                    drawCtx.lineTo(x, y);
                    drawCtx.stroke();
                    lastX = x;
                    lastY = y;
                    isDrawing = true;
                    isErasing = false;
                } else {
                    setMode('HOVER');
                    isDrawing = false;
                    isErasing = false;
                }
                lastGesture = stabilizedGesture;
            };

            hands = new window.Hands({
                locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
            });

            hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.8,
                minTrackingConfidence: 0.8
            });

            hands.onResults(onResults);

            camera = new window.Camera(videoElement, {
                onFrame: async () => {
                    if (!active) return;
                    try {
                        await hands.send({image: videoElement});
                    } catch (e) {
                        console.error("Hands send error:", e);
                    }
                },
                width: isMobile ? 720 : 1280,
                height: isMobile ? 1280 : 720,
                facingMode: 'user'
            });

            camera.start();
        };

        initGame();

        return () => {
            active = false;
            console.log("Cleaning up Hand Sense...");
            
            if (camera) {
                try {
                    camera.stop();
                    console.log("Camera stopped");
                } catch (e) {
                    console.error("Error stopping camera:", e);
                }
            }

            // Force stop tracks IMMEDIATELY
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => {
                    track.stop();
                    console.log("Manually stopped track:", track.label);
                });
                videoRef.current.srcObject = null;
            }

            // Delay closing the hands instance to allow any in-flight frames to finish
            // or hit the !active check. This prevents "Cannot pass deleted object" errors.
            const handsToClose = hands;
            if (handsToClose) {
                setTimeout(() => {
                    try {
                        handsToClose.close();
                        console.log("Hands instance closed safely after delay");
                    } catch (e) {
                        console.error("Error closing hands:", e);
                    }
                }, 500);
            }
            
            window.removeEventListener('resize', () => {});
        };
    }, [isReady, isMobile]);

    return (
        <div className="relative w-full h-[60vh] md:h-[70vh] rounded-[2rem] overflow-hidden bg-black/40 border border-white/10 backdrop-blur-xl group shadow-2xl">
            {!isReady && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md px-6 text-center">
                    <Skeleton className="w-16 h-16 rounded-full mb-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60">Loading Jarvis Core...</span>
                </div>
            )}

            <div className="absolute top-6 left-6 z-20 flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">System: Active</span>
                <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full animate-pulse", mode === 'DRAWING' ? 'bg-primary' : mode === 'ERASE' ? 'bg-rose-500' : 'bg-emerald-500')} />
                    <span className="text-xl font-black italic tracking-tighter text-white uppercase">{mode}</span>
                </div>
            </div>

            <div className="absolute top-6 right-6 z-20 flex flex-col items-end gap-2">
                <div 
                    className="w-10 h-10 rounded-xl border border-white/20 transition-all duration-300" 
                    style={{ backgroundColor: currentColor, boxShadow: `0 0 20px ${currentColor}40` }}
                />
            </div>

            <div className="absolute bottom-6 left-6 z-20">
                <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-2xl space-y-1 text-[8px] font-black uppercase tracking-widest text-white/60">
                    <p>☝️ INDEX: DRAW</p>
                    <p>✊ FIST: ERASE</p>
                    <p>✋ OPEN: CLEAR</p>
                </div>
            </div>

            <video ref={videoRef} className="hidden" aria-hidden="true" />
            <canvas ref={canvasRef} className="absolute inset-0 z-10 pointer-events-none opacity-40" style={{ transform: 'scaleX(-1)' }} />
            <canvas ref={drawingCanvasRef} className="absolute inset-0 z-10 pointer-events-none" />
            
            <div className="absolute inset-0 border-[20px] border-transparent group-hover:border-primary/5 transition-all duration-700 pointer-events-none" />
        </div>
    );
}

export default function HandSensePage() {
    const [libLoaded, setLibLoaded] = useState({ camera: false, drawing: false, hands: false });
    const isMobile = useIsMobile();

    const isAllReady = libLoaded.camera && libLoaded.drawing && libLoaded.hands;

    return (
        <div className="min-h-screen flex flex-col bg-black text-white relative overflow-hidden selection:bg-primary selection:text-black">
            {/* Library Scripts */}
            <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" onLoad={() => setLibLoaded(l => ({...l, camera: true}))} />
            <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" onLoad={() => setLibLoaded(l => ({...l, drawing: true}))} />
            <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" onLoad={() => setLibLoaded(l => ({...l, hands: true}))} />

            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80rem] h-[80rem] bg-primary/5 rounded-full blur-[150px] opacity-20" />
            </div>

            <header className="sticky top-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl px-6 h-20 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-6">
                    <SidebarTrigger className="text-white/60 hover:text-white transition-colors" />
                    <div className="h-8 w-px bg-white/10 hidden md:block" />
                    <div className="flex flex-col">
                        <h1 className="text-xl font-black italic tracking-tighter leading-none uppercase">Jarvis Air Draw</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mt-1">Hand Sense Engine</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <GenZToggle />
                    <ThemeToggle />
                    <SOSButton />
                </div>
            </header>

            <main className="flex-1 relative z-10 overflow-auto p-6 md:p-12 lg:p-20">
                <div className="mx-auto max-w-6xl space-y-10">
                    {!isAllReady ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <Skeleton className="h-[60vh] md:h-[70vh] rounded-[2.5rem]" />
                             <div className="space-y-8">
                                 <Skeleton className="h-20 w-full rounded-2xl" />
                                 <Skeleton className="h-64 w-full rounded-[2.5rem]" />
                             </div>
                        </div>
                    ) : (
                        <>
                            <JarvisAirDraw isReady={isAllReady} />

                            {/* Info Section */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-20">
                                {[
                                    { icon: Pencil, title: "Jarvis Core", desc: "Advanced hand-tracking engine with sub-20ms responsiveness for fluid air drawing." },
                                    { icon: Sparkles, title: "Immersive", desc: "Experience the next evolution of user interaction and creative expression without touching the screen." },
                                    { icon: AlertCircle, title: "Experimental", desc: "Pushing the boundaries of AI-human interaction for wellness and focus." }
                                ].map((item, i) => (
                                    <GlassCard key={i} className="p-10 rounded-[2.5rem] border-white/5 hover:border-primary/20 transition-all duration-500 flex flex-col items-center text-center gap-4 group">
                                        <div className="p-5 bg-primary/10 rounded-2xl group-hover:bg-primary/20 transition-all">
                                            <item.icon className="w-6 h-6 text-primary" />
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="font-black italic uppercase text-lg tracking-tighter">{item.title}</h4>
                                            <p className="text-sm text-muted-foreground font-medium italic leading-relaxed">{item.desc}</p>
                                        </div>
                                    </GlassCard>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

declare global {
    interface Window {
        Hands: any;
        Camera: any;
        drawConnectors: any;
        HAND_CONNECTIONS: any;
    }
}
