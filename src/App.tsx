import React, { lazy, Suspense, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  Trophy, 
  Flame, 
  VolumeX, 
  Volume2, 
  Sun, 
  Moon,
  Activity
} from 'lucide-react';
import { useGameStore } from './state/gameStore.js';
import { AppShell } from './components/AppShell.js';
import { LOCAL_QUESTIONS } from './data/questions.js';
import { 
  Question, 
  SubjectType,
  GameMode,
  DifficultyLevel,
  ALL_SUBJECTS
} from './types.js';
import {
  getSessionHistory,
  addSessionRecord
} from './utils/sessionHistory.js';
import { runLocalAnalytics } from './engine/analyticsEngine.js';
import { simulatePvPOpponentStep } from './utils/gameStateEngine.js';
import { QuestionService } from './engine/questionEngine.js';
import { GameEngine } from './engine/gameEngine.js';
import { AuthInterface } from './components/AuthInterface.js';
import { 
  saveUserProfile, 
  getUserProfile, 
  saveMatchRecord, 
  saveAnalyticsRecord, 
  auth,
  FirebaseUser
} from './utils/firebase.js';
import { DbUser } from './types.js';

// Setup React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    }
  }
});

// Lazy Load separate chunks for Dashboard, Game, GameOver, Landing, Leaderboard, and Auth
const DashboardPage = lazy(() => import('./app/routes/Dashboard.js'));
const GamePage = lazy(() => import('./app/routes/Game.js'));
const GameOverPage = lazy(() => import('./components/game/GameOver.js'));
const LandingPage = lazy(() => import('./app/routes/Landing.js'));
const LeaderboardPage = lazy(() => import('./app/routes/Leaderboard.js'));
const AuthPage = lazy(() => import('./app/routes/Auth.js'));

function MainAppContent() {
  const {
    selectedExamType,
    selectedSubjects,
    selectedDifficulty,
    selectedMode,
    aiDynamicMode,
    otherSubjectsLanguage,
    theme,
    stats,
    gameState,
    targetChallengeEnabled,
    totalQuestionLimit,
    targetPassingScore,
    sessionCorrectCount,
    sessionWrongCount,
    currentQuestionList,
    currentQuestionIndex,
    activeQuestion,
    selectedOption,
    answerRevealed,
    timeLeft,
    maxTime,
    screenEffect,
    comboAlert,
    soundEnabled,
    pvpOpponent,
    incorrectList,
    attemptedSessionQuestions,
    aiReport,
    aiLoading,
    isBatchGenerating,
    batchProgress,
    batchMessage,
    rawSessionHistory,
    activeUser,
    activeProfile,

    // Setters
    setExamType,
    setSubjects,
    setDifficulty,
    setDifficultyLabel,
    setGameMode,
    setAiDynamicMode,
    setOtherSubjectsLanguage,
    setTheme,
    setSoundEnabled,
    setStats,
    setGameState,
    setTargetChallengeEnabled,
    setTotalQuestionLimit,
    setTargetPassingScore,
    setSessionCorrectCount,
    setSessionWrongCount,
    setCurrentQuestionList,
    setCurrentQuestionIndex,
    setActiveQuestion,
    setActiveQuestionStartTime,
    setTimeLeft,
    setMaxTime,
    setSelectedOption,
    setAnswerRevealed,
    setScreenEffect,
    setComboAlert,
    setPvpOpponent,
    setActiveUser,
    setActiveProfile,
    setIncorrectList,
    setAttemptedSessionQuestions,
    setIsBatchGenerating,
    setBatchProgress,
    setBatchMessage,
    setRawSessionHistory,
    setAiLoading,
    setAiReport,
  } = useGameStore();

  const [offlineBackupActive, setOfflineBackupActive] = React.useState<boolean>(false);
  const [questionLoading, setQuestionLoading] = React.useState<boolean>(false);
  const [shouldAutoStart, setShouldAutoStart] = React.useState<boolean>(false);

  // Trigger auto start once game state is ready and engine function is initialized
  useEffect(() => {
    if (shouldAutoStart && gameState === 'PLAYING') {
      setShouldAutoStart(false);
      startGame();
    }
  }, [shouldAutoStart, gameState]);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pvpTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeQuestionStartTimeRef = useRef<number>(0);
  const currentQuestionListRef = useRef<Question[]>([]);
  const isPrefetchingRef = useRef<boolean>(false);
  const hasSavedSessionRef = useRef<boolean>(false);

  // Keep ref in sync
  useEffect(() => {
    currentQuestionListRef.current = currentQuestionList;
  }, [currentQuestionList]);

  // Load session history on startup
  useEffect(() => {
    setRawSessionHistory(getSessionHistory());
  }, []);

  // Stable game state reference for PopState synchronization
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Stable game startup reference for PopState handling
  const startGameRef = useRef<(() => Promise<void>) | null>(null);

  // ----------------------------------------------------
  // TWO-WAY ROUTER & ADDRESS BAR SYNCHRONIZER
  // ----------------------------------------------------
  useEffect(() => {
    const handlePopState = () => {
      const currentPath = window.location.pathname;
      const currentSearch = window.location.search;
      const currentHash = window.location.hash;
      const params = new URLSearchParams(currentSearch);

      if (currentPath === '/dashboard') {
        if (gameStateRef.current !== 'DASHBOARD') setGameState('DASHBOARD');
      } else if (currentPath === '/app') {
        // Default mode 'survival' if routing to app and has any parameters
        let modeParam = params.get('mode');
        const subjectParam = params.get('subjects') || params.get('subject');
        const diffParam = params.get('difficulty');
        
        if (!modeParam && (subjectParam || diffParam)) {
          modeParam = 'survival';
        }

        if (modeParam) {
          let mappedMode: GameMode = 'Survival';
          if (modeParam.toLowerCase() === 'speed') mappedMode = 'Speed';
          else if (modeParam.toLowerCase() === 'marathon') mappedMode = 'Marathon';
          else if (modeParam.toLowerCase() === 'daily') mappedMode = 'Daily';
          else if (modeParam.toLowerCase() === 'pvp') mappedMode = 'PvP';

          setGameMode(mappedMode);

          if (diffParam) {
            let mappedDiff: DifficultyLevel = 'Standard';
            const cleanDiff = diffParam.toLowerCase();
            if (cleanDiff === 'easy') mappedDiff = 'Easy';
            else if (cleanDiff === 'moderate') mappedDiff = 'Moderate';
            else if (cleanDiff === 'standard') mappedDiff = 'Standard';
            else if (cleanDiff === 'hard') mappedDiff = 'Hard';
            setDifficulty(mappedDiff);
            setDifficultyLabel(mappedDiff);
          }

          if (subjectParam) {
            const parts = subjectParam.split(',').map(s => s.trim().toLowerCase());
            const mapped: SubjectType[] = [];
            parts.forEach(p => {
              if (p === 'bangla') mapped.push('Bangla');
              else if (p === 'english') mapped.push('English');
              else if (p === 'math' || p === 'mathematics') mapped.push('Mathematics');
              else if (p === 'ict') mapped.push('ICT');
              else if (p.includes('bangladesh')) mapped.push('Bangladesh Affairs');
              else if (p.includes('international')) mapped.push('International Affairs');
              else if (p.includes('science')) mapped.push('General Science');
              else if (p.includes('mental')) mapped.push('Mental Ability');
            });
            if (mapped.length > 0) {
              setSubjects(mapped);
            }
          }

          setExamType('BCS');
          if (gameStateRef.current !== 'PLAYING') {
            setGameState('PLAYING');
            if (startGameRef.current) {
              startGameRef.current();
            } else {
              setShouldAutoStart(true);
            }
          }
        } else if (currentHash === '#modes') {
          if (gameStateRef.current !== 'DASHBOARD') setGameState('DASHBOARD');
          setTimeout(() => {
            const el = document.getElementById('bpsc-modes-grid');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 400);
        } else {
          if (gameStateRef.current !== 'PLAYING' && gameStateRef.current !== 'GAMEOVER') {
            setGameState('PLAYING');
          }
        }
      } else if (currentPath === '/leaderboard') {
        if (gameStateRef.current !== 'LEADERBOARD') setGameState('LEADERBOARD');
      } else if (currentPath === '/auth') {
        if (gameStateRef.current !== 'AUTH') setGameState('AUTH');
      } else if (currentPath === '/') {
        if (gameStateRef.current !== 'LANDING') setGameState('LANDING');
        if (currentHash === '#modes' || currentHash === '#game-modes') {
          setTimeout(() => {
            const el = document.getElementById('game-modes');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 400);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    handlePopState(); // Handle initial route load

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [setGameState, setGameMode, setExamType, setDifficulty, setDifficultyLabel, setSubjects, setShouldAutoStart]);

  useEffect(() => {
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    const currentHash = window.location.hash;
    
    let targetPath = '/';
    if (gameState === 'DASHBOARD') {
      targetPath = currentSearch.includes('preview=true') ? '/dashboard?preview=true' : '/dashboard';
    } else if (gameState === 'PLAYING' || gameState === 'GAMEOVER') {
      targetPath = `/app?mode=${selectedMode.toLowerCase()}`;
    } else if (gameState === 'LEADERBOARD') {
      targetPath = '/leaderboard';
    } else if (gameState === 'AUTH') {
      targetPath = '/auth';
    }

    if (currentPath + currentSearch + currentHash !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  }, [gameState, selectedMode]);

  const handleUserSynced = (user: FirebaseUser | null, profile: DbUser | null) => {
    setActiveUser(user);
    setActiveProfile(profile);
    if (profile) {
      setStats(prev => ({
        ...prev,
        maxStreak: Math.max(prev.maxStreak, profile.bestStreak)
      }));
    }
  };

  // Record active run to history upon reaching GAMEOVER
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

      if (currentSessionErrors.length === 0 && activeQuestion) {
        currentSessionErrors.push({
          subject: activeQuestion.subject,
          errorType: activeQuestion.errorType || 'Concept Gap'
        });
      }

      // Append run to history
      const updated = addSessionRecord(
        stats.totalScore,
        stats.maxStreak,
        currentSessionErrors
      );
      setRawSessionHistory(updated);

      // Cloud persistent sync
      if (auth.currentUser) {
        const userId = auth.currentUser.uid;
        const matchId = `match_${Date.now()}`;

        const previousBest = activeProfile?.bestStreak || 0;
        const currentBest = Math.max(stats.maxStreak, previousBest);
        const currentTotalGames = (activeProfile?.totalGames || 0) + 1;
        const email = auth.currentUser.email || '';
        const name = auth.currentUser.displayName || activeProfile?.name || 'Anonymous Candidate';
        const examTarget = selectedExamType ? [selectedExamType] : ['BCS'];
        const currentRank = Math.max(1, Math.min(99 - currentBest, 99));

        const previousTotalScore = activeProfile?.totalScore || 0;
        const currentTotalScore = previousTotalScore + stats.totalScore;

        const correctAnswers = attemptedSessionQuestions.filter(q => q.isCorrect);
        const sessionFastestResponse = correctAnswers.length > 0
          ? Math.min(...correctAnswers.map(q => q.timeTaken))
          : 99.99;
        const previousFastest = activeProfile?.fastestResponse ?? 99.99;
        const currentFastest = (sessionFastestResponse > 0 && sessionFastestResponse < previousFastest)
          ? sessionFastestResponse
          : previousFastest;

        const currentFriends = activeProfile?.friends || [];
        const lastActiveAt = new Date().toISOString();

        saveUserProfile(userId, {
          id: userId,
          name,
          email,
          examTarget,
          currentRank,
          totalGames: currentTotalGames,
          bestStreak: currentBest,
          totalScore: currentTotalScore,
          fastestResponse: currentFastest,
          friends: currentFriends,
          lastActiveAt,
          createdAt: activeProfile?.createdAt || new Date()
        }).then(() => {
          getUserProfile(userId).then(p => {
            if (p) setActiveProfile(p);
          });
        });

        saveMatchRecord({
          id: matchId,
          userId,
          mode: selectedMode,
          streak: stats.streak,
          score: stats.totalScore,
          duration: stats.timeSpentSeconds,
          result: stats.streak >= (totalQuestionLimit || 10) ? 'Victory' : 'Survival Ended'
        });

        saveAnalyticsRecord({
          userId,
          subjectStats: Object.entries(stats.subjectProficiency).map(([subj, data]) => ({
            subject: subj,
            correct: data.correct,
            total: data.total
          })),
          weakAreas: attemptedSessionQuestions
            .filter(q => !q.isCorrect)
            .map(q => q.question.subject),
          strongAreas: attemptedSessionQuestions
            .filter(q => q.isCorrect)
            .map(q => q.question.subject),
          trends: updated.slice(-10).map(s => ({
            timestamp: s.timestamp,
            totalScore: s.totalScore,
            maxStreak: s.maxStreak
          }))
        });
      }
    }
  }, [gameState, attemptedSessionQuestions, activeQuestion, stats.totalScore, stats.maxStreak, activeProfile]);

  // Sound generator helpers using Web Audio API
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
      console.warn("Audio Context blocked/unsupported.");
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
    playBeep(880, 'square', 0.08);
    setTimeout(() => playBeep(1200, 'sine', 0.04), 40);
  };

  const playVictorySound = () => {
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        playBeep(freq, idx === 4 ? 'sine' : 'triangle', 0.18);
      }, idx * 100);
    });
  };

  const prefetchMoreAiQuestions = async () => {
    if (isPrefetchingRef.current) return;
    isPrefetchingRef.current = true;
    console.log("[prefetch] Sparking background pre-charge of AI questions...");
    try {
      const result = await QuestionService.requestBatch(
        selectedSubjects,
        selectedDifficulty,
        selectedExamType,
        otherSubjectsLanguage,
        10,
        true
      );
      if (result.questions && result.questions.length > 0) {
        console.log(`[prefetch] Successfully fetched ${result.questions.length} questions.`);
        setCurrentQuestionList([...currentQuestionListRef.current, ...result.questions]);
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

    let initialLocalMatches = LOCAL_QUESTIONS.filter(q => {
      const matchesExam = selectedExamType === 'Mixed' || q.examType.includes(selectedExamType);
      const matchesSubject = selectedSubjects.includes(q.subject);
      const matchesDifficulty = selectedDifficulty === 'Standard' || q.difficulty === selectedDifficulty;
      return matchesExam && matchesSubject && matchesDifficulty;
    });

    if (initialLocalMatches.length === 0) {
      initialLocalMatches = LOCAL_QUESTIONS.filter(q => selectedSubjects.includes(q.subject));
    }

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
          "Formulating explanation keys... (বিশদ ব্যাখ্যা ও ডায়াগনস্টিক কি তৈরি হচ্ছে)",
          "Readying high-tension timed canvas... (টাইমড ব্যাটল গ্রাউন্ড লোড হচ্ছে)"
        ];
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        setBatchMessage(randomMsg);
        setBatchProgress(Math.min(92, useGameStore.getState().batchProgress + Math.floor(Math.random() * 12) + 4));
      }, 700);

      try {
        const fetchCount = targetChallengeEnabled ? Math.max(totalQuestionLimit, 15) : 15;
        const result = await QuestionService.requestBatch(
          selectedSubjects,
          selectedDifficulty,
          selectedExamType,
          otherSubjectsLanguage,
          fetchCount,
          true
        );

        clearInterval(messageInterval);
        if (result.questions && result.questions.length > 0) {
          initialQuestionsPool = result.questions;
        } else {
          console.warn("Empty AI batch returned from QuestionService, falling back to local.");
        }
      } catch (err) {
        clearInterval(messageInterval);
        console.warn("AI Batch generation failed, falling back to local.", err);
      } finally {
        setBatchProgress(100);
        setIsBatchGenerating(false);
      }
    }

    // Deduplicate and backfill pool
    const seenNormalized = new Set<string>();
    const seenIds = new Set<string>();
    const uniquePool: Question[] = [];

    const addIfUnique = (q: Question): boolean => {
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

    for (const q of initialQuestionsPool) {
      addIfUnique(q);
    }

    const desiredSize = targetChallengeEnabled ? totalQuestionLimit : Math.max(uniquePool.length, 30);

    // Padding fallback stages
    if (uniquePool.length < desiredSize) {
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

    const finalQuestionsPool = uniquePool.slice(0, desiredSize);
    setCurrentQuestionList(finalQuestionsPool);

    // Reset gameplay parameters
    hasSavedSessionRef.current = false;
    setCurrentQuestionIndex(0);
    setIncorrectList([]);
    setAttemptedSessionQuestions([]);
    setAiReport(null);
    setSessionCorrectCount(0);
    setSessionWrongCount(0);
    
    const initialDiff = GameEngine.determineAdaptiveDifficulty(0, selectedMode);
    setDifficulty(initialDiff.difficulty);
    setDifficultyLabel(initialDiff.label);
    setStats(prev => ({
      ...prev,
      streak: 0,
      answerHistory: [],
    }));

    // Setup PvP Competitor
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

    setGameState('PLAYING');
    await loadQuestion(0, finalQuestionsPool);
  };

  // Keep game startup ref updated
  useEffect(() => {
    startGameRef.current = startGame;
  }, [startGame]);

  const loadQuestion = async (idx: number, questionsPool?: Question[]) => {
    setSelectedOption(null);
    setAnswerRevealed(false);
    setScreenEffect('NONE');

    const pool = questionsPool || currentQuestionListRef.current;
    const limit = GameEngine.getTimerLimit(selectedDifficulty, selectedMode);
    setMaxTime(limit);
    setTimeLeft(limit);
    activeQuestionStartTimeRef.current = Date.now();

    if (pvpTimerRef.current) clearInterval(pvpTimerRef.current);

    if (aiDynamicMode) {
      const remainingQuestionsCount = pool.length - idx;
      if (remainingQuestionsCount <= 4) {
        prefetchMoreAiQuestions();
      }
    }

    let q: Question;
    if (selectedMode === 'Marathon') {
      const marathonShuffled = [...LOCAL_QUESTIONS]
        .filter(item => selectedSubjects.includes(item.subject as SubjectType))
        .sort(() => Math.random() - 0.5);
      const targetDifficulty = selectedDifficulty;
      const attemptedIdsOrTexts = new Set(attemptedSessionQuestions.map(aq => aq.question.id || aq.question.questionText));
      
      const filtered = marathonShuffled.filter(item => {
        const isNotAttempted = !attemptedIdsOrTexts.has(item.id) && !attemptedIdsOrTexts.has(item.questionText);
        return item.difficulty === targetDifficulty && isNotAttempted;
      });
      
      q = filtered.length > 0 ? filtered[0] : (
        marathonShuffled.find(item => !attemptedIdsOrTexts.has(item.id) && !attemptedIdsOrTexts.has(item.questionText)) || marathonShuffled[0]
      );
    } else {
      if (idx < pool.length) {
        q = pool[idx];
      } else {
        const attemptedIdsOrTexts = new Set(attemptedSessionQuestions.map(aq => aq.question.id || aq.question.questionText));
        let nonAttempted = pool.filter(item => !attemptedIdsOrTexts.has(item.id) && !attemptedIdsOrTexts.has(item.questionText));
        
        if (nonAttempted.length === 0) {
          const localShuffled = [...LOCAL_QUESTIONS]
            .filter(item => selectedSubjects.includes(item.subject as SubjectType))
            .sort(() => Math.random() - 0.5);
          nonAttempted = localShuffled.filter(item => !attemptedIdsOrTexts.has(item.id) && !attemptedIdsOrTexts.has(item.questionText));
        }

        if (nonAttempted.length > 0) {
          q = nonAttempted[0];
          setCurrentQuestionList([...pool, q]);
        } else {
          const reshuffled = [...pool].sort(() => Math.random() - 0.5);
          q = reshuffled[0];
        }
      }
    }

    setActiveQuestion(q);
    startActiveQuestionTimer(limit);
    triggerPvpOpponentTurn(q);
  };

  const startActiveQuestionTimer = (seconds: number) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const currentPrev = typeof prev === 'function' ? (prev as any)(0) : prev;
        if (currentPrev <= 1) {
          clearInterval(timerIntervalRef.current!);
          handleTimeout();
          return 0;
        }
        if (currentPrev <= 4) {
          playCountdownSound();
        } else {
          playTickSound();
        }
        return currentPrev - 1;
      });
    }, 1000);
  };

  const handleTimeout = () => {
    if (answerRevealed || gameState !== 'PLAYING') return;
    playFailureSound();
    setScreenEffect('SCREEN_BREAK');
    if (activeQuestion) {
      setIncorrectList([...incorrectList, activeQuestion]);
      
      const timeTaken = maxTime;
      const nextWrong = sessionWrongCount + 1;
      setSessionWrongCount(nextWrong);

      setAttemptedSessionQuestions([
        ...attemptedSessionQuestions,
        {
          question: activeQuestion,
          selectedOption: null,
          isCorrect: false,
          timeTaken,
          errorType: 'time lag pressure panic'
        }
      ]);

      const result = GameEngine.processTurn({
        question: activeQuestion,
        selectedOption: -1,
        timeTaken,
        maxTime,
        currentStats: stats,
        gameMode: selectedMode,
        targetChallengeEnabled,
        totalQuestionLimit,
        targetPassingScore,
        sessionCorrectCount,
        sessionWrongCount: nextWrong
      });

      setStats(result.stats);
      setDifficulty(result.currentDifficulty);
      setDifficultyLabel(result.difficultyLabel);

      if (result.isGameOver) {
        setTimeout(() => {
          setGameState('GAMEOVER');
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }, 800);
      } else {
        setTimeout(() => {
          const nextIdx = currentQuestionIndex + 1;
          setCurrentQuestionIndex(nextIdx);
          loadQuestion(nextIdx, currentQuestionList);
        }, 1400);
      }
    }
  };

  const triggerPvpOpponentTurn = (q: Question) => {
    if (selectedMode !== 'PvP' || !pvpOpponent) return;
    const actionDelayMs = (Math.random() * 4 + 2) * 1000 / pvpOpponent.speedMultiplier;
    
    pvpTimerRef.current = setTimeout(() => {
      const isCorrect = Math.random() < pvpOpponent.accuracy;
      const stepResult = simulatePvPOpponentStep(pvpOpponent, isCorrect);
      setPvpOpponent(stepResult.opponent);

      if (stepResult.failedAnnouncement) {
        setComboAlert(stepResult.failedAnnouncement);
        setTimeout(() => setComboAlert(null), 3000);
      }
    }, actionDelayMs);
  };

  const handleOptionClick = (optionIdx: number) => {
    if (answerRevealed || !activeQuestion) return;

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (pvpTimerRef.current) clearTimeout(pvpTimerRef.current);
    
    setSelectedOption(optionIdx);
    setAnswerRevealed(true);

    const isCorrect = optionIdx === activeQuestion.correctAnswerIndex;
    const timeTaken = Math.max(1, Math.round((Date.now() - activeQuestionStartTimeRef.current) / 1000));
    
    const nextCorrect = sessionCorrectCount + (isCorrect ? 1 : 0);
    const nextWrong = sessionWrongCount + (isCorrect ? 0 : 1);
    setSessionCorrectCount(nextCorrect);
    setSessionWrongCount(nextWrong);

    const result = GameEngine.processTurn({
      question: activeQuestion,
      selectedOption: optionIdx,
      timeTaken,
      maxTime,
      currentStats: stats,
      gameMode: selectedMode,
      targetChallengeEnabled,
      totalQuestionLimit,
      targetPassingScore,
      sessionCorrectCount: nextCorrect,
      sessionWrongCount: nextWrong,
    });

    setStats(result.stats);
    setDifficulty(result.currentDifficulty);
    setDifficultyLabel(result.difficultyLabel);

    if (isCorrect) {
      playSuccessSound();
      setScreenEffect('CORRECT_FLASH');
      setAttemptedSessionQuestions([
        ...attemptedSessionQuestions,
        {
          question: activeQuestion,
          selectedOption: optionIdx,
          isCorrect: true,
          timeTaken
        }
      ]);

      if (result.comboAlert) {
        setComboAlert(result.comboAlert);
        playVictorySound();
        setTimeout(() => setComboAlert(null), 2500);
      }
    } else {
      playFailureSound();
      setScreenEffect('WRONG_SHAKE');
      setIncorrectList([...incorrectList, activeQuestion]);
      setAttemptedSessionQuestions([
        ...attemptedSessionQuestions,
        {
          question: activeQuestion,
          selectedOption: optionIdx,
          isCorrect: false,
          timeTaken,
          errorType: activeQuestion.errorType || 'concept misunderstanding'
        }
      ]);

      if (pvpOpponent && !pvpOpponent.isAlive && result.stats.streak > pvpOpponent.streak) {
        setComboAlert(`Defeated ${pvpOpponent.name}! You got higher streak!`);
      }
    }

    if (result.isGameOver) {
      setTimeout(() => {
        setScreenEffect('SCREEN_BREAK');
        playFailureSound();
        setTimeout(() => {
          setGameState('GAMEOVER');
        }, 500);
      }, 1400);
    } else {
      setTimeout(() => {
        const nextIdx = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIdx);
        loadQuestion(nextIdx, currentQuestionList);
      }, 1400);
    }
  };

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
      console.warn("[Diagnostics] AI Call failed. Falling back to dynamic local analysis.", e);
      const fallbackReport = runLocalAnalytics(stats, rawSessionHistory);
      setAiReport(fallbackReport);
    } finally {
      setAiLoading(false);
    }
  };

  const exitToDashboard = () => {
    setGameState('DASHBOARD');
    setAiReport(null);
  };

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (pvpTimerRef.current) clearTimeout(pvpTimerRef.current);
    };
  }, []);

  const getAccuracyRate = () => {
    if (stats.totalAnswered === 0) return 0;
    return Math.round((stats.correctCount / stats.totalAnswered) * 100);
  };

  return (
    <AppShell>
      {/* AI Question Batch Generation Loader */}
      {isBatchGenerating && (
        <div className="fixed inset-0 z-55 bg-slate-950/95 flex flex-col items-center justify-center p-6 backdrop-blur-md">
          <div className="max-w-md w-full text-center space-y-8 animate-fade-in relative z-50">
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

            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/40 text-[13px] text-slate-400 flex items-start gap-3 text-left">
              <span className="text-amber-500 text-lg">💡</span>
              <p className="leading-relaxed font-sans">
                <strong>Did you know?</strong> BCS questions often target tricky grammar structures and core constitutional articles. AI is curating realistic options to test your conceptual clarity.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Route Switcher with Suspense loading states */}
      <Suspense fallback={(
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-slate-850 border-t-cyan-500 animate-spin" />
          <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest animate-pulse font-bold">LOADING SYLLABUS NODE...</p>
        </div>
      )}>
        {gameState === 'LANDING' && (
          <LandingPage onStartGame={startGame} />
        )}

        {gameState === 'LEADERBOARD' && (
          <div className="max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col justify-center">
            <LeaderboardPage />
          </div>
        )}

        {gameState === 'AUTH' && (
          <div className="max-w-md w-full mx-auto p-4 md:p-6 flex flex-col justify-center">
            <AuthPage />
          </div>
        )}

        {gameState === 'DASHBOARD' && (
          <div className="space-y-6 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col justify-center">
            {/* HERO BOX */}
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
                <p className="text-slate-400 text-sm md:text-base leading-relaxed font-sans">
                  Train your brain for Bangladesh’s toughest competitive tests (BCS, BB AD, Bank jobs). Strengthen recall and timing under relentless speed constraints.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex flex-col items-center justify-center gap-2 min-w-[200px] text-center shrink-0 z-10">
                <span className="text-xs text-slate-400 font-mono tracking-wider uppercase">Your Record Streak</span>
                <div className="flex items-center gap-1">
                  <Flame className="w-8 h-8 text-amber-500 fill-amber-500 animate-pulse" />
                  <span className="text-4xl font-black font-mono text-white">{stats.maxStreak}</span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${Math.min(100, stats.maxStreak * 4)}%` }} />
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-1">Accuracy: {getAccuracyRate()}%</span>
              </div>
            </div>

            {/* FIRESTORE CLOUD SYNCHRONIZER */}
            <AuthInterface 
              onUserSynced={handleUserSynced} 
              currentStats={{ totalScore: stats.totalScore, maxStreak: stats.maxStreak }} 
            />

            <DashboardPage 
              onStartGame={startGame} 
              onUserSynced={handleUserSynced}
              onUpdateProfile={(profile) => setActiveProfile(profile)}
            />
          </div>
        )}

        {gameState === 'PLAYING' && (
          <div className="max-w-7xl w-full mx-auto p-4 md:p-6 flex-1 flex flex-col justify-center">
            <GamePage 
              offlineBackupActive={offlineBackupActive}
              questionLoading={questionLoading}
              onOptionClick={handleOptionClick}
              onExitToDashboard={exitToDashboard}
            />
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="max-w-7xl w-full mx-auto p-4 md:p-6 flex-1 flex flex-col justify-center">
            <GameOverPage 
              aiLoading={aiLoading}
              aiReport={aiReport}
              fetchAiAnalysis={fetchAiAnalysis}
              rawSessionHistory={rawSessionHistory}
              attemptedSessionQuestions={attemptedSessionQuestions}
              onRetryGame={startGame}
              onExitToDashboard={exitToDashboard}
            />
          </div>
        )}
      </Suspense>
    </AppShell>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainAppContent />
    </QueryClientProvider>
  );
}
