import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Flame, 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  ArrowRight, 
  Activity, 
  User, 
  Compass
} from 'lucide-react';
import { useGameStore } from '../state/gameStore.js';
import { brandPalette } from '../theme/colors.js';
import { pageTransitionVariants } from '../theme/motion.js';
import { cosmicBackgroundFX, screenFlashVariants } from '../theme/effects.js';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const {
    theme,
    setTheme,
    soundEnabled,
    setSoundEnabled,
    screenEffect,
    comboAlert,
    gameState,
    setGameState,
    activeUser,
    activeProfile,
    stats,
    selectedMode
  } = useGameStore();

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Shrink header on scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState(null, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  const handleNavClick = (sectionId: string) => {
    const currentPath = window.location.pathname;
    if (currentPath === '/') {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigateTo(`/#${sectionId}`);
      }
    } else {
      navigateTo(`/#${sectionId}`);
    }
    setMobileMenuOpen(false);
  };

  return (
    <div 
      id="exam-survival-app-root" 
      className={`min-h-screen relative flex flex-col font-sans selection:bg-cyan-500 selection:text-black transition-colors duration-500 overflow-x-hidden ${
        theme === 'Light' ? 'theme-light bg-slate-50 text-slate-900' : 'bg-[#02050c] text-slate-100'
      }`}
    >
      {/* GLOBAL COSMIC STARS & GRID ALWAYS ACTIVE */}
      <div className="absolute inset-x-0 top-0 h-[1200px] overflow-hidden pointer-events-none z-0">
        {/* Ambient Glowing Orbs */}
        {cosmicBackgroundFX.glowOrbs.map((orb, idx) => (
          <div key={idx} className={orb.className} />
        ))}
        
        {/* Soft stargaze twinkling nodes */}
        <div className={cosmicBackgroundFX.softStargaze.className} />
        
        {/* BPSC Cognitive Neural-network Pattern Grid Overlay */}
        <div className={cosmicBackgroundFX.cognitiveGrid.className} />
      </div>

      {/* DYNAMIC BACKGROUND ALERT FLASH OVERLAYS */}
      <div className={`fixed inset-0 pointer-events-none transition-all duration-300 z-50 ${
        screenEffect === 'CORRECT_FLASH' ? screenFlashVariants.correct : 
        screenEffect === 'WRONG_SHAKE' ? screenFlashVariants.wrong : 
        screenEffect === 'SCREEN_BREAK' ? screenFlashVariants.break : ''
      }`} />

      {/* INTERACTIVE FLAME COMBO OVERLAY */}
      <AnimatePresence>
        {comboAlert && (
          <motion.div 
            initial={{ scale: 0.6, y: -40, opacity: 0, x: '-50%' }}
            animate={{ scale: 1.1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: -30, opacity: 0 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 text-slate-950 font-black px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 border-2 border-white"
          >
            <Flame className="w-6 h-6 fill-amber-950 animate-pulse text-amber-950" />
            <span className="tracking-wide uppercase font-mono text-sm">{comboAlert}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* persistent HUD GLASS NAVBAR */}
      <header className={`sticky top-0 inset-x-0 z-40 transition-all duration-300 border-b ${
        scrolled 
          ? 'bg-slate-950/85 backdrop-blur-md border-slate-900 py-3 shadow-lg shadow-black/40' 
          : 'bg-transparent py-4.5 border-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
          
          {/* Logo Brand Segment */}
          <button 
            onClick={() => navigateTo('/')}
            className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer relative z-10"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-teal-400 to-amber-400 p-0.5 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition duration-300">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Trophy className="w-5 h-5 text-cyan-400 group-hover:text-amber-400 transition-colors duration-300" />
              </div>
            </div>
            <div>
              <span className="block font-black tracking-tight text-white uppercase text-xs font-mono tracking-wider">EXAM SURVIVAL</span>
              <span className="block text-[9px] text-cyan-400 font-mono tracking-widest leading-none font-bold">BPSC RECALL v2.6</span>
            </div>
          </button>

          {/* Persistent Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-mono tracking-widest text-slate-400 uppercase">
            <button 
              onClick={() => navigateTo('/')} 
              className={`hover:text-white transition cursor-pointer ${gameState === 'LANDING' ? 'text-white font-bold underline decoration-cyan-400 underline-offset-4' : ''}`}
            >
              Home
            </button>
            <button 
              onClick={() => handleNavClick('game-modes')} 
              className="hover:text-white transition cursor-pointer"
            >
              Modes
            </button>
            <button 
              onClick={() => handleNavClick('subjects-section')} 
              className="hover:text-white transition cursor-pointer"
            >
              Subjects
            </button>
            <button 
              onClick={() => navigateTo('/dashboard')} 
              className={`hover:text-white transition cursor-pointer ${gameState === 'DASHBOARD' ? 'text-white font-bold underline decoration-cyan-400 underline-offset-4' : ''}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => navigateTo('/leaderboard')} 
              className={`hover:text-amber-400 transition cursor-pointer font-bold flex items-center gap-1 ${
                gameState === 'LEADERBOARD' ? 'text-amber-400 underline decoration-amber-400 underline-offset-4' : ''
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" /> Leaderboard
            </button>
          </nav>

          {/* Controls & Tools Container */}
          <div className="hidden md:flex items-center gap-4">
            {/* Audio Toggle */}
            <button 
              id="app_shell_sound_toggle"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title="Toggle system acoustics"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Micro Theme Switcher */}
            <button 
              id="app_shell_theme_toggle"
              onClick={() => setTheme(theme === 'Dark' ? 'Light' : 'Dark')}
              className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 hover:bg-slate-800 text-slate-400 transition cursor-pointer"
              title="Shift ambient polarity"
            >
              {theme === 'Dark' ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-cyan-400" />}
            </button>

            {/* Context-aware action buttons */}
            {gameState !== 'PLAYING' ? (
              <button 
                onClick={() => navigateTo('/app?mode=survival')}
                className="px-4 py-2 text-xs font-mono bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 rounded-lg shadow-md hover:shadow-cyan-400/20 active:scale-95 transition-all font-black uppercase tracking-wider cursor-pointer"
              >
                SURVIVAL RUN
              </button>
            ) : (
              <div className="flex items-center gap-2 text-[10px] font-mono bg-cyan-950/40 border border-cyan-800/40 px-3.5 py-1.5 rounded-lg text-cyan-300">
                <span className="h-1.5 w-1.5 bg-red-500 rounded-full animate-ping" />
                <span>COMBAT ENGINE: ON</span>
              </div>
            )}
          </div>

          {/* Mobile Overlay Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 text-slate-400 hover:text-white"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white cursor-pointer relative z-50"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </header>

      {/* MOBILE DRAWER WINDOW */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-0 pt-16 pb-8 bg-slate-950/95 backdrop-blur-2xl border-b border-slate-900 z-30 shadow-2xl flex flex-col px-6 space-y-5"
          >
            <div className="flex flex-col gap-3.5 text-sm font-mono tracking-widest text-slate-400 uppercase pt-4">
              <button onClick={() => { navigateTo('/'); setMobileMenuOpen(false); }} className="text-left py-2 hover:text-white transition">Home</button>
              <button onClick={() => handleNavClick('game-modes')} className="text-left py-2 hover:text-white transition">Modes</button>
              <button onClick={() => handleNavClick('subjects-section')} className="text-left py-2 hover:text-white transition">Subjects</button>
              <button onClick={() => { navigateTo('/dashboard'); setMobileMenuOpen(false); }} className="text-left py-2 hover:text-white transition text-cyan-400 font-bold">Dashboard</button>
              <button onClick={() => { navigateTo('/leaderboard'); setMobileMenuOpen(false); }} className="text-left py-2 hover:text-amber-400 transition font-bold flex items-center gap-1 text-amber-500">
                <Trophy className="w-4 h-4 text-amber-500" /> Leaderboard
              </button>
              <button onClick={() => { navigateTo('/auth'); setMobileMenuOpen(false); }} className="text-left py-2 hover:text-white transition">Account Sync</button>
            </div>

            <div className="flex flex-col gap-2 pt-4 border-t border-slate-900">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2">
                <span>Theme Shift</span>
                <button 
                  onClick={() => setTheme(theme === 'Dark' ? 'Light' : 'Dark')}
                  className="px-3 py-1 border border-slate-800 rounded bg-slate-900 font-mono text-cyan-400"
                >
                  {theme}
                </button>
              </div>
              <button 
                onClick={() => {
                  navigateTo('/app?mode=survival');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-center py-3 text-xs font-mono font-black tracking-wider bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 rounded-lg uppercase"
              >
                SURVIVAL BATTLERUN
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO / DATA TRANSITION FRAMEWORK */}
      <main className="flex-1 w-full mx-auto relative z-10 flex flex-col justify-between">
        <AnimatePresence mode="wait">
          <motion.div
            key={gameState}
            variants={pageTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1 flex flex-col h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FOOTER PERSISTENT HUD */}
      <footer className="border-t border-slate-950 bg-slate-950/80 backdrop-blur-sm py-6 relative z-10 text-center text-xs text-slate-500 space-y-2">
        <div className="max-w-7xl mx-auto px-4 font-mono leading-relaxed max-w-2xl px-6">
          <p>
            Strict competitive exam survival simulation. All structural blueprints calibrated with public Cadet and administrative exams.
          </p>
          <p className="font-sans text-[10px] text-slate-600 mt-1">
            Exam Survival BD &copy; 2026. Keep drilling and secure your desired class-1 gazetted post.
          </p>
        </div>
      </footer>
    </div>
  );
}
