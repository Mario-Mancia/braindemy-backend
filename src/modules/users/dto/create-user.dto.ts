import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsDateString, IsEnum } from 'class-validator';
import { $Enums } from '@prisma/client';

export class CreateUserDto {
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
  @IsEnum($Enums.user_role)
  role?: $Enums.user_role;

  @IsOptional()
  @IsEnum($Enums.user_status)
  status?: $Enums.user_status;
}