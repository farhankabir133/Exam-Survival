import { create } from 'zustand';
import { PlayerStats, Question, SubjectType, DifficultyLevel, GameMode, ExamType, PvPCompetitor, DbUser, AIAnalysisResponse } from '../types.js';
import { SessionRecord } from '../utils/sessionHistory.js';

interface GameStoreState {
  // Configs
  selectedExamType: ExamType;
  selectedSubjects: SubjectType[];
  selectedDifficulty: DifficultyLevel;
  difficultyLabel: string;
  selectedMode: GameMode;
  aiDynamicMode: boolean;
  otherSubjectsLanguage: 'Bangla' | 'English';
  theme: 'Dark' | 'Light';
  soundEnabled: boolean;

  // Stats
  stats: PlayerStats;
  gameState: 'LANDING' | 'DASHBOARD' | 'PLAYING' | 'GAMEOVER' | 'LEADERBOARD' | 'AUTH';

  // Target limit
  targetChallengeEnabled: boolean;
  totalQuestionLimit: number;
  targetPassingScore: number;

  // Active played sessions
  sessionCorrectCount: number;
  sessionWrongCount: number;

  // Active Questions & Index
  currentQuestionList: Question[];
  currentQuestionIndex: number;
  activeQuestion: Question | null;
  activeQuestionStartTime: number;

  // Timer states
  timeLeft: number;
  maxTime: number;

  // Option submission details
  selectedOption: number | null;
  answerRevealed: boolean;

  // Screen effect state
  screenEffect: 'NONE' | 'CORRECT_FLASH' | 'WRONG_SHAKE' | 'SCREEN_BREAK';
  comboAlert: string | null;

  // PvP competitor states
  pvpOpponent: PvPCompetitor | null;

  // Candidates profiles
  activeUser: any | null; // FirebaseUser
  activeProfile: DbUser | null;

  // Incorrect records for AI
  incorrectList: Question[];
  attemptedSessionQuestions: any[];

  // Session stats & loaders
  isBatchGenerating: boolean;
  batchProgress: number;
  batchMessage: string;
  rawSessionHistory: SessionRecord[];

  // AI Diagnostic report
  aiLoading: boolean;
  aiReport: AIAnalysisResponse | null;

  // Page level navigation state
  activeTab: 'dashboard' | 'game' | 'analytics' | 'profile' | 'leaderboard';

  // Setters/Actions
  setExamType: (examType: ExamType) => void;
  setSubjects: (sub: SubjectType[]) => void;
  toggleSubject: (sub: SubjectType) => void;
  setDifficulty: (level: DifficultyLevel) => void;
  setDifficultyLabel: (label: string) => void;
  setGameMode: (mode: GameMode) => void;
  setAiDynamicMode: (val: boolean) => void;
  setOtherSubjectsLanguage: (lang: 'Bangla' | 'English') => void;
  setTheme: (theme: 'Dark' | 'Light') => void;
  setSoundEnabled: (enabled: boolean) => void;

  setStats: (stats: PlayerStats | ((prev: PlayerStats) => PlayerStats)) => void;
  setGameState: (state: 'LANDING' | 'DASHBOARD' | 'PLAYING' | 'GAMEOVER' | 'LEADERBOARD' | 'AUTH') => void;

  setTargetChallengeEnabled: (enabled: boolean) => void;
  setTotalQuestionLimit: (limit: number) => void;
  setTargetPassingScore: (score: number) => void;

  setSessionCorrectCount: (cnt: number) => void;
  setSessionWrongCount: (cnt: number) => void;

  setCurrentQuestionList: (questions: Question[]) => void;
  setCurrentQuestionIndex: (idx: number) => void;
  setActiveQuestion: (q: Question | null) => void;
  setActiveQuestionStartTime: (time: number) => void;

  setTimeLeft: (time: number | ((prev: number) => number)) => void;
  setMaxTime: (time: number) => void;

  setSelectedOption: (opt: number | null) => void;
  setAnswerRevealed: (revealed: boolean) => void;

  setScreenEffect: (effect: 'NONE' | 'CORRECT_FLASH' | 'WRONG_SHAKE' | 'SCREEN_BREAK') => void;
  setComboAlert: (alert: string | null) => void;

  setPvpOpponent: (opp: PvPCompetitor | null) => void;

  setActiveUser: (user: any) => void;
  setActiveProfile: (profile: DbUser | null) => void;

  setIncorrectList: (questions: Question[] | ((prev: Question[]) => Question[])) => void;
  setAttemptedSessionQuestions: (attempted: any[] | ((prev: any[]) => any[])) => void;

  setIsBatchGenerating: (val: boolean) => void;
  setBatchProgress: (val: number) => void;
  setBatchMessage: (msg: string) => void;
  setRawSessionHistory: (history: SessionRecord[]) => void;

  setAiLoading: (loading: boolean) => void;
  setAiReport: (report: AIAnalysisResponse | null) => void;

  setActiveTab: (tab: 'dashboard' | 'game' | 'analytics' | 'profile' | 'leaderboard') => void;
}

export const useGameStore = create<GameStoreState>((set) => ({
  // Configs
  selectedExamType: 'BCS',
  selectedSubjects: [
    'Bangla', 'English', 'Mathematics', 'ICT', 'Bangladesh Affairs', 'International Affairs', 'General Science', 'Mental Ability'
  ],
  selectedDifficulty: 'Standard',
  difficultyLabel: 'Standard',
  selectedMode: 'Survival',
  aiDynamicMode: true,
  otherSubjectsLanguage: 'Bangla',
  theme: 'Dark',
  soundEnabled: true,

  // Stats
  stats: {
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
  },
  gameState: 'LANDING',

  // Target limit
  targetChallengeEnabled: true,
  totalQuestionLimit: 10,
  targetPassingScore: 7.0,

  // Active played sessions
  sessionCorrectCount: 0,
  sessionWrongCount: 0,

  // Active Questions & Index
  currentQuestionList: [],
  currentQuestionIndex: 0,
  activeQuestion: null,
  activeQuestionStartTime: 0,

  // Timer states
  timeLeft: 10,
  maxTime: 10,

  // Option submission details
  selectedOption: null,
  answerRevealed: false,

  // Screen effect state
  screenEffect: 'NONE',
  comboAlert: null,

  // PvP competitor states
  pvpOpponent: null,

  // Candidates profiles
  activeUser: null,
  activeProfile: null,

  // Incorrect records for AI
  incorrectList: [],
  attemptedSessionQuestions: [],

  // Session stats & loaders
  isBatchGenerating: false,
  batchProgress: 0,
  batchMessage: '',
  rawSessionHistory: [],

  // AI Diagnostic report
  aiLoading: false,
  aiReport: null,

  // Page level navigation state
  activeTab: 'dashboard',

  // Setters/Actions
  setExamType: (selectedExamType) => set({ selectedExamType }),
  setSubjects: (selectedSubjects) => set({ selectedSubjects }),
  toggleSubject: (sub) => set((state) => {
    if (state.selectedSubjects.includes(sub)) {
      if (state.selectedSubjects.length <= 1) return {}; // Keep at least one subject
      return { selectedSubjects: state.selectedSubjects.filter((s) => s !== sub) };
    } else {
      return { selectedSubjects: [...state.selectedSubjects, sub] };
    }
  }),
  setDifficulty: (selectedDifficulty) => set({ selectedDifficulty }),
  setDifficultyLabel: (difficultyLabel) => set({ difficultyLabel }),
  setGameMode: (selectedMode) => set({ selectedMode }),
  setAiDynamicMode: (aiDynamicMode) => set({ aiDynamicMode }),
  setOtherSubjectsLanguage: (otherSubjectsLanguage) => set({ otherSubjectsLanguage }),
  setTheme: (theme) => set({ theme }),
  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),

  setStats: (updater) => set((state) => ({
    stats: typeof updater === 'function' ? updater(state.stats) : updater
  })),
  setGameState: (gameState) => {
    // Also track updating activeTab if appropriate
    set((state) => {
      const updates: Partial<GameStoreState> = { gameState };
      if (gameState === 'PLAYING') {
        updates.activeTab = 'game';
      } else if (gameState === 'GAMEOVER') {
        updates.activeTab = 'analytics';
      } else if (gameState === 'DASHBOARD') {
        updates.activeTab = 'dashboard';
      }
      return updates;
    });
  },

  setTargetChallengeEnabled: (targetChallengeEnabled) => set({ targetChallengeEnabled }),
  setTotalQuestionLimit: (totalQuestionLimit) => set({ totalQuestionLimit }),
  setTargetPassingScore: (targetPassingScore) => set({ targetPassingScore }),

  setSessionCorrectCount: (sessionCorrectCount) => set({ sessionCorrectCount }),
  setSessionWrongCount: (sessionWrongCount) => set({ sessionWrongCount }),

  setCurrentQuestionList: (currentQuestionList) => set({ currentQuestionList }),
  setCurrentQuestionIndex: (currentQuestionIndex) => set({ currentQuestionIndex }),
  setActiveQuestion: (activeQuestion) => set({ activeQuestion }),
  setActiveQuestionStartTime: (activeQuestionStartTime) => set({ activeQuestionStartTime }),

  setTimeLeft: (updater) => set((state) => ({
    timeLeft: typeof updater === 'function' ? updater(state.timeLeft) : updater
  })),
  setMaxTime: (maxTime) => set({ maxTime }),

  setSelectedOption: (selectedOption) => set({ selectedOption }),
  setAnswerRevealed: (answerRevealed) => set({ answerRevealed }),

  setScreenEffect: (screenEffect) => set({ screenEffect }),
  setComboAlert: (comboAlert) => set({ comboAlert }),

  setPvpOpponent: (pvpOpponent) => set({ pvpOpponent }),

  setActiveUser: (activeUser) => set({ activeUser }),
  setActiveProfile: (activeProfile) => set({ activeProfile }),

  setIncorrectList: (updater) => set((state) => ({
    incorrectList: typeof updater === 'function' ? updater(state.incorrectList) : updater
  })),
  setAttemptedSessionQuestions: (updater) => set((state) => ({
    attemptedSessionQuestions: typeof updater === 'function' ? updater(state.attemptedSessionQuestions) : updater
  })),

  setIsBatchGenerating: (isBatchGenerating) => set({ isBatchGenerating }),
  setBatchProgress: (batchProgress) => set({ batchProgress }),
  setBatchMessage: (batchMessage) => set({ batchMessage }),
  setRawSessionHistory: (rawSessionHistory) => set({ rawSessionHistory }),

  setAiLoading: (aiLoading) => set({ aiLoading }),
  setAiReport: (aiReport) => set({ aiReport }),

  setActiveTab: (activeTab) => set({ activeTab }),
}));
