import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class LessonProgressFilterDto {
  @IsOptional()
  @IsUUID()
  lesson_id?: string;

  @IsOptional()
  @IsUUID()
  student_id?: string;
}