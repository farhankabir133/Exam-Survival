import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Zap, 
  Award, 
  Clock, 
  Users, 
  UserPlus, 
  UserMinus, 
  Search, 
  Calendar, 
  Globe, 
  Flame,
  Check,
  SearchX,
  Loader2,
  Lock
} from 'lucide-react';
import { fetchLeaderboardUsers, saveUserProfile } from '../utils/firebase.js';
import { DbUser } from '../types.js';
import { motion, AnimatePresence } from 'motion/react';

interface DynamicLeaderboardsProps {
  currentUser: any; // FirebaseUser from firestore
  currentProfile: DbUser | null;
  onUpdateProfile: (updatedProfile: DbUser) => void;
}

type TabScope = 'global' | 'weekly' | 'monthly' | 'friends';
type TabMetric = 'streak' | 'speed' | 'score';

export const DynamicLeaderboards: React.FC<DynamicLeaderboardsProps> = ({ 
  currentUser, 
  currentProfile,
  onUpdateProfile 
}) => {
  const [users, setUsers] = useState<DbUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Tab states
  const [scope, setScope] = useState<TabScope>('global');
  const [metric, setMetric] = useState<TabMetric>('score');

  // Load cloud data
  const loadLeaderboardData = async () => {
    setLoading(true);
    try {
      const allUsers = await fetchLeaderboardUsers();
      setUsers(allUsers);
    } catch (err) {
      console.error("Error retrieving custom leaderboard metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboardData();
  }, [currentUser, currentProfile?.bestStreak, currentProfile?.totalScore, currentProfile?.fastestResponse]);

  // Handle Add/Remove Friend action
  const handleToggleFriend = async (targetUid: string, targetName: string) => {
    if (!currentUser || !currentProfile) return;
    
    const currentFriends = currentProfile.friends || [];
    const isFriend = currentFriends.includes(targetUid);
    
    let updatedFriends: string[];
    if (isFriend) {
      updatedFriends = currentFriends.filter(id => id !== targetUid);
    } else {
      updatedFriends = [...currentFriends, targetUid];
    }
    
    const updatedProfile: DbUser = {
      ...currentProfile,
      friends: updatedFriends
    };

    try {
      await saveUserProfile(currentUser.uid, updatedProfile);
      onUpdateProfile(updatedProfile);
      
      // Update local state smoothly
      setUsers(prev => prev.map(u => {
        if (u.id === currentProfile.id) {
          return { ...u, friends: updatedFriends };
        }
        return u;
      }));
    } catch (err) {
      console.error("Failed to commit friends list update:", err);
    }
  };

  // 1. FILTER CANDIDATES BY SCOPE
  const getFilteredByScope = () => {
    const now = new Date();
    
    return users.filter(user => {
      // General safety filters
      if (!user.name) return false;

      // Search Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = user.name.toLowerCase().includes(query);
        const matchesEmail = user.email.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail) return false;
      }

      // Scope filter
      if (scope === 'friends') {
        if (!currentUser || !currentProfile) return false;
        // Include friends plus current user themselves
        const mFriends = currentProfile.friends || [];
        return mFriends.includes(user.id) || user.id === currentProfile.id;
      }

      const activeDate = user.lastActiveAt ? new Date(user.lastActiveAt) : new Date(user.createdAt || now);
      const diffTime = Math.abs(now.getTime() - activeDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (scope === 'weekly') {
        return diffDays <= 7;
      }
      if (scope === 'monthly') {
        return diffDays <= 30;
      }

      return true; // Global matches all
    });
  };

  // 2. SORT CANDIDATES BY METRIC
  const getSortedByMetric = (filteredList: DbUser[]) => {
    return [...filteredList].sort((a, b) => {
      if (metric === 'streak') {
        // High correct streaks descending
        return (b.bestStreak || 0) - (a.bestStreak || 0);
      }
      if (metric === 'score') {
        // High total accumulated points descending
        return (b.totalScore || 0) - (a.totalScore || 0);
      }
      if (metric === 'speed') {
        // Response time in seconds ascending (faster is lower, e.g. 1.2s bpsc cracker is better than 4.5s)
        const speedA = a.fastestResponse || 99.99;
        const speedB = b.fastestResponse || 99.99;
        
        // Exclude completely default slow entries if possible, or rank them at bottom
        if (speedA === 99.99 && speedB !== 99.99) return 1;
        if (speedB === 99.99 && speedA !== 99.99) return -1;
        
        return speedA - speedB;
      }
      return 0;
    });
  };

  const filteredCandidates = getFilteredByScope();
  const sortedCandidates = getSortedByMetric(filteredCandidates);

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-slate-800 space-y-4 bg-slate-950/40 relative">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-850 pb-4">
        <div className="space-y-0.5 text-left">
          <h3 className="font-extrabold text-xs font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-cyan-400" /> BPSC National Arena
          </h3>
          <p className="text-[10px] text-slate-500 font-mono">Real-time competitive metrics from cloud database</p>
        </div>

        {/* REFRESH CONTROL */}
        <button
          onClick={loadLeaderboardData}
          disabled={loading}
          className="text-[9px] font-mono text-slate-400 hover:text-white bg-slate-900 border border-slate-850 hover:bg-slate-800 transition py-1 px-2.5 rounded cursor-pointer self-start sm:self-auto"
        >
          {loading ? 'Syncing...' : 'Sync Arena'}
        </button>
      </div>

      {/* FILTER TABS (SCOPE) */}
      <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-900/80 gap-1 overflow-x-auto scroller-hidden">
        <button
          onClick={() => setScope('global')}
          className={`text-[10px] uppercase font-mono font-bold tracking-wider rounded-lg px-3 py-1.5 transition flex items-center gap-1 shrink-0 cursor-pointer ${
            scope === 'global' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white bg-transparent'
          }`}
        >
          <Globe className="w-3.5 h-3.5" /> Global
        </button>
        <button
          onClick={() => setScope('weekly')}
          className={`text-[10px] uppercase font-mono font-bold tracking-wider rounded-lg px-3 py-1.5 transition flex items-center gap-1 shrink-0 cursor-pointer ${
            scope === 'weekly' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white bg-transparent'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" /> Weekly
        </button>
        <button
          onClick={() => setScope('monthly')}
          className={`text-[10px] uppercase font-mono font-bold tracking-wider rounded-lg px-3 py-1.5 transition flex items-center gap-1 shrink-0 cursor-pointer ${
            scope === 'monthly' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white bg-transparent'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" /> Monthly
        </button>
        <button
          onClick={() => setScope('friends')}
          className={`text-[10px] uppercase font-mono font-bold tracking-wider rounded-lg px-3 py-1.5 transition flex items-center gap-1 shrink-0 cursor-pointer ${
            scope === 'friends' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white bg-transparent'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Friends
        </button>
      </div>

      {/* SORT TABS (METRIC) */}
      <div className="grid grid-cols-3 bg-slate-900/30 p-1 rounded-lg border border-slate-850 gap-1 text-center">
        <button
          onClick={() => setMetric('score')}
          className={`text-[9px] sm:text-[10px] uppercase font-mono py-1 font-bold transition flex items-center justify-center gap-1 rounded cursor-pointer ${
            metric === 'score' ? 'bg-indigo-950/40 border border-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Award className="w-3 h-3 text-indigo-400" /> Total Points
        </button>
        
        <button
          onClick={() => setMetric('streak')}
          className={`text-[9px] sm:text-[10px] uppercase font-mono py-1 font-bold transition flex items-center justify-center gap-1 rounded cursor-pointer ${
            metric === 'streak' ? 'bg-amber-950/40 border border-amber-500/20 text-amber-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Flame className="w-3 h-3 text-amber-500" /> Max Streak
        </button>
        
        <button
          onClick={() => setMetric('speed')}
          className={`text-[9px] sm:text-[10px] uppercase font-mono py-1 font-bold transition flex items-center justify-center gap-1 rounded cursor-pointer ${
            metric === 'speed' ? 'bg-cyan-950/40 border border-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Zap className="w-3 h-3 text-cyan-400" /> Fast Response
        </button>
      </div>

      {/* SEARCH AND FILTER FIELD */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-slate-950/80 border border-slate-900 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full font-mono text-left"
          placeholder="Lookup competitor name or email..."
        />
      </div>

      {/* CONDITIONAL AUTH WARNING & RENDER LIST */}
      {scope === 'friends' && !currentUser ? (
        <div className="bg-slate-900/40 border border-slate-850/60 rounded-xl p-6 text-center font-mono py-10 space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-950 border border-slate-855 flex items-center justify-center mx-auto text-slate-500">
            <Lock className="w-4 h-4 text-slate-400 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black text-slate-300 uppercase">Interactive Social Sandbox</h4>
            <p className="text-[10px] text-slate-500">Please sign in to your BCS Candidate Profile above to customize friends lists, compare stats, and track rivals!</p>
          </div>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 font-mono text-xs">
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          <span className="text-slate-500">Retesting cloud statistics database...</span>
        </div>
      ) : sortedCandidates.length === 0 ? (
        <div className="text-center py-10 font-mono space-y-2">
          <SearchX className="w-6 h-6 text-slate-700 mx-auto" />
          <p className="text-[10px] text-slate-500">No competitors matches the specified criteria.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 select-none font-mono scroll-thin">
          <AnimatePresence initial={false}>
            {sortedCandidates.map((cadet, idx) => {
              const isMe = cadet.id === currentUser?.uid;
              const isTrackerFriend = currentProfile?.friends?.includes(cadet.id);
              
              // Formatting criteria tags
              let statsText = '';
              let statsIcon: React.ReactNode = null;
              
              if (metric === 'score') {
                statsText = `${cadet.totalScore || 0} PTS`;
                statsIcon = <Award className="w-3 h-3 text-indigo-400" />;
              } else if (metric === 'streak') {
                statsText = `${cadet.bestStreak || 0} RUNS`;
                statsIcon = <Flame className="w-3 h-3 text-amber-500" />;
              } else if (metric === 'speed') {
                const speed = cadet.fastestResponse;
                statsText = speed && speed !== 99.99 ? `${speed.toFixed(2)}s` : 'N/A';
                statsIcon = <Clock className="w-3 h-3 text-cyan-400" />;
              }

              return (
                <motion.div
                  key={cadet.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`flex justify-between items-center text-xs p-3 rounded-xl border transition ${
                    isMe 
                      ? 'bg-cyan-500/10 border-cyan-400/40' 
                      : 'bg-slate-950/60 hover:bg-slate-950 border-slate-900/65'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 text-left">
                    {/* RANK ACCENT */}
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 ${
                      idx === 0 ? 'bg-yellow-400 text-slate-950' :
                      idx === 1 ? 'bg-slate-200 text-slate-950' :
                      idx === 2 ? 'bg-amber-600 text-white' : 'bg-slate-900 text-slate-500 border border-slate-850'
                    }`}>
                      {idx + 1}
                    </span>

                    {/* AVATAR EMBLEM */}
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-semibold text-[11px] shrink-0 ${
                      isMe 
                        ? 'bg-cyan-400 text-slate-950 border-cyan-300/30 font-black' 
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}>
                      {cadet.name ? cadet.name.slice(0, 2).toUpperCase() : 'CD'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className={`font-extrabold truncate text-[11px] leading-tight block ${
                          isMe ? 'text-cyan-400 font-extrabold' : 'text-slate-200'
                        }`}>
                          {cadet.name}
                        </span>
                        {isMe && (
                          <span className="bg-cyan-400/20 border border-cyan-400/40 text-cyan-300 font-bold text-[7px] px-1 rounded uppercase tracking-wider leading-none">YOU</span>
                        )}
                      </div>
                      <span className="text-[8px] text-slate-500 block leading-none pt-0.5 max-w-[130px] truncate">
                        {cadet.examTarget?.join(' / ') || 'BCS'} • {cadet.totalGames || 0} Matches
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* STATS RATING */}
                    <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-850 py-1 px-2.5 rounded-lg">
                      {statsIcon}
                      <span className="font-extrabold text-[10px] text-slate-200">{statsText}</span>
                    </div>

                    {/* ADD FRIEND / FAVORITE CONTROL (DO NOT SHOW FOR CURRENT USER) */}
                    {currentUser && currentProfile && !isMe && (
                      <button
                        onClick={() => handleToggleFriend(cadet.id, cadet.name)}
                        className={`w-7 h-7 rounded-lg border transition flex items-center justify-center cursor-pointer ${
                          isTrackerFriend 
                            ? 'bg-rose-950/20 border-rose-900/40 text-rose-400 hover:bg-rose-950/40' 
                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-350 hover:bg-slate-800'
                        }`}
                        title={isTrackerFriend ? "Remove from tracking candidates" : "Track this candidate in Friends board"}
                      >
                        {isTrackerFriend ? <UserMinus className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* COMPACT FOOTER STATS INFO */}
      {currentUser && currentProfile && (
        <div className="bg-slate-900/20 p-3 rounded-xl border border-slate-900 text-left">
          <p className="text-[9px] font-mono leading-relaxed text-slate-500">
            * <strong>Weekly / Monthly filters</strong> are calculated on your candidates' active exam sequences within the timeframe. Max correct answers streak determines highest level sequence multiplier.
          </p>
        </div>
      )}

    </div>
  );
};
