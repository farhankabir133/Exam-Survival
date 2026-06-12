import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import { useGameStore } from '../../state/gameStore.js';
import { AuthInterface } from '../../components/AuthInterface.js';

export default function AuthPage() {
  const { 
    setGameState,
    theme,
    stats,
    setActiveUser,
    setActiveProfile
  } = useGameStore();

  const handleUserSynced = (user: any, profile: any) => {
    setActiveUser(user);
    setActiveProfile(profile);
    if (user) {
      setGameState('DASHBOARD');
    }
  };

  return (
    <div className={`min-h-screen py-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-start items-center ${
      theme === 'Light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      <div className="w-full max-w-md space-y-6">
        
        {/* Navigation Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <button 
            onClick={() => setGameState('LANDING')}
            className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition uppercase tracking-widest cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> [ Back Home ]
          </button>
          
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="font-mono text-xs text-slate-500 uppercase tracking-widest leading-none">
              SECURE PORTAL
            </span>
          </div>
        </div>

        {/* Dynamic Auth Container */}
        <div className="bg-slate-900/40 p-1.5 rounded-2xl border border-slate-850">
          <AuthInterface
            onUserSynced={handleUserSynced}
            currentStats={{
              totalScore: stats.totalScore,
              maxStreak: stats.maxStreak
            }}
          />
        </div>
      </div>
    </div>
  );
}
