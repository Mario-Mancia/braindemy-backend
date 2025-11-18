import { IsUUID, IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateCourseDto {
  @IsUUID()
  teacher_id: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  schedule?: any;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}