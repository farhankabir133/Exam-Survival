export type SubjectType =
  | 'Bangla'
  | 'English'
  | 'Mathematics'
  | 'ICT'
  | 'Bangladesh Affairs'
  | 'International Affairs'
  | 'General Science'
  | 'Mental Ability';

export type ExamType = 'BCS' | 'Bank' | 'Mixed' | 'Custom';

export type DifficultyLevel = 'Easy' | 'Moderate' | 'Standard' | 'Hard';

export type GameMode = 'Survival' | 'Speed' | 'Daily' | 'Marathon' | 'PvP';

export interface Question {
  id: string; // unique identifier
  subject: SubjectType;
  topic: string;
  examType: ExamType[]; // e.g. ['BCS', 'Bank']
  difficulty: DifficultyLevel;
  questionText: string;
  options: string[]; // 4 MCQ options
  correctAnswerIndex: number; // 0, 1, 2, or 3 representing options
  explanation: string; // Hidden during gameplay, shown on Game Over
  
  // Cognitive Exam Engine Integrations
  skillNode?: string;           // hidden skill node e.g. "ratio/proportion calculations"
  errorType?: string;           // classification of candidate mistake e.g. "calculation slip" 
  correctReasoning?: string;    // specific breakdown why correct is right
  wrongReasoning?: string;      // description why distractors are wrong
  conceptBreakdown?: string;    // conceptual mastery baseline
  shortcutMethod?: string;      // shortcut mathematical trick / mnemonic
}

export interface PlayerStats {
  streak: number;
  maxStreak: number;
  totalAnswered: number;
  correctCount: number;
  totalScore: number;
  timeSpentSeconds: number; // total time spent in active questions
  subjectProficiency: Record<SubjectType, { correct: number; total: number }>;
  answerHistory?: {
    questionId: string;
    subject: SubjectType;
    topic: string;
    skillNode: string;
    isCorrect: boolean;
    timeTaken: number;
    errorType?: string;
  }[];
}

export interface PvPCompetitor {
  name: string;
  avatar: string;
  streak: number;
  isAlive: boolean;
  accuracy: number;
  speedMultiplier: number; // how quickly they answer
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  streak: number;
  mode: GameMode;
  date: string;
}

export interface AIAnalysisResponse {
  weaknessDetected: string;
  personalizedTips: string[];
  recommendedSubjects: SubjectType[];
  motivationQuote: string;
  
  // Advanced Diagnostics Layer fields
  worstSubjectText?: string;
  worstSkillNodeCluster?: string;
  errorPatternType?: 'speed' | 'concept' | 'carelessness' | 'fatigue';
  improvementRecommendations?: string[];
  accuracyRating?: string;
  reactionTimeSuitability?: 'Fast Recall' | 'Slow Analytical' | 'Erratic Speed Rider' | 'Steady Thinker';
  estimatedConfidencePercent?: number;
}

/**
 * ----------------------------------------------------
 * PERSISTENT DATABASE SCHEMAS
 * ----------------------------------------------------
 */

export interface DbUser {
  id: string;
  name: string;
  email: string;
  examTarget: string[];
  currentRank: number;
  totalGames: number;
  bestStreak: number;
  totalScore: number;
  fastestResponse: number;
  friends: string[];
  lastActiveAt: string;
  createdAt: Date;
}

export interface DbQuestion {
  id: string;
  subject: string;
  difficulty: number;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  source: string;
}

export interface DbMatch {
  id: string;
  userId: string;
  mode: string;
  streak: number;
  score: number;
  duration: number; // in seconds
  result: string;
}

export interface DbAnalytics {
  userId: string;
  subjectStats: any[];
  weakAreas: string[];
  strongAreas: string[];
  trends: any[];
}

export const ALL_SUBJECTS: SubjectType[] = [
  'Bangla', 'English', 'Mathematics', 'ICT', 'Bangladesh Affairs', 'International Affairs', 'General Science', 'Mental Ability'
];

