import { IsUUID, IsInt, Min, Max, IsOptional, IsString, Length } from 'class-validator';

export class CreateCourseReviewDto {
  @IsUUID()
  course_id: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  comment?: string;
}
