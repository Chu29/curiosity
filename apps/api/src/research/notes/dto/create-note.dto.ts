import { IsString, IsNotEmpty, IsOptional, IsUUID, IsArray } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsOptional()
  @IsUUID()
  researchQuestionId?: string | null;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  sourceIds?: string[];
}
