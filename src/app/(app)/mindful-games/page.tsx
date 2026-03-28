
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, CheckCircle, Lightbulb, Gamepad2, ArrowLeft, Cat, Dog, Bird, Fish, Rabbit, Turtle, Bug, Snail, X, Circle, Puzzle, Wind, Brain, Music, Sparkles, Languages } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { GenZToggle } from '@/components/genz-toggle';

import { GlassCard } from '@/components/glass-card';
import { motion, AnimatePresence } from 'framer-motion';
import { SOSButton } from '@/components/sos-button';

// --- Mindful Exercises Components ---

const stages = [
  { name: 'Breathe In', duration: 4, animation: 'animate-breathe-in' },
  { name: 'Hold', duration: 4, animation: 'animate-hold' },
  { name: 'Breathe Out', duration: 4, animation: 'animate-breathe-out' },
  { name: 'Hold', duration: 4, animation: 'animate-hold' },
];

function BoxBreathingVisualizer({ stageIndex, countdown, isActive }: { stageIndex: number, countdown: number, isActive: boolean }) {
  const currentStage = stages[stageIndex];

  return (
    <div className="relative flex h-[400px] items-center justify-center rounded-[3rem] bg-white/5 border border-white/10 overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none" />
        
        {/* Animated Background Pulse */}
        <AnimatePresence>
            {isActive && (
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ 
                        scale: currentStage.name === 'Breathe In' ? 1.5 : (currentStage.name === 'Breathe Out' ? 0.8 : 1.2),
                        opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ duration: 4, ease: "easeInOut" }}
                    className="absolute h-80 w-80 rounded-full bg-primary/20 blur-[80px]"
                />
            )}
        </AnimatePresence>

        <div className="relative flex h-72 w-72 items-center justify-center">
            {/* Outer Ring */}
            <div className="absolute h-full w-full rounded-full border border-white/10" />
            
            {/* Stage Progress Ring */}
            <svg className="absolute h-full w-full -rotate-90">
                <motion.circle
                    cx="144"
                    cy="144"
                    r="140"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="880"
                    animate={{ strokeDashoffset: isActive ? 880 - (880 * ((4 - countdown) / 4)) : 880 }}
                    className="text-primary/30"
                />
            </svg>

            {/* Core Orb */}
            <motion.div 
                animate={{ 
                    scale: isActive ? (currentStage.name === 'Breathe In' ? 1.4 : (currentStage.name === 'Breathe Out' ? 0.6 : 1.2)) : 1,
                    boxShadow: isActive ? "0 0 50px rgba(var(--primary), 0.3)" : "none"
                }}
                transition={{ duration: 4, ease: "easeInOut" }}
                className="relative z-10 h-24 w-24 rounded-full bg-white flex flex-col items-center justify-center shadow-2xl"
            >
                <span className="text-black font-black italic text-2xl tracking-tighter">{countdown}</span>
                <span className="text-black/40 font-black uppercase text-[8px] tracking-[0.2em]">Sec</span>
            </motion.div>
            
            {/* Labels Grid */}
            <div className="absolute inset-0 p-4">
                <div className={cn("absolute top-0 left-1/2 -translate-x-1/2 transition-all duration-700", stageIndex === 0 ? "scale-110 opacity-100" : "scale-90 opacity-20")}>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Breathe In</p>
                </div>
                <div className={cn("absolute right-0 top-1/2 -translate-y-1/2 rotate-90 transition-all duration-700", stageIndex === 1 ? "scale-110 opacity-100" : "scale-90 opacity-20")}>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Hold</p>
                </div>
                <div className={cn("absolute bottom-0 left-1/2 -translate-x-1/2 transition-all duration-700", stageIndex === 2 ? "scale-110 opacity-100" : "scale-90 opacity-20")}>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Breathe Out</p>
                </div>
                <div className={cn("absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 transition-all duration-700", stageIndex === 3 ? "scale-110 opacity-100" : "scale-90 opacity-20")}>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Hold</p>
                </div>
            </div>
        </div>
    </div>
  );
}


function BoxBreathingExercise() {
  const [isActive, setIsActive] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [countdown, setCountdown] = useState(stages[0].duration);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev > 1) {
            return prev - 1;
          } else {
            setStageIndex(prevIndex => {
              const nextIndex = (prevIndex + 1) % stages.length;
              setCountdown(stages[nextIndex].duration);
              return nextIndex;
            });
            return stages[(stageIndex + 1) % stages.length].duration; 
          }
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, stageIndex]);

  const handleStartPause = () => setIsActive(!isActive);
  const handleReset = () => {
    setIsActive(false);
    setStageIndex(0);
    setCountdown(stages[0].duration);
  };

  return (
    <GlassCard className="rounded-[3rem] p-0 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center space-y-8">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                        <Wind className="w-3 h-3 text-primary" />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary">Breathing</span>
                    </div>
                    <h3 className="text-4xl font-black italic tracking-tightest text-white leading-tight">Calm Breathing</h3>
                    <p className="text-muted-foreground font-medium leading-relaxed max-w-sm">
                        Synchronize your neural rhythm with a controlled respiratory pattern. Stabilize your core frequency.
                    </p>
                </div>

                <div className="space-y-4">
                    {stages.map((stage, index) => (
                         <div key={index} className="flex items-center gap-6 group">
                            <div className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black italic transition-all duration-500",
                                stageIndex === index ? "bg-white text-black scale-110" : "bg-white/5 text-white/40 border border-white/10"
                            )}>
                                0{index + 1}
                            </div>
                            <div>
                                <p className={cn("font-black italic text-lg transition-colors", stageIndex === index ? "text-white" : "text-white/20")}>{stage.name}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">{stage.duration}s Interval</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-wrap gap-4 pt-4">
                    <Button 
                        onClick={handleStartPause} 
                        size="lg"
                        className={cn(
                            "h-14 px-8 rounded-2xl font-black italic text-xs tracking-[0.2em] transition-all active:scale-95",
                            isActive ? "bg-rose-500 text-white hover:bg-rose-600" : "bg-white text-black hover:bg-white/90"
                        )}
                    >
                        {isActive ? <Pause className="mr-3 h-4 w-4 fill-current"/> : <Play className="mr-3 h-4 w-4 fill-current"/>}
                        {isActive ? 'STOP' : 'START'}
                    </Button>
                     <Button 
                        onClick={handleReset} 
                        variant="ghost" 
                        size="lg"
                        className="h-14 px-8 rounded-2xl border border-white/10 text-white font-black italic text-xs tracking-widest hover:bg-white/5 transition-all"
                    >
                        <RotateCcw className="mr-3 h-4 w-4"/>
                        RESET
                    </Button>
                </div>
            </div>
            <div className="bg-black/40 p-8 lg:p-12 flex items-center justify-center">
                <BoxBreathingVisualizer stageIndex={stageIndex} countdown={countdown} isActive={isActive} />
            </div>
        </div>
    </GlassCard>
  );
}

// --- Mind Games Components ---

// 1. Guess The Number
function GuessTheNumberGame() {
    const [guess, setGuess] = useState('');
    const [message, setMessage] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [isCorrect, setIsCorrect] = useState(false);
    const [secretNumber, setSecretNumber] = useState(0);

    useEffect(() => {
        resetGame();
    }, []);

    const resetGame = () => {
        setSecretNumber(Math.floor(Math.random() * 100) + 1);
        setGuess('');
        setMessage('');
        setAttempts(0);
        setIsCorrect(false);
    };

    const handleGuess = (e: React.FormEvent) => {
        e.preventDefault();
        if (isCorrect) return;

        const numGuess = parseInt(guess, 10);
        if (isNaN(numGuess) || numGuess < 1 || numGuess > 100) {
            setMessage('Input out of range. 01-100 required.');
            return;
        }

        setAttempts(prev => prev + 1);

        if (numGuess === secretNumber) {
            setMessage(`Correct! You guessed it in ${attempts + 1} tries.`);
            setIsCorrect(true);
        } else if (numGuess < secretNumber) {
            setMessage('Try a higher number.');
        } else {
            setMessage('Try a lower number.');
        }
        setGuess('');
    };

    return (
        <GlassCard className="w-full max-w-lg mx-auto p-12 space-y-10 rounded-[3rem]">
            <div className="space-y-4 text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto border border-primary/20">
                    <Brain className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-3xl font-black italic tracking-tightest text-white uppercase">Number Guess</h3>
                <p className="text-muted-foreground font-medium text-sm tracking-wide">Guess the number (1-100).</p>
            </div>

            <form onSubmit={handleGuess} className="space-y-8">
                <div className="flex gap-4">
                    <Input
                        type="number"
                        placeholder="GUESS..."
                        className="h-16 bg-white/5 border-white/10 rounded-2xl focus:border-primary/50 focus:ring-primary/20 transition-all font-black italic text-xl px-6 text-white"
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        disabled={isCorrect}
                    />
                    <Button 
                        type="submit" 
                        disabled={isCorrect || !guess}
                        className="h-16 px-10 rounded-2xl bg-white text-black font-black italic tracking-widest hover:bg-white/90 active:scale-95 transition-all"
                    >
                        GUESS
                    </Button>
                </div>
                
                <AnimatePresence mode="wait">
                    {message && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <Alert className={cn(
                                "border-none rounded-2.5rem p-6",
                                isCorrect ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-primary/80"
                            )}>
                                {isCorrect ? <CheckCircle className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                                <AlertTitle className="font-black uppercase tracking-widest text-[10px] mb-2">{isCorrect ? 'SYNCHRONIZED' : 'ANALYSIS'}</AlertTitle>
                                <AlertDescription className="font-medium italic">{message}</AlertDescription>
                            </Alert>
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>

            <div className="flex items-center justify-between pt-4">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Attempts</span>
                    <span className="text-2xl font-black italic text-white tracking-widest">{attempts < 10 ? `0${attempts}` : attempts}</span>
                </div>
                {(isCorrect || attempts > 7) && (
                    <Button onClick={resetGame} variant="ghost" className="h-12 border border-white/10 rounded-xl px-6 font-black italic text-xs tracking-widest text-white hover:bg-white/5">
                         <RotateCcw className="mr-2 h-4 w-4" />
                        RE-INITIALIZE
                    </Button>
                )}
            </div>
        </GlassCard>
    );
}

// 2. Memory Match
const ICONS = [Cat, Dog, Bird, Fish, Rabbit, Turtle, Bug, Snail];
const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

interface CardType {
    id: number;
    icon: React.ElementType;
    isFlipped: boolean;
    isMatched: boolean;
}

function MemoryMatchGame() {
    const [cards, setCards] = useState<CardType[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [moves, setMoves] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    const generateCards = useCallback(() => {
        const icons = ICONS.flatMap((Icon, index) => [
            { id: index * 2, icon: Icon, isFlipped: false, isMatched: false },
            { id: index * 2 + 1, icon: Icon, isFlipped: false, isMatched: false },
        ]);
        setCards(shuffleArray(icons));
        setFlippedIndices([]);
        setMoves(0);
        setGameOver(false);
    }, []);
    
    useEffect(() => {
        generateCards();
    }, [generateCards]);

    const handleCardClick = (index: number) => {
        if (flippedIndices.length === 2 || cards[index].isFlipped || cards[index].isMatched) return;

        const newCards = [...cards];
        newCards[index].isFlipped = true;
        setCards(newCards);
        setFlippedIndices([...flippedIndices, index]);
    };

    useEffect(() => {
        if (flippedIndices.length === 2) {
            setMoves(prevMoves => prevMoves + 1);
            const [firstIndex, secondIndex] = flippedIndices;
            if (cards[firstIndex].icon === cards[secondIndex].icon) {
                const newCards = [...cards];
                newCards[firstIndex].isMatched = true;
                newCards[secondIndex].isMatched = true;
                setCards(newCards);
                setFlippedIndices([]);
                 if (newCards.every(card => card.isMatched)) {
                    setGameOver(true);
                }
            } else {
                setTimeout(() => {
                    const newCards = [...cards];
                    newCards[firstIndex].isFlipped = false;
                    newCards[secondIndex].isFlipped = false;
                    setCards(newCards);
                    setFlippedIndices([]);
                }, 800);
            }
        }
    }, [flippedIndices, cards]);

    return (
        <GlassCard className="w-full max-w-2xl mx-auto p-12 space-y-12 rounded-[3.5rem] relative overflow-hidden">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="text-3xl font-black italic tracking-tightest text-white uppercase">Memory Match</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Match the pairs</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Moves</p>
                    <p className="text-2xl font-black italic text-white">{moves < 10 ? `0${moves}` : moves}</p>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4 sm:gap-6">
                <AnimatePresence>
                    {cards.map((card, index) => {
                        const Icon = card.icon;
                        return (
                            <motion.button
                                key={index}
                                whileHover={{ scale: card.isFlipped ? 1 : 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleCardClick(index)}
                                className={cn(
                                    'aspect-square rounded-[2rem] flex items-center justify-center transition-all duration-500 border relative overflow-hidden',
                                    card.isFlipped || card.isMatched 
                                        ? 'bg-white border-white' 
                                        : 'bg-white/5 border-white/10 hover:border-white/20'
                                )}
                            >
                                {(card.isFlipped || card.isMatched) ? (
                                    <motion.div initial={{ rotateY: 180 }} animate={{ rotateY: 0 }}>
                                        <Icon className="w-10 h-10 text-black" />
                                    </motion.div>
                                ) : (
                                    <Sparkles className="w-5 h-5 text-white/5 group-hover:text-white/20 transition-colors" />
                                )}
                                {card.isMatched && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="absolute inset-0 bg-primary/20 backdrop-blur-sm flex items-center justify-center"
                                    >
                                        <CheckCircle className="w-12 h-12 text-black" />
                                    </motion.div>
                                )}
                            </motion.button>
                        )
                    })}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {gameOver && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center space-y-6 pt-4"
                    >
                        <h2 className="text-4xl font-black italic tracking-tightest text-primary uppercase">Synchronization Complete</h2>
                        <Button onClick={generateCards} className="h-14 px-10 bg-white text-black font-black italic tracking-widest rounded-2xl hover:bg-white/90">
                            <RotateCcw className="mr-3 h-4 w-4" />
                            RE-INITIALIZE
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {!gameOver && (
                 <Button onClick={generateCards} variant="ghost" className="w-full h-12 border border-white/10 rounded-2xl font-black italic text-xs tracking-widest text-white hover:bg-white/5">
                     <RotateCcw className="mr-3 h-4 w-4" />
                    FORCED RE-SYNC
                </Button>
            )}
        </GlassCard>
    );
}

// 3. Word Unscramble
const WORDS = ['calm', 'breathe', 'happy', 'relax', 'focus', 'peace', 'smile', 'dream'];
const scrambleWord = (word: string) => {
    const a = word.split('');
    const n = a.length;
    for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a.join('');
};

function WordUnscrambleGame() {
    const [currentWord, setCurrentWord] = useState('');
    const [scrambledWord, setScrambledWord] = useState('');
    const [guess, setGuess] = useState('');
    const [message, setMessage] = useState('');
    const [isCorrect, setIsCorrect] = useState(false);

    const newWord = useCallback(() => {
        const word = WORDS[Math.floor(Math.random() * WORDS.length)];
        setCurrentWord(word);
        let scrambled = scrambleWord(word);
        while (scrambled === word) {
          scrambled = scrambleWord(word);
        }
        setScrambledWord(scrambled);
        setGuess('');
        setMessage('');
        setIsCorrect(false);
    }, []);

    useEffect(() => {
        newWord();
    }, [newWord]);

    const handleGuess = (e: React.FormEvent) => {
        e.preventDefault();
        if (guess.toLowerCase() === currentWord) {
            setMessage('Linguistic pattern recognized. Decryption successful.');
            setIsCorrect(true);
        } else {
            setMessage('Input mismatch. Re-calculating...');
        }
    };
    
    return (
        <GlassCard className="w-full max-w-lg mx-auto p-12 space-y-10 rounded-[3rem]">
            <div className="space-y-4 text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto border border-primary/20">
                    <Languages className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-3xl font-black italic tracking-tightest text-white uppercase">Word Unscramble</h3>
                <p className="text-muted-foreground font-medium text-sm tracking-wide">Find the word.</p>
            </div>

            <div className="py-8 px-4 bg-white/5 rounded-[2rem] border border-white/10 text-center">
                <div className="flex justify-center gap-2 flex-wrap">
                    {scrambledWord.toUpperCase().split('').map((char, i) => (
                        <motion.div 
                            key={i}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="w-12 h-14 bg-white flex items-center justify-center rounded-xl font-black italic text-2xl text-black shadow-xl"
                        >
                            {char}
                        </motion.div>
                    ))}
                </div>
            </div>

            <form onSubmit={handleGuess} className="space-y-6">
                <div className="flex gap-4">
                    <Input
                        placeholder="UNSCRAMBLE..."
                        className="h-16 bg-white/5 border-white/10 rounded-2xl focus:border-primary/50 focus:ring-primary/20 transition-all font-black italic text-xl px-6 text-white uppercase tracking-widest"
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        disabled={isCorrect}
                    />
                    <Button 
                        type="submit" 
                        disabled={isCorrect || !guess}
                        className="h-16 px-10 rounded-2xl bg-white text-black font-black italic tracking-widest hover:bg-white/90 active:scale-95 transition-all"
                    >
                        GUESS
                    </Button>
                </div>
                
                <AnimatePresence mode="wait">
                    {message && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <Alert className={cn(
                                "border-none rounded-2.5rem p-6",
                                isCorrect ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-primary/80"
                            )}>
                                {isCorrect ? <CheckCircle className="h-5 w-5" /> : <Lightbulb className="h-5 w-5" />}
                                <AlertTitle className="font-black uppercase tracking-widest text-[10px] mb-2">{isCorrect ? 'VALIDATED' : 'FEEDBACK'}</AlertTitle>
                                <AlertDescription className="font-medium italic">{message}</AlertDescription>
                            </Alert>
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>

            <Button onClick={newWord} variant="ghost" className="w-full h-12 border border-white/10 rounded-xl px-6 font-black italic text-xs tracking-widest text-white hover:bg-white/5">
                 <RotateCcw className="mr-2 h-4 w-4" />
                {isCorrect ? 'NEXT SEQUENCE' : 'RE-SCRAMBLE'}
            </Button>
        </GlassCard>
    );
}

// 4. Tic-Tac-Toe
type Player = 'X' | 'O' | null;

function TicTacToeGame() {
    const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
    const [isXNext, setIsXNext] = useState(true);

    const calculateWinner = (squares: Player[]) => {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6],
        ];
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                return squares[a];
            }
        }
        return null;
    };

    const winner = calculateWinner(board);
    const isDraw = !winner && board.every(Boolean);

    const handleClick = (i: number) => {
        if (winner || board[i]) return;
        const newBoard = board.slice();
        newBoard[i] = 'X';
        setBoard(newBoard);
        setIsXNext(false); // AI's turn
    };
    
    // Simple AI move
    useEffect(() => {
        if (!isXNext && !winner && !isDraw) {
            const emptySquares = board
                .map((val, idx) => (val === null ? idx : null))
                .filter(val => val !== null);
            
            if (emptySquares.length > 0) {
                 const aiMove = emptySquares[Math.floor(Math.random() * emptySquares.length)] as number;
                 const newBoard = board.slice();
                 setTimeout(() => {
                    newBoard[aiMove] = 'O';
                    setBoard(newBoard);
                    setIsXNext(true);
                 }, 500);
            }
        }
    }, [isXNext, board, winner, isDraw]);

    const resetGame = () => {
        setBoard(Array(9).fill(null));
        setIsXNext(true);
    };

    const renderStatus = () => {
        if (winner) return `Winner: ${winner}`;
        if (isDraw) return "It's a Draw!";
        return isXNext ? "Your Turn" : "AI is thinking...";
    };
    
    return (
         <GlassCard className="w-full max-w-lg mx-auto p-12 space-y-12 rounded-[3.5rem] relative overflow-hidden">
            <div className="space-y-4 text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto border border-primary/20">
                    <Gamepad2 className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-3xl font-black italic tracking-tightest text-white uppercase">Tic-Tac-Toe</h3>
                <p className="text-muted-foreground font-medium text-sm tracking-wide">Play against the computer.</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {board.map((value, i) => (
                    <motion.button
                        key={i}
                        whileHover={{ scale: value ? 1 : 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                            "aspect-square h-auto w-full rounded-2xl border transition-all duration-300 flex items-center justify-center relative bg-white/5 border-white/10",
                            value === 'X' && "bg-white border-white",
                            value === 'O' && "bg-rose-500/10 border-rose-500/50"
                        )}
                        onClick={() => handleClick(i)}
                        disabled={!isXNext || !!value || !!winner}
                    >
                        {value === 'X' && <X className="w-12 h-12 text-black"/>}
                        {value === 'O' && <Circle className="w-12 h-12 text-rose-500"/>}
                        {!value && <div className="w-1.5 h-1.5 rounded-full bg-white/20" />}
                    </motion.button>
                ))}
            </div>

            <div className="space-y-6">
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 mb-1">Status</p>
                    <p className="font-black italic text-white text-lg tracking-widest">{renderStatus()}</p>
                </div>

                <Button onClick={resetGame} variant="ghost" className="w-full h-14 border border-white/10 rounded-2xl font-black italic text-xs tracking-widest text-white hover:bg-white/5">
                    <RotateCcw className="mr-3 h-4 w-4" />
                    RESET GAME
                </Button>
            </div>
        </GlassCard>
    );
}

const games = [
    { 
        id: 'guess-the-number', 
        name: 'Number Guess', 
        component: <GuessTheNumberGame />, 
        icon: Brain,
        category: 'Focus',
        description: "Guess the right number to train your focus." 
    },
    { 
        id: 'memory-match', 
        name: 'Memory Match', 
        component: <MemoryMatchGame />, 
        icon: Sparkles,
        category: 'Memory',
        description: "Match the pairs to test your memory." 
    },
    { 
        id: 'word-unscramble', 
        name: 'Word Unscramble', 
        component: <WordUnscrambleGame />, 
        icon: Languages,
        category: 'Verbal',
        description: "Unscramble letters to find the word." 
    },
    { 
        id: 'tic-tac-toe', 
        name: 'Tic-Tac-Toe', 
        component: <TicTacToeGame />, 
        icon: Gamepad2,
        category: 'Logic',
        description: "A classic game of strategy." 
    },
];


function MindfulGamesPageContent() {
    const [activeGame, setActiveGame] = useState<string | null>(null);
    const SelectedGameComponent = games.find(g => g.id === activeGame)?.component;

  return (
    <div className="min-h-screen flex flex-col bg-black text-white selection:bg-primary selection:text-black">
      {/* Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ 
                x: [0, 100, 0], 
                y: [0, 50, 0],
                scale: [1, 1.2, 1]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[120px]" 
          />
          <motion.div 
            animate={{ 
                x: [0, -80, 0], 
                y: [0, 120, 0],
                scale: [1, 1.1, 1]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[100px]" 
          />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-6">
            <SidebarTrigger className="text-white/60 hover:text-white transition-colors" />
            <div className="h-8 w-px bg-white/10 hidden md:block" />
            <div className="flex flex-col">
              <h1 className="text-xl font-black italic tracking-tighter leading-none">Wellness Games</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mt-1">Train Your Mind</p>
            </div>
        </div>
        <div className="flex items-center gap-4">
             <div className="hidden sm:block">
                <GenZToggle />
            </div>
            <ThemeToggle />
            <SOSButton />
        </div>
      </header>

      <main className="flex-1 relative z-10 overflow-x-hidden p-6 md:p-12 lg:p-20">
        <div className="mx-auto max-w-7xl w-full">
             <AnimatePresence mode="wait">
                {activeGame && SelectedGameComponent ? (
                    <motion.div 
                        key="active-game"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="space-y-12"
                    >
                        <div className="flex items-center justify-between">
                            <Button 
                                variant="ghost" 
                                onClick={() => setActiveGame(null)} 
                                className="h-12 border border-white/10 rounded-2xl px-6 font-black italic text-xs tracking-widest text-white hover:bg-white/5 active:scale-95 transition-all"
                            >
                                <ArrowLeft className="mr-3 h-4 w-4" />
                                BACK
                            </Button>
                            
                            <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl">
                                <Sparkles className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Active_Terminal: {activeGame?.toUpperCase()}</span>
                            </div>
                        </div>
                        
                        <div className="perspective-1000">
                            {SelectedGameComponent}
                        </div>
                    </motion.div>
                    ) : (
                    <motion.div 
                        key="hub"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-24"
                    >
                        {/* Hero Section */}
                        <div className="max-w-3xl space-y-6">
                            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Ready</span>
                            </div>
                            <h1 className="text-4xl md:text-8xl font-black italic tracking-tightest leading-none text-white">
                                FOCUS.<br/>
                                <span className="text-primary">FLOW.</span><br/>
                                FEEL.
                            </h1>
                            <p className="text-base md:text-xl text-muted-foreground font-medium leading-relaxed max-w-2xl">
                                Simple exercises and games to help you relax and stay sharp.
                            </p>
                        </div>

                        {/* Exercises Tabs */}
                        <div className="space-y-10">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-4">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase mb-1">Relaxation</h2>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Stay Calm</p>
                                </div>
                            </div>

                            <Tabs defaultValue="box-breathing" className="w-full">
                                <TabsList className="flex items-center gap-2 bg-white/5 p-1 rounded-[1.5rem] border border-white/10 mb-12 w-full md:w-fit overflow-x-auto">
                                    <TabsTrigger value="box-breathing" className="flex-1 md:flex-none rounded-2xl px-4 md:px-8 h-12 font-black italic text-xs tracking-widest data-[state=active]:bg-white data-[state=active]:text-black transition-all whitespace-nowrap">
                                        BREATHING
                                    </TabsTrigger>
                                    <TabsTrigger value="meditation" className="flex-1 md:flex-none rounded-2xl px-4 md:px-8 h-12 font-black italic text-xs tracking-widest data-[state=active]:bg-white data-[state=active]:text-black transition-all whitespace-nowrap">
                                        MEDITATION
                                    </TabsTrigger>
                                    <TabsTrigger value="listening" className="flex-1 md:flex-none rounded-2xl px-4 md:px-8 h-12 font-black italic text-xs tracking-widest data-[state=active]:bg-white data-[state=active]:text-black transition-all whitespace-nowrap">
                                        LISTENING
                                    </TabsTrigger>
                                </TabsList>

                                <div className="mt-8">
                                    <TabsContent value="box-breathing">
                                        <BoxBreathingExercise />
                                    </TabsContent>
                                    <TabsContent value="meditation">
                                        <GlassCard className="text-center p-20 rounded-[3rem] border-dashed border-white/20">
                                            <Music className="w-16 h-16 text-white/10 mx-auto mb-6" />
                                            <h3 className="text-2xl font-black italic uppercase mb-2">Guided Meditation</h3>
                                            <p className="text-muted-foreground">More features coming soon.</p>
                                        </GlassCard>
                                    </TabsContent>
                                    <TabsContent value="listening">
                                         <GlassCard className="text-center p-20 rounded-[3rem] border-dashed border-white/20">
                                            <Wind className="w-16 h-16 text-white/10 mx-auto mb-6" />
                                            <h3 className="text-2xl font-black italic uppercase mb-2">Mindful Listening</h3>
                                            <p className="text-muted-foreground">Ambient soundscapes in development.</p>
                                        </GlassCard>
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </div>

                        {/* Games Grid */}
                        <div className="space-y-12">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase mb-1">Brain Games</h2>
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Have Fun</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {games.map((game, i) => {
                                    const Icon = game.icon;
                                    return (
                                        <motion.div
                                            key={game.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                        >
                                            <GlassCard className="group relative h-full flex flex-col p-8 rounded-[2.5rem] hover:bg-white/10 transition-all duration-500 cursor-pointer overflow-hidden border-white/10 hover:border-primary/30" onClick={() => setActiveGame(game.id)}>
                                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="bg-primary/20 text-primary p-2 rounded-xl">
                                                        <ArrowLeft className="w-4 h-4 rotate-180" />
                                                    </div>
                                                </div>
                                                
                                                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-8 border border-white/10 group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                                                    <Icon className="w-6 h-6 text-white group-hover:text-primary transition-colors" />
                                                </div>

                                                <div className="mt-auto space-y-4">
                                                    <div className="space-y-1">
                                                        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-primary/60">{game.category}</p>
                                                        <h3 className="text-xl font-black italic uppercase tracking-tighter">{game.name}</h3>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                                                        {game.description}
                                                    </p>
                                                    <div className="pt-2">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20 group-hover:text-white transition-colors">PLAY //</span>
                                                    </div>
                                                </div>

                                                {/* Decorative background number */}
                                                <span className="absolute -bottom-6 -right-6 text-9xl font-black italic text-white/[0.02] pointer-events-none group-hover:text-primary/[0.03] transition-colors">{i + 1}</span>
                                            </GlassCard>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
             </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default function MindfulGamesPage() {
    return <MindfulGamesPageContent />;
}
