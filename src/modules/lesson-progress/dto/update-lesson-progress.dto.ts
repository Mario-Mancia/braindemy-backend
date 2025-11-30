import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class UpdateLessonProgressDto {
  @IsOptional()
  @IsBoolean()
  is_completed?: boolean;
}