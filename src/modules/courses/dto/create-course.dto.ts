import { IsUUID, IsString, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';

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
  @Min(0)
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
