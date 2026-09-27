import { IsString, IsOptional, IsUUID, IsArray } from 'class-validator';

export class UpdateNoteDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsUUID()
  researchQuestionId?: string | null;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  sourceIds?: string[];
}
