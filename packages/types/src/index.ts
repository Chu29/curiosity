// Shared TypeScript types for Science & Technology Learning Platform

export type ID = string;

export interface BaseEntity {
  id: ID;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type SourceType =
  | 'ACADEMIC_PAPER'
  | 'BOOK'
  | 'SCIENTIFIC_ORGANIZATION'
  | 'UNIVERSITY'
  | 'TECHNICAL_DOCUMENTATION'
  | 'ARTICLE'
  | 'VIDEO'
  | 'NEWS'
  | 'OTHER';

export type QuestionStatus = 'PENDING' | 'COMPLETED';

export interface SuggestedPlatform {
  name: string;
  url: string;
}

export interface ParsedRequirements {
  timeLimitMinutes: number;
  requiredCoverage: string[];
  concepts: string[];
  suggestedSourceTypes: string[];
  suggestedPlatforms: SuggestedPlatform[];
  checklist: string[];
}

export interface ResearchQuestionDraft {
  question: string;
  required: boolean;
}

export interface ResearchGuideDraft {
  objective: string;
  questions: ResearchQuestionDraft[];
  presentationRequirements: string;
  parsedRequirements?: ParsedRequirements;
}

export interface CreateNoteInput {
  content: string;
  researchQuestionId?: string | null;
  sourceIds?: string[];
}

export interface UpdateNoteInput {
  content?: string;
  researchQuestionId?: string | null;
  sourceIds?: string[];
}

export interface CreateSourceInput {
  title: string;
  url: string;
  authorOrganization?: string | null;
  sourceType: SourceType;
  description?: string | null;
}

export interface UpdateSourceInput {
  title?: string;
  url?: string;
  authorOrganization?: string | null;
  sourceType?: SourceType;
  description?: string | null;
}

export interface ResearchQuestionItem {
  id: ID;
  researchGuideId: ID;
  question: string;
  orderIndex: number;
  required: boolean;
  status: QuestionStatus;
  completedAt?: Date | string | null;
}

export interface ResearchGuideResponse {
  id: ID;
  learningSessionId: ID;
  objective: string;
  presentationRequirements?: string | null;
  version: number;
  generatedBy?: string | null;
  modelVersion?: string | null;
  promptVersion?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  questions: ResearchQuestionItem[];
  parsedRequirements?: ParsedRequirements;
}

export interface NoteItem extends BaseEntity {
  learningSessionId: ID;
  researchQuestionId?: ID | null;
  content: string;
  sources?: SourceItem[];
  noteSources?: { noteId: ID; sourceId: ID }[];
}

export interface SourceItem extends BaseEntity {
  learningSessionId: ID;
  title: string;
  url: string;
  authorOrganization?: string | null;
  sourceType: SourceType;
  description?: string | null;
  _count?: {
    noteSources: number;
  };
}
