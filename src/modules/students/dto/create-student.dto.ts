import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateStudentDto {
  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  academy?: string;

  @IsOptional()
  @IsString()
  academic_level?: string;
}