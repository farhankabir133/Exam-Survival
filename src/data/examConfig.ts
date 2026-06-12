import { ExamType, SubjectType } from '../types.js';

export interface ExamProfile {
  id: ExamType;
  label: string;
  desc: string;
  subjects: SubjectType[];
}

export const EXAM_PROFILES: Record<ExamType, ExamProfile> = {
  BCS: {
    id: 'BCS',
    label: 'BCS / Civil Service',
    desc: 'High-yield Literature, Science, ICT, Math, Bangladesh Affairs, International Affairs, Mental Ability',
    subjects: ['Bangla', 'English', 'Mathematics', 'General Science', 'ICT', 'Bangladesh Affairs', 'International Affairs', 'Mental Ability']
  },
  Bank: {
    id: 'Bank',
    label: 'Bangladesh Bank AD',
    desc: 'Advanced banking focus: Math, English, Analytical Ability (Mental Ability), Current Affairs, ICT',
    subjects: ['Mathematics', 'English', 'Mental Ability', 'International Affairs', 'ICT']
  },
  Mixed: {
    id: 'Mixed',
    label: 'Unified / Govt Jobs',
    desc: 'Syllabus of standard ministry grade jobs: Bangla, English, Math, General Science, ICT, Bangladesh Affairs, Mental Ability',
    subjects: ['Bangla', 'English', 'Mathematics', 'General Science', 'ICT', 'Bangladesh Affairs', 'Mental Ability']
  },
  Custom: {
    id: 'Custom',
    label: 'Custom Syllabus Practice',
    desc: 'Manual candidate syllabus configuration. Set custom pool target subjects below',
    subjects: []
  }
};
