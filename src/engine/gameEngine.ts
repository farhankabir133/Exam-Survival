import { DifficultyLevel, GameMode, PlayerStats, Question, SubjectType } from '../types.js';
import { calculatePoints, evaluateTargetChallenge, DIFFICULTY_TIMERS } from '../utils/gameStateEngine.js';

/**
 * ----------------------------------------------------
 * CENTRALIZED GAME ENGINE
 * ----------------------------------------------------
 * High-performance state controller containing:
 * - Timer Manager
 * - Streak Manager
 * - Combo Manager
 * - Difficulty Manager (incorporating streak-based Adaptive Difficulty Progression)
 * - Game Over Handler
 * - Score Calculator
 */

export interface GameEngineState {
  stats: PlayerStats;
  comboAlert: string | null;
  currentDifficulty: DifficultyLevel;
  difficultyLabel: string; // Dynamic presentation label e.g., 'BCS Elite'
  isGameOver: boolean;
  gameoverReason?: string;
  pointsEarnedLastTurn?: number;
}

export const GameEngine = {
  /**
   * 1. TIMER MANAGER
   * Retrieves the countdown time limit based on difficulty level and game mode.
   * Speed mode enforces tighter constraints.
   */
  getTimerLimit(difficulty: DifficultyLevel, mode: GameMode): number {
    const baseLimit = DIFFICULTY_TIMERS[difficulty] || 10;
    if (mode === 'Speed') {
      // Speed mode cuts timer limits significantly for higher urgency
      return Math.max(4, Math.floor(baseLimit * 0.7));
    }
    return baseLimit;
  },

  /**
   * 2. DIFFICULTY MANAGER (Phase 5: Adaptive Difficulty System)
   * Dynamically tracks the candidate's real-time streak to adapt and scale challenges.
   * Progression mapping:
   * - 0-5 streak: Easy
   * - 6-10 streak: Moderate (Medium)
   * - 11-20 streak: Standard (Hard)
   * - 21-40 streak: Hard (Expert)
   * - 40+ streak: Hard (BCS Elite)
   * 
   * For Marathon Mode: uses dynamic progression where (streak / 5) drives difficulty class transitions.
   */
  determineAdaptiveDifficulty(streak: number, mode: GameMode): { difficulty: DifficultyLevel; label: string } {
    if (mode === 'Marathon') {
      const stage = Math.floor(streak / 5);
      if (stage === 0) {
        return { difficulty: 'Easy', label: 'Easy (Stage 0)' };
      } else if (stage === 1) {
        return { difficulty: 'Moderate', label: 'Moderate (Stage 1)' };
      } else if (stage === 2) {
        return { difficulty: 'Standard', label: 'Standard (Stage 2)' };
      } else if (stage >= 3 && stage < 8) {
        return { difficulty: 'Hard', label: `Expert (Stage ${stage})` };
      } else {
        return { difficulty: 'Hard', label: `BCS Elite (Stage ${stage})` };
      }
    }

    // Classic Survival & Other modes Streak-Based progressions
    if (streak <= 5) {
      return { difficulty: 'Easy', label: 'Easy' };
    } else if (streak <= 10) {
      return { difficulty: 'Moderate', label: 'Moderate' };
    } else if (streak <= 20) {
      return { difficulty: 'Standard', label: 'Standard' };
    } else if (streak <= 40) {
      return { difficulty: 'Hard', label: 'Expert' };
    } else {
      return { difficulty: 'Hard', label: 'BCS Elite' };
    }
  },

  /**
   * 3. COMBO MANAGER
   * Inspects current streaks to determine high-intensity motivational combos.
   */
  getComboAlert(streak: number): string | null {
    if (streak === 5) {
      return '🔥 5-STEP RECALL COMBO!';
    } else if (streak === 10) {
      return '⚡ 10-STEP CADRE FORCE COMBO!';
    } else if (streak === 25) {
      return '🔱 25-STEP SUPERIOR ELITE STREAK!';
    } else if (streak === 50) {
      return '🌌 50-STEP IMMORTAL SURVIVAL LEGEND!';
    }
    return null;
  },

  /**
   * 4. SCORE CALCULATOR
   * Directly interfaces with the gameStateEngine's optimized pacing formula.
   */
  calculatePointsEarned(timeTaken: number, maxTime: number, difficulty: DifficultyLevel): number {
    return calculatePoints(timeTaken, maxTime, difficulty);
  },

  /**
   * 5. GAME ENGINE CORE DISPATCHER
   * Processes a turn's outcome, computes scores, cascades state mutations, updates proficiency,
   * analyzes target-challenge bounds, handles combo milestones, and checks for game-overs.
   */
  processTurn(params: {
    question: Question;
    selectedOption: number;
    timeTaken: number;
    maxTime: number;
    currentStats: PlayerStats;
    gameMode: GameMode;
    targetChallengeEnabled: boolean;
    totalQuestionLimit: number;
    targetPassingScore: number;
    sessionCorrectCount: number;
    sessionWrongCount: number;
  }): GameEngineState {
    const {
      question,
      selectedOption,
      timeTaken,
      maxTime,
      currentStats,
      gameMode,
      targetChallengeEnabled,
      totalQuestionLimit,
      targetPassingScore,
      sessionCorrectCount,
      sessionWrongCount,
    } = params;

    const isCorrect = selectedOption === question.correctAnswerIndex;
    const subj = question.subject;
    
    // Update proficiency variables
    const currentSubjStat = currentStats.subjectProficiency[subj] || { correct: 0, total: 0 };
    const updatedSubjStat = {
      correct: currentSubjStat.correct + (isCorrect ? 1 : 0),
      total: currentSubjStat.total + 1
    };

    let nextStreak = isCorrect ? currentStats.streak + 1 : 0;
    const nextMaxStreak = Math.max(currentStats.maxStreak, nextStreak);

    // Compute score
    const pointsEarned = isCorrect ? this.calculatePointsEarned(timeTaken, maxTime, question.difficulty) : 0;
    const nextScore = currentStats.totalScore + pointsEarned;

    // Log tracking elements
    const historyItem = {
      questionId: question.id,
      subject: question.subject,
      topic: question.topic,
      skillNode: question.skillNode || 'Conceptual general recall',
      isCorrect,
      timeTaken,
      errorType: isCorrect ? undefined : (question.errorType || 'concept misunderstanding')
    };

    const nextHistory = [...(currentStats.answerHistory || []), historyItem];

    // Build mutated Stats structure
    const updatedStats: PlayerStats = {
      ...currentStats,
      streak: nextStreak,
      maxStreak: nextMaxStreak,
      totalAnswered: currentStats.totalAnswered + 1,
      correctCount: currentStats.correctCount + (isCorrect ? 1 : 0),
      totalScore: nextScore,
      timeSpentSeconds: currentStats.timeSpentSeconds + timeTaken,
      subjectProficiency: {
        ...currentStats.subjectProficiency,
        [subj]: updatedSubjStat
      },
      answerHistory: nextHistory
    };

    // Determine target-challenge constraints
    let isGameOver = false;
    let gameoverReason: string | undefined = undefined;

    if (targetChallengeEnabled) {
      const challengeMetrics = evaluateTargetChallenge(
        sessionCorrectCount + (isCorrect ? 1 : 0),
        sessionWrongCount + (isCorrect ? 0 : 1),
        totalQuestionLimit,
        targetPassingScore,
        targetChallengeEnabled
      );

      if (challengeMetrics.isImpossible) {
        isGameOver = true;
        gameoverReason = `Failure: Target passing score is now mathematically impossible to reach. Current Score: ${challengeMetrics.currentScore.toFixed(1)}, Required: ${targetPassingScore}`;
      } else if (challengeMetrics.answeredCount === totalQuestionLimit) {
        isGameOver = true;
        gameoverReason = `Completed all ${totalQuestionLimit} challenge questions! Game Concluded successfully.`;
      }
    } else {
      // In Standard Survival/Speed Modes, any direct incorrect answer ends the candidate's career immediately!
      if (!isCorrect) {
        isGameOver = true;
        gameoverReason = `Incorrect answer in Survival Mode! Slipped up on: "${question.questionText.substring(0, 40)}..."`;
      }
    }

    // Determine Combo Alert
    const comboAlert = isCorrect ? this.getComboAlert(nextStreak) : null;

    // Compute dynamic adaptive difficulty based on the newly updated streak
    const adaptive = this.determineAdaptiveDifficulty(nextStreak, gameMode);

    return {
      stats: updatedStats,
      comboAlert,
      currentDifficulty: adaptive.difficulty,
      difficultyLabel: adaptive.label,
      isGameOver,
      gameoverReason,
      pointsEarnedLastTurn: pointsEarned
    };
  }
};
