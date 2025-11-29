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
}