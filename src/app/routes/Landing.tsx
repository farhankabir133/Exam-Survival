import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Flame, 
  Trophy, 
  Target, 
  Award, 
  BookOpen, 
  Search, 
  Play, 
  Activity, 
  Sparkles, 
  Timer, 
  ChevronRight, 
  Skull, 
  ShieldAlert, 
  Zap, 
  TrendingUp, 
  Menu, 
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  RotateCcw,
  Compass,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '../../state/gameStore.js';
import { ALL_SUBJECTS, GameMode, SubjectType, ExamType } from '../../types.js';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Tooltip,
  AreaChart,
  XAxis,
  YAxis,
  Area
} from 'recharts';

interface LandingPageProps {
  onStartGame: () => void;
}

export default function LandingPage({ onStartGame }: LandingPageProps) {
  const {
    stats,
    setGameMode,
    setSubjects,
    setExamType,
    setGameState,
    setDifficulty
  } = useGameStore();

  const navigateTo = (path: string) => {
    window.history.pushState(null, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  // Scroll offset state for navbar shrink
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Parallax mouse hover coordinates
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  // Subject systems
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChips, setSelectedChips] = useState<SubjectType[]>([...ALL_SUBJECTS]);

  // Zero-bleed demo: error slider state
  const [errorCount, setErrorCount] = useState(0);

  // Selected mode for dynamic comparison modal preview
  const [activeModalMode, setActiveModalMode] = useState<GameMode | null>(null);

  // Smooth scroll helper
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  // Keep track of scroll offset
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Parallax rate limiter
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  // Filtered lists for subject showcase
  const displaySubjects = useMemo(() => {
    return ALL_SUBJECTS.filter(s => 
      s.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleChipToggle = (subject: SubjectType) => {
    if (selectedChips.includes(subject)) {
      setSelectedChips(prev => prev.filter(s => s !== subject));
    } else {
      setSelectedChips(prev => [...prev, subject]);
    }
  };

  const startCustomSurvivalPlay = (mode: GameMode) => {
    const activeSubjects = selectedChips.length > 0 ? selectedChips : ALL_SUBJECTS;
    setSubjects([...activeSubjects]);
    setGameMode(mode);
    setExamType('BCS'); // Match default
    
    const subjectsQuery = activeSubjects.join(',');
    navigateTo(`/app?mode=${mode.toLowerCase()}&subjects=${encodeURIComponent(subjectsQuery)}`);
  };

  // Standard Mock database metrics for radar and area preview
  const radarPreviewData = [
    { subject: 'Bangla', proficiency: 78, average: 60 },
    { subject: 'English', proficiency: 85, average: 65 },
    { subject: 'Mathematics', proficiency: 92, average: 55 },
    { subject: 'ICT', proficiency: 88, average: 70 },
    { subject: 'Sovereign Affairs', proficiency: 72, average: 58 },
    { subject: 'International', proficiency: 80, average: 62 },
    { subject: 'Science', proficiency: 86, average: 64 },
    { subject: 'Mental Aptitude', proficiency: 89, average: 61 }
  ];

  const streakProgressData = [
    { match: 'Match 1', score: 3, survivalMinutes: 1 },
    { match: 'Match 2', score: 7, survivalMinutes: 4 },
    { match: 'Match 3', score: 14, survivalMinutes: 9 },
    { match: 'Match 4', score: 0, survivalMinutes: 1 }, // Defeat!
    { match: 'Match 5', score: 9, survivalMinutes: 6 },
    { match: 'Match 6', score: 18, survivalMinutes: 12 },
    { match: 'Match 7', score: 25, survivalMinutes: 18 }
  ];

  // Mode descriptions for expandable popup
  const MODES_DATA = {
    'Survival': {
      title: 'Survival Mode',
      tagline: 'Precision Combat. One mistake terminates the run.',
      badge: 'BCS Core Standard',
      color: 'from-cyan-500 to-emerald-400',
      description: 'Your primary training matrix. Questions are sourced adaptively. As your streak scales, the cognitive engine injects highly detailed mathematical distractors and complex chronological history events. Supports deep diagnostic learning with Gemini report logs.',
      perks: ['Adaptive scaling difficulty', 'Deep AI Weakness analysis available', 'Unlimited progression timeframe'],
      intensity: 'High Intensity State'
    },
    'Speed': {
      title: 'Speed Blitz',
      tagline: 'Time-dilated execution chamber.',
      badge: 'Government Bank Special',
      color: 'from-rose-500 to-amber-500',
      description: 'Strict limits of 6 to 10 seconds per question. Ideal for Bangladesh Bank AD aspirants who must calculate compound interests or vocabulary synonyms under brutal milliseconds constraints. Sharpens direct neural recall.',
      perks: ['Strict time-decay thresholds', 'Double scoring multipliers active', 'Focus-mode visual filters'],
      intensity: 'Superhuman Execution Pace'
    },
    'Marathon': {
      title: 'Marathon Core',
      tagline: 'Sub-cadre endurance evaluation.',
      badge: 'Syllabus Wide Core',
      color: 'from-purple-500 to-indigo-500',
      description: 'Infinite progression spanning all 8 key disciplines simultaneously. Difficulty ramps up every 5 completed nodes. Test your long-term focus across 100+ questions without burning the simulator modules.',
      perks: ['Comprehensive test coverage', 'Steadily increasing difficulty scaling', 'Global leaderboard focus'],
      intensity: 'Unyielding Mental Stamina'
    },
    'Daily': {
      title: 'Daily Protocol',
      tagline: 'Uniform exam seed for all candidates.',
      badge: 'National Synergy Test',
      color: 'from-amber-400 to-yellow-300',
      description: 'A dedicated set of 15 premium questions crafted nightly using high-yield BCS past topics. Every user in Bangladesh answers the exact same questions under the same seed. Compete directly on the unified dashboard.',
      perks: ['Compare exactly with rivals', 'Balanced mathematical syllabus keys', 'Updated daily at 00:00 UTC'],
      intensity: 'Unified Ranking Metrics'
    }
  };

  return (
    <div id="landing-container" className="relative min-h-screen overflow-x-hidden">

      {/* 2. CINEMATIC HERO SECTION */}
      <section 
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative pt-32 pb-24 px-4 md:px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 min-h-[90vh]"
      >
        
        {/* HEADING DETAILS LEFT */}
        <div className="space-y-6 lg:max-w-xl text-center lg:text-left z-10 animate-fade-in">
          
          {/* BPSC High Attention Badge */}
          <div className="inline-flex items-center gap-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full px-3.5 py-1 text-[10px] font-mono font-black tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            LIVE competitive simulation PROTOCOL
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-none">
            Survive. Learn. <br />
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-400 bg-clip-text text-transparent">
              Rank Up.
            </span>
          </h1>

          <p className="text-slate-400 text-sm md:text-base leading-relaxed font-sans max-w-md mx-auto lg:mx-0">
            A high-intensity AI-powered exam survival system for Bangladesh’s most competitive government exams. One micro mistake terminates the battle immediately.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
            <button 
              id="hero-cta-survival"
              onClick={() => navigateTo('/app?mode=survival')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_35px_rgba(6,182,212,0.4)] active:scale-98 transition-all cursor-pointer group"
            >
              <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
              Start Survival Mode
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => navigateTo('/app#modes')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 border border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 text-slate-300 hover:text-white font-mono text-xs uppercase tracking-widest rounded-xl transition cursor-pointer"
            >
              Explore Modes
            </button>
          </div>

          {/* Localized Syllabi Metrology */}
          <div className="grid grid-cols-3 gap-4 pt-6 max-w-xs sm:max-w-none mx-auto border-t border-slate-900">
            <div>
              <span className="block text-xl font-bold font-mono text-white tracking-tight">4,200+</span>
              <span className="block text-[9px] text-slate-500 font-mono tracking-wider uppercase">Authentic MCQs</span>
            </div>
            <div>
              <span className="block text-xl font-bold font-mono text-cyan-400 tracking-tight">Adaptive</span>
              <span className="block text-[9px] text-slate-500 font-mono tracking-wider uppercase">AI Generation</span>
            </div>
            <div>
              <span className="block text-xl font-bold font-mono text-amber-400 tracking-tight">0.0%</span>
              <span className="block text-[9px] text-slate-500 font-mono tracking-wider uppercase">Error Tolerance</span>
            </div>
          </div>
        </div>

        {/* CINEMATIC FLOATING CARDS STACK RIGHT */}
        <div className="relative w-full max-w-lg h-[450px] flex items-center justify-center z-13">
          
          {/* Card 1: Streak Counter (Top-Left Parallax) */}
          <motion.div 
            style={{ 
              x: mousePos.x * 25 - 15, 
              y: mousePos.y * 25 - 50,
            }}
            transition={{ type: 'spring', stiffness: 50, damping: 12 }}
            className="absolute left-0 top-6 glass-panel rounded-2xl p-4.5 border border-cyan-500/25 shadow-lg shadow-black/40 w-52 pointer-events-none group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-widest font-extrabold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> SYSTEM STREAK
              </span>
              <Activity className="w-3.5 h-3.5 text-cyan-500" />
            </div>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-4xl font-extrabold font-mono text-white leading-none">14</span>
              <span className="text-xs text-emerald-400 font-bold font-mono">1.8x Multiplier</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-900">
              <span>Time Saved: 42s</span>
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
          </motion.div>

          {/* Card 2: Cyber Timer (Top-Right Parallax) */}
          <motion.div 
            style={{ 
              x: mousePos.x * -35 + 160, 
              y: mousePos.y * 20 - 90,
            }}
            transition={{ type: 'spring', stiffness: 50, damping: 10 }}
            className="absolute right-0 top-12 glass-panel rounded-2xl p-4 border border-rose-500/20 shadow-lg shadow-black/40 w-44 pointer-events-none text-center"
          >
            <span className="text-[9px] text-rose-400 font-mono uppercase tracking-widest font-black block">DECAY THRESHOLD</span>
            
            {/* Interactive Pulse Timer circular bar simulation */}
            <div className="relative flex items-center justify-center w-16 h-16 mx-auto my-3">
              <div className="absolute inset-0 rounded-full border-2 border-rose-500/10" />
              <div className="absolute inset-0 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin duration-1000" />
              <span className="text-lg font-black font-mono text-rose-500">08.4s</span>
            </div>

            <span className="block text-[10px] text-slate-500 font-mono">CRITICAL DECISION WINDOW</span>
          </motion.div>

          {/* Card 3: Adaptive Subject Selector (Bottom-Left Parallax) */}
          <motion.div 
            style={{ 
              x: mousePos.x * 40 - 50, 
              y: mousePos.y * -25 + 150,
            }}
            transition={{ type: 'spring', stiffness: 50, damping: 14 }}
            className="absolute left-6 bottom-4 glass-panel rounded-2xl p-4 border border-slate-800 shadow-xl shadow-black/50 w-60 pointer-events-none"
          >
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest font-bold">SYLLABUS TARGET MATCH</span>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              <span className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[9px] px-2 py-0.5 rounded-full font-mono font-bold">Mathematics</span>
              <span className="bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] px-2 py-0.5 rounded-full font-mono font-bold">English LIT</span>
              <span className="bg-slate-800 border border-slate-750 text-slate-300 text-[9px] px-2 py-0.5 rounded-full font-mono">Mental Science</span>
              <span className="bg-slate-800 border border-slate-755 text-slate-400 text-[9px] px-2 py-0.5 rounded-full font-mono">Bangladesh Affairs</span>
            </div>
            <div className="mt-3 text-[10px] text-slate-500 flex justify-between items-center">
              <span>BPSC Balanced Matrix</span>
              <span className="text-slate-400 font-bold">Weight: 84.5%</span>
            </div>
          </motion.div>

          {/* Card 4: Game Over Terminal Preview (Center Parallax - Premium Focus) */}
          <motion.div 
            style={{ 
              x: mousePos.x * 12 + 60, 
              y: mousePos.y * 12 + 60,
              rotateX: mousePos.y * -15,
              rotateY: mousePos.x * 15,
            }}
            transition={{ type: 'spring', stiffness: 40, damping: 15 }}
            className="absolute glass-panel-accent-cyan rounded-2xl p-5 border border-cyan-400/40 shadow-2xl shadow-cyan-950/20 w-80 z-20 backdrop-blur-xl"
          >
            <div className="flex justify-between items-center border-b border-cyan-500/20 pb-2">
              <span className="text-xs font-mono font-bold text-rose-500 flex items-center gap-1 uppercase tracking-wider">
                <Skull className="w-3.5 h-3.5 animate-pulse" /> TERMINAL BROKEN
              </span>
              <span className="text-[9px] font-mono text-slate-500">SESSION_ERR: 81-A</span>
            </div>
            
            <div className="space-y-3 mt-4">
              <div className="text-center">
                <p className="text-[10px] font-mono text-slate-400">SURVIVAL RUN ELAPSED</p>
                <p className="text-2xl font-black font-mono text-white">STREAK: 19</p>
              </div>

              <div className="bg-slate-950/90 rounded-lg p-3 border border-slate-900 space-y-1.5 font-mono text-[9px]">
                <p className="text-slate-400 uppercase tracking-widest font-extrabold text-[8px] text-cyan-400">🧠 Cognitive Diagnostic</p>
                <div className="flex justify-between text-slate-300">
                  <span>Weakness Detected:</span>
                  <span className="text-rose-400 font-bold">Medieval Bangla Gaps</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Error Pattern:</span>
                  <span className="text-amber-400 font-bold">Careless Speed Slip</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Estimate Confidence:</span>
                  <span className="text-cyan-400 font-bold">89.4% accurate</span>
                </div>
              </div>

              <button 
                onClick={() => {
                  navigateTo('/dashboard?preview=true');
                }}
                className="w-full text-center py-1.5 border border-cyan-400/30 text-[10px] font-mono text-cyan-400 bg-cyan-950/20 hover:bg-cyan-400 hover:text-slate-950 rounded-md transition duration-300 uppercase tracking-widest font-black"
              >
                View Analytics Demo
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. GAME MODES SHOWCASE */}
      <section id="game-modes" className="py-24 border-t border-slate-900 bg-slate-950/40 relative z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-16">
          
          {/* Header Description */}
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="inline-block text-xs font-mono font-bold text-cyan-400 tracking-widest uppercase">EXAMINATION BLUEPRINTS</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white uppercase">FOUR PROTOCOLS OF ENGAGEMENT</h2>
            <p className="text-slate-400 text-sm md:text-base">
              Rivals train across traditional books; we build neural networks. Choose your speed template and dominate the public exam metrics.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Object.entries(MODES_DATA).map(([key, item]) => {
              const modeKey = key as GameMode;
              return (
                <motion.div
                  key={modeKey}
                  whileHover={{ y: -8, scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                  onClick={() => navigateTo(`/app?mode=${modeKey.toLowerCase()}`)}
                  className="group relative overflow-hidden rounded-2xl glass-panel p-6 border border-slate-850 hover:border-cyan-400/30 transition-all shadow-black/30 shadow-lg cursor-pointer flex flex-col justify-between min-h-[340px]"
                >
                  {/* Glowing corners background */}
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.color} opacity-5 group-hover:opacity-15 blur-2xl transition-opacity duration-300`} />
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="bg-slate-900 text-slate-400 text-[9px] font-mono border border-slate-800 px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                      <Sparkles className="w-4 h-4 text-cyan-400 group-hover:animate-pulse" />
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-xl font-extrabold text-white group-hover:text-cyan-400 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-sans line-clamp-4">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-900 mt-4 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500 font-bold uppercase tracking-wider">{item.intensity}</span>
                    <span className="text-cyan-400 flex items-center gap-1 group-hover:translate-x-1.5 transition-transform">
                      Launch <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. SUBJECT SYSTEM SECTION */}
      <section id="subjects-section" className="py-24 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-72 h-72 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* LEFT COLUMN: INTRO & SEARCH */}
          <div className="lg:col-span-5 space-y-6">
            <span className="inline-block text-xs font-mono font-bold text-teal-400 tracking-widest uppercase">
              BPSC DIRECTIVE FIELDS
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight uppercase">
              EIGHT DOMAINS. ZERO LEAKS.
            </h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              Every subject has been categorized according to classical BCS preliminary guidelines. Select, filter, and isolate weak nodes before the timer decays.
            </p>

            {/* Live Search Interactive System */}
            <div className="space-y-4">
              <label className="block text-[11px] text-slate-400 font-mono uppercase tracking-wider">
                Filter Target Domains
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Seaching Mathematics, Bangla, ICT, English Literature..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/60 hover:bg-slate-900/90 focus:bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-3 pl-11 pr-4 text-xs font-mono text-white tracking-wide transition placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
                />
              </div>

              {/* Status information */}
              <div className="flex items-center justify-between text-xs font-mono text-slate-500 pt-1">
                <span>Selected {selectedChips.length} of {ALL_SUBJECTS.length} Core Fields</span>
                <button 
                  onClick={() => {
                    if (selectedChips.length === ALL_SUBJECTS.length) {
                      setSelectedChips([]);
                    } else {
                      setSelectedChips([...ALL_SUBJECTS]);
                    }
                  }}
                  className="text-cyan-400 hover:underline"
                >
                  [ {selectedChips.length === ALL_SUBJECTS.length ? 'Clear Selection' : 'Select All'} ]
                </button>
              </div>
            </div>

            {/* ZERO BLEED RULE VISUAL DEMO */}
            <div className="glass-panel-accent-cyan p-5.5 rounded-2xl border border-rose-500/20 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 uppercase text-[7px] text-rose-500 border border-rose-500/20 tracking-wider font-black font-mono">
                CRUCIAL UX SAFEGUARD
              </div>
              
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <span className="text-xs font-mono font-extrabold text-white tracking-widest uppercase">
                  ZERO BLEED SIMULATION
                </span>
              </div>
              
              <p className="text-[11px] text-slate-400 leading-normal font-sans">
                Unlike common test simulators that sum score ratios, the **Survival Engine** simulates authentic mental combat. Type standard errors manually to see its dramatic effect:
              </p>

              {/* Interactive Slide Button */}
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-900 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-400">Answer Errors allowed:</span>
                  <span className={`font-black ${errorCount > 0 ? 'text-rose-500 animate-pulse' : 'text-cyan-400'}`}>
                    {errorCount} {errorCount === 1 ? 'Error' : 'Errors'}
                  </span>
                </div>
                
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="1"
                  value={errorCount}
                  onChange={(e) => setErrorCount(Number(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />

                <div className="flex justify-between text-[11px] font-mono pt-1">
                  <span>Candidate Health Meter</span>
                  <span className={errorCount === 0 ? 'text-cyan-400 font-bold' : 'text-rose-500 font-black animate-pulse'}>
                    {errorCount === 0 ? '100% (ALIVE)' : '0% (CORE CRITICAL)'}
                  </span>
                </div>

                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${errorCount === 0 ? 'bg-cyan-400' : 'bg-rose-500'}`}
                    style={{ width: errorCount === 0 ? '100%' : '0%' }}
                  />
                </div>

                {errorCount === 1 && (
                  <motion.p 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-[9px] font-mono text-rose-400 uppercase text-center font-bold tracking-widest pt-2"
                  >
                    ☠️ CADRE ATTEMPT SUSPENDED. NO SECOND CHANCE!
                  </motion.p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ACTIVE SYLLABUS GRID CHIPS */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {displaySubjects.map((subject, index) => {
              const isSelected = selectedChips.includes(subject);
              return (
                <motion.div
                  key={subject}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleChipToggle(subject)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex justify-between items-center ${
                    isSelected 
                      ? 'bg-slate-900 border-cyan-500 text-white shadow-lg shadow-cyan-400/5' 
                      : 'bg-slate-900/30 border-slate-850 text-slate-500 hover:border-slate-800 hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'}`} />
                    <div>
                      <span className="block text-xs font-mono font-extrabold tracking-wide uppercase leading-none">
                        {subject}
                      </span>
                      <span className="block text-[9px] text-slate-500 font-mono mt-1">
                        Node Syllabus B{index + 1}-A
                      </span>
                    </div>
                  </div>

                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border text-[9px] font-mono font-black ${
                    isSelected ? 'border-cyan-500/40 text-cyan-400 bg-cyan-950/20' : 'border-slate-800 text-slate-600'
                  }`}>
                    {isSelected ? 'ON' : 'OFF'}
                  </div>
                </motion.div>
              );
            })}

            {/* Quick Trigger Button for isolated chips */}
            <div className="sm:col-span-2 pt-2">
              <button
                onClick={() => startCustomSurvivalPlay('Survival')}
                disabled={selectedChips.length === 0}
                className="w-full py-4 text-xs font-mono tracking-widest font-black uppercase rounded-xl transition duration-300 flex justify-center items-center gap-2 border border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Target className="w-4 h-4 text-cyan-400" />
                Launch custom battle using selected subjects ({selectedChips.length})
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS FLOW DIAGRAM */}
      <section id="how-it-works" className="py-24 border-t border-slate-900 bg-slate-950/80 relative z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-16">
          
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="inline-block text-xs font-mono font-bold text-purple-400 tracking-widest uppercase">
              COGNITIVE CYBERNETICS
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white uppercase leading-tight">
              THE ENGINE PIPELINE
            </h2>
            <p className="text-slate-400 text-sm">
              We orchestrate real-time adaptive questioning and deep diagnostic tracking. Heres how your mind and the simulator forge first-class career placements:
            </p>
          </div>

          {/* Pipeline flow visual container */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 relative">
            
            {/* Horizontal Line connecting nodes in desktop */}
            <div className="hidden md:block absolute top-[44px] inset-x-8 h-0.5 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-teal-500/20 z-0" />

            {/* Step 1: User */}
            <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 text-center relative z-10 space-y-3 group hover:border-cyan-500/30 transition-all">
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-cyan-950 border border-cyan-500/30 text-cyan-400 text-sm font-mono font-bold shadow-lg shadow-cyan-950/30">
                01
              </div>
              <h3 className="text-sm font-mono font-black text-white uppercase">User Login</h3>
              <p className="text-[11px] text-slate-400 leading-normal font-sans">
                Authenticate online via safe AuthInterface or practice anonymously.
              </p>
            </div>

            {/* Step 2: Query parameters */}
            <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 text-center relative z-10 space-y-3 group hover:border-purple-500/30 transition-all">
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-purple-950 border border-purple-500/30 text-purple-400 text-sm font-mono font-bold shadow-lg shadow-purple-950/30">
                02
              </div>
              <h3 className="text-sm font-mono font-black text-white uppercase">Syllabus Engine</h3>
              <p className="text-[11px] text-slate-400 leading-normal font-sans">
                Zustand system extracts target parameters and pulls verified local data sets.
              </p>
            </div>

            {/* Step 3: Gemini API */}
            <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 text-center relative z-10 space-y-3 group hover:border-amber-500/30 transition-all">
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-amber-950 border border-amber-500/30 text-amber-400 text-sm font-mono font-bold shadow-lg shadow-amber-950/30">
                03
              </div>
              <h3 className="text-sm font-mono font-black text-white uppercase">Gemini Models</h3>
              <p className="text-[11px] text-slate-400 leading-normal font-sans">
                Server-side execution queries Gemini 2.5/3.5 to formulate custom high-yield questions.
              </p>
            </div>

            {/* Step 4: Game Engine */}
            <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 text-center relative z-10 space-y-3 group hover:border-rose-500/30 transition-all">
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-rose-950 border border-rose-500/30 text-rose-400 text-sm font-mono font-bold shadow-lg shadow-rose-950/30">
                04
              </div>
              <h3 className="text-sm font-mono font-black text-white uppercase">Survival Loop</h3>
              <p className="text-[11px] text-slate-400 leading-normal font-sans">
                Active countdown checks errors. First mistake isolates node and triggers defeat state.
              </p>
            </div>

            {/* Step 5: Analytics */}
            <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 text-center relative z-10 space-y-3 group hover:border-emerald-500/30 transition-all">
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-emerald-950 border border-emerald-500/30 text-emerald-400 text-sm font-mono font-bold shadow-lg shadow-emerald-950/30">
                05
              </div>
              <h3 className="text-sm font-mono font-black text-white uppercase">Deep Diagnostic</h3>
              <p className="text-[11px] text-slate-400 leading-normal font-sans">
                Evaluates response timing, carelessness metrics, and historical accuracy scales.
              </p>
            </div>

            {/* Step 6: Rank */}
            <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 text-center relative z-10 space-y-3 group hover:border-cyan-500/30 transition-all">
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-slate-900 border border-slate-700 text-teal-400 text-sm font-mono font-bold shadow-lg shadow-slate-950/30">
                06
              </div>
              <h3 className="text-sm font-mono font-black text-white uppercase">National Rank</h3>
              <p className="text-[11px] text-slate-400 leading-normal font-sans">
                Ranks streamed records against real synchronized aspirants in Firestore pools.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 6. FUTURISTIC ANALYTICS DECK PREVIEW */}
      <section id="analytics-deck" className="py-24 relative">
        <div className="absolute left-[10%] bottom-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-16">
          
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="inline-block text-xs font-mono font-bold text-cyan-400 tracking-widest uppercase">
              ELITE DECISION MATRIX
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white uppercase leading-tight">
              CYBER ADVANCED INTELLIGENCE
            </h2>
            <p className="text-slate-400 text-sm">
              We monitor structural memory holes. The interface tracks analytical response speeds and categorizes careless mistakes so you can plug cognitive gaps.
            </p>
          </div>

          {/* HUD Analytics grid framework */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Active Radar proficiency - 5 Cols */}
            <div className="lg:col-span-5 bg-slate-900/40 border border-slate-850 rounded-2xl p-6 flex flex-col justify-between min-h-[380px]">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-mono text-xs font-black text-white uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-405 bg-cyan-400 animate-pulse" /> Domain Proficiency Matrix
                </h3>
                <span className="text-[9px] text-cyan-400 bg-cyan-950/30 font-mono px-2 py-0.5 rounded border border-cyan-500/20 font-bold uppercase">
                  BPSC CADRE WEAPONRY
                </span>
              </div>

              {/* Functional Radar chart layout */}
              <div className="w-full h-64 flex items-center justify-center pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarPreviewData}>
                    <PolarGrid stroke="#1e293b" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 9, fontFamily: 'monospace' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#475569', fontSize: 8 }} />
                    <Radar name="Active Candidate" dataKey="proficiency" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
                    <Radar name="Toppers Average" dataKey="average" stroke="#eab308" fill="#eab308" fillOpacity={0.1} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '10px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-between text-[10px] text-slate-500 font-mono border-t border-slate-800 pt-3">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500" /> Active Profile</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Toppers Average (43rd BCS)</span>
              </div>
            </div>

            {/* Sparkline Area graph - 7 Cols */}
            <div className="lg:col-span-7 bg-slate-900/40 border border-slate-850 rounded-2xl p-6 flex flex-col justify-between min-h-[380px]">
              
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-mono text-xs font-black text-white uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" /> Historical Streak Performance Tracker
                </h3>
                <span className="text-[9px] text-slate-500 font-mono">Real-time DB synced</span>
              </div>

              {/* Functional Area chart showcase */}
              <div className="w-full h-56 pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={streakProgressData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <XAxis dataKey="match" tick={{ fill: '#64748b', fontSize: 8, fontFamily: 'monospace' }} stroke="#1e293b" />
                    <YAxis tick={{ fill: '#64748b', fontSize: 8 }} stroke="#1e293b" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="score" stroke="#8b5cf6" fill="url(#purpleGlow)" strokeWidth={2} />
                    <defs>
                      <linearGradient id="purpleGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Diagnostics summaries underneath */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-800 pt-4">
                
                {/* Gauge 1 */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex flex-col justify-center items-center text-center">
                  <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">Exam Readiness</span>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xl font-black font-mono text-emerald-400">84.7%</span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>

                {/* Gauge 2 */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex flex-col justify-center items-center text-center">
                  <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">Average Speed Pace</span>
                  <div className="flex items-center gap-0.5 mt-1">
                    <span className="text-xl font-black font-mono text-cyan-400">4.2s</span>
                    <span className="text-[9px] text-slate-500 font-mono">/q</span>
                  </div>
                </div>

                {/* Gauge 3 */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex flex-col justify-center items-center text-center">
                  <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">Weakness Cluster</span>
                  <span className="text-xs font-mono font-bold text-rose-400 mt-1.5 uppercase truncate w-full">
                    Sovereign History
                  </span>
                </div>

              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 7. SOCIAL PROOF / MOTIVATION */}
      <section className="py-24 border-t border-slate-900 bg-slate-950/60 relative z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-16">
          
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="inline-block text-xs font-mono font-bold text-amber-500 tracking-widest uppercase">
              RECRUITMENT ACCREDITATION
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white uppercase">
              BUILT FOR ELITE COMPETITORS
            </h2>
            <p className="text-slate-400 text-sm">
              We eliminate traditional quiz complacency. Read evaluations direct from candidates currently holding first-class government ranks across the territory.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Testimonial 1 */}
            <div className="bg-slate-905 bg-slate-900/40 border border-slate-850 p-6 rounded-2xl flex flex-col justify-between space-y-6">
              <p className="text-xs text-slate-300 leading-relaxed font-sans italic">
                &ldquo;BCS is 80% about pressure management. Traditional textbooks teach you equations, but Exam Survival forces you to identify logical traps under an 8-second ticking window. Defeating the AI gave me immense confidence before my real 44th BCS preliminary.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-500/20 flex items-center justify-center text-sm">
                  👨‍💼
                </div>
                <div>
                  <span className="block text-xs font-mono font-black text-white uppercase">Imtiaz Ahmed</span>
                  <span className="block text-[9px] text-cyan-400 font-mono uppercase font-bold">44th BCS Admin Cadre (Recommendation List)</span>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl flex flex-col justify-between space-y-6">
              <p className="text-xs text-slate-300 leading-relaxed font-sans italic">
                &ldquo;Bangladesh Bank AD questions are notoriously analytical, especially ICT and English synonyms. I practiced Speed Mode night after night. The zero-bleed rule completely cured my habit of guessing blind. Highly recommended!&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-950 border border-purple-500/20 flex items-center justify-center text-sm">
                  👩‍💻
                </div>
                <div>
                  <span className="block text-xs font-mono font-black text-white uppercase">Sultana Jahan</span>
                  <span className="block text-[9px] text-purple-400 font-mono uppercase font-bold">Assistant Director (Aspirant), BB AD Prep</span>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl flex flex-col justify-between space-y-6">
              <p className="text-xs text-slate-300 leading-relaxed font-sans italic">
                &ldquo;Practicing in a simulated PvP lobby against bots resembling top-scoring BCS aspirants mimics the real-world tension of the exam hall. Best educational tech layout in Bangladesh.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-950 border border-amber-500/20 flex items-center justify-center text-sm">
                  👔
                </div>
                <div>
                  <span className="block text-xs font-mono font-black text-white uppercase">Kazi Tanvir</span>
                  <span className="block text-[9px] text-amber-500 font-mono uppercase font-bold">First Class Officer, 9th Grade Govt Appointee</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 8. HIGH IMPACT CTA FINAL SECTION */}
      <section className="py-28 relative overflow-hidden flex items-center justify-center border-t border-slate-900">
        
        {/* Animated glitch visual details background */}
        <div className="absolute inset-0 bg-slate-950 pointer-events-none" />
        <div className="absolute w-[400px] h-[400px] bg-red-500/5 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl right-10 top-10 pointer-events-none animate-pulse" />
        
        <div className="relative text-center max-w-2xl px-6 space-y-8 z-10">
          
          <div className="space-y-4">
            <span className="inline-block text-xs font-mono font-black text-rose-500 tracking-widest uppercase animate-shake">
              ☠️ HIGH CONFLICT DETECTED
            </span>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white uppercase">
              YOUR COMPETITION <br />
              <span className="bg-gradient-to-r from-rose-500 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
                IS ALREADY PRACTICING.
              </span>
            </h2>
            <p className="text-slate-400 text-sm font-sans leading-relaxed max-w-lg mx-auto">
              Every second you delay, active rivals are sealing computer science nodes, configuring history weights, and scaling streaks. Safeguard your career destination today!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => {
                navigateTo('/app?mode=survival');
              }}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 text-sm font-black uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] transition cursor-pointer"
            >
              Start Survival Loop Now
            </button>
            <button 
              onClick={() => {
                navigateTo('/auth');
              }}
              className="w-full sm:w-auto px-8 py-4 border border-slate-850 hover:border-slate-750 bg-slate-900/60 text-slate-300 text-xs font-mono uppercase tracking-widest rounded-xl hover:text-white transition cursor-pointer"
            >
              Sync Profile (Cloud Save)
            </button>
          </div>

          <span className="block text-[10px] text-slate-600 font-mono">
            Requires modern browser rendering capability. Dynamic server-side Gemini generation active.
          </span>
        </div>
      </section>


      {/* Subtle animated neon border underlay spacer ending */}
      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent my-12" />

      {/* INJECT INTERACTIVE COMPARISONS MODAL IF OPEN */}
      <AnimatePresence>
        {activeModalMode && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-55 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setActiveModalMode(null)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-2">
                <span className="bg-slate-950 text-cyan-400 font-mono text-[9px] px-2 py-0.5 rounded border border-cyan-500/20 font-bold uppercase">
                  {MODES_DATA[activeModalMode].badge}
                </span>
                <h3 className="text-2xl font-black text-white">
                  {MODES_DATA[activeModalMode].title}
                </h3>
                <p className="text-xs text-slate-400 font-mono font-bold">
                  &ldquo;{MODES_DATA[activeModalMode].tagline}&rdquo;
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {MODES_DATA[activeModalMode].description}
                </p>

                <div className="space-y-2">
                  <span className="block text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                    Protocol Mechanics ACTIVE
                  </span>
                  <ul className="space-y-1.5 font-mono text-[10px] text-slate-300">
                    {MODES_DATA[activeModalMode].perks.map(perk => (
                      <li key={perk} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex gap-3">
                <button 
                  onClick={() => setActiveModalMode(null)}
                  className="flex-1 py-2.5 border border-slate-800 hover:bg-slate-800 text-xs text-slate-400 hover:text-white rounded-lg transition"
                >
                  Close parameters
                </button>
                <button 
                  onClick={() => {
                    startCustomSurvivalPlay(activeModalMode);
                    setActiveModalMode(null);
                  }}
                  className="flex-1 py-2.5 bg-cyan-400 text-slate-950 font-black tracking-widest text-xs uppercase rounded-lg shadow-lg shadow-cyan-500/10 hover:shadow-cyan-400/20 transition cursor-pointer"
                >
                  Configure mode
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
