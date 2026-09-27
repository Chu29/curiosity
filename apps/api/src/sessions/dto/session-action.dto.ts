import { IsOptional, IsString } from 'class-validator';

export class SessionActionDto {
  @IsOptional()
  @IsString({ message: 'guestToken must be a string' })
  guestToken?: string;
}
