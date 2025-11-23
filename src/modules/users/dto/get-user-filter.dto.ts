import { IsOptional, IsEnum, IsString, IsNumberString } from 'class-validator';
import { $Enums } from '@prisma/client';

export class GetUsersFiltersDto {
  @IsOptional()
  @IsEnum($Enums.user_role)
  role?: $Enums.user_role;

  @IsOptional()
  @IsEnum($Enums.user_status)
  status?: $Enums.user_status;

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