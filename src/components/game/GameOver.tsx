import React, { useState } from 'react';
import { 
  RefreshCw, 
  Sparkles, 
  Award, 
  BookOpen, 
  Compass
} from 'lucide-react';
import { motion } from 'motion/react';
import { useGameStore } from '../../state/gameStore.js';
import { AnimatedCounter } from '../ui/AnimatedCounter.js';
import { AnalyticsEngine } from '../../engine/analyticsEngine.js';
import { InteractiveTrendsChart } from '../ui/InteractiveTrendsChart.js';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';

interface GameOverPageProps {
  aiLoading: boolean;
  aiReport: any;
  fetchAiAnalysis: () => Promise<void>;
  rawSessionHistory: any[];
  attemptedSessionQuestions: any[];
  onRetryGame: () => void;
  onExitToDashboard: () => void;
}

export default function GameOverPage({
  aiLoading,
  aiReport,
  fetchAiAnalysis,
  rawSessionHistory,
  attemptedSessionQuestions,
  onRetryGame,
  onExitToDashboard
}: GameOverPageProps) {
  const {
    targetChallengeEnabled,
    sessionCorrectCount,
    sessionWrongCount,
    totalQuestionLimit,
    targetPassingScore,
    stats,
    theme
  } = useGameStore();

  const [expandedQuestionIdx, setExpandedQuestionIdx] = useState<number | null>(null);
  const [chartTab, setChartTab] = useState<'subject' | 'errorType' | 'trends'>('subject');

  // Accuracy helper
  const getAccuracy = () => {
    if (stats.totalAnswered === 0) return 0;
    return Math.round((stats.correctCount / stats.totalAnswered) * 100);
  };

  // Convert raw records into aggregated Recharts structure
  const prepareChartData = (history: any[]) => {
    const last10 = history.slice(-10);
    return last10.map((run, idx) => {
      const dataPoint: any = {
        label: `M${idx + 1}`,
        'Concept Gap': 0,
        'Time Lag Panic': 0,
        'Careless Slip': 0,
        'Distractor Trap': 0,
      };
      
      // Seed subjects
      dataPoint.Bangla = 0;
      dataPoint.English = 0;
      dataPoint.Mathematics = 0;
      dataPoint.ICT = 0;
      dataPoint['Bangladesh Affairs'] = 0;
      dataPoint['International Affairs'] = 0;
      dataPoint['General Science'] = 0;
      dataPoint['Mental Ability'] = 0;

      run.errors.forEach((err: any) => {
        // Stack by subject
        if (err.subject in dataPoint) {
          dataPoint[err.subject] += 1;
        }
        
        // Stack by error type
        let normalized = 'Concept Gap';
        const t = err.errorType.toLowerCase();
        if (t.includes('time') || t.includes('lag') || t.includes('speed') || t.includes('pressure') || t.includes('pacing') || t.includes('panic')) {
          normalized = 'Time Lag Panic';
        } else if (t.includes('careless') || t.includes('slip') || t.includes('impulse')) {
          normalized = 'Careless Slip';
        } else if (t.includes('distractor') || t.includes('trap') || t.includes('option') || t.includes('confused') || t.includes('tricky')) {
          normalized = 'Distractor Trap';
        }
        dataPoint[normalized] += 1;
      });

      return dataPoint;
    });
  };

  // Historical drill summary
  const last10Runs = rawSessionHistory.slice(-10);
  const subjectErrCounts: Record<string, number> = {};
  const errorTypeCounts: Record<string, number> = {};

  last10Runs.forEach(run => {
    run.errors.forEach((err: any) => {
      subjectErrCounts[err.subject] = (subjectErrCounts[err.subject] || 0) + 1;
      
      let normalized = 'Concept Gap';
      const t = err.errorType.toLowerCase();
      if (t.includes('time') || t.includes('lag') || t.includes('speed') || t.includes('pressure') || t.includes('pacing') || t.includes('panic')) {
        normalized = 'Time Lag Panic';
      } else if (t.includes('careless') || t.includes('slip') || t.includes('impulse')) {
        normalized = 'Careless Slip';
      } else if (t.includes('distractor') || t.includes('trap') || t.includes('option') || t.includes('confused') || t.includes('tricky')) {
        normalized = 'Distractor Trap';
      }
      errorTypeCounts[normalized] = (errorTypeCounts[normalized] || 0) + 1;
    });
  });

  let worstSubject = 'None';
  let maxSubErrs = 0;
  Object.entries(subjectErrCounts).forEach(([sub, count]) => {
    if (count > maxSubErrs) {
      maxSubErrs = count;
      worstSubject = sub;
    }
  });

  let worstErrType = 'None';
  let maxTypeErrs = 0;
  Object.entries(errorTypeCounts).forEach(([t, count]) => {
    if (count > maxTypeErrs) {
      maxTypeErrs = count;
      worstErrType = t;
    }
  });

  const totalErrorsRecorded = last10Runs.reduce((sum, run) => sum + run.errors.length, 0);

  return (
    <div id="gameover-page" className="space-y-6 max-w-4xl mx-auto w-full animate-fade-in">
      
      {/* STYLISH GLOWING HEADER */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-950/30 border border-rose-500/20 rounded-full text-rose-500 font-mono text-xs font-bold tracking-widest uppercase">
          ⚠️ SURVIVAL TERM TERMINATED
        </div>
        <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
          GAME OVER
        </h2>
        <p className="text-slate-400 max-w-lg mx-auto text-sm leading-relaxed">
          You clicked a wrong option or ran out of vital response seconds. In BCS Cadet or Bank tests, simple slip-ups seal your outcome immediately.
        </p>
      </div>

      {/* TARGET SCORE CHALLENGE RESULT BANNER */}
      {targetChallengeEnabled && (() => {
        const finalScore = sessionCorrectCount * 1.0 - sessionWrongCount * 0.5;
        const hasPassed = finalScore >= targetPassingScore;
        
        return (
          <div className={`p-6 rounded-3xl border-2 text-center space-y-4 relative overflow-hidden shadow-xl ${
            hasPassed
              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-350 shadow-emerald-950/10'
              : 'bg-rose-950/20 border-rose-500/40 text-rose-350 shadow-rose-950/10'
          }`}>
            <div className="absolute top-0 left-0 w-24 h-24 bg-white/2 rounded-full blur-xl pointer-events-none" />
            
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono tracking-widest uppercase bg-black/40 border ${
              hasPassed ? 'text-emerald-400 border-emerald-500/30' : 'text-rose-400 border-rose-500/30'
            }`}>
              🎯 TARGET CHALLENGE RESULT
            </div>

            <h3 className={`text-2xl md:text-3xl font-black tracking-tight ${hasPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
              {hasPassed 
                ? "🎉 CONGRATULATIONS! INGRESS REQUIREMENT CLEARED!" 
                : "💔 ENGINE FAULT: MISSION TERMINATED EARLY!"}
            </h3>

            <p className="text-sm text-slate-350 max-w-2xl mx-auto leading-relaxed">
              {hasPassed
                ? `Your final BCS marks stood at positive +${finalScore.toFixed(1)} marks, successfully clearing the set requirement of ${targetPassingScore.toFixed(1)} marks within the designated ${totalQuestionLimit} questions limit!`
                : `You did not satisfy the target parameters. The current marks of ${finalScore.toFixed(1)} marks dropped below feasible threshold, making it impossible to satisfy the required passing score of ${targetPassingScore.toFixed(1)} marks.`}
            </p>

            <div className="flex flex-wrap justify-center items-center gap-4 pt-2 font-mono text-xs">
              <div className="bg-slate-900/60 px-4 py-2.5 rounded-xl border border-slate-850/80 min-w-[140px]">
                <span className="text-slate-500 block text-[9px] uppercase tracking-wider">TOTAL ATTEMPTED</span>
                <span className="text-slate-200 font-extrabold text-sm">{sessionCorrectCount + sessionWrongCount} / {totalQuestionLimit} Qs</span>
              </div>

              <div className="bg-slate-900/60 px-4 py-2.5 rounded-xl border border-slate-850/80 min-w-[140px]">
                <span className="text-slate-500 block text-[9px] uppercase tracking-wider">CALCULATED SCORE</span>
                <span className={`font-black text-sm ${hasPassed ? 'text-emerald-400' : 'text-rose-400'}`}>{finalScore >= 0 ? `+${finalScore.toFixed(1)}` : `${finalScore.toFixed(1)}`} Marks</span>
              </div>

              <div className="bg-slate-900/60 px-4 py-2.5 rounded-xl border border-slate-850/80 min-w-[140px]">
                <span className="text-slate-500 block text-[9px] uppercase tracking-wider">TARGET REQUIRED</span>
                <span className="text-amber-400 font-extrabold text-sm">{targetPassingScore.toFixed(1)} Marks</span>
              </div>

              <div className="bg-slate-900/60 px-4 py-2.5 rounded-xl border border-slate-850/80 min-w-[140px]">
                <span className="text-slate-500 block text-[9px] uppercase tracking-wider">ACCURACY ACCUMULATED</span>
                <span className="text-cyan-400 font-extrabold text-sm">
                  {sessionCorrectCount + sessionWrongCount > 0 
                    ? `${Math.round((sessionCorrectCount / (sessionCorrectCount + sessionWrongCount)) * 100)}%` 
                    : '0%'}
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* KEY SCORE & TIMING STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Aspirant Score', val: stats.totalScore, color: 'text-cyan-400', sub: 'pts accumulated', animate: true },
          { label: 'Longest Streak', val: stats.maxStreak, color: 'text-amber-400', sub: 'combo high-run' },
          { label: 'Accuracy Rate', val: `${getAccuracy()}%`, color: 'text-rose-500', sub: 'correct response ratio' },
          { label: 'Total Answered', val: stats.totalAnswered, color: 'text-indigo-400', sub: 'tasks attempted', animate: true }
        ].map((card, i) => (
          <div key={i} className="glass-panel rounded-2xl p-5 border border-slate-800 text-center space-y-1">
            <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">{card.label}</span>
            <div className={`text-3xl font-black font-mono ${card.color}`}>
              {card.animate ? (
                <AnimatedCounter value={Number(card.val) || 0} />
              ) : (
                card.val
              )}
            </div>
            <span className="text-[9px] text-slate-500 font-mono block leading-none">{card.sub}</span>
          </div>
        ))}
      </div>

      {/* DEEP GEMINI AI DIAGNOSIS PANE */}
      <div className="glass-panel rounded-2xl p-6 border border-yellow-500/20 relative overflow-hidden bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-400/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1 bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-yellow-300 animate-pulse" /> Gemini AI Engine
            </div>
            <h3 className="font-extrabold text-base text-white">
              Post-Exam Weakness Diagnostics & ROI Mastery Strategy
            </h3>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Evaluates your cognitive answers, maps subject telemetry to find your weakest skill node nodes, classifies your errors, and defines high-stakes Civil Service game plans!
            </p>
          </div>

          <button
            id="btn_request_analysis"
            disabled={aiLoading}
            onClick={fetchAiAnalysis}
            className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black px-5 py-3 rounded-xl text-xs font-mono flex items-center gap-2 tracking-wider uppercase shrink-0 hover:scale-102 transition cursor-pointer disabled:opacity-50"
          >
            {aiLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> RUNNING CLOUD AUDIT ...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 fill-black" /> Run Gemini Diagnostic
              </>
            )}
          </button>
        </div>

        {/* RENDER THE DETECTED DIAGNOSIS */}
        {aiReport ? (() => {
          const readiness = AnalyticsEngine.calculateExamReadiness(stats, rawSessionHistory);
          const rank = AnalyticsEngine.predictRank(stats, rawSessionHistory);
          const subjectSummary = AnalyticsEngine.getSubjectAccuracy(stats);
          const wrongTraceLogs = attemptedSessionQuestions.filter(aq => !aq.isCorrect);

          return (
            <div className="space-y-6 font-mono text-xs">
              
              {/* EXAM READINESS ENGINE PROFILE */}
              <div className="bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div>
                    <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-widest block mb-0.5">🎓 EXAM READINESS INDEX (ERI)</span>
                    <h4 className="text-sm font-bold text-white font-sans leading-none">Competitive Survival Readiness Calibrator</h4>
                  </div>
                  <div className="text-right">
                    <span className="bg-cyan-500 text-slate-950 font-black text-xs px-3 py-1 rounded font-mono uppercase">
                      ERI: {readiness.readinessScore}%
                    </span>
                  </div>
                </div>

                {/* PROGRESS GAUGE */}
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full" 
                    initial={{ width: 0 }}
                    animate={{ width: `${readiness.readinessScore}%` }}
                    transition={{ type: "spring", stiffness: 80, damping: 15 }}
                  />
                </div>

                {/* READINESS COMPONENT MATRIX */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                  
                  {/* ACCURACY 40% */}
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-900 space-y-1.5">
                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-extrabold">
                      <span>ACCURACY (40%)</span>
                      <span className="text-cyan-400">{readiness.accuracyRaw}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${readiness.accuracyRaw}%` }} />
                    </div>
                    <span className="text-[8px] text-slate-500 block leading-none">Contributes {readiness.accuracyComponent} pts</span>
                  </div>

                  {/* CONSISTENCY 25% */}
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-900 space-y-1.5">
                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-extrabold">
                      <span>CONSISTENCY (25%)</span>
                      <span className="text-emerald-400">{readiness.consistencyRaw}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${readiness.consistencyRaw}%` }} />
                    </div>
                    <span className="text-[8px] text-slate-500 block leading-none">Contributes {readiness.consistencyComponent} pts</span>
                  </div>

                  {/* SPEED 20% */}
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-900 space-y-1.5">
                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-extrabold">
                      <span>SPEED (20%)</span>
                      <span className="text-amber-400">{readiness.speedRaw}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${readiness.speedRaw}%` }} />
                    </div>
                    <span className="text-[8px] text-slate-500 block leading-none">Contributes {readiness.speedComponent} pts</span>
                  </div>

                  {/* DIFFICULTY 15% */}
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-900 space-y-1.5">
                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-extrabold">
                      <span>DIFFICULTY (15%)</span>
                      <span className="text-rose-400">{readiness.difficultyRaw}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-400 rounded-full" style={{ width: `${readiness.difficultyRaw}%` }} />
                    </div>
                    <span className="text-[8px] text-slate-500 block leading-none">Contributes {readiness.difficultyComponent} pts</span>
                  </div>

                </div>

                <p className="text-[11px] text-slate-300 font-sans leading-normal italic pl-1 border-l-2 border-cyan-500/50">
                  {readiness.analyticalFeedback}
                </p>
              </div>

              {/* TOP ROW: COMPETITIVE RANK PREDICTOR */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* RANK ESTIMATION CARD */}
                <div className="bg-slate-950/80 border border-slate-900 p-4 rounded-xl space-y-3">
                  <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-widest block">🔱 COMPETITIVE COHORT RANK PREDICTOR</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-400">Predicted Percentile:</span>
                    <span className="text-lg font-black text-white">{rank.percentile}%</span>
                  </div>
                  <div className="flex items-baseline justify-between border-t border-slate-900 pt-2">
                    <span className="text-xs text-slate-400">Simulated National Merit Rank:</span>
                    <span className="text-base font-bold text-amber-400">#{rank.estimatedNationalRank.toLocaleString()}</span>
                  </div>
                  <span className="text-[8px] text-slate-500 block leading-tight">
                    Projected position among ~350,000 preliminary competitors. Classification: <span className="text-slate-300 font-bold">{rank.cadreSuitabilityStatus}</span>
                  </span>
                </div>

                {/* PACING & ERROR FATIGUE */}
                <div className="bg-slate-950/80 border border-slate-900 p-4 rounded-xl space-y-3 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-rose-400 font-extrabold uppercase tracking-widest block mb-1">🚨 COGNITIVE ANXIETY & ERROR MODE</span>
                    <div className="text-sm font-black text-slate-100 uppercase tracking-tight">
                      {aiReport.errorPatternType === 'speed' ? '⚡ Relentless Speed Rush Fatigue' :
                       aiReport.errorPatternType === 'concept' ? '📚 Fundamental Concept Gap' :
                       aiReport.errorPatternType === 'carelessness' ? '⚠️ Carelessness & Speed Slip' :
                       '🧠 Stress Cognitive Exhaustion'}
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-550 leading-tight block">
                    Primary psychological pattern detected during the game. Your speed response is suitability matched for: <span className="text-slate-300 font-bold">{aiReport.reactionTimeSuitability || 'Steady Thinker'}</span>
                  </span>
                </div>

              </div>

              {/* CENTRAL COLUMN: SUBJECT ACCURACY BREAKDOWN */}
              <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3">
                <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-widest block">📊 SUBJECT PERFORMANCE & SYLLABUS DIRECTORY</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                  {subjectSummary.breakdown.length > 0 ? (
                    subjectSummary.breakdown.map((item: any, i: number) => (
                      <div key={i} className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-300 font-sans">{item.subject}</span>
                          <span className={`font-mono font-bold ${
                            item.percentage >= 75 ? 'text-emerald-400' :
                            item.percentage >= 50 ? 'text-amber-400' : 'text-rose-400'
                          }`}>
                            {item.correct}/{item.total} ({item.percentage}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${
                            item.percentage >= 75 ? 'bg-emerald-400' :
                            item.percentage >= 50 ? 'bg-amber-400 animate-pulse' : 'bg-rose-400'
                          }`} style={{ width: `${item.percentage}%` }} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 italic col-span-2 py-2">
                      No subject competency data has been registered in the current active quorums yet.
                    </div>
                  )}
                </div>
              </div>

              {/* WRONG ANSWER TRACKER CHECKLIST */}
              <div className="bg-slate-900/40 border border-slate-900 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-rose-400 font-extrabold uppercase tracking-widest block">⚠️ WRONG ANSWER COGNITIVE TRACKER ({wrongTraceLogs.length})</span>
                  <span className="text-[9px] text-slate-500 font-mono">SESSION SLIPS</span>
                </div>
                
                {wrongTraceLogs.length > 0 ? (
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {wrongTraceLogs.map((log, idx) => (
                      <div key={idx} className="bg-slate-950/80 p-2.5 rounded border border-slate-900 space-y-1 text-[11px] font-sans">
                        <div className="flex justify-between items-start gap-2">
                          <span className="bg-rose-500/10 text-rose-400 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono shrink-0 mt-0.5">
                            {log.question.subject}
                          </span>
                          <p className="text-xs text-slate-200 font-medium leading-normal flex-grow">
                            {log.question.questionText}
                          </p>
                        </div>
                        <div className="text-[10px] text-emerald-400 font-mono pt-1">
                          ✓ Correct Option: <span className="font-extrabold">{log.question.options[log.question.correctAnswerIndex]}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 italic">
                          Advice: {log.question.explanation}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-400 italic text-[11px] font-sans">
                    🎉 Flawless Run! No errors logged in the WRONG ANSWER TRACKER database. Keep up your focus!
                  </div>
                )}
              </div>

              {/* ACTION PLAN RULES */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-3">
                <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-widest block">📋 HIGH-STAKES SCORE IMPROVEMENT ACTION DRILL</span>
                <div className="space-y-1.5 font-sans text-xs">
                  {aiReport.improvementRecommendations ? aiReport.improvementRecommendations.map((step: string, idx: number) => (
                    <div key={idx} className="bg-slate-900/60 p-2 rounded-lg border border-slate-950 flex items-start gap-2.5">
                      <span className="bg-cyan-500/10 text-cyan-400 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded mt-0.5 shrink-0">
                        STEP {idx + 1}
                      </span>
                      <p className="text-xs text-slate-300 leading-normal">{step}</p>
                    </div>
                  )) : (aiReport.personalizedTips || []).map((step: string, idx: number) => (
                    <div key={idx} className="bg-slate-900/60 p-2 rounded-lg border border-slate-950 flex items-start gap-2.5">
                      <span className="bg-cyan-500/10 text-cyan-400 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded mt-0.5 shrink-0">
                        TIP {idx + 1}
                      </span>
                      <p className="text-xs text-slate-300 leading-normal">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* MENTOR REINFORCEMENT FOOTER */}
              <div className="border-t border-slate-900 pt-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 bg-slate-950/20 p-2 rounded-lg">
                <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">🔥 BPSC Chairman Cadre Slogan</span>
                <p className="text-[11px] text-amber-300 italic font-medium leading-relaxed font-sans">
                  "{aiReport.motivationQuote}"
                </p>
              </div>

            </div>
          );
        })() : (
          <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center text-xs text-slate-500 font-mono">
            [ System diagnostic passive. Press "Run Gemini Diagnostic" above to audit candidate statistics and map performance ]
          </div>
        )}
      </div>

      {/* HISTORICAL COGNITIVE ERROR TREND ANALYZER */}
      {chartTab !== 'trends' ? (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6 bg-gradient-to-tr from-slate-950 via-slate-900 to-cyan-950/10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-850 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-cyan-950/50 border border-cyan-500/30 rounded-full text-cyan-400 font-mono text-[10px] font-bold tracking-widest uppercase">
                📊 Performance & Error Analytics
              </div>
              <h3 className="font-extrabold text-lg text-white">
                Historical Error Drill Analyzer (Last 10 Runs)
              </h3>
              <p className="text-xs text-slate-400 max-w-xl leading-normal">
                Tracks error distributions across subjects and failure modes over past attempts. Visualizes cognitive blindspots to optimize your BPSC and bank preparation.
              </p>
            </div>

            {/* TABS SELECTOR */}
            <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-850 self-stretch md:self-auto justify-between font-mono text-[10px] font-bold">
              {[
                { id: 'subject', label: 'Domain Topics' },
                { id: 'errorType', label: 'Failure Modes' },
                { id: 'trends', label: 'Growth Curves' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setChartTab(tab.id as any)}
                  className={`px-3 py-2 rounded-lg transition cursor-pointer shrink-0 uppercase tracking-wider ${
                    chartTab === tab.id
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in animate-duration-300">
            
            {/* METRICS SIDE COLUMN */}
            <div className="lg:col-span-1 space-y-4 font-mono text-xs">
              
              <div className="bg-slate-950/80 border border-slate-900 p-4 rounded-xl space-y-1">
                <span className="text-[10px] text-cyan-400 uppercase tracking-wider block font-bold">⚠️ Primary Fatal Area</span>
                <div className="text-cyan-400 font-extrabold text-[13px] leading-tight flex items-center gap-1.5 pt-0.5">
                  {worstSubject === 'None' ? 'N/A' : worstSubject}
                </div>
                <span className="text-[9px] text-slate-500 block leading-tight">
                  Subject containing the maximum errors in past 10 sessions. ({maxSubErrs} errors)
                </span>
              </div>

              <div className="bg-slate-950/80 border border-slate-900 p-4 rounded-xl space-y-1">
                <span className="text-[10px] text-rose-400 uppercase tracking-wider block font-bold">🧠 Dominant Failure Mode</span>
                <div className="text-rose-400 font-extrabold text-[13px] leading-tight flex items-center gap-1.5 pt-0.5">
                  {worstErrType === 'None' ? 'N/A' : (
                    worstErrType === 'Time Lag Panic' ? '⚡ Time Lag Panic' :
                    worstErrType === 'Careless Slip' ? '⚠️ Careless Slip' :
                    worstErrType === 'Distractor Trap' ? '🪤 Distractor Trap' : '📚 Concept Gap'
                  )}
                </div>
                <span className="text-[9px] text-slate-500 block leading-tight">
                  Most frequent failure trigger. Keep focused here during active runs! ({maxTypeErrs} errors)
                </span>
              </div>

              <div className="bg-slate-950/80 border border-slate-900 p-4 rounded-xl space-y-1">
                <span className="text-[10px] text-amber-400 uppercase tracking-wider block font-bold">📉 Aggregate Errors Registered</span>
                <div className="text-amber-400 font-black text-sm pt-0.5">
                  {totalErrorsRecorded} total / 10 runs
                </div>
                <span className="text-[9px] text-slate-500 block leading-tight">
                  Average of <span className="text-slate-300">{(totalErrorsRecorded / 10).toFixed(1)}</span> errors per survival test.
                </span>
              </div>

            </div>

            {/* MAIN CHART SCREEN */}
            <div className="lg:col-span-3 bg-slate-950/60 border border-slate-900 p-4 rounded-2xl relative min-h-[340px] flex flex-col justify-between">
              <div className="w-full h-[290px]">
                <ResponsiveContainer width="100%" height="100%">
                  {chartTab === 'subject' ? (
                    <BarChart
                      data={prepareChartData(rawSessionHistory)}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="label" stroke="#475569" style={{ fontSize: 9, fontFamily: 'monospace' }} />
                      <YAxis stroke="#475569" style={{ fontSize: 9, fontFamily: 'monospace' }} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-2xl text-xs font-mono">
                                <p className="font-extrabold text-cyan-400 border-b border-slate-800 pb-1 mb-1.5">{label}</p>
                                <div className="space-y-1">
                                  {payload.map((entry: any, i: number) => {
                                    if (entry.value === 0) return null;
                                    return (
                                      <div key={i} className="flex items-center justify-between gap-6" style={{ color: entry.color }}>
                                        <span>{entry.name}:</span>
                                        <span className="font-extrabold">{entry.value}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'monospace', paddingTop: 10 }} />
                      <Bar dataKey="Bangla" stackId="subject" fill="#ec4899" name="Bangla" />
                      <Bar dataKey="English" stackId="subject" fill="#3b82f6" name="English" />
                      <Bar dataKey="Mathematics" stackId="subject" fill="#10b981" name="Mathematics" />
                      <Bar dataKey="ICT" stackId="subject" fill="#a855f7" name="ICT" />
                      <Bar dataKey="Bangladesh Affairs" stackId="subject" fill="#f59e0b" name="Bangladesh Aff." />
                      <Bar dataKey="International Affairs" stackId="subject" fill="#06b6d4" name="International Aff." />
                      <Bar dataKey="General Science" stackId="subject" fill="#84cc16" name="Gen. Science" />
                      <Bar dataKey="Mental Ability" stackId="subject" fill="#ef4444" name="Mental Ability" />
                    </BarChart>
                  ) : (
                    <BarChart
                      data={prepareChartData(rawSessionHistory)}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="label" stroke="#475569" style={{ fontSize: 9, fontFamily: 'monospace' }} />
                      <YAxis stroke="#475569" style={{ fontSize: 9, fontFamily: 'monospace' }} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-2xl text-xs font-mono">
                                <p className="font-extrabold text-cyan-400 border-b border-slate-800 pb-1 mb-1.5">{label}</p>
                                <div className="space-y-1">
                                  {payload.map((entry: any, i: number) => {
                                    if (entry.value === 0) return null;
                                    return (
                                      <div key={i} className="flex items-center justify-between gap-6" style={{ color: entry.color }}>
                                        <span>{entry.name}:</span>
                                        <span className="font-extrabold">{entry.value}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'monospace', paddingTop: 10 }} />
                      <Bar dataKey="Concept Gap" stackId="errType" fill="#3b82f6" name="Concept Gap" />
                      <Bar dataKey="Time Lag Panic" stackId="errType" fill="#f59e0b" name="Time Lag Panic" />
                      <Bar dataKey="Careless Slip" stackId="errType" fill="#ef4444" name="Careless Slip" />
                      <Bar dataKey="Distractor Trap" stackId="errType" fill="#8b5cf6" name="Distractor Trap" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
              
              <div className="text-center text-[9px] font-mono text-slate-500 uppercase pt-2">
                📊 [ Live historical progression sourced from player browser cache ]
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6 bg-gradient-to-tr from-slate-950 via-slate-900 to-cyan-950/10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-850 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-cyan-950/50 border border-cyan-500/30 rounded-full text-cyan-400 font-mono text-[10px] font-bold tracking-widest uppercase">
                📊 Performance & Error Analytics
              </div>
              <h3 className="font-extrabold text-lg text-white">
                Historical Error Drill Analyzer (Last 10 Runs)
              </h3>
              <p className="text-xs text-slate-400 max-w-xl leading-normal">
                Tracks error distributions across subjects and failure modes over past attempts. Visualizes cognitive blindspots to optimize your BPSC and bank preparation.
              </p>
            </div>

            {/* TABS SELECTOR */}
            <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-850 self-stretch md:self-auto justify-between font-mono text-[10px] font-bold">
              {[
                { id: 'subject', label: 'Domain Topics' },
                { id: 'errorType', label: 'Failure Modes' },
                { id: 'trends', label: 'Growth Curves' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setChartTab(tab.id as any)}
                  className={`px-3 py-2 rounded-lg transition cursor-pointer shrink-0 uppercase tracking-wider ${
                    chartTab === tab.id
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full">
            <InteractiveTrendsChart 
              sessions={rawSessionHistory} 
              theme={theme}
            />
          </div>
        </div>
      )}

      {/* MASTER SYSTEM EXAM REVIEW LEDGER */}
      {attemptedSessionQuestions.length > 0 && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-850 pb-3">
            <h3 className="font-extrabold text-sm font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-2">
              <BookOpen className="w-4.5 h-4.5 text-cyan-400" /> Complete Candidate Exam Review Ledger
            </h3>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-900">
              {attemptedSessionQuestions.length} Questions Attempted in active run
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Click on any question card below to expand the cognitive diagnostic review, detailing precise BPSC skill-node metrics, common expected student failure reasons, conceptual mastery baselines, and quick mnemonic shortcuts under time pressure!
          </p>

          <div className="space-y-3">
            {attemptedSessionQuestions.map((attempt, index) => {
              const qObj = attempt.question;
              const isExpanded = expandedQuestionIdx === index;
              const userIncorrect = !attempt.isCorrect;
              
              return (
                <div 
                  key={index} 
                  onClick={() => setExpandedQuestionIdx(isExpanded ? null : index)}
                  className={`p-4 rounded-xl border text-left transition cursor-pointer flex flex-col gap-3 ${
                    isExpanded 
                      ? 'bg-slate-900/45 border-slate-700/60 bg-slate-900/40 outline-none' 
                      : 'bg-slate-950/60 border-slate-900/80 hover:bg-slate-900/40 hover:border-slate-800'
                  }`}
                >
                  {/* Summary Line */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                        attempt.isCorrect ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {attempt.isCorrect ? '✓' : '✕'}
                      </span>
                      <span className="text-slate-400">Q#{index + 1}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-350 font-bold bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">{qObj.subject}</span>
                      {qObj.topic && (
                        <>
                          <span className="text-slate-500">•</span>
                          <span className="text-cyan-400 truncate max-w-[200px]">{qObj.topic}</span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-slate-500">Duration: {attempt.timeTaken}s</span>
                      {userIncorrect && (
                        <span className="bg-red-950/20 text-rose-400 border border-rose-950 px-2 py-0.5 rounded uppercase text-[9px] font-black">
                          {attempt.errorType || qObj.errorType || 'Concept Gap'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <p className="text-sm font-semibold text-slate-100 leading-relaxed font-sans mt-1">
                    {qObj.questionText}
                  </p>

                  {/* Collapsible Details Panel */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-800 space-y-4 font-sans text-xs text-slate-305 animate-slide-down">
                      
                      {/* Options Selected Vs Correct */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900">
                          <span className="text-slate-505 uppercase block mb-1">CANDIDATE SELECTED SELECTION</span>
                          <span className={attempt.isCorrect ? 'text-emerald-400 font-bold' : (attempt.selectedOption === null ? 'text-rose-400 italic' : 'text-rose-400 font-bold')}>
                            {attempt.selectedOption !== null ? qObj.options[attempt.selectedOption] : 'TIMEOUT (NONE)'}
                          </span>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900">
                          <span className="text-slate-505 uppercase block mb-1">SYSTEM KEY STANDARD (CORRECT)</span>
                          <span className="text-emerald-400 font-black">
                            {qObj.options[qObj.correctAnswerIndex]}
                          </span>
                        </div>
                      </div>

                      {/* Deep Cognitive Substructures */}
                      <div className="space-y-3 bg-slate-950/30 p-3 rounded-lg border border-slate-900/60">
                        
                        {/* Primary Explanation */}
                        <div>
                          <span className="font-mono text-[10px] text-yellow-400/80 font-bold uppercase block mb-1">💡 Solution Key & Explanation</span>
                          <p className="leading-relaxed text-slate-200">{qObj.explanation}</p>
                        </div>

                        {/* Mapped Skill Node & Error Classification */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[11px]">
                          <div>
                            <span className="font-mono text-[9px] text-cyan-400/80 font-bold uppercase block mb-0.5">🎯 Mapped Syllabus Skill Node</span>
                            <p className="font-mono text-slate-300 text-[10px] uppercase font-bold">{qObj.skillNode || 'Conceptual BPSC General Syllabus Topic'}</p>
                          </div>
                          <div>
                            <span className="font-mono text-[9px] text-rose-400/80 font-bold uppercase block mb-0.5">❌ Rookie Distractor Category</span>
                            <p className="font-mono text-slate-300 text-[10px] uppercase font-bold">{attempt.errorType || qObj.errorType || 'Factual recall trap'}</p>
                          </div>
                        </div>

                        {/* Correct Reasoning & Wrong Reasoning */}
                        {(qObj.correctReasoning || qObj.wrongReasoning) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-900/80 text-[11px]">
                            {qObj.correctReasoning && (
                              <div>
                                <span className="font-mono text-[9px] text-emerald-400 font-bold uppercase block mb-0.5">✓ Strict Scored Correctness Justification</span>
                                <p className="text-slate-300 leading-normal">{qObj.correctReasoning}</p>
                              </div>
                            )}
                            {qObj.wrongReasoning && (
                              <div>
                                <span className="font-mono text-[9px] text-rose-400/80 font-bold uppercase block mb-0.5">✗ Strategic Distractor Failure Attribution</span>
                                <p className="text-slate-300 leading-normal">{qObj.wrongReasoning}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Concept Core & Formula Shortcut */}
                        {(qObj.conceptBreakdown || qObj.shortcutMethod) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-900/80 text-[11px]">
                            {qObj.conceptBreakdown && (
                              <div>
                                <span className="font-mono text-[9px] text-indigo-400 font-bold uppercase block mb-0.5">🧠 Conceptual Mastery Baseline</span>
                                <p className="text-slate-300 leading-normal">{qObj.conceptBreakdown}</p>
                              </div>
                            )}
                            {qObj.shortcutMethod && (
                              <div>
                                <span className="font-mono text-[9px] text-amber-400 font-bold uppercase block mb-0.5">⚡ Standard BPSC 10-Second Shortcut / Mnemonic</span>
                                <p className="text-amber-300 font-mono text-[10px] bg-slate-950 p-2 rounded border border-slate-900 mt-1 leading-normal">
                                  {qObj.shortcutMethod}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                      </div>

                      <p className="text-right text-[9px] font-mono text-slate-500 uppercase">
                        [ Click card heading again to collapse view ]
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ACTION FOOTERS */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
        <button
          id="btn_retry_challenge"
          onClick={onRetryGame}
          className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-8 py-4.5 rounded-xl text-sm font-mono tracking-wider uppercase flex items-center justify-center gap-2 hover:scale-102 transition cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> RETRY RUN IMMEDIATELY
        </button>

        <button
          id="btn_back_to_menu"
          onClick={onExitToDashboard}
          className="w-full sm:w-auto bg-slate-900 hover:bg-slate-850 hover:text-white text-slate-400 font-black px-8 py-4.5 rounded-xl text-sm border border-slate-800 font-mono tracking-wider uppercase text-center flex items-center justify-center gap-2 hover:scale-102 transition cursor-pointer"
        >
          <Compass className="w-4 h-4" /> RECONFIGURE SYLLABUS MENU
        </button>
      </div>

    </div>
  );
}
