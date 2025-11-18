import { IsEmail, IsOptional, IsString, MinLength, IsEnum } from 'class-validator';
import { user_role } from '@prisma/client';

export class RegisterDto {
  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsEmail()
  email: string;

  @MinLength(8)
  @IsString()
  password: string;

  @IsOptional()
  @IsEnum(user_role)
  role?: user_role;
}