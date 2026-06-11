import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, 
  Flame, 
  Timer, 
  Zap, 
  Activity, 
  Play, 
  Compass, 
  Clock, 
  User, 
  RefreshCw, 
  AlertTriangle, 
  Sparkles, 
  ChevronRight, 
  BookOpen, 
  Award, 
  ChevronDown, 
  VolumeX, 
  Volume2, 
  Heart,
  Target,
  Sun,
  Moon,
  Search,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LOCAL_QUESTIONS } from './data/questions.js';
import { AnimatedCounter } from './components/AnimatedCounter.js';
import { InteractiveTrendsChart } from './components/InteractiveTrendsChart.js';
import { 
  Question, 
  SubjectType, 
  DifficultyLevel, 
  GameMode, 
  ExamType, 
  PlayerStats, 
  PvPCompetitor, 
  LeaderboardEntry, 
  AIAnalysisResponse 
} from './types.js';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import {
  getSessionHistory,
  addSessionRecord,
  prepareChartData,
  SessionRecord
} from './utils/sessionHistory.js';

// Default mock leaderboard
const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  { name: 'BCS_Cadre_Shagor', score: 1420, streak: 35, mode: 'Survival', date: 'Today' },
  { name: 'BB_AD_Nusrat', score: 1250, streak: 28, mode: 'Speed', date: 'Today' },
  { name: 'Banker_Mashrafe', score: 1180, streak: 26, mode: 'Daily', date: 'Today' },
  { name: 'GovtJobSeeker__99', score: 950, streak: 21, mode: 'Marathon', date: 'Today' },
  { name: 'BPSC_Cracker', score: 870, streak: 19, mode: 'Survival', date: 'Today' }
];

export default function App() {
  // Game Setup States
  const [selectedExamType, setSelectedExamType] = useState<ExamType>('BCS');
  const [selectedSubjects, setSelectedSubjects] = useState<SubjectType[]>([
    'Bangla', 'English', 'Mathematics', 'ICT', 'Bangladesh Affairs', 'International Affairs', 'General Science', 'Mental Ability'
  ]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('Standard');
  const [selectedMode, setSelectedMode] = useState<GameMode>('Survival');
  const [aiDynamicMode, setAiDynamicMode] = useState<boolean>(true);
  const [otherSubjectsLanguage, setOtherSubjectsLanguage] = useState<'Bangla' | 'English'>('Bangla');
  const [theme, setTheme] = useState<'Dark' | 'Light'>('Dark');

  // Stats / Progression
  const [stats, setStats] = useState<PlayerStats>({
    streak: 0,
    maxStreak: 0,
    totalAnswered: 0,
    correctCount: 0,
    totalScore: 0,
    timeSpentSeconds: 0,
    subjectProficiency: {
      'Bangla': { correct: 0, total: 0 },
      'English': { correct: 0, total: 0 },
      'Mathematics': { correct: 0, total: 0 },
      'ICT': { correct: 0, total: 0 },
      'Bangladesh Affairs': { correct: 0, total: 0 },
      'International Affairs': { correct: 0, total: 0 },
      'General Science': { correct: 0, total: 0 },
      'Mental Ability': { correct: 0, total: 0 }
    }
  });

  // Gameplay State Machine
  const [gameState, setGameState] = useState<'DASHBOARD' | 'PLAYING' | 'GAMEOVER'>('DASHBOARD');

  // Targeting & Score Limits Challenge Custom Features
  const [targetChallengeEnabled, setTargetChallengeEnabled] = useState<boolean>(true);
  const [totalQuestionLimit, setTotalQuestionLimit] = useState<number>(10);
  const [targetPassingScore, setTargetPassingScore] = useState<number>(7.0);

  // Real-time answers count for the active played session
  const [sessionCorrectCount, setSessionCorrectCount] = useState<number>(0);
  const [sessionWrongCount, setSessionWrongCount] = useState<number>(0);

  // Real-time target challenge calculations helper
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
  
  // Game Questions and Active indices
  const [currentQuestionList, setCurrentQuestionList] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  
  // Selected Option during Active Question
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerRevealed, setAnswerRevealed] = useState<boolean>(false);
  
  // Timer States for Speed mode
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [maxTime, setMaxTime] = useState<number>(10);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [activeQuestionStartTime, setActiveQuestionStartTime] = useState<number>(0);
  
  // High-Tension Visual Effects
  const [screenEffect, setScreenEffect] = useState<'NONE' | 'CORRECT_FLASH' | 'WRONG_SHAKE' | 'SCREEN_BREAK'>('NONE');
  const [comboAlert, setComboAlert] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // PvP Simulated Competitor State
  const [pvpOpponent, setPvpOpponent] = useState<PvPCompetitor | null>(null);
  const pvpTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Leaderboard data
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(INITIAL_LEADERBOARD);

  // Review & AI Diagnosis States
  const [incorrectList, setIncorrectList] = useState<Question[]>([]);
  const [attemptedSessionQuestions, setAttemptedSessionQuestions] = useState<{
    question: Question;
    selectedOption: number | null;
    isCorrect: boolean;
    timeTaken: number;
    errorType?: string;
  }[]>([]);
  const [expandedQuestionIdx, setExpandedQuestionIdx] = useState<number | null>(null);
  const [aiReport, setAiReport] = useState<AIAnalysisResponse | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Question Loading State
  const [questionLoading, setQuestionLoading] = useState<boolean>(false);

  // AI Dynamic Mode Bulk Question Pre-generation & Background Charging
  const [isBatchGenerating, setIsBatchGenerating] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<number>(0);
  const [batchMessage, setBatchMessage] = useState<string>('');
  const [offlineBackupActive, setOfflineBackupActive] = useState<boolean>(false);
  const [subjectSearchQuery, setSubjectSearchQuery] = useState<string>('');

  const currentQuestionListRef = useRef<Question[]>([]);
  const isPrefetchingRef = useRef<boolean>(false);

  // Sync ref with state to completely immunize gameplay handlers from stale closures
  useEffect(() => {
    currentQuestionListRef.current = currentQuestionList;
  }, [currentQuestionList]);

  // Saved sessions and chart analytics
  const hasSavedSessionRef = useRef(false);
  const [rawSessionHistory, setRawSessionHistory] = useState<SessionRecord[]>([]);
  const [chartTab, setChartTab] = useState<'subject' | 'errorType' | 'trends'>('subject');

  // Load session history on startup
  useEffect(() => {
    setRawSessionHistory(getSessionHistory());
  }, []);

  // Record active run to history upon reaching the GAME OVER screen
  useEffect(() => {
    if (gameState === 'GAMEOVER' && !hasSavedSessionRef.current) {
      hasSavedSessionRef.current = true;
      
      // Collect errors of the current session
      const currentSessionErrors = attemptedSessionQuestions
        .filter(q => !q.isCorrect)
        .map(q => ({
          subject: q.question.subject,
          errorType: q.errorType || q.question.errorType || 'Concept Gap'
        }));
      
      // Fallback in case of React state batching delays or empty run results
      if (currentSessionErrors.length === 0 && activeQuestion) {
        currentSessionErrors.push({
          subject: activeQuestion.subject,
          errorType: activeQuestion.errorType || 'Concept Gap'
        });
      }

      // Append new run to history and write to localStorage
      const updated = addSessionRecord(
        stats.totalScore,
        stats.maxStreak,
        currentSessionErrors
      );
      setRawSessionHistory(updated);
    }
  }, [gameState, attemptedSessionQuestions, activeQuestion, stats.totalScore, stats.maxStreak]);

  // All Subjects available
  const ALL_SUBJECTS: SubjectType[] = [
    'Bangla', 'English', 'Mathematics', 'ICT', 
    'Bangladesh Affairs', 'International Affairs', 'General Science', 'Mental Ability'
  ];

  const filteredSubjects = ALL_SUBJECTS.filter(subj =>
    subj.toLowerCase().includes(subjectSearchQuery.toLowerCase())
  );

  // Map difficulty to time limits
  const DIFFICULTY_TIMERS: Record<DifficultyLevel, number> = {
    'Easy': 15,
    'Moderate': 12,
    'Standard': 10,
    'Hard': 8
  };

  // Sound generator helpers using Web Audio API (soundless option is preserved)
  const playBeep = (freq: number, type: 'sine' | 'square' | 'triangle', duration: number) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = type;
      oscillator.frequency.value = freq;
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn("Audio Context init blocked or unsupported.");
    }
  };

  const playSuccessSound = () => {
    playBeep(440, 'triangle', 0.1);
    setTimeout(() => playBeep(880, 'sine', 0.15), 80);
  };

  const playFailureSound = () => {
    playBeep(220, 'square', 0.35);
  };

  const playTickSound = () => {
    playBeep(600, 'sine', 0.03);
  };

  const playStartSound = () => {
    playBeep(261.63, 'triangle', 0.08); // C4
    setTimeout(() => playBeep(329.63, 'sine', 0.08), 80); // E4
    setTimeout(() => playBeep(392.00, 'sine', 0.08), 160); // G4
    setTimeout(() => playBeep(523.25, 'sine', 0.20), 240); // C5
  };

  const playCountdownSound = () => {
    // Sharp dual-tone ticking and urgent alarm beep
    playBeep(880, 'square', 0.08);
    setTimeout(() => playBeep(1200, 'sine', 0.04), 40);
  };

  const playVictorySound = () => {
    // Triumphant rising fan-fare jingle for high-streak milestones
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        playBeep(freq, idx === 4 ? 'sine' : 'triangle', 0.18);
      }, idx * 100);
    });
  };

  // Toggle subject selection
  const handleSubjectToggle = (sub: SubjectType) => {
    if (selectedSubjects.includes(sub)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== sub));
    } else {
      setSelectedSubjects([...selectedSubjects, sub]);
    }
  };

  const selectAllSubjects = () => {
    if (subjectSearchQuery) {
      const merged = Array.from(new Set([...selectedSubjects, ...filteredSubjects]));
      setSelectedSubjects(merged);
    } else {
      setSelectedSubjects([...ALL_SUBJECTS]);
    }
  };

  const clearAllSubjects = () => {
    if (subjectSearchQuery) {
      setSelectedSubjects(selectedSubjects.filter(s => !filteredSubjects.includes(s)));
    } else {
      setSelectedSubjects([]);
    }
  };

  const prefetchMoreAiQuestions = async () => {
    if (isPrefetchingRef.current) return;
    isPrefetchingRef.current = true;
    console.log("[prefetch] Sparking background pre-charge of AI questions...");
    try {
      const response = await fetch('/api/generate-ai-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjects: selectedSubjects,
          difficulty: selectedDifficulty,
          examType: selectedExamType,
          otherSubjectsLanguage: otherSubjectsLanguage,
          count: 10
        })
      });
      if (response.ok) {
        const data = await response.json();
        const newQuestions = data.questions || [];
        if (newQuestions.length > 0) {
          console.log(`[prefetch] Successfully fetched ${newQuestions.length} questions in background.`);
          setCurrentQuestionList(prev => [...prev, ...newQuestions]);
        }
      }
    } catch (e) {
      console.warn("[prefetch] Background pre-fetching failed:", e);
    } finally {
      isPrefetchingRef.current = false;
    }
  };

  // Triggered when starting the game
  const startGame = async () => {
    playStartSound();
    
    // Collect filtered questions from Local Question Pool
    let initialLocalMatches = LOCAL_QUESTIONS.filter(q => {
      // Filter by Exam Type if not Mixed
      const matchesExam = selectedExamType === 'Mixed' || q.examType.includes(selectedExamType);
      // Filter by Subjects
      const matchesSubject = selectedSubjects.includes(q.subject);
      // Filter by Difficulty
      const matchesDifficulty = selectedDifficulty === 'Standard' || q.difficulty === selectedDifficulty;
      
      return matchesExam && matchesSubject && matchesDifficulty;
    });

    // In case zero fit, grab standard matches
    if (initialLocalMatches.length === 0) {
      initialLocalMatches = LOCAL_QUESTIONS.filter(q => selectedSubjects.includes(q.subject));
    }

    // Shuffle questions slightly
    let shuffledLocal = [...initialLocalMatches].sort(() => Math.random() - 0.5);

    if (shuffledLocal.length === 0) {
      shuffledLocal = [...LOCAL_QUESTIONS]
        .filter(q => selectedSubjects.includes(q.subject))
        .sort(() => Math.random() - 0.5);
    }

    let initialQuestionsPool = shuffledLocal;

    if (aiDynamicMode) {
      setIsBatchGenerating(true);
      setBatchProgress(10);
      setBatchMessage("Initializing BPSC Selection Framework... (বিসিএস প্রশ্নমালা সুবিন্যস্ত করা হচ্ছে)");
      
      const messageInterval = setInterval(() => {
        const messages = [
          "Curating premium syllabus matches... (সিলেবাস সমন্বয় করা হচ্ছে)",
          "Injecting cognitive psychometric distractors... (ভুল উত্তরগুলো সাজানো হচ্ছে)",
          "Structuring arithmetic shortcuts... (গাণিতিক শর্টকাট সূত্র লোড হচ্ছে)",
          "Syncing target subjects with Cadet standards... (ক্যাডার মানের প্রশ্ন প্রস্তুত হচ্ছে)",
          "Formulating explanation keys... (বিশদ ব্যাখ্যা ও ডায়াগนস্টিক কি তৈরি হচ্ছে)",
          "Readying high-tension timed canvas... (টাইমড ব্যাটল গ্রাউন্ড লোড হচ্ছে)"
        ];
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        setBatchMessage(randomMsg);
        setBatchProgress(prev => Math.min(92, prev + Math.floor(Math.random() * 12) + 4));
      }, 700);

      try {
        const fetchCount = targetChallengeEnabled ? Math.max(totalQuestionLimit, 15) : 15;
        const response = await fetch('/api/generate-ai-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subjects: selectedSubjects,
            difficulty: selectedDifficulty,
            examType: selectedExamType,
            otherSubjectsLanguage: otherSubjectsLanguage,
            count: fetchCount
          })
        });
        
        clearInterval(messageInterval);

        if (response.ok) {
          const data = await response.json();
          if (data.isFallback) {
            setOfflineBackupActive(true);
          } else {
            setOfflineBackupActive(false);
          }
          if (data.questions && data.questions.length > 0) {
            initialQuestionsPool = data.questions;
          } else {
            console.warn("Empty AI batch returned, falling back to local questions pool.");
          }
        } else {
          setOfflineBackupActive(true);
          console.warn("AI Batch generation response not ok, falling back to local questions pool.");
        }
      } catch (err) {
        clearInterval(messageInterval);
        setOfflineBackupActive(true);
        console.warn("AI Batch generation request failed, falling back to local questions pool.", err);
      } finally {
        setBatchProgress(100);
        setIsBatchGenerating(false);
      }
    }

    // Deduplicate and backfill pool to reach desired size completely without repetitions
    const seenNormalized = new Set<string>();
    const seenIds = new Set<string>();
    const uniquePool: Question[] = [];

    const addIfUnique = (q: Question): boolean => {
      // STRICT CONSTRAINT: Only accept matching selected subjects
      if (!selectedSubjects.includes(q.subject as SubjectType)) {
        return false;
      }
      const norm = q.questionText.trim().toLowerCase().replace(/\s+/g, ' ');
      const idKey = q.id?.toString() || '';
      
      if (!seenNormalized.has(norm) && (idKey === '' || !seenIds.has(idKey))) {
        seenNormalized.add(norm);
        if (idKey !== '') {
          seenIds.add(idKey);
        }
        uniquePool.push(q);
        return true;
      }
      return false;
    };

    // First add all from initial pool (AI or local matches)
    for (const q of initialQuestionsPool) {
      addIfUnique(q);
    }

    // Determine target size
    const desiredSize = targetChallengeEnabled ? totalQuestionLimit : Math.max(uniquePool.length, 30);

    // Dynamic backfill Stages to avoid duplicates
    if (uniquePool.length < desiredSize) {
      // Stage 1: Matches Exam, Subject, and Difficulty
      const stage1 = [...LOCAL_QUESTIONS]
        .sort(() => Math.random() - 0.5)
        .filter(q => {
          const matchesExam = selectedExamType === 'Mixed' || q.examType.includes(selectedExamType);
          const matchesSubject = selectedSubjects.includes(q.subject);
          const matchesDifficulty = selectedDifficulty === 'Standard' || q.difficulty === selectedDifficulty;
          return matchesExam && matchesSubject && matchesDifficulty;
        });
      for (const q of stage1) {
        if (uniquePool.length >= desiredSize) break;
        if (selectedSubjects.includes(q.subject)) {
          addIfUnique(q);
        }
      }
    }

    if (uniquePool.length < desiredSize) {
      // Stage 2: Matches Exam and Subject
      const stage2 = [...LOCAL_QUESTIONS]
        .sort(() => Math.random() - 0.5)
        .filter(q => {
          const matchesExam = selectedExamType === 'Mixed' || q.examType.includes(selectedExamType);
          const matchesSubject = selectedSubjects.includes(q.subject);
          return matchesExam && matchesSubject;
        });
      for (const q of stage2) {
        if (uniquePool.length >= desiredSize) break;
        if (selectedSubjects.includes(q.subject)) {
          addIfUnique(q);
        }
      }
    }

    if (uniquePool.length < desiredSize) {
      // Stage 3: Matches Subject only
      const stage3 = [...LOCAL_QUESTIONS]
        .sort(() => Math.random() - 0.5)
        .filter(q => selectedSubjects.includes(q.subject));
      for (const q of stage3) {
        if (uniquePool.length >= desiredSize) break;
        if (selectedSubjects.includes(q.subject)) {
          addIfUnique(q);
        }
      }
    }

    if (uniquePool.length < desiredSize) {
      // Stage 4: Absolute fallback, pull any question from standard database matching SELECTED subjects
      const stage4 = [...LOCAL_QUESTIONS]
        .filter(q => selectedSubjects.includes(q.subject))
        .sort(() => Math.random() - 0.5);
      for (const q of stage4) {
        if (uniquePool.length >= desiredSize) break;
        addIfUnique(q);
      }
    }

    // Stage 5: If uniquePool is still smaller than desiredSize, pad with duplicates of matching questions to completely avoid unselected subjects
    if (uniquePool.length < desiredSize && uniquePool.length > 0) {
      let idx = 0;
      while (uniquePool.length < desiredSize) {
        const originalQ = uniquePool[idx % uniquePool.length];
        const clone = {
          ...originalQ,
          id: `${originalQ.id}_rep_${Math.random().toString(36).substr(2, 5)}`
        };
        uniquePool.push(clone);
        idx++;
      }
    }

    // Slice to exact desired target count
    const finalQuestionsPool = uniquePool.slice(0, desiredSize);

    setCurrentQuestionList(finalQuestionsPool);

    // Reset gameplay parameters
    hasSavedSessionRef.current = false;
    setCurrentQuestionIndex(0);
    setIncorrectList([]);
    setAttemptedSessionQuestions([]);
    setExpandedQuestionIdx(null);
    setAiReport(null);
    setSessionCorrectCount(0);
    setSessionWrongCount(0);
    setStats(prev => ({
      ...prev,
      streak: 0,
      answerHistory: [],
    }));

    // Setup PvP Competitor if selected
    if (selectedMode === 'PvP') {
      const opponents = [
        { name: 'Arif (45th BCS Cadre Prep)', avatar: '👔', streak: 0, isAlive: true, accuracy: 0.85, speedMultiplier: 1.5 },
        { name: 'Nusrat (BB AD Aspirant)', avatar: '📊', streak: 0, isAlive: true, accuracy: 0.9, speedMultiplier: 1.8 },
        { name: 'Tahmid (Sreemangal Admin)', avatar: '🏔️', streak: 0, isAlive: true, accuracy: 0.8, speedMultiplier: 1.2 }
      ];
      setPvpOpponent(opponents[Math.floor(Math.random() * opponents.length)]);
    } else {
      setPvpOpponent(null);
    }

    // Set playing state
    setGameState('PLAYING');
    
    // Load question at index 0
    await loadQuestion(0, initialQuestionsPool);
  };

  // Handle Loading a question (supports local and server-side AI generation)
  const loadQuestion = async (idx: number, questionsPool?: Question[]) => {
    setSelectedOption(null);
    setAnswerRevealed(false);
    setScreenEffect('NONE');

    const pool = questionsPool || currentQuestionListRef.current;

    // Setup Timer
    const limit = DIFFICULTY_TIMERS[selectedDifficulty];
    setMaxTime(limit);
    setTimeLeft(limit);
    setActiveQuestionStartTime(Date.now());

    // Clean PvP intervals
    if (pvpTimerRef.current) clearInterval(pvpTimerRef.current);

    // AI Dynamic Question Mode - slide background pre-fetcher check!
    if (aiDynamicMode) {
      const remainingQuestionsCount = pool.length - idx;
      if (remainingQuestionsCount <= 4) {
        prefetchMoreAiQuestions();
      }
    }

    // Fallback or Standard Local Pool loading
    setQuestionLoading(false);
    let q: Question;
    
    if (selectedMode === 'Marathon') {
      // Adaptive scaling: dynamically fetch standard or harder questions based on current progress without repetitions, strictly within selected subjects
      const marathonShuffled = [...LOCAL_QUESTIONS]
        .filter(item => selectedSubjects.includes(item.subject as SubjectType))
        .sort(() => Math.random() - 0.5);
      const targetDifficulty = stats.streak >= 12 ? 'Hard' : (stats.streak >= 6 ? 'Standard' : 'Easy');
      
      const attemptedIdsOrTexts = new Set(attemptedSessionQuestions.map(aq => aq.question.id || aq.question.questionText));
      
      const filtered = marathonShuffled.filter(item => {
        const isNotAttempted = !attemptedIdsOrTexts.has(item.id) && !attemptedIdsOrTexts.has(item.questionText);
        return item.difficulty === targetDifficulty && isNotAttempted;
      });
      
      q = filtered.length > 0 ? filtered[0] : (
        marathonShuffled.find(item => !attemptedIdsOrTexts.has(item.id) && !attemptedIdsOrTexts.has(item.questionText)) || marathonShuffled[0]
      );
    } else {
      // Loop or take next
      if (idx < pool.length) {
        q = pool[idx];
      } else {
        // Find a first non-attempted question in the pool if possible, or backoff to LOCAL_QUESTIONS matching selected subjects
        const attemptedIdsOrTexts = new Set(attemptedSessionQuestions.map(aq => aq.question.id || aq.question.questionText));
        let nonAttempted = pool.filter(item => !attemptedIdsOrTexts.has(item.id) && !attemptedIdsOrTexts.has(item.questionText));
        
        if (nonAttempted.length === 0) {
          // Relax and look in general LOCAL_QUESTIONS pool for any non-attempted strictly within selected subjects
          const localShuffled = [...LOCAL_QUESTIONS]
            .filter(item => selectedSubjects.includes(item.subject as SubjectType))
            .sort(() => Math.random() - 0.5);
          nonAttempted = localShuffled.filter(item => !attemptedIdsOrTexts.has(item.id) && !attemptedIdsOrTexts.has(item.questionText));
        }

        if (nonAttempted.length > 0) {
          q = nonAttempted[0];
          // Append this to the list so index traversal continues smoothly
          setCurrentQuestionList(prev => [...prev, q]);
        } else {
          // Absolute last resort
          const reshuffled = [...pool].sort(() => Math.random() - 0.5);
          q = reshuffled[0];
        }
      }
    }

    setActiveQuestion(q);
    startActiveQuestionTimer(limit);
    triggerPvpOpponentTurn(q);
  };

  // Start countdown clock
  const startActiveQuestionTimer = (seconds: number) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          handleTimeout();
          return 0;
        }
        if (prev <= 4) {
          playCountdownSound();
        } else {
          playTickSound();
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Timeout handler
  const handleTimeout = () => {
    if (answerRevealed || gameState !== 'PLAYING') return;
    playFailureSound();
    setScreenEffect('SCREEN_BREAK');
    if (activeQuestion) {
      setIncorrectList(prev => [...prev, activeQuestion]);
      
      const timeTaken = maxTime;
      setAttemptedSessionQuestions(prev => [
        ...prev,
        {
          question: activeQuestion,
          selectedOption: null,
          isCorrect: false,
          timeTaken,
          errorType: 'time lag pressure panic'
        }
      ]);

      const subj = activeQuestion.subject;
      const currentSubjStat = stats.subjectProficiency[subj] || { correct: 0, total: 0 };
      const updatedSubjStat = {
        correct: currentSubjStat.correct,
        total: currentSubjStat.total + 1
      };

      setStats(prev => {
        const historyItem = {
          questionId: activeQuestion.id,
          subject: activeQuestion.subject,
          topic: activeQuestion.topic,
          skillNode: activeQuestion.skillNode || 'Conceptual general recall',
          isCorrect: false,
          timeTaken,
          errorType: 'time lag pressure panic'
        };
        return {
          ...prev,
          totalAnswered: prev.totalAnswered + 1,
          timeSpentSeconds: prev.timeSpentSeconds + timeTaken,
          subjectProficiency: {
            ...prev.subjectProficiency,
            [subj]: updatedSubjStat
          },
          answerHistory: [...(prev.answerHistory || []), historyItem]
        };
      });

      // Track target challenge wrong counters
      const nextWrong = sessionWrongCount + 1;
      setSessionWrongCount(nextWrong);

      if (targetChallengeEnabled) {
        const nextAttempts = sessionCorrectCount + nextWrong;
        const currentScore = sessionCorrectCount * 1.0 - nextWrong * 0.5;
        const remainingQuestions = totalQuestionLimit - nextAttempts;
        const maxPossible = currentScore + remainingQuestions * 1.0;

        if (maxPossible < targetPassingScore) {
          // Mathematically impossible! Immediately terminate game
          setTimeout(() => {
            setScreenEffect('SCREEN_BREAK');
            playFailureSound();
            setTimeout(() => {
              setGameState('GAMEOVER');
              if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            }, 500);
          }, 800);
          return;
        }

        if (nextAttempts === totalQuestionLimit) {
          // Finished all questions! Conclude to gameover screen
          setTimeout(() => {
            setGameState('GAMEOVER');
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          }, 800);
          return;
        }

        // Still possible to pass, move to next question automatically
        setTimeout(() => {
          const nextIdx = currentQuestionIndex + 1;
          setCurrentQuestionIndex(nextIdx);
          loadQuestion(nextIdx, currentQuestionList);
        }, 1400);
        return;
      }
    }
    
    // Simulate Game Over (instant fail) for standard survival
    setTimeout(() => {
      setGameState('GAMEOVER');
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }, 800);
  };

  // Simulated PvP Opponent matching
  const triggerPvpOpponentTurn = (q: Question) => {
    if (selectedMode !== 'PvP' || !pvpOpponent) return;

    // Simulate opponent action after random seconds
    const actionDelayMs = (Math.random() * 4 + 2) * 1000 / pvpOpponent.speedMultiplier;
    
    pvpTimerRef.current = setTimeout(() => {
      const isCorrect = Math.random() < pvpOpponent.accuracy;
      setPvpOpponent(prev => {
        if (!prev) return null;
        if (!isCorrect) {
          return {
            ...prev,
            isAlive: false,
            streak: prev.streak
          };
        } else {
          return {
            ...prev,
            streak: prev.streak + 1
          };
        }
      });

      if (!isCorrect) {
        setComboAlert(`${pvpOpponent.name} FAILED the task! You have the control!`);
        setTimeout(() => setComboAlert(null), 3000);
      }
    }, actionDelayMs);
  };

  // Option submission logic
  const handleOptionClick = (optionIdx: number) => {
    if (answerRevealed || !activeQuestion) return;

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (pvpTimerRef.current) clearTimeout(pvpTimerRef.current);
    
    setSelectedOption(optionIdx);
    setAnswerRevealed(true);

    const isCorrect = optionIdx === activeQuestion.correctAnswerIndex;
    const timeTaken = Math.max(1, Math.round((Date.now() - activeQuestionStartTime) / 1000));
    
    // Update real-time target challenge counters
    const nextCorrect = sessionCorrectCount + (isCorrect ? 1 : 0);
    const nextWrong = sessionWrongCount + (isCorrect ? 0 : 1);
    setSessionCorrectCount(nextCorrect);
    setSessionWrongCount(nextWrong);

    // Update Subject performance tracker
    const subj = activeQuestion.subject;
    const currentSubjStat = stats.subjectProficiency[subj] || { correct: 0, total: 0 };
    const updatedSubjStat = {
      correct: currentSubjStat.correct + (isCorrect ? 1 : 0),
      total: currentSubjStat.total + 1
    };

    if (isCorrect) {
      // Score calculation based on speed & difficulty
      playSuccessSound();
      setScreenEffect('CORRECT_FLASH');
      
      const speedBonus = Math.max(5, maxTime - timeTaken) * 5;
      const difficultyMultiplier = selectedDifficulty === 'Easy' ? 1 : (selectedDifficulty === 'Moderate' ? 1.5 : (selectedDifficulty === 'Standard' ? 2 : 3));
      const pointsEarned = Math.round((100 + speedBonus) * difficultyMultiplier);

      const nextStreak = stats.streak + 1;
      const nextMaxStreak = Math.max(stats.maxStreak, nextStreak);

      setStats(prev => {
        const historyItem = {
          questionId: activeQuestion.id,
          subject: activeQuestion.subject,
          topic: activeQuestion.topic,
          skillNode: activeQuestion.skillNode || 'Conceptual general recall',
          isCorrect: true,
          timeTaken,
          errorType: undefined
        };
        const nextHistory = [...(prev.answerHistory || []), historyItem];
        return {
          ...prev,
          streak: nextStreak,
          maxStreak: nextMaxStreak,
          totalAnswered: prev.totalAnswered + 1,
          correctCount: prev.correctCount + 1,
          totalScore: prev.totalScore + pointsEarned,
          timeSpentSeconds: prev.timeSpentSeconds + timeTaken,
          subjectProficiency: {
            ...prev.subjectProficiency,
            [subj]: updatedSubjStat
          },
          answerHistory: nextHistory
        };
      });

      setAttemptedSessionQuestions(prev => [
        ...prev,
        {
          question: activeQuestion,
          selectedOption: optionIdx,
          isCorrect: true,
          timeTaken
        }
      ]);

      // Combos milestones alerts
      if (nextStreak === 5 || nextStreak === 10 || nextStreak === 25 || nextStreak === 50) {
        setComboAlert(`🔥 ${nextStreak} COMBO MULTIPLIER ACTIVE!`);
        playVictorySound();
        setTimeout(() => setComboAlert(null), 2500);
      }

    } else {
      // Wrong Answer
      playFailureSound();
      setScreenEffect('WRONG_SHAKE');
      setIncorrectList(prev => [...prev, activeQuestion]);

      setStats(prev => {
        const historyItem = {
          questionId: activeQuestion.id,
          subject: activeQuestion.subject,
          topic: activeQuestion.topic,
          skillNode: activeQuestion.skillNode || 'Conceptual general recall',
          isCorrect: false,
          timeTaken,
          errorType: activeQuestion.errorType || 'concept misunderstanding'
        };
        const nextHistory = [...(prev.answerHistory || []), historyItem];
        return {
          ...prev,
          totalAnswered: prev.totalAnswered + 1,
          timeSpentSeconds: prev.timeSpentSeconds + timeTaken,
          subjectProficiency: {
            ...prev.subjectProficiency,
            [subj]: updatedSubjStat
          },
          answerHistory: nextHistory
        };
      });

      setAttemptedSessionQuestions(prev => [
        ...prev,
        {
          question: activeQuestion,
          selectedOption: optionIdx,
          isCorrect: false,
          timeTaken,
          errorType: activeQuestion.errorType || 'concept misunderstanding'
        }
      ]);

      // PvP Mode checks: Did they survive longer than competitor?
      if (pvpOpponent && !pvpOpponent.isAlive && stats.streak > pvpOpponent.streak) {
        setComboAlert(`Defeated ${pvpOpponent.name}! You got higher streak!`);
      }
    }

    // Process transition or elimination based on targetPassingScore
    if (targetChallengeEnabled) {
      const nextAttempts = nextCorrect + nextWrong;
      const currentScore = nextCorrect * 1.0 - nextWrong * 0.5;
      const remainingQuestions = totalQuestionLimit - nextAttempts;
      const maxPossible = currentScore + remainingQuestions * 1.0;

      if (maxPossible < targetPassingScore) {
        // Mathematically impossible! Immediately terminate game
        setTimeout(() => {
          setScreenEffect('SCREEN_BREAK');
          playFailureSound();
          setTimeout(() => {
            setGameState('GAMEOVER');
          }, 500);
        }, 1400);
        return;
      }

      if (nextAttempts === totalQuestionLimit) {
        // Finished all questions! Conclude to gameover screen
        setTimeout(() => {
          setGameState('GAMEOVER');
        }, 1400);
        return;
      }

      // Still possible to pass, move to next question automatically
      setTimeout(() => {
        const nextIdx = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIdx);
        loadQuestion(nextIdx, currentQuestionList);
      }, 1400);
      return;
    } else {
      // NON-CHALLENGE / STANDARD OVERRIDE (Fails on first wrong choice)
      if (isCorrect) {
        // Move to next question in 1.4 seconds
        setTimeout(() => {
          const nextIdx = currentQuestionIndex + 1;
          setCurrentQuestionIndex(nextIdx);
          loadQuestion(nextIdx, currentQuestionList);
        }, 1400);
      } else {
        // Enter Game Over Screen representation (failure)
        setTimeout(() => {
          setScreenEffect('SCREEN_BREAK');
          setTimeout(() => {
            setGameState('GAMEOVER');
          }, 500);
        }, 1500);
      }
    }
  };

  // Call server-side API to compute Gemini intelligence analysis on study guidelines
  const fetchAiAnalysis = async () => {
    if (incorrectList.length === 0) return;
    setAiLoading(true);
    try {
      const response = await fetch('/api/ai-analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incorrectQuestions: incorrectList.map(item => ({
            id: item.id,
            subject: item.subject,
            topic: item.topic,
            questionText: item.questionText,
            explanation: item.explanation,
            skillNode: item.skillNode,
            errorType: item.errorType
          })),
          streak: stats.maxStreak,
          selectedExamType,
          totalCount: stats.totalAnswered,
          correctCount: stats.correctCount,
          averageTimeTakenInSeconds: stats.totalAnswered > 0 ? Math.round(stats.timeSpentSeconds / stats.totalAnswered) : 0
        })
      });

      if (response.ok) {
        const result = await response.json();
        setAiReport(result);
      } else {
        throw new Error("Analysis failed");
      }
    } catch (e) {
      console.error(e);
      // fallback mock diagnosis
      setAiReport({
        weaknessDetected: "You exhibit minor stress failures during sudden countdown transitions.",
        personalizedTips: [
          "Set aside blocks of 20 minutes to resolve mock standard mathematics daily.",
          "Keep an physical diary of high frequency vocabulary words to glance over weekly.",
          "Take slow, deep breaths to prevent clicking answers impulsively."
        ],
        recommendedSubjects: ['Mathematics', 'English'],
        motivationQuote: "কষ্টেই তো মেলে গৌরব! আপনার প্রতিটি ব্যর্থতা ক্যাডার হওয়ার সংকল্পকে আরও দৃঢ় করুক। হাল ছাড়বেন না!",
        worstSubjectText: "Mathematics",
        worstSkillNodeCluster: "Proportional scaling and equation speed tricks",
        errorPatternType: "fatigue",
        improvementRecommendations: [
          "Do focus training with high pressure timers.",
          "Map out common logical fallacies in mental ability worksheets."
        ],
        accuracyRating: "Vulnerable to tricky distractors",
        reactionTimeSuitability: "Steady Thinker",
        estimatedConfidencePercent: 55
      });
    } finally {
      setAiLoading(false);
    }
  };

  // Helper calculation for accuracy percentage
  const getAccuracy = () => {
    if (stats.totalAnswered === 0) return 0;
    return Math.round((stats.correctCount / stats.totalAnswered) * 100);
  };

  // Return to Setup menu
  const exitToDashboard = () => {
    setGameState('DASHBOARD');
    setAiReport(null);
  };

  // Clear timer integrations on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (pvpTimerRef.current) clearTimeout(pvpTimerRef.current);
    };
  }, []);

  return (
    <div id="exam-survival-app" className={`min-h-screen ${theme === 'Light' ? 'theme-light bg-slate-50 text-slate-900' : 'bg-[#030712] text-slate-100'} flex flex-col font-sans selection:bg-cyan-500 selection:text-black`}>
      
      {/* Dynamic Background Alert Flash */}
      <div className={`fixed inset-0 pointer-events-none transition-all duration-300 z-50 ${
        screenEffect === 'CORRECT_FLASH' ? 'animate-flash-green' : 
        screenEffect === 'WRONG_SHAKE' ? 'animate-shake' : 
        screenEffect === 'SCREEN_BREAK' ? 'animate-break' : ''
      }`} />

      {/* FIRE combo alert overlay */}
      {comboAlert && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 text-slate-950 font-black px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-bounce border-2 border-white scale-110">
          <Flame className="w-6 h-6 fill-amber-950 animate-pulse" />
          <span className="tracking-wide uppercase font-mono text-sm">{comboAlert}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md py-4 px-6 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-500 to-amber-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Trophy className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-black bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-400 bg-clip-text text-transparent uppercase tracking-wider">
              Exam Survival
            </h1>
            <p className="text-xs text-slate-400 font-medium">BPSC & Bank Competitive Challenge</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            id="btn_sound_toggle"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-md ${theme === 'Light' ? 'hover:bg-slate-200' : 'hover:bg-slate-800'} transition text-slate-400 hover:text-slate-200`}
            title="Toggle game sound"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-cyan-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
          </button>

          <button 
            id="btn_theme_toggle_header"
            onClick={() => setTheme(theme === 'Dark' ? 'Light' : 'Dark')}
            className={`p-2 rounded-md transition ${theme === 'Light' ? 'hover:bg-slate-200 text-amber-600' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'}`}
            title={`Switch to ${theme === 'Dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'Dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
          </button>
          
          <div className="hidden sm:flex items-center gap-4 text-xs font-mono bg-slate-950 rounded-full py-1.5 px-4 border border-slate-800">
            <span className="text-cyan-400 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> High-Stakes Quiz System v2.6
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col justify-center">

        {/* AI Question Batch Generation Loader */}
        {isBatchGenerating && (
          <div className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center p-6 backdrop-blur-md">
            <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full border-4 border-slate-800 border-t-cyan-500 animate-spin flex items-center justify-center">
                  <span className="text-3xl">📝</span>
                </div>
                <span className="absolute bottom-1 right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500"></span>
                </span>
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-bold tracking-tight text-white font-sans">
                  Preparing AI Question Bank
                </h3>
                <p className="text-cyan-400 font-mono text-[11px] max-w-sm mx-auto uppercase tracking-wider min-h-[32px] px-2 leading-relaxed">
                  {batchMessage}
                </p>
              </div>

              {/* Progress Bar Container */}
              <div className="space-y-2">
                <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-[1px]">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${batchProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-slate-500">
                  <span>SYSTEM STATUS: COMPILING SYLLABUS</span>
                  <span>{batchProgress}%</span>
                </div>
              </div>

              {/* Custom micro informational tip ticker */}
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/40 text-[13px] text-slate-400 flex items-start gap-3 text-left">
                <span className="text-amber-500 text-lg">💡</span>
                <p className="leading-relaxed">
                  <strong>Did you know?</strong> BCS questions often target tricky grammar structures and core constitutional articles. AI is curating realistic options to test your conceptual clarity.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 1: CONFIGURATION / SETUP DASHBOARD                 */}
        {/* ======================================================== */}
        {gameState === 'DASHBOARD' && (
          <div className="space-y-6 max-w-4xl mx-auto w-full animate-fade-in-up">
            
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
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'BCS', label: 'BCS / Civil Service', desc: 'Focus on high-yield General Knowledge, Literature' },
                        { id: 'Bank', label: 'Bank Recruitment', desc: 'Analytical focus: Math, English Vocabulary' },
                        { id: 'Mixed', label: 'Unified / Govt Jobs', desc: 'Syllabus of standard ministry grade jobs' },
                        { id: 'Custom', label: 'Custom Drill', desc: 'Manual choice: set any pool subjects' }
                      ].map(type => (
                        <button
                          key={type.id}
                          id={`btn_exam_${type.id}`}
                          onClick={() => setSelectedExamType(type.id as ExamType)}
                          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between h-20 ${
                            selectedExamType === type.id 
                              ? 'border-cyan-400 bg-cyan-950/20 text-white shadow-xl shadow-cyan-950/10 glow-border-cyan' 
                              : 'border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 text-slate-400'
                          }`}
                        >
                          <span className="text-xs font-extrabold uppercase block">{type.label}</span>
                          <span className="text-[9px] text-slate-400 capitalize truncate w-full block">{type.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

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
                            onClick={() => setSelectedDifficulty(level as DifficultyLevel)}
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
                            onClick={() => setSelectedMode(mode.id as GameMode)}
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
                              className="w-full accent-cyan-400 cursor-pointer h-1.5 rounded-lg bg-slate-950"
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
                              className="w-full accent-amber-400 cursor-pointer h-1.5 rounded-lg bg-slate-950"
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
                  onClick={startGame}
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

                {/* THE LEADERBOARD PANE */}
                <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
                  <h3 className="font-extrabold text-xs font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Trophy className="w-4 h-4 text-cyan-400" /> Top survival scores
                  </h3>
                  
                  <div className="space-y-2 font-mono">
                    {leaderboard.map((player, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs p-2 rounded-lg bg-slate-950/60 hover:bg-slate-950 transition border border-slate-900">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                            idx === 0 ? 'bg-yellow-400 text-slate-950' :
                            idx === 1 ? 'bg-slate-300 text-slate-950' :
                            idx === 2 ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-300 truncate max-w-[120px]">{player.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="text-amber-400 font-extrabold">🎖️{player.streak}</span>
                          <span className="font-bold text-cyan-400">{player.score} pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

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
        )}

        {/* ======================================================== */}
        {/* VIEW 2: ACTIVE GAMEPLAY PREPARATION VIEW                 */}
        {/* ======================================================== */}
        {gameState === 'PLAYING' && (
          <div className="space-y-6 max-w-3xl mx-auto w-full animate-scale-up">

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
              const { currentScore, answeredCount, remainingCount, maxPossible, requiredRemainingToTarget } = getChallengeMetrics();
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
                      <div className="w-full bg-slate-950 h-1.5 rounded-full mt-1.5 overflow-hidden border border-slate-905">
                        <div 
                          className="bg-cyan-500 h-full rounded-full transition-all duration-300"
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
                <div className="flex items-center gap-1 bg-rose-950/20 border border-rose-505/20 px-4 py-2 rounded-xl text-rose-500 font-black animate-pulse">
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
                      
                      <span className="bg-slate-900 text-slate-400 border border-slate-800 rounded-full px-3 py-1 text-xs font-bold font-mono uppercase">
                        Difficulty: {activeQuestion.difficulty}
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
                    <div className="glass-panel rounded-3xl border-2 border-slate-800/80 p-6 md:p-8 relative overflow-hidden bg-gradient-to-b from-slate-900/90 to-slate-950/90 shadow-2xl">
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
                              onClick={() => handleOptionClick(oIdx)}
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
                onClick={exitToDashboard}
                className="text-xs text-rose-400/70 hover:text-rose-400 font-mono transition border border-rose-500/20 rounded-lg px-4 py-2 hover:bg-rose-500/5 cursor-pointer"
              >
                [ ABANDON EXAM RUN ]
              </button>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 3: GAME OVER DEFEAT SCREEN REVIEW                   */}
        {/* ======================================================== */}
        {gameState === 'GAMEOVER' && (
          <div className="space-y-6 max-w-4xl mx-auto w-full animate-fade-in">
            
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
              {aiReport ? (
                <div className="space-y-6 font-mono text-xs">
                  
                  {/* TOP ROW QUANTITATIVE DIALS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* CONFIDENCE ESTIMATE METER */}
                    <div className="bg-slate-950/80 border border-slate-900 p-4 rounded-xl space-y-2">
                      <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-widest block">📊 ESTIMATED EXAM CONFIDENCE</span>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-white">{aiReport.estimatedConfidencePercent || 50}%</span>
                        <span className="text-[9px] text-slate-500">PROBABILITY PASS RATIO</span>
                      </div>
                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-cyan-400 rounded-full" 
                          initial={{ width: 0 }}
                          animate={{ width: `${aiReport.estimatedConfidencePercent || 50}%` }}
                          transition={{ type: "spring", stiffness: 80, damping: 15 }}
                        />
                      </div>
                    </div>

                    {/* REACTION TIME METRIC BADGE */}
                    <div className="bg-slate-950/80 border border-slate-900 p-4 rounded-xl space-y-1">
                      <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-widest block">⏱️ RESPONSE PACING PROFILE</span>
                      <div className="text-base font-bold text-slate-100 flex items-center gap-2 pt-1">
                        <span className="bg-amber-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded">
                          {aiReport.reactionTimeSuitability || 'Steady Thinker'}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-500 block leading-tight">
                        Pace matched for: BPSC (36s/q) and Bank AD (45s/q with math complexity).
                      </span>
                    </div>

                    {/* ERROR PATTERN CLASSIFICATION METRIC */}
                    <div className="bg-slate-950/80 border border-slate-900 p-4 rounded-xl space-y-1">
                      <span className="text-[10px] text-rose-400 font-extrabold uppercase tracking-widest block">🚨 CORE ERROR FAILURE PATTERN</span>
                      <div className="text-sm font-bold text-slate-150 flex items-center gap-1.5 pt-1 uppercase">
                        {aiReport.errorPatternType === 'speed' ? '⚡ Relentless Speed Rush Fatigue' :
                         aiReport.errorPatternType === 'concept' ? '📚 Fundamental Concept Gap' :
                         aiReport.errorPatternType === 'carelessness' ? '⚠️ Carelessness & Speed Slip' :
                         '🧠 Stress Cognitive Exhaustion'}
                      </div>
                      <span className="text-[9px] text-slate-505 block leading-tight">
                        Dominant psychological stress category identified in wrong clicks.
                      </span>
                    </div>

                  </div>

                  {/* DOUBLE COLUMN DIAGNOSTICS & TIPS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    
                    {/* LEFT COLUMN: DIAGNOSTIC DETAILS & REC GUIDE */}
                    <div className="space-y-4">
                      
                      {/* DETECTED SYLLABUS SPOTLIGHT */}
                      <div className="bg-slate-950/85 border border-slate-800 p-4 rounded-xl space-y-2">
                        <span className="text-[10px] text-yellow-300 font-extrabold uppercase tracking-widest block">🎯 Primary Weakest Skill-Node Cluster</span>
                        <p className="text-white text-md font-extrabold font-sans leading-tight">
                          {aiReport.worstSkillNodeCluster || "Multi-step analytical reasoning and fact associations (সিভিল সার্ভিস সাধারণ জ্ঞান ও গাণিতিক জটিলতা)"}
                        </p>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Subject focus path: <span className="text-yellow-400 font-bold">{aiReport.worstSubjectText || "General Knowledge Affairs"}</span>
                        </div>
                      </div>

                      {/* WEAKNESS DESCRIPTION */}
                      <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900/60 space-y-1">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">🔍 Cognitive Weakness Assessment</span>
                        <p className="text-[12px] text-slate-300 font-sans leading-relaxed">
                          {aiReport.weaknessDetected}
                        </p>
                      </div>

                    </div>

                    {/* RIGHT COLUMN: ACTIONABLE SCORE IMPROVEMENT RULES & STRATEGY */}
                    <div className="space-y-4 flex flex-col justify-between">
                      
                      {/* ACTION PLANS */}
                      <div className="space-y-2.5">
                        <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-widest block">📋 Stepped High-Stakes Score Improvement Steps</span>
                        <div className="space-y-1.5">
                          {(aiReport.improvementRecommendations || aiReport.personalizedTips).map((step, idx) => (
                            <div key={idx} className="bg-slate-950 p-2 rounded-lg border border-slate-900 flex items-start gap-2.5 font-sans">
                              <span className="bg-cyan-500/10 text-cyan-400 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded mt-0.5">
                                STEP {idx + 1}
                              </span>
                              <p className="text-xs text-slate-200 leading-normal">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-900/60 mt-3 flex items-center justify-between text-[11px] gap-2 font-mono">
                        <div>
                          <span className="text-slate-500 uppercase block text-[9px]">Syllabus Area Practice Priority</span>
                          <div className="flex gap-1 flex-wrap mt-0.5">
                            {aiReport.recommendedSubjects.map((sub, i) => (
                              <span key={i} className="bg-slate-900 border border-rose-500/20 text-rose-400 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                {sub}
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className="bg-slate-900 text-slate-400 text-[10px] px-2 py-1 rounded border border-slate-800 shrink-0 uppercase tracking-widest">
                          {aiReport.accuracyRating || 'ACCURACY: '+getAccuracy()+'%'}
                        </span>
                      </div>

                    </div>

                  </div>

                  {/* BOTTOM REINFORCEMENT MENTOR SLOGAN */}
                  <div className="border-t border-slate-900 pt-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 bg-slate-950/20 p-2.5 rounded-lg">
                    <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">🔥 BPSC Chairman Cadre Slogan</span>
                    <p className="text-[11px] text-amber-300 italic font-medium leading-relaxed font-sans shrink-1">
                      "{aiReport.motivationQuote}"
                    </p>
                  </div>

                </div>
              ) : (
                <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center text-xs text-slate-500 font-mono">
                  [ System diagnostic passive. Press "Run Gemini Diagnostic" above to audit candidate statistics and map performance ]
                </div>
              )}

            </div>

            {/* HISTORICAL COGNITIVE ERROR TREND ANALYZER */}
            {(() => {
              const last10Runs = rawSessionHistory.slice(-10);
              const subjectErrCounts: Record<string, number> = {};
              const errorTypeCounts: Record<string, number> = {};

              last10Runs.forEach(run => {
                run.errors.forEach(err => {
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

                  {/* ANALYTICS GRID CONTAINER */}
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
                      {chartTab === 'trends' ? (
                        <div className="w-full">
                          <InteractiveTrendsChart 
                            sessions={rawSessionHistory} 
                            theme={theme}
                          />
                        </div>
                      ) : (
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
                      )}
                      
                      <div className="text-center text-[9px] font-mono text-slate-500 uppercase pt-2">
                        📊 [ Live historical progression sourced from player browser cache ]
                      </div>
                    </div>

                  </div>
                </div>
              );
            })()}

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
                            ? 'bg-slate-901 border-slate-700/60 bg-slate-900/40' 
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
                          <div className="pt-3 border-t border-slate-800 space-y-4 font-sans text-xs text-slate-300 animate-slide-down">
                            
                            {/* Options Selected Vs Correct */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900">
                                <span className="text-slate-500 uppercase block mb-1">CANDIDATE SELECTED SELECTION</span>
                                <span className={attempt.isCorrect ? 'text-emerald-400 font-bold' : (attempt.selectedOption === null ? 'text-rose-400 italic' : 'text-rose-400 font-bold')}>
                                  {attempt.selectedOption !== null ? qObj.options[attempt.selectedOption] : 'TIMEOUT (NONE)'}
                                </span>
                              </div>
                              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900">
                                <span className="text-slate-500 uppercase block mb-1">SYSTEM KEY STANDARD (CORRECT)</span>
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
                                <p className="leading-relaxed text-slate-250">{qObj.explanation}</p>
                              </div>

                              {/* Mapped Skill Node & Error Classification */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[11px]">
                                <div>
                                  <span className="font-mono text-[9px] text-cyan-400/80 font-bold uppercase block mb-0.5">🎯 Mapped Syllabus Skill Node</span>
                                  <p className="font-mono text-slate-300 text-[10px] uppercase font-bold">{qObj.skillNode || 'Conceptual BPSC General Syllabus Topic'}</p>
                                </div>
                                <div>
                                  <span className="font-mono text-[9px] text-rose-405/80 font-bold uppercase block mb-0.5">❌ Rookie Distractor Category</span>
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
                onClick={startGame}
                className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-8 py-4.5 rounded-xl text-sm font-mono tracking-wider uppercase flex items-center justify-center gap-2 hover:scale-102 transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> RETRY RUN IMMEDIATELY
              </button>

              <button
                id="btn_back_to_menu"
                onClick={exitToDashboard}
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-850 hover:text-white text-slate-400 font-black px-8 py-4.5 rounded-xl text-sm border border-slate-800 font-mono tracking-wider uppercase text-center flex items-center justify-center gap-2 hover:scale-102 transition cursor-pointer"
              >
                <Compass className="w-4 h-4" /> RECONFIGURE SYLLABUS MENU
              </button>
            </div>

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-4 text-center text-xs text-slate-500 space-y-2 mt-12">
        <p className="font-mono">
          Strict high pressure mock test simulation. All question structures modeled after public source exams.
        </p>
        <p className="font-sans text-[10px]">
          Exam Survival BD &copy; 2026. Keep drilling and secure your desired first class post!
        </p>
      </footer>

    </div>
  );
}
