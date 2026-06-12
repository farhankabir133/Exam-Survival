import { DifficultyLevel, SubjectType, PvPCompetitor } from '../types.js';

/**
 * Game State Engine Calculations & Mathematical Formulas
 * Implements high-tension game modes, scoring penalties,
 * target qualifying limits, and simulated opponent decisions.
 */

export const DIFFICULTY_TIMERS: Record<DifficultyLevel, number> = {
  'Easy': 15,
  'Moderate': 12,
  'Standard': 10,
  'Hard': 8
};

/**
 * Calculates score points dynamically based on speed and difficulty level.
 * Rewards quick recall and applies high-tension amplifiers.
 */
export function calculatePoints(
  timeTaken: number,
  maxTime: number,
  difficulty: DifficultyLevel
): number {
  const speedBonus = Math.max(0, Math.max(5, maxTime - timeTaken) * 5);
  let difficultyMultiplier = 1.0;

  switch (difficulty) {
    case 'Easy':
      difficultyMultiplier = 1.0;
      break;
    case 'Moderate':
      difficultyMultiplier = 1.5;
      break;
    case 'Standard':
      difficultyMultiplier = 2.0;
      break;
    case 'Hard':
      difficultyMultiplier = 3.0;
      break;
  }

  return Math.round((100 + speedBonus) * difficultyMultiplier);
}

export interface TargetChallengeMetrics {
  currentScore: number;
  answeredCount: number;
  remainingCount: number;
  maxPossible: number;
  isImpossible: boolean;
  requiredRemainingToTarget: number;
}

/**
 * Analyzes current survival stats to evaluate qualifying eligibility.
 * Correct answers +1.0 point, incorrect answers -0.5 point.
 * Determines if reaching the target passing score is still mathematically possible.
 */
export function evaluateTargetChallenge(
  correctCount: number,
  wrongCount: number,
  totalLimit: number,
  targetPassingScore: number,
  enabled: boolean
): TargetChallengeMetrics {
  const currentScore = correctCount * 1.0 - wrongCount * 0.5;
  const answeredCount = correctCount + wrongCount;
  const remainingCount = Math.max(0, totalLimit - answeredCount);
  
  // Best-case scenario: get all remaining questions correct (+1.0 point each, 0 wrong)
  const maxPossible = currentScore + remainingCount * 1.0;
  const isImpossible = enabled && (maxPossible < targetPassingScore);
  const requiredRemainingToTarget = Math.max(0, targetPassingScore - currentScore);

  return {
    currentScore,
    answeredCount,
    remainingCount,
    maxPossible,
    isImpossible,
    requiredRemainingToTarget
  };
}

export interface PvPStepResult {
  opponent: PvPCompetitor;
  failedAnnouncement: string | null;
}

/**
 * Simulates an opponent's turn. 
 * An opponent decides based on their configured analytical accuracy and speed multipliers.
 * If they take too long or miss, they fail the critical competitive exam survival run.
 */
export function simulatePvPOpponentStep(
  opponent: PvPCompetitor,
  isCorrectOption: boolean
): PvPStepResult {
  const isOpponentCorrect = Math.random() < opponent.accuracy;
  let announcement: string | null = null;

  const nextOpponentState: PvPCompetitor = { ...opponent };

  if (!isOpponentCorrect) {
    nextOpponentState.isAlive = false;
    announcement = `⚠️ CRITICAL SYSTEM FAILURE! ${opponent.name} slipped up with a distractor trap and failed current BCS eligibility check! You have total tactical superiority!`;
  } else {
    nextOpponentState.streak += 1;
  }

  return {
    opponent: nextOpponentState,
    failedAnnouncement: announcement
  };
}
