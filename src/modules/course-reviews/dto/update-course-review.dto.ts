import { IsOptional, IsInt, Min, Max, IsString, Length } from 'class-validator';

export class UpdateCourseReviewDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  comment?: string;
}