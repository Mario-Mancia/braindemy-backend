import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class GetStudentsFiltersDto {
  @IsOptional()
  @IsString()
  academy?: string;

  @IsOptional()
  @IsString()
  academic_level?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;
}