import { IsUUID, IsString, IsOptional, IsUrl, IsInt, Min } from 'class-validator';

export class CreateLessonDto {
  @IsUUID()
  course_id: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsUrl()
  video_url?: string;

  @IsOptional()
  @IsUrl()
  file_url?: string;

  @IsInt()
  @Min(1)
  position: number;
}