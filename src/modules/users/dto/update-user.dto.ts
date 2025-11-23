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

  // ⚠️ Cambio importante → new_password en lugar de password
  @IsOptional()
  @IsString()
  @MinLength(8)
  new_password?: string;

  @IsOptional()
  @IsEnum($Enums.user_role)
  role?: $Enums.user_role;

  @IsOptional()
  @IsEnum($Enums.user_status)
  status?: $Enums.user_status;
}