export enum HiringRecommendation {
  HIRE = 'HIRE',
  MAYBE = 'MAYBE',
  REJECT = 'REJECT'
}

export interface PersonalityProfile {
  archetype: string;
  traits: string[];
  communicationStyle: string;
  cultureFit: string;
}

export interface AnalysisResult {
  candidateName: string;
  score: number;
  headline: string;
  summary: string;
  pros: string[];
  cons: string[];
  skillsGap: string[];
  personality: PersonalityProfile;
  recommendation: HiringRecommendation;
  reasoning: string;
}

export interface InterviewQuestion {
  topic: string;
  question: string;
  guidance?: string;
}

export interface TechnicalQuestion {
  skill: string;
  question: string;
  expectedKeyPoints: string[];
}

export interface BehavioralQuestion {
  competency: string;
  question: string;
  starGuide: string; // Specific STAR guidance
}

export interface InterviewPlan {
  opening: string;
  backgroundQuestions: InterviewQuestion[];
  technicalQuestions: TechnicalQuestion[];
  behavioralQuestions: BehavioralQuestion[];
  closing: string;
}

export interface JobContext {
  title: string;
  description: string;
}

export type FileType = 'text' | 'image' | 'pdf';

export interface UploadedFile {
  id: string; // Unique ID for list management
  type: FileType;
  content: string; // Text content or Base64 string
  name: string;
  mimeType?: string;
}

export type AnalysisStatus = 'idle' | 'analyzing' | 'completed' | 'error';

export interface BatchItem {
  file: UploadedFile;
  status: AnalysisStatus;
  result: AnalysisResult | null;
  error?: string;
}

export interface HistorySession {
  id: string;
  timestamp: number;
  jobTitle: string;
  jobDescription: string;
  items: BatchItem[];
  totalCandidates: number;
  averageScore: number;
}