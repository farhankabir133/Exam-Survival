import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Flame, 
  Timer, 
  Clock, 
  User, 
  Sparkles, 
  Target, 
  Award, 
  BookOpen, 
  Search, 
  X,
  Play,
  Moon,
  Sun,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '../../state/gameStore.js';
import { EXAM_PROFILES } from '../../data/examConfig.js';
import { AuthInterface } from '../../components/AuthInterface.js';
import { DynamicLeaderboards } from '../../components/DynamicLeaderboards.js';
import { ALL_SUBJECTS, ExamType, SubjectType, DifficultyLevel, GameMode } from '../../types.js';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';

interface DashboardPageProps {
  onStartGame: () => void;
  onUserSynced: (user: any, profile: any) => void;
  onUpdateProfile: (updatedProfile: any) => void;
}

export default function DashboardPage({ onStartGame, onUserSynced, onUpdateProfile }: DashboardPageProps) {
  const {
    selectedExamType,
    setExamType,
    selectedSubjects,
    setSubjects,
    toggleSubject,
    selectedDifficulty,
    setDifficulty,
    setDifficultyLabel,
    selectedMode,
    setGameMode,
    aiDynamicMode,
    setAiDynamicMode,
    otherSubjectsLanguage,
    setOtherSubjectsLanguage,
    theme,
    setTheme,
    targetChallengeEnabled,
    setTargetChallengeEnabled,
    totalQuestionLimit,
    setTotalQuestionLimit,
    targetPassingScore,
    setTargetPassingScore,
    stats,
    activeUser,
    activeProfile,
    setGameState,
  } = useGameStore();

  const [subjectSearchQuery, setSubjectSearchQuery] = useState('');

  // Accuracy helper
  const getAccuracy = () => {
    if (stats.totalAnswered === 0) return 0;
    return Math.round((stats.correctCount / stats.totalAnswered) * 100);
  };

  // Exam Selection
  const handleExamProfileSelection = (id: ExamType) => {
    setExamType(id);
    if (id !== 'Custom') {
      const profile = EXAM_PROFILES[id];
      setSubjects([...profile.subjects]);
    }
  };

  // Subject selection & custom profile fallback
  const handleSubjectToggle = (sub: SubjectType) => {
    toggleSubject(sub);
    setExamType('Custom');
  };

  // Memoized search filtered subjects
  const filteredSubjects = useMemo(() => {
    return ALL_SUBJECTS.filter(subj =>
      subj.toLowerCase().includes(subjectSearchQuery.toLowerCase())
    );
  }, [subjectSearchQuery]);

  const selectAllSubjects = () => {
    if (subjectSearchQuery) {
      const merged = Array.from(new Set([...selectedSubjects, ...filteredSubjects]));
      setSubjects(merged);
    } else {
      setSubjects([...ALL_SUBJECTS]);
    }
    setExamType('Custom');
  };

  const clearAllSubjects = () => {
    if (subjectSearchQuery) {
      setSubjects(selectedSubjects.filter(s => !filteredSubjects.includes(s)));
    } else {
      setSubjects([]);
    }
    setExamType('Custom');
  };

  return (
    <div id="dashboard-page" className="space-y-6 max-w-4xl mx-auto w-full animate-fade-in-up">
      
      {/* HERO PROMOTIONAL BOX */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-3 max-w-xl text-center md:text-left">
          <span className="inline-flex items-center gap-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full px-3 py-1 text-xs font-mono font-bold tracking-wider uppercase">
            ⚡ HIGH ATTENTION COMBAT
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            One Mistake. <span className="text-rose-500 line-through">No Excuses.</span> <br />
            <span className="bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">Immediate Game Over!</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Train your brain for Bangladesh’s toughest competitive tests (BCS, BB AD, Bank jobs). Strengthen recall and timing under relentless speed constraints.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex flex-col items-center justify-center gap-2 min-w-[200px] text-center shrink-0">
          <span className="text-xs text-slate-400 font-mono tracking-wider uppercase">Your Record Streak</span>
          <div className="flex items-center gap-1">
            <Flame className="w-8 h-8 text-amber-500 fill-amber-500 animate-pulse" />
            <span className="text-4xl font-black font-mono text-white">{stats.maxStreak}</span>
          </div>
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-2">
            <motion.div 
              className="h-full bg-cyan-400" 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, stats.maxStreak * 4)}%` }}
              transition={{ type: "spring", stiffness: 80, damping: 15 }}
            />
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-1">Accuracy: {getAccuracy()}%</span>
        </div>
      </div>

      {/* HIGH FIDELITY CLOUD SYNCHRONIZER */}
      <AuthInterface 
        onUserSynced={onUserSynced} 
        currentStats={{ totalScore: stats.totalScore, maxStreak: stats.maxStreak }} 
      />

      {/* DASHBOARD GRID: CONTROLS & STATISTICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LEFT & CENTER BOX - CONFIGURATOR */}
        <div className="md:col-span-2 space-y-6">
          
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" /> 1. Configure Exam Parameters
              </h3>
              <span className="text-xs text-slate-500 font-mono">Dynamic Pools</span>
            </div>

            {/* SELECT EXAM TYPE */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Target Exam Syllabus</label>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                {Object.values(EXAM_PROFILES).map(type => (
                  <button
                    key={type.id}
                    id={`btn_exam_${type.id}`}
                    onClick={() => handleExamProfileSelection(type.id)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-1 min-h-[92px] cursor-pointer ${
                      selectedExamType === type.id 
                        ? 'border-cyan-500 bg-cyan-950/30 text-white shadow-lg shadow-cyan-500/5 glow-border-cyan' 
                        : 'border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 text-slate-400'
                    }`}
                  >
                    <div className="w-full">
                      <div className="flex justify-between items-center w-full">
                        <span className="text-xs font-extrabold uppercase block leading-none">{type.label}</span>
                        {selectedExamType === type.id && (
                          <span className="bg-cyan-500 text-slate-950 font-mono text-[8px] font-black px-1 rounded uppercase tracking-wider scale-90">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 block leading-normal font-sans">
                        {type.desc}
                      </span>
                    </div>
                    {type.subjects.length > 0 && (
                      <span className="text-[8px] text-slate-500 font-mono block tracking-tight uppercase truncate w-full">
                        {type.subjects.length} Core Subjects
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {selectedExamType !== 'Custom' && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-cyan-950/20 border border-cyan-500/10 p-4 rounded-xl flex items-start gap-3 text-xs"
              >
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-extrabold text-cyan-400 uppercase tracking-widest block text-[9px] font-mono">Syllabus Weighting Prioritization Active</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Your active target <strong className="text-white">{EXAM_PROFILES[selectedExamType]?.label}</strong> is prioritizing exam-specific questions. Weights have been dynamically tuned to skew local DB pools and AI-generation templates for high-fidelity alignment.
                  </p>
                </div>
              </motion.div>
            )}

            {/* SELECT SUBJECTS GRID */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Candidate Subjects Practice</label>
                  {subjectSearchQuery && (
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      Showing {filteredSubjects.length} of {ALL_SUBJECTS.length} subjects
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={selectAllSubjects}
                    className="text-[10px] text-cyan-400 font-mono hover:underline uppercase cursor-pointer"
                  >
                    {subjectSearchQuery ? '[ Select Matches ]' : '[ Select All ]'}
                  </button>
                  <span className="text-slate-600 text-[10px]">|</span>
                  <button 
                    onClick={clearAllSubjects}
                    className="text-[10px] text-rose-400 font-mono hover:underline uppercase cursor-pointer"
                  >
                    {subjectSearchQuery ? '[ Deselect Matches ]' : '[ Deselect All ]'}
                  </button>
                </div>
              </div>

              {/* FILTERABLE SEARCH BAR */}
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-500 flex items-center">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={subjectSearchQuery}
                  onChange={(e) => setSubjectSearchQuery(e.target.value)}
                  placeholder="Quick search subjects (e.g. Bangla, Mathematics, English, ICT)..."
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/40 transition-all font-mono"
                />
                {subjectSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSubjectSearchQuery('')}
                    className="absolute right-3 p-1 rounded-full text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition cursor-pointer flex items-center"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {filteredSubjects.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {filteredSubjects.map(subj => {
                    const isSelected = selectedSubjects.includes(subj);
                    return (
                      <button
                        key={subj}
                        id={`btn_subject_${subj.replace(/\s+/g, '_')}`}
                        onClick={() => handleSubjectToggle(subj)}
                        className={`p-2.5 rounded-lg border text-xs font-medium text-center transition cursor-pointer ${
                          isSelected 
                            ? 'bg-slate-800 border-cyan-500/80 text-cyan-400 font-extrabold shadow-md shadow-cyan-500/5' 
                            : 'bg-slate-950/40 border-slate-850 text-slate-500 hover:text-slate-400'
                        }`}
                      >
                        {subj}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl text-center space-y-2">
                  <p className="text-xs text-slate-400 font-mono">No subjects match "{subjectSearchQuery}"</p>
                  <button
                    type="button"
                    onClick={() => setSubjectSearchQuery('')}
                    className="text-[10px] bg-slate-900 hover:bg-slate-850 text-cyan-400 px-3 py-1 rounded-md border border-slate-800 transition cursor-pointer"
                  >
                    Reset Search Filter
                  </button>
                </div>
              )}

              {selectedSubjects.length === 0 && (
                <div className="p-3 bg-rose-950/20 border border-rose-500/20 rounded-xl text-center text-xs font-mono text-rose-400 animate-pulse">
                  ⚠️ NO CANDIDATE SUBJECTS SELECTED. CHOOSE AT LEAST ONE SYLLABUS DISCIPLINE TO PROCEED.
                </div>
              )}
            </div>

            {/* SELECT DIFFICULTY & TIMERS */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Analytical Difficulty</label>
                <div className="flex gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                  {['Easy', 'Moderate', 'Standard', 'Hard'].map(level => (
                    <button
                      key={level}
                      id={`btn_diff_${level}`}
                      onClick={() => {
                        setDifficulty(level as DifficultyLevel);
                        setDifficultyLabel(level);
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold text-center transition uppercase ${
                        selectedDifficulty === level 
                          ? 'bg-cyan-500 text-slate-950 font-black' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Other Subjects Language</span>
                  <span className="text-[9px] text-slate-500 normal-case">(Excl. Bangla/Eng)</span>
                </label>
                <div className="flex gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                  {['Bangla', 'English'].map(lang => (
                    <button
                      key={lang}
                      id={`btn_lang_${lang}`}
                      onClick={() => setOtherSubjectsLanguage(lang as 'Bangla' | 'English')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold text-center transition uppercase ${
                        otherSubjectsLanguage === lang 
                          ? 'bg-cyan-500 text-slate-950 font-black' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Visual Theme Mode</span>
                  <span className="text-[9px] text-slate-500 normal-case">(Day / Night)</span>
                </label>
                <div className="flex gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                  {[
                    { value: 'Dark', label: 'Dark / Night', icon: Moon },
                    { value: 'Light', label: 'Light / Day', icon: Sun }
                  ].map(t => {
                    const IconComp = t.icon;
                    const isActive = theme === t.value;
                    return (
                      <button
                        key={t.value}
                        id={`btn_theme_preset_${t.value}`}
                        onClick={() => setTheme(t.value as 'Dark' | 'Light')}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold text-center transition flex items-center justify-center gap-1 uppercase ${
                          isActive 
                            ? 'bg-cyan-500 text-slate-950 font-black' 
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <IconComp className="w-3.5 h-3.5" />
                        <span>{t.value}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">AI Question Augmentation</label>
                <button
                  id="btn_ai_question_toggle"
                  onClick={() => {
                    setAiDynamicMode(!aiDynamicMode);
                  }}
                  className={`w-full py-2.5 px-3.5 rounded-xl border flex items-center justify-between text-xs transition ${
                    aiDynamicMode
                      ? 'border-yellow-400/40 bg-yellow-950/20 text-yellow-300 shadow-lg shadow-yellow-950/10'
                      : 'border-slate-800 bg-slate-950 text-slate-500 hover:text-slate-400'
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-bold">
                    <Sparkles className={`w-4 h-4 ${aiDynamicMode ? 'text-yellow-400 animate-spin' : ''}`} />
                    Gemini AI Dynamic Pool
                  </span>
                  <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                    {aiDynamicMode ? "ACTIVE" : "OFFLINED"}
                  </span>
                </button>
              </div>
            </div>

            {/* SELECT GAME MODE */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Game Mode selection</label>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {[
                  { id: 'Survival', label: 'Survival', icon: Flame, color: 'text-rose-500', bg: 'hover:border-rose-500/40', desc: 'Endless. One death.' },
                  { id: 'Speed', label: 'Speed Rush', icon: Timer, color: 'text-cyan-400', bg: 'hover:border-cyan-400/40', desc: 'Strict time rule.' },
                  { id: 'Daily', label: 'Daily Hunt', icon: Trophy, color: 'text-amber-400', bg: 'hover:border-amber-400/40', desc: 'Shared board task.' },
                  { id: 'Marathon', label: 'Marathon', icon: Clock, color: 'text-emerald-400', bg: 'hover:border-emerald-400/40', desc: 'Adaptive difficulty.' },
                  { id: 'PvP', label: 'Simulated PvP', icon: User, color: 'text-indigo-400', bg: 'hover:border-indigo-400/40', desc: 'Turn battle vs pros.' }
                ].map(mode => {
                  const IconComponent = mode.icon;
                  const isChosen = selectedMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      id={`btn_mode_${mode.id}`}
                      onClick={() => setGameMode(mode.id as GameMode)}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 h-24 ${mode.bg} ${
                        isChosen 
                          ? 'border-amber-500 bg-amber-500/10 text-white font-bold glow-border-gold' 
                          : 'border-slate-800 bg-slate-900/40 text-slate-400'
                      }`}
                    >
                      <IconComponent className={`w-5 h-5 ${mode.color} ${isChosen ? 'animate-bounce' : ''}`} />
                      <span className="text-[11px] font-bold uppercase tracking-wider block">{mode.label}</span>
                      <span className="text-[8px] text-slate-500 block leading-tight">{mode.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TARGET CHALLENGE WORKBENCH */}
            <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-cyan-400" />
                    Target Passing Score Challenge
                  </label>
                  <p className="text-[10px] text-slate-500 normal-case">
                    Simulate authentic BCS marking (-0.5 per wrong answer) and set a custom passing threshold.
                  </p>
                </div>
                <button
                  id="btn_target_challenge_toggle"
                  onClick={() => setTargetChallengeEnabled(!targetChallengeEnabled)}
                  className={`py-1 px-3.5 rounded-lg text-xs font-mono font-bold transition border ${
                    targetChallengeEnabled
                      ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 font-extrabold shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  {targetChallengeEnabled ? "ENABLED" : "OFF"}
                </button>
              </div>

              {targetChallengeEnabled && (
                <div className="space-y-4 pt-2 border-t border-slate-900/60 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Left Option: Question Limit Selection */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Number of Questions</span>
                        <span className="text-xs font-mono text-cyan-400 font-bold">{totalQuestionLimit} QUESTIONS</span>
                      </div>

                      <input
                        type="range"
                        min={5}
                        max={50}
                        step={5}
                        value={totalQuestionLimit}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setTotalQuestionLimit(val);
                          // Keep target threshold within range (default 70% accuracy)
                          const optimalPassing = Math.round(val * 0.7 * 2) / 2;
                          setTargetPassingScore(optimalPassing);
                        }}
                        className="w-full h-1.5 rounded-lg bg-slate-950 accent-cyan-400 cursor-pointer"
                      />

                      <div className="flex justify-between gap-1 mt-1 flex-wrap">
                        {[5, 10, 15, 20, 25, 30, 50].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => {
                              setTotalQuestionLimit(num);
                              const optimalPassing = Math.round(num * 0.7 * 2) / 2;
                              setTargetPassingScore(optimalPassing);
                            }}
                            className={`px-1.5 py-1 text-[10px] font-mono font-bold rounded transition-all ${
                              totalQuestionLimit === num
                                ? 'bg-cyan-500 text-slate-950 font-black'
                                : 'bg-slate-950/60 text-slate-500 hover:text-slate-300 border border-slate-900'
                            }`}
                          >
                            {num}Q
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Right Option: Target Score Selection */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Target Passing Score</span>
                        <span className="text-xs font-mono text-amber-400 font-bold">
                          {targetPassingScore.toFixed(1)} MARKS
                        </span>
                      </div>

                      <input
                        type="range"
                        min={1}
                        max={totalQuestionLimit}
                        step={0.5}
                        value={targetPassingScore}
                        onChange={(e) => {
                          setTargetPassingScore(parseFloat(e.target.value));
                        }}
                        className="w-full h-1.5 rounded-lg bg-slate-950 accent-amber-400 cursor-pointer"
                      />

                      <div className="flex justify-between gap-1 mt-1 flex-wrap">
                        {[0.5, 0.7, 0.9].map((ratio) => {
                          const scorePreset = Math.round(totalQuestionLimit * ratio * 2) / 2;
                          const labelText = ratio === 0.5 ? '50% Pass' : ratio === 0.7 ? '70% Std' : '90% Elite';
                          return (
                            <button
                              key={ratio}
                              type="button"
                              onClick={() => setTargetPassingScore(scorePreset)}
                              className={`px-1.5 py-1 text-[9px] font-mono font-bold rounded transition-all ${
                                targetPassingScore === scorePreset
                                  ? 'bg-amber-400 text-slate-950 font-black'
                                  : 'bg-slate-950/60 text-slate-500 hover:text-slate-300 border border-slate-900'
                              }`}
                            >
                              {labelText} ({scorePreset.toFixed(1)})
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  {/* Rules Callout Panel */}
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-900 text-[10px] font-mono leading-relaxed space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Correct Answer Allowance:</span>
                      <span className="text-emerald-400 font-bold">+1.0 Marks / Right Answer</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Negative Penalty Code:</span>
                      <span className="text-rose-400 font-bold">-0.5 Marks / Mistake or Timeout</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-900/55 pt-1 mt-1 text-[11px]">
                      <span className="text-slate-400 font-bold">Dynamic Termination:</span>
                      <span className="text-amber-400/90 font-black">
                        IMMEDIATE FAILURE IF SCORE FEASIBILITY DROPS BELOW {targetPassingScore.toFixed(1)} MARKS
                      </span>
                    </div>
                  </div>

                </div>
              )}
            </div>

          </div>

          {/* RUN BUTTON */}
          <button
            id="btn_start_game"
            disabled={selectedSubjects.length === 0}
            onClick={onStartGame}
            className={`w-full font-black py-4.5 rounded-2xl text-lg transition-all flex items-center justify-center gap-2 tracking-wider group ${
              selectedSubjects.length === 0
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-cyan-400 via-teal-400 to-amber-400 text-slate-950 hover:shadow-2xl hover:shadow-cyan-500/20 active:scale-98 cursor-pointer'
            }`}
          >
            <Play className={`w-6 h-6 transition-transform group-hover:scale-110 ${selectedSubjects.length === 0 ? 'fill-slate-500' : 'fill-slate-950'}`} />
            {selectedSubjects.length === 0 ? "SELECT SUBJECTS TO START" : "START CRITICAL EXAM CHALLENGE"}
          </button>

        </div>

        {/* RIGHT BOX - HIGHLIGHT PERFORMANCE LEADERBOARD & COMBAT STATS */}
        <div className="space-y-6">
          
          {/* ACHIEVEMENTS/TROPHIES */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="font-extrabold text-xs font-mono text-amber-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-3">
              <Award className="w-4 h-4 text-amber-400" /> Career Milestones
            </h3>
            
            <div className="space-y-2.5">
              {[
                { streak: 5, title: 'Muckraker Appointee', desc: 'Unlock with a 5 correct answers streak.', done: stats.maxStreak >= 5 },
                { streak: 12, title: 'BCS Aspirant Cadre', desc: 'Attain a 12 correct answers streak under pressure.', done: stats.maxStreak >= 12 },
                { streak: 20, title: 'Directorship Candidate', desc: 'Master key bank topics to secure 20 correct answers.', done: stats.maxStreak >= 20 },
                { streak: 35, title: 'Governor Material', desc: 'Infinite streak control top honors.', done: stats.maxStreak >= 35 },
              ].map((ach, i) => (
                <div 
                  key={i} 
                  className={`flex items-center gap-3 p-2 rounded-xl border ${
                    ach.done 
                      ? 'bg-amber-950/20 border-amber-500/20 text-slate-200' 
                      : 'bg-slate-950/40 border-slate-900 text-slate-500'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    ach.done ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-600 border border-slate-850'
                  }`}>
                    🏅 {ach.streak}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black truncate">{ach.title}</h4>
                    <p className="text-[10px] text-slate-400 leading-normal truncate">{ach.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* HIGH-FIDELITY INTERACTIVE ARENA LEADERBOARDS */}
          <div className="flex justify-between items-center bg-slate-900/40 p-3 rounded-xl border border-slate-900/60 mb-2">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
              🏆 BPSC Arena Leaderboards
            </span>
            <button
              onClick={() => setGameState('LEADERBOARD')}
              className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition uppercase tracking-wider cursor-pointer border border-cyan-500/30 px-2 py-1 rounded bg-cyan-500/10"
            >
              [ Fullscreen Route ]
            </button>
          </div>
          <DynamicLeaderboards
            currentUser={activeUser}
            currentProfile={activeProfile}
            onUpdateProfile={onUpdateProfile}
          />

        </div>
      </div>

      {/* SUBJECT PROFICIENCY RADAR GRAPH */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 className="font-extrabold text-xs font-mono text-indigo-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-3">
          <BookOpen className="w-4 h-4 text-indigo-400" /> Topic Proficiency Matrix
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          
          {/* Visual Radar Map */}
          <div className="lg:col-span-2 h-[340px] w-full flex items-center justify-center bg-slate-950/40 rounded-xl p-4 border border-slate-900/60">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={ALL_SUBJECTS.map(subj => {
                const subjectData = stats.subjectProficiency[subj] || { correct: 0, total: 0 };
                const percent = subjectData.total > 0 ? Math.round((subjectData.correct / subjectData.total) * 100) : 0;
                return {
                  subject: subj,
                  proficiency: percent,
                  correct: subjectData.correct,
                  total: subjectData.total
                };
              })}>
                <PolarGrid stroke="#334155" strokeWidth={0.5} />
                <PolarAngleAxis 
                  dataKey="subject" 
                  stroke="#94a3b8" 
                  style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold' }} 
                  tickFormatter={(value) => {
                    if (value === 'Bangladesh Affairs') return 'BD Affairs';
                    if (value === 'International Affairs') return 'Int. Affairs';
                    if (value === 'General Science') return 'Science';
                    if (value === 'Mental Ability') return 'Mental Ab.';
                    return value;
                  }}
                />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" style={{ fontSize: 8, fontFamily: 'monospace' }} />
                <Radar name="Proficiency" dataKey="proficiency" stroke="#818cf8" fill="#6366f1" fillOpacity={0.2} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl shadow-2xl text-[11px] font-mono">
                          <p className="font-extrabold text-indigo-400 border-b border-slate-800 pb-1 mb-1.5">{data.subject}</p>
                          <div className="space-y-1">
                            <div className="flex justify-between gap-6">
                              <span className="text-slate-400">Proficiency:</span>
                              <span className="font-black text-cyan-400">{data.proficiency}%</span>
                            </div>
                            <div className="flex justify-between gap-6">
                              <span className="text-slate-400">Correct:</span>
                              <span className="font-extrabold text-emerald-400">{data.correct}</span>
                            </div>
                            <div className="flex justify-between gap-6">
                              <span className="text-slate-400">Attempts:</span>
                              <span className="font-extrabold text-slate-300">{data.total}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend & Details Column */}
          <div className="lg:col-span-1 space-y-3 font-mono text-xs">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-1">Subject Breakdown</div>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              {ALL_SUBJECTS.map(subj => {
                const subjectData = stats.subjectProficiency[subj] || { correct: 0, total: 0 };
                const percent = subjectData.total > 0 ? Math.round((subjectData.correct / subjectData.total) * 100) : 0;
                return (
                  <div key={subj} className="bg-slate-950/80 border border-slate-900/60 p-2.5 rounded-xl flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-slate-300 font-extrabold truncate block">{subj}</span>
                      <span className="text-[9px] text-slate-500 block">Acc: {subjectData.correct}/{subjectData.total}</span>
                    </div>
                    <span className={`text-[11px] font-black shrink-0 ${
                      percent >= 75 ? 'text-emerald-400' : (percent >= 40 ? 'text-amber-400' : 'text-rose-400')
                    }`}>
                      {percent}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
