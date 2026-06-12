import { DifficultyLevel, ExamType, SubjectType } from '../types.js';

/**
 * High-performance Network API layer wrapping full-stack endpoints
 */

export interface GenerateQuestionParams {
  subject: SubjectType;
  difficulty: DifficultyLevel;
  examType: ExamType;
}

export interface GenerateBatchParams {
  subjects: SubjectType[];
  difficulty: DifficultyLevel;
  examType: ExamType;
  otherSubjectsLanguage?: 'Bangla' | 'English';
  count?: number;
}

export interface AnalyseSessionParams {
  incorrectQuestions: any[];
  streak: number;
  selectedExamType: ExamType;
  totalCount: number;
  correctCount: number;
  averageTimeTakenInSeconds: number;
}

export const ApiService = {
  /**
   * Generates a single high-yield examination question
   */
  async generateQuestion({ subject, difficulty, examType }: GenerateQuestionParams) {
    const res = await fetch('/api/generate-ai-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, difficulty, examType })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error ${res.status}`);
    }
    return res.json();
  },

  /**
   * Batch generates adaptive quiz questions
   */
  async generateBatch({ subjects, difficulty, examType, otherSubjectsLanguage = 'Bangla', count = 12 }: GenerateBatchParams) {
    const res = await fetch('/api/generate-ai-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subjects, difficulty, examType, otherSubjectsLanguage, count })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error ${res.status}`);
    }
    return res.json();
  },

  /**
   * Submits session failure logs to Gemini Diagnostic Analyzers
   */
  async analyzeSession(params: AnalyseSessionParams) {
    const res = await fetch('/api/ai-analyse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error ${res.status}`);
    }
    return res.json();
  }
};
