import { IsOptional, IsUUID, IsInt, Min, Max, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class FilterCourseReviewDto {
  @IsOptional()
  @IsUUID()
  course_id?: string;

  @IsOptional()
  @IsUUID()
  student_id?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsDateString()
  created_from?: string;

  @IsOptional()
  @IsDateString()
  created_to?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  page: number = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  limit: number = 20;
}