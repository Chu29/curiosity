import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSessionDto {
  @IsUUID('4', { message: 'topicId must be a valid UUID' })
  @IsNotEmpty({ message: 'topicId is required' })
  topicId!: string;

  @IsOptional()
  @IsString({ message: 'guestToken must be a string' })
  guestToken?: string;
}
