import { IsNotEmpty, IsOptional, IsString, IsUUID, IsNumber, IsPositive, Max, Min } from 'class-validator';

export class CreateTeacherDto {
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
  specialty?: string;
}