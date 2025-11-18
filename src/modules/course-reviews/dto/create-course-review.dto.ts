import { IsUUID, IsInt, Min, Max, IsOptional, IsString } from 'class-validator';

export class CreateCourseReviewDto {
  @IsUUID()
  course_id: string;

  @IsUUID()
  student_id: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;
}