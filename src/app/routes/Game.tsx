import React from 'react';
import { 
  Flame, 
  Zap, 
  Timer, 
  RefreshCw, 
  X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '../../state/gameStore.js';

interface GamePageProps {
  offlineBackupActive: boolean;
  questionLoading: boolean;
  onOptionClick: (optionIdx: number) => void;
  onExitToDashboard: () => void;
}

export default function GamePage({ 
  offlineBackupActive, 
  questionLoading, 
  onOptionClick, 
  onExitToDashboard 
}: GamePageProps) {
  const {
    gameState,
    targetChallengeEnabled,
    sessionCorrectCount,
    sessionWrongCount,
    currentQuestionIndex,
    totalQuestionLimit,
    targetPassingScore,
    selectedMode,
    stats,
    timeLeft,
    maxTime,
    pvpOpponent,
    activeQuestion,
    difficultyLabel,
    selectedOption,
    answerRevealed,
  } = useGameStore();

  // Target challenge helper
  const getChallengeMetrics = () => {
    const currentScore = sessionCorrectCount * 1.0 - sessionWrongCount * 0.5;
    const answeredCount = sessionCorrectCount + sessionWrongCount;
    const remainingCount = Math.max(0, totalQuestionLimit - answeredCount);
    const maxPossible = currentScore + remainingCount * 1.0;
    const isImpossible = targetChallengeEnabled && (maxPossible < targetPassingScore);
    const requiredRemainingToTarget = Math.max(0, targetPassingScore - currentScore);

    return {
      currentScore,
      answeredCount,
      remainingCount,
      maxPossible,
      isImpossible,
      requiredRemainingToTarget,
    };
  };

  return (
    <div id="game-page" className="space-y-6 max-w-3xl mx-auto w-full animate-scale-up">

      {/* OFFLINE BACKUP ACTIVE NOTIFICATION BANNER */}
      {offlineBackupActive && (
        <div className="bg-amber-500/10 border border-amber-500/35 p-3 rounded-2xl flex items-center justify-between gap-3 text-xs font-mono text-amber-300">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>
              ⚡ <b>Offline Engine Engaged:</b> Running seamlessly from high-yield built-in syllabus database. (নিরবচ্ছিন্ন অফলাইন প্রশ্নপত্র সক্রিয় রয়েছে)।
            </span>
          </div>
          <div className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-400 border border-slate-800 hidden sm:block">
            Quota Limit Fallback
          </div>
        </div>
      )}

      {/* REAL-TIME TARGET CHALLENGE SCOREBOARD */}
      {targetChallengeEnabled && (() => {
        const { currentScore, remainingCount, maxPossible, requiredRemainingToTarget } = getChallengeMetrics();
        const isWarning = maxPossible - targetPassingScore <= 2.0;

        return (
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-lg shadow-black/40">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
              <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded font-mono uppercase tracking-widest font-black">
                🎯 TARGET SCORE MODE: ACTIVE CHALLENGE
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                STABILITY STATUS: <span className={isWarning ? "text-amber-500 animate-pulse font-extrabold" : "text-emerald-400 font-extrabold"}>{isWarning ? "⚠️ CRITICAL SECTOR" : "✓ NOMINAL ENGINE"}</span>
              </span>
            </div>

            {/* Dynamic stats rows */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
              <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-850/60 text-left">
                <span className="text-slate-500 text-[9px] uppercase tracking-wider block">CURRENT MARKS</span>
                <span className={`text-lg font-black ${currentScore >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {currentScore >= 0 ? `+${currentScore.toFixed(1)}` : `${currentScore.toFixed(1)}`}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  {sessionCorrectCount} right | {sessionWrongCount} wrong
                </span>
              </div>

              <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-850/60 text-left">
                <span className="text-slate-500 text-[9px] uppercase tracking-wider block">TARGET THRESHOLD</span>
                <span className="text-lg font-black text-amber-400">
                  {targetPassingScore.toFixed(1)} <span className="text-xs text-slate-500">MARKS</span>
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  {Math.round((targetPassingScore / totalQuestionLimit) * 100)}% accuracy req.
                </span>
              </div>

              <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-850/60 text-left">
                <span className="text-slate-500 text-[9px] uppercase tracking-wider block">MAX POSSIBLE CHANCE</span>
                <span className={`text-lg font-black ${isWarning ? 'text-rose-400 font-black animate-pulse' : 'text-cyan-400'}`}>
                  +{maxPossible.toFixed(1)}
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">
                  {remainingCount} questions remaining
                </span>
              </div>

              <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-850/60 text-left">
                <span className="text-slate-500 text-[9px] uppercase tracking-wider block">RUN PROGRESS</span>
                <span className="text-lg font-black text-slate-200">
                  {currentQuestionIndex + 1} <span className="text-xs text-slate-500">/ {totalQuestionLimit}</span>
                </span>
                <div className="w-full bg-slate-950 h-1.5 rounded-full mt-1.5 overflow-hidden border border-slate-900">
                  <div 
                    className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / totalQuestionLimit) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Live helper notes */}
            <div className="text-[9px] font-mono flex items-center justify-between text-slate-500 pt-1 border-t border-slate-900">
              <span>
                * Correct: <b className="text-emerald-400">+1.0</b> | Inc/Skipped: <b className="text-rose-400">-0.5</b>
              </span>
              <span className="text-amber-400/90 font-bold">
                {requiredRemainingToTarget > 0 
                  ? `Required Remaining Marks to Pass: +${requiredRemainingToTarget.toFixed(1)}` 
                  : "✓ TARGET CONSTRAINTS ACHIEVED! MAINTAIN TO FINISH!"}
              </span>
            </div>
          </div>
        );
      })()}

      {/* GAME TIMERS, PROGRESS, AND PvP OVERLAY PANEL */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          {/* Streak Fire Indicator */}
          <div className="flex items-center gap-1 bg-rose-950/20 border border-rose-500/20 px-4 py-2 rounded-xl text-rose-500 font-black animate-pulse">
            <Flame className="w-6 h-6 fill-rose-500 text-rose-500 stroke-[2.5]" />
            <div className="font-mono text-left">
              <div className="text-2xl leading-none">{stats.streak}</div>
              <div className="text-[9px] uppercase tracking-wider text-rose-400">COMBO MULTIPLIER</div>
            </div>
          </div>

          {/* Score panel */}
          <div className="flex items-center gap-2 bg-amber-950/20 border border-amber-500/20 px-4 py-2 rounded-xl text-amber-400 font-mono">
            <Zap className="w-5 h-5 fill-amber-400" />
            <div className="text-left">
              <div className="text-lg font-black leading-none">{stats.totalScore}</div>
              <div className="text-[9px] uppercase text-amber-500">SCORE PTS</div>
            </div>
          </div>
        </div>

        {/* Countdown Progress line (Only for Speed Mode / Others optionally) */}
        {(selectedMode === 'Speed' || selectedMode === 'PvP' || selectedMode === 'Survival' || selectedMode === 'Marathon') && (
          <div className="w-full md:flex-1 space-y-1">
            <div className="flex justify-between items-center text-xs font-mono px-1">
              <span className="text-slate-400 flex items-center gap-1">
                <Timer className="w-3.5 h-3.5 text-cyan-400" /> SYSTEM HEARTBEAT
              </span>
              <span className={`font-extrabold ${timeLeft <= 3 ? 'text-rose-500 animate-ping' : 'text-cyan-400'}`}>
                {timeLeft} seconds remaining
              </span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full border border-slate-850 p-0.5 overflow-hidden">
              <motion.div 
                className={`h-full rounded-full ${
                  timeLeft <= 3 ? 'bg-gradient-to-r from-rose-600 to-red-500 animate-pulse' : 
                  timeLeft <= 5 ? 'bg-gradient-to-r from-orange-500 to-yellow-500' : 
                  'bg-gradient-to-r from-cyan-400 to-teal-400'
                }`}
                initial={{ width: '100%' }}
                animate={{ width: `${(timeLeft / maxTime) * 100}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
              />
            </div>
          </div>
        )}

        {/* PvP split screen status panel */}
        {selectedMode === 'PvP' && pvpOpponent && (
          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center gap-3 w-full md:w-auto shrink-0 font-mono text-xs">
            <div className="text-2xl">{pvpOpponent.avatar}</div>
            <div className="text-left min-w-[120px]">
              <div className="font-extrabold text-slate-300 truncate">{pvpOpponent.name}</div>
              <div className="flex justify-between text-[10px] mt-0.5">
                <span className="text-purple-400">Streak: {pvpOpponent.streak}</span>
                <span className={pvpOpponent.isAlive ? "text-emerald-400" : "text-rose-500 font-bold"}>
                  {pvpOpponent.isAlive ? "● ACTIVE" : "● FAILED"}
                </span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MAIN QUESTION INTERACTIVE CARD */}
      {questionLoading ? (
        <div className="glass-panel rounded-3xl border border-slate-800 p-12 text-center flex flex-col items-center justify-center gap-4 min-h-[300px]">
          <RefreshCw className="w-12 h-12 text-cyan-400 animate-spin" />
          <p className="text-slate-300 font-mono text-sm tracking-widest animate-pulse">
            RECONSTRUCTION OF NEXT PROBLEM ... PLEASE FOCUS ...
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeQuestion ? (
            <motion.div
              key={activeQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="space-y-6"
            >
              
              {/* Question Info labels */}
              <div className="flex justify-between items-center px-1">
                <span className="bg-slate-900 text-cyan-400 border border-cyan-400/20 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest font-mono">
                  {activeQuestion.subject} — {activeQuestion.topic}
                </span>
                
                <span className="bg-slate-900 text-slate-300 border border-slate-800 rounded-full px-4 py-1 text-xs font-bold font-mono uppercase">
                  Difficulty: <span className={
                    difficultyLabel === 'BCS Elite' ? 'text-amber-400 font-extrabold animate-pulse' :
                    difficultyLabel === 'Expert' ? 'text-rose-400 font-bold' :
                    difficultyLabel === 'Standard' ? 'text-cyan-400' :
                    difficultyLabel === 'Moderate' ? 'text-yellow-400' : 'text-emerald-400'
                  }>{difficultyLabel}</span>
                </span>
              </div>

              {/* Brain Strain High Alert Banner */}
              {activeQuestion.difficulty === 'Hard' && (
                <div className="bg-rose-950/40 border border-rose-500/20 shadow-lg p-3 rounded-xl text-xs flex items-center gap-2.5 animate-pulse font-mono text-rose-300">
                  <Flame className="w-4.5 h-4.5 text-rose-500 fill-rose-500 shrink-0" />
                  <div>
                    <span className="font-extrabold uppercase text-rose-400">🔥 Brain Strain Tension Gauge:</span> Tricky distractors, multi-step analytical reasoning are enabled! Solve this fast!
                  </div>
                </div>
              )}

              {/* Question card core */}
              <div className="glass-panel border-2 border-slate-800/80 p-6 md:p-8 rounded-3xl relative overflow-hidden bg-gradient-to-b from-slate-900/90 to-slate-950/90 shadow-2xl">
                <div className="absolute top-0 left-0 w-16 h-16 bg-cyan-400/5 rounded-br-3xl pointer-events-none" />
                
                {/* Dynamic prompt badge or combat note */}
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                    Problem identification: {activeQuestion.id}
                  </span>
                  <span className="text-[10px] bg-red-950/30 text-rose-400 border border-rose-950 px-2 py-0.5 rounded font-mono uppercase font-black">
                    STRICT OFF-LIMITS REVIEW
                  </span>
                </div>

                {/* Question Text */}
                <h3 className="text-xl md:text-2xl font-semibold leading-relaxed text-slate-100 mb-8 whitespace-pre-wrap">
                  {activeQuestion.questionText}
                </h3>

                {/* Options select grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="mcq_options_container">
                  {activeQuestion.options.map((opt, oIdx) => {
                    // Determine visual styling based on user interaction & truth states
                    const isSelected = selectedOption === oIdx;
                    const isCorrectAnswer = activeQuestion.correctAnswerIndex === oIdx;
                    const showSuccessColor = answerRevealed && isCorrectAnswer;
                    const showFailureColor = answerRevealed && isSelected && !isCorrectAnswer;

                    return (
                      <button
                        key={oIdx}
                        id={`btn_option_${oIdx}`}
                        disabled={answerRevealed}
                        onClick={() => onOptionClick(oIdx)}
                        className={`p-4 rounded-2xl border text-left font-medium transition-all duration-200 text-sm md:text-base cursor-pointer flex justify-between items-center ${
                          showSuccessColor 
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-lg shadow-emerald-900/10' 
                            : showFailureColor 
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold shadow-lg shadow-rose-900/10 animate-shake' 
                            : isSelected 
                            ? 'bg-cyan-500/10 border-cyan-500 text-cyan-200' 
                            : 'bg-slate-950/80 border-slate-800 text-slate-350 hover:bg-slate-900 hover:border-slate-700'
                        }`}
                      >
                        <span className="tracking-wide leading-relaxed">{opt}</span>
                        
                        {/* Checked elements visual representations */}
                        {answerRevealed && isCorrectAnswer && (
                          <span className="bg-emerald-500 text-slate-950 text-xs font-black px-2 py-1 rounded-md shrink-0 ml-2">CORRECT</span>
                        )}
                        {answerRevealed && isSelected && !isCorrectAnswer && (
                          <span className="bg-rose-500 text-slate-950 text-xs font-black px-2 py-1 rounded-md shrink-0 ml-2">WRONG</span>
                        )}
                      </button>
                    );
                  })}
                </div>

              </div>

              {/* Instant Correct/Incorrect overlay alert box */}
              {answerRevealed && (
                <div className={`p-4 rounded-2xl border text-center font-mono text-sm uppercase tracking-wider animate-bounce ${
                  selectedOption === activeQuestion.correctAnswerIndex 
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' 
                    : 'bg-rose-950/20 border-rose-500/30 text-rose-400'
                }`}>
                  {selectedOption === activeQuestion.correctAnswerIndex 
                    ? "✓ CORRECT ANSWER! SPEEDING UP MULTIPLIER ..." 
                    : "✕ WRONG! DEFENSIVE FOCUS COMPROMISED. DECREASED TO ZERO ..."}
                </div>
              )}

            </motion.div>
          ) : (
            <motion.div
              key="no-question"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-slate-400 py-12"
            >
              Questions finished or list is empty. Reach back out to configurator options.
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ESCAPE MECHANISM CONTROL */}
      <div className="flex justify-end">
        <button 
          id="btn_abandon_game"
          onClick={onExitToDashboard}
          className="text-xs text-rose-400/70 hover:text-rose-400 font-mono transition border border-rose-500/20 rounded-lg px-4 py-2 hover:bg-rose-500/5 cursor-pointer"
        >
          [ ABANDON EXAM RUN ]
        </button>
      </div>

    </div>
  );
}
