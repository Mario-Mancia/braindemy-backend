import { IsOptional, IsEnum } from 'class-validator';
import { $Enums } from '@prisma/client';

export class AdminUpdateUserDto {
  @IsOptional()
  @IsEnum($Enums.user_role)
  role?: $Enums.user_role;

  @IsOptional()
  @IsEnum($Enums.user_status)
  status?: $Enums.user_status;
}