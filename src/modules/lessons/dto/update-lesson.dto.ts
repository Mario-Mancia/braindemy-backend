import { IsOptional, IsString, IsUrl, IsInt, Min } from 'class-validator';

export class UpdateLessonDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsUrl()
  video_url?: string;

  @IsOptional()
  @IsUrl()
  file_url?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  position?: number;
}