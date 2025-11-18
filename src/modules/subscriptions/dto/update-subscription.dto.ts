import { IsString, IsNumber, IsOptional, IsInt, IsObject } from 'class-validator';

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsInt()
  max_courses?: number;

  @IsOptional()
  @IsInt()
  max_students_per_course?: number;

  @IsOptional()
  @IsObject()
  features?: any;
}