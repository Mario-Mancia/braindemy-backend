import { IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateTeacherApplicationDto {
  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsString()
  experience?: string;

  @IsOptional()
  @IsUrl()
  portfolio_url?: string;
}