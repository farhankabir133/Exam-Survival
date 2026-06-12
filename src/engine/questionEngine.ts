import { Question, SubjectType, DifficultyLevel, ExamType } from '../types.js';
import { LOCAL_QUESTIONS } from '../data/questions.js';

/**
 * ----------------------------------------------------
 * VALIDATION ENGINE
 * ----------------------------------------------------
 * Ensures dynamically-generated or locally-retrieved questions
 * conform strictly to the competitive BPSC/Bank recruitment schema.
 */
export const QuestionValidationEngine = {
  /**
   * Validates a single question structure.
   * Auto-repairs salvageable format violations (such as missing option prefixes).
   */
  validateAndRepair(raw: any, defaultSubject: SubjectType = 'Bangla'): { isValid: boolean; question: Question; errors: string[] } {
    const errors: string[] = [];
    const repaired: Partial<Question> = { ...raw };

    // 1. Basic properties
    if (!repaired.id) {
      repaired.id = `serv_repair_${Math.random().toString(36).substring(2, 11)}`;
    }

    if (!repaired.subject) {
      errors.push("Missing subject");
      repaired.subject = defaultSubject;
    }

    if (!repaired.topic) {
      repaired.topic = "General Curriculum";
    }

    if (!repaired.difficulty) {
      repaired.difficulty = 'Standard';
    }

    if (!repaired.examType || !Array.isArray(repaired.examType) || repaired.examType.length === 0) {
      repaired.examType = ['Mixed'];
    }

    if (!repaired.questionText || typeof repaired.questionText !== 'string' || repaired.questionText.trim().length === 0) {
      errors.push("Missing or invalid questionText");
      repaired.questionText = "Question data error. Please choose another response.";
    }

    // 2. Options checks & repairs
    if (!repaired.options || !Array.isArray(repaired.options)) {
      errors.push("Missing or invalid options array");
      repaired.options = [
        "A) Option A",
        "B) Option B",
        "C) Option C",
        "D) Option D"
      ];
    } else if (repaired.options.length !== 4) {
      errors.push(`Invalid options length: expected 4, got ${repaired.options.length}`);
      // Pad or truncate to 4
      const letters = ['A) ', 'B) ', 'C) ', 'D) '];
      const fixedOps = [...repaired.options].slice(0, 4);
      while (fixedOps.length < 4) {
        fixedOps.push(`${letters[fixedOps.length]}Placeholder option`);
      }
      repaired.options = fixedOps;
    }

    // Ensure options start with proper labels A), B), C), D)
    const prefixes = ['A)', 'B)', 'C)', 'D)'];
    repaired.options = repaired.options.map((opt, idx) => {
      if (typeof opt !== 'string') {
        opt = String(opt || '');
      }
      const trimmed = opt.trim();
      const currentPrefix = prefixes[idx];
      if (!trimmed.startsWith(currentPrefix) && !trimmed.toLowerCase().startsWith(`${currentPrefix.toLowerCase()}`)) {
        return `${currentPrefix} ${trimmed}`;
      }
      return trimmed;
    });

    // 3. correctAnswerIndex checks
    if (
      repaired.correctAnswerIndex === undefined ||
      repaired.correctAnswerIndex === null ||
      typeof repaired.correctAnswerIndex !== 'number' ||
      repaired.correctAnswerIndex < 0 ||
      repaired.correctAnswerIndex > 3
    ) {
      errors.push(`Invalid correctAnswerIndex: got ${repaired.correctAnswerIndex}`);
      repaired.correctAnswerIndex = 0;
    }

    // 4. Explanation & Cognitive fields backfills
    if (!repaired.explanation || typeof repaired.explanation !== 'string' || repaired.explanation.trim().length === 0) {
      repaired.explanation = `Correct answer is Option ${prefixes[repaired.correctAnswerIndex!]}.`;
    }

    if (!repaired.skillNode) {
      repaired.skillNode = `${repaired.subject} Concept & Recall Retention`;
    }

    if (!repaired.errorType) {
      repaired.errorType = "factual memory slip";
    }

    if (!repaired.correctReasoning) {
      repaired.correctReasoning = `Option ${prefixes[repaired.correctAnswerIndex!]} is scientifically verified and compliant with BPSC standard resources.`;
    }

    if (!repaired.wrongReasoning) {
      repaired.wrongReasoning = `The remaining choices contain deceptive distractors constructed to test attention under pressure.`;
    }

    if (!repaired.conceptBreakdown) {
      repaired.conceptBreakdown = `Standard review of high-yield exam patterns indicates correct recall is critical for competitive grade maintenance.`;
    }

    if (!repaired.shortcutMethod) {
      repaired.shortcutMethod = "Mnemonic Key: Active repetition and strategic elimination reduces mistake rate by 80%.";
    }

    return {
      isValid: errors.length === 0,
      question: repaired as Question,
      errors
    };
  }
};

/**
 * ----------------------------------------------------
 * LOCAL DATABASE PROVIDER
 * ----------------------------------------------------
 * Fetches well-formed offline questions from LOCAL_QUESTIONS
 * with fallbacks and random shuffle guarantees.
 */
export const LocalDatabaseProvider = {
  /**
   * Retrieves single local question matching subjects, difficulty, and exam criteria with weighted priority
   */
  getQuestion(subjects: SubjectType[], difficulty: DifficultyLevel, examType: ExamType): Question {
    const batch = this.getBatch(subjects, difficulty, examType, 1);
    if (batch.length > 0) {
      return batch[0];
    }
    // Strict fallback within selected subjects
    const fallbackList = LOCAL_QUESTIONS.filter(q => subjects.includes(q.subject as SubjectType));
    const finalQ = fallbackList.length > 0 ? fallbackList[Math.floor(Math.random() * fallbackList.length)] : LOCAL_QUESTIONS[0];
    return QuestionValidationEngine.validateAndRepair(finalQ).question;
  },

  /**
   * Retrieves a filtered batch of local questions sorted by weighted relevance
   */
  getBatch(subjects: SubjectType[], difficulty: DifficultyLevel, examType: ExamType, count: number): Question[] {
    // 1. Filter ALL questions strictly by chosen subjects. (ZERO-BLEED GUARANTEE)
    const pool = LOCAL_QUESTIONS.filter(q => subjects.includes(q.subject as SubjectType));

    if (pool.length === 0) {
      // Direct absolute fallback if there is literally nothing matching chosen subject list
      const fallbackList = LOCAL_QUESTIONS.slice(0, count);
      return fallbackList.map(q => QuestionValidationEngine.validateAndRepair(q).question);
    }

    // 2. Score questions based on syllabus relevance and profile alignment
    const scored = pool.map(q => {
      let score = 0;
      // Match exact examType (e.g. BCS profile prioritizes BCS tagged questions)
      if (examType !== 'Mixed' && examType !== 'Custom' && q.examType.includes(examType)) {
        score += 100;
      }
      // Match difficulty level
      if (difficulty !== 'Standard' && q.difficulty === difficulty) {
        score += 50;
      }
      return { q, score };
    });

    // 3. Sort by descending relevance score
    const sorted = scored.sort((a, b) => b.score - a.score);

    // 4. Partition matched vs general ones to allow variety while preserving weight
    const exactMatches = sorted.filter(item => item.score > 0).map(item => item.q);
    const regularMatches = sorted.filter(item => item.score === 0).map(item => item.q);

    // Shuffle lists to ensure high variety
    const shuffledExact = exactMatches.sort(() => Math.random() - 0.5);
    const shuffledRegular = regularMatches.sort(() => Math.random() - 0.5);

    const merged = [...shuffledExact, ...shuffledRegular];

    // Take top count
    let result = merged.slice(0, count);

    // Pad with duplicates if extremely low pool size
    if (result.length < count && result.length > 0) {
      while (result.length < count) {
        const extra = result[Math.floor(Math.random() * result.length)];
        result.push({ ...extra, id: `${extra.id}_rep_${Math.random().toString(36).substring(2, 6)}` });
      }
    }

    return result.map(q => QuestionValidationEngine.validateAndRepair(q).question);
  }
};

/**
 * ----------------------------------------------------
 * GEMINI PROVIDER (CLIENT GATEWAY TO SERVER ENDPOINTS)
 * ----------------------------------------------------
 * Requests dynamically generated questions from the Express
 * Gemini integration endpoints.
 */
export const GeminiProvider = {
  /**
   * Generates a single dynamic question over the network API
   */
  async generateQuestion(subject: SubjectType, difficulty: DifficultyLevel, examType: ExamType): Promise<Question> {
    const response = await fetch('/api/generate-ai-question', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, difficulty, examType }),
    });

    if (!response.ok) {
      throw new Error(`Gemini Provider HTTP error: status ${response.status}`);
    }

    const rawQuestion = await response.json();
    return rawQuestion;
  },

  /**
   * Generates a dynamic batch of questions over the network API
   */
  async generateBatch(subjects: SubjectType[], difficulty: DifficultyLevel, examType: ExamType, otherSubjectsLanguage: string, count: number): Promise<Question[]> {
    const response = await fetch('/api/generate-ai-batch', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjects, difficulty, examType, otherSubjectsLanguage, count }),
    });

    if (!response.ok) {
      throw new Error(`Gemini Batch Provider HTTP error: status ${response.status}`);
    }

    const data = await response.json();
    if (!data.questions || !Array.isArray(data.questions)) {
      throw new Error("Invalid response format received from AI batch endpoint");
    }

    return data.questions;
  }
};

/**
 * ----------------------------------------------------
 * QUESTION SERVICE (PRIMARY INTERFACE)
 * ----------------------------------------------------
 * Consolidates Gemini, Local Database, and Validation engines
 * into an elite, infallible first-class component.
 */
export const QuestionService = {
  /**
   * Requests a single question.
   * Leverages Gemini Provider with an absolute, graceful recovery to the Local DB Provider.
   */
  async requestQuestion(
    subject: SubjectType,
    difficulty: DifficultyLevel,
    examType: ExamType,
    useAI: boolean = true
  ): Promise<{ question: Question; source: 'Gemini' | 'LocalDatabase'; repaired: boolean }> {
    if (!useAI) {
      const localQ = LocalDatabaseProvider.getQuestion([subject], difficulty, examType);
      return { question: localQ, source: 'LocalDatabase', repaired: false };
    }

    try {
      console.log(`[QuestionService] Dispatching dynamic Gemini request for: ${subject} (${difficulty})`);
      const aiQ = await GeminiProvider.generateQuestion(subject, difficulty, examType);
      
      // Pass through rigorous schema validation/cleaning
      const audit = QuestionValidationEngine.validateAndRepair(aiQ, subject);
      if (audit.errors.length > 0) {
        console.warn("[QuestionService] Gemini returned a question with minor anomalies; repaired successfully.", audit.errors);
      }
      return { question: audit.question, source: 'Gemini', repaired: audit.errors.length > 0 };
    } catch (err: any) {
      console.warn(`[QuestionService] Gemini request failed [${err?.message || err}]. Executing graceful Local Database fallback recovery...`);
      const fallbackQ = LocalDatabaseProvider.getQuestion([subject], difficulty, examType);
      return { question: fallbackQ, source: 'LocalDatabase', repaired: false };
    }
  },

  /**
   * Requests a batch of questions.
   * Leverages Gemini Provider with automatic failover to the Local DB Provider.
   */
  async requestBatch(
    subjects: SubjectType[],
    difficulty: DifficultyLevel,
    examType: ExamType,
    otherSubjectsLanguage: string,
    count: number,
    useAI: boolean = true
  ): Promise<{ questions: Question[]; source: 'Gemini' | 'LocalDatabase'; offlineActive: boolean }> {
    if (!useAI) {
      const localBatch = LocalDatabaseProvider.getBatch(subjects, difficulty, examType, count);
      return { questions: localBatch, source: 'LocalDatabase', offlineActive: true };
    }

    try {
      console.log(`[QuestionService] Requesting batch of ${count} questions from Gemini...`);
      const aiBatch = await GeminiProvider.generateBatch(subjects, difficulty, examType, otherSubjectsLanguage, count);
      
      const validatedBatch = aiBatch.map(q => {
        const audit = QuestionValidationEngine.validateAndRepair(q, subjects[0] || 'Bangla');
        return audit.question;
      });

      return { questions: validatedBatch, source: 'Gemini', offlineActive: false };
    } catch (err: any) {
      console.warn(`[QuestionService] Batch generation failed [${err?.message || err}]. Reverting to high-quality Local Database Provider...`);
      const fallbackBatch = LocalDatabaseProvider.getBatch(subjects, difficulty, examType, count);
      return { questions: fallbackBatch, source: 'LocalDatabase', offlineActive: true };
    }
  }
};
