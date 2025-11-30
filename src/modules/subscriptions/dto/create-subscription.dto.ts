import { IsString, IsNumber, IsOptional, IsInt, IsObject, Min } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  name: string;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  price: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  max_courses?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  max_students_per_course?: number;

  @IsOptional()
  @IsObject()
  features?: Record<string, any>;
}