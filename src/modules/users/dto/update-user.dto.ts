import { IsOptional, IsString, MinLength, IsDateString, IsEnum } from 'class-validator';
import { $Enums } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsDateString()
  birthdate?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  new_password?: string;
}