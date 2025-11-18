import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateStudentDto {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

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