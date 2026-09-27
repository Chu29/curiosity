import { IsString, IsNotEmpty, IsUrl, IsOptional, IsEnum } from 'class-validator';
import { SourceType } from '@prisma/client';

export class CreateSourceDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsUrl()
  @IsNotEmpty()
  url!: string;

  @IsOptional()
  @IsString()
  authorOrganization?: string | null;

  @IsEnum(SourceType)
  sourceType!: SourceType;

  @IsOptional()
  @IsString()
  description?: string | null;
}
