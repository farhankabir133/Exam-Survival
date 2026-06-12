import React from 'react';
import { ArrowLeft, Trophy } from 'lucide-react';
import { useGameStore } from '../../state/gameStore.js';
import { DynamicLeaderboards } from '../../components/DynamicLeaderboards.js';

export default function LeaderboardPage() {
  const { 
    activeUser, 
    activeProfile, 
    setActiveProfile,
    setGameState,
    theme 
  } = useGameStore();

  return (
    <div className={`min-h-screen py-12 px-4 sm:px-6 lg:px-8 ${
      theme === 'Light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation HUD */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <button 
            onClick={() => setGameState('DASHBOARD')}
            className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition uppercase tracking-widest cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> [ Back to Dashboard ]
          </button>
          
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span className="font-mono text-xs text-slate-500 uppercase tracking-widest leading-none">
              Competitive Leaderboard Page
            </span>
          </div>
        </div>

        {/* Dynamic Leaderboards Card */}
        <DynamicLeaderboards
          currentUser={activeUser}
          currentProfile={activeProfile}
          onUpdateProfile={(profile) => setActiveProfile(profile)}
        />
      </div>
    </div>
  );
}
