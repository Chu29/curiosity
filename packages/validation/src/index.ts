import { z } from 'zod';

export const IdSchema = z.string().uuid();

export const SourceTypeSchema = z.enum([
  'ACADEMIC_PAPER',
  'BOOK',
  'SCIENTIFIC_ORGANIZATION',
  'UNIVERSITY',
  'TECHNICAL_DOCUMENTATION',
  'ARTICLE',
  'VIDEO',
  'NEWS',
  'OTHER',
]);

export type SourceType = z.infer<typeof SourceTypeSchema>;

export const QuestionStatusSchema = z.enum(['PENDING', 'COMPLETED']);
export type QuestionStatus = z.infer<typeof QuestionStatusSchema>;

export const SuggestedPlatformSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
});

export const ParsedRequirementsSchema = z.object({
  timeLimitMinutes: z.number().int().min(1).default(5),
  requiredCoverage: z.array(z.string().min(1)).min(1),
  concepts: z.array(z.string().min(1)).min(1),
  suggestedSourceTypes: z.array(z.string().min(1)).min(1),
  suggestedPlatforms: z.array(SuggestedPlatformSchema).min(1),
  checklist: z.array(z.string().min(1)).min(1),
});

export type ParsedRequirements = z.infer<typeof ParsedRequirementsSchema>;

export const ResearchQuestionDraftSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters long'),
  required: z.boolean().default(true),
});

export type ResearchQuestionDraft = z.infer<typeof ResearchQuestionDraftSchema>;

export const ResearchGuideDraftSchema = z.object({
  objective: z.string().min(10, 'Objective must be at least 10 characters long'),
  questions: z.array(ResearchQuestionDraftSchema).min(3, 'Guide must include at least 3 research questions'),
  presentationRequirements: z.string().min(10, 'Presentation requirements must be provided'),
  parsedRequirements: ParsedRequirementsSchema.optional(),
});

export type ResearchGuideDraft = z.infer<typeof ResearchGuideDraftSchema>;

export const CreateNoteSchema = z.object({
  content: z.string().min(1, 'Note content cannot be empty'),
  researchQuestionId: z.string().uuid().optional().nullable(),
  sourceIds: z.array(z.string().uuid()).optional(),
});

export type CreateNoteInput = z.infer<typeof CreateNoteSchema>;

export const UpdateNoteSchema = z.object({
  content: z.string().min(1, 'Note content cannot be empty').optional(),
  researchQuestionId: z.string().uuid().optional().nullable(),
  sourceIds: z.array(z.string().uuid()).optional(),
});

export type UpdateNoteInput = z.infer<typeof UpdateNoteSchema>;

export const CreateSourceSchema = z.object({
  title: z.string().min(1, 'Source title cannot be empty'),
  url: z.string().url('Must be a valid URL'),
  authorOrganization: z.string().optional().nullable(),
  sourceType: SourceTypeSchema,
  description: z.string().optional().nullable(),
});

export type CreateSourceInput = z.infer<typeof CreateSourceSchema>;

export const UpdateSourceSchema = z.object({
  title: z.string().min(1, 'Source title cannot be empty').optional(),
  url: z.string().url('Must be a valid URL').optional(),
  authorOrganization: z.string().optional().nullable(),
  sourceType: SourceTypeSchema.optional(),
  description: z.string().optional().nullable(),
});

export type UpdateSourceInput = z.infer<typeof UpdateSourceSchema>;

export { z };
