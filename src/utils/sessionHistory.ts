import { SubjectType } from '../types.js';

export interface SessionError {
  subject: SubjectType;
  errorType: string;
}

export interface SessionRecord {
  id: string;
  timestamp: string;
  sessionLabel: string;
  totalScore: number;
  maxStreak: number;
  errors: SessionError[];
}

const STORAGE_KEY = 'exam_survival_sessions_v1';

// Detailed realistic mock sessions to populate initial analytics
const INITIAL_MOCK_SESSIONS: SessionRecord[] = [
  {
    id: 'mock_1',
    timestamp: '2026-06-01T10:00:00Z',
    sessionLabel: 'Session 1',
    totalScore: 280,
    maxStreak: 3,
    errors: [
      { subject: 'Mathematics', errorType: 'Concept Gap' },
      { subject: 'English', errorType: 'Time Lag Panic' },
      { subject: 'Bangla', errorType: 'Distractor Trap' },
      { subject: 'General Science', errorType: 'Careless Slip' }
    ]
  },
  {
    id: 'mock_2',
    timestamp: '2026-06-02T11:15:00Z',
    sessionLabel: 'Session 2',
    totalScore: 450,
    maxStreak: 5,
    errors: [
      { subject: 'Mathematics', errorType: 'Concept Gap' },
      { subject: 'ICT', errorType: 'Careless Slip' },
      { subject: 'English', errorType: 'Distractor Trap' }
    ]
  },
  {
    id: 'mock_3',
    timestamp: '2026-06-03T14:30:00Z',
    sessionLabel: 'Session 3',
    totalScore: 390,
    maxStreak: 4,
    errors: [
      { subject: 'Mental Ability', errorType: 'Careless Slip' },
      { subject: 'International Affairs', errorType: 'Time Lag Panic' },
      { subject: 'Bangla', errorType: 'Distractor Trap' }
    ]
  },
  {
    id: 'mock_4',
    timestamp: '2026-06-04T09:45:00Z',
    sessionLabel: 'Session 4',
    totalScore: 680,
    maxStreak: 7,
    errors: [
      { subject: 'Mathematics', errorType: 'Concept Gap' },
      { subject: 'General Science', errorType: 'Time Lag Panic' }
    ]
  },
  {
    id: 'mock_5',
    timestamp: '2026-06-05T16:20:00Z',
    sessionLabel: 'Session 5',
    totalScore: 520,
    maxStreak: 6,
    errors: [
      { subject: 'Bangladesh Affairs', errorType: 'Distractor Trap' },
      { subject: 'English', errorType: 'Careless Slip' },
      { subject: 'ICT', errorType: 'Concept Gap' }
    ]
  },
  {
    id: 'mock_6',
    timestamp: '2026-06-06T12:10:00Z',
    sessionLabel: 'Session 6',
    totalScore: 880,
    maxStreak: 9,
    errors: [
      { subject: 'Bangla', errorType: 'Careless Slip' },
      { subject: 'Mental Ability', errorType: 'Distractor Trap' }
    ]
  },
  {
    id: 'mock_7',
    timestamp: '2026-06-07T18:00:00Z',
    sessionLabel: 'Session 7',
    totalScore: 1150,
    maxStreak: 11,
    errors: [
      { subject: 'Mathematics', errorType: 'Concept Gap' },
      { subject: 'English', errorType: 'Time Lag Panic' }
    ]
  },
  {
    id: 'mock_8',
    timestamp: '2026-06-08T15:30:00Z',
    sessionLabel: 'Session 8',
    totalScore: 1620,
    maxStreak: 15,
    errors: [
      { subject: 'International Affairs', errorType: 'Distractor Trap' }
    ]
  },
  {
    id: 'mock_9',
    timestamp: '2026-06-09T13:40:00Z',
    sessionLabel: 'Session 9',
    totalScore: 2150,
    maxStreak: 19,
    errors: [
      { subject: 'General Science', errorType: 'Careless Slip' }
    ]
  }
];

export function getSessionHistory(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Return initial seed history
      return [...INITIAL_MOCK_SESSIONS];
    }
    const parsed = JSON.parse(raw) as SessionRecord[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [...INITIAL_MOCK_SESSIONS];
    }
    return parsed;
  } catch (err) {
    console.error('Failed to parse session history:', err);
    return [...INITIAL_MOCK_SESSIONS];
  }
}

export function saveSessionHistory(sessions: SessionRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.error('Failed to save session history:', err);
  }
}

export function addSessionRecord(
  score: number,
  maxStreak: number,
  errors: SessionError[]
): SessionRecord[] {
  const history = getSessionHistory();
  
  // Create next session label based on number of sessions in store
  const userPlayedCount = history.filter(s => !s.id.startsWith('mock')).length;
  const nextSessionNum = userPlayedCount + 10; // offset mocks starting from S10
  
  const newRecord: SessionRecord = {
    id: `session_${Date.now()}`,
    timestamp: new Date().toISOString(),
    sessionLabel: `Run ${nextSessionNum}`,
    totalScore: score,
    maxStreak,
    errors: errors.length > 0 ? errors : [{ subject: 'General Science', errorType: 'Careless Slip' }]
  };

  const updated = [...history, newRecord];
  saveSessionHistory(updated);
  return updated;
}

export function prepareChartData(sessions: SessionRecord[]) {
  // Take only the last 10 sessions from the history list for current tracking
  const last10 = sessions.slice(-10);
  
  return last10.map((sess) => {
    const dataPoint: any = {
      label: sess.sessionLabel,
      totalErrors: sess.errors.length,
      totalScore: sess.totalScore,
      maxStreak: sess.maxStreak,
      // Initialize subjects to 0
      'Bangla': 0,
      'English': 0,
      'Mathematics': 0,
      'ICT': 0,
      'Bangladesh Affairs': 0,
      'International Affairs': 0,
      'General Science': 0,
      'Mental Ability': 0,
      // Initialize error types to 0
      'Concept Gap': 0,
      'Time Lag Panic': 0,
      'Careless Slip': 0,
      'Distractor Trap': 0
    };
    
    sess.errors.forEach(err => {
      // Map subject if found
      if (dataPoint[err.subject] !== undefined) {
        dataPoint[err.subject]++;
      } else {
        // Handle direct assignments in case of dynamic names
        dataPoint[err.subject] = (dataPoint[err.subject] || 0) + 1;
      }
      
      // Normalize error types to standard buckets
      let normalizedType = 'Concept Gap';
      const t = err.errorType.toLowerCase();
      if (t.includes('time') || t.includes('lag') || t.includes('speed') || t.includes('pressure') || t.includes('panic')) {
        normalizedType = 'Time Lag Panic';
      } else if (t.includes('careless') || t.includes('slip') || t.includes('impulse')) {
        normalizedType = 'Careless Slip';
      } else if (t.includes('distractor') || t.includes('trap') || t.includes('option') || t.includes('confused') || t.includes('tricky')) {
        normalizedType = 'Distractor Trap';
      } else {
        normalizedType = 'Concept Gap';
      }
      
      dataPoint[normalizedType]++;
    });
    
    return dataPoint;
  });
}

