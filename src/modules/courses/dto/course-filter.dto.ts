import { IsOptional, IsString, IsUUID, IsNumber, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CourseFilterDto {

  @IsOptional()
  @IsString()
  search?: string; // Este parámetro acepta cualquier tipo de texto para  el filtrado.

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsUUID()
  teacher_id?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  min_price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  max_price?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit: number = 10;
}
