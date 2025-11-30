import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class CreateLessonProgressDto {
  @IsUUID()
  lesson_id: string;
}
