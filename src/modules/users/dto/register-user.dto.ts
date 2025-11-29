import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsDateString, IsEnum, IsIn} from 'class-validator'
import { user_role, user_status } from '@prisma/client';

export class RegisterUserDto {
  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsDateString()
  birthdate?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsIn(['student', 'teacher'])
  role?: 'student' | 'teacher';
}