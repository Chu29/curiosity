import { IsString, IsOptional, IsUrl, IsEnum } from 'class-validator';
import { SourceType } from '@prisma/client';

export class UpdateSourceDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsString()
  authorOrganization?: string | null;

  @IsOptional()
  @IsEnum(SourceType)
  sourceType?: SourceType;

  @IsOptional()
  @IsString()
  description?: string | null;
}
