import { IsBoolean, IsOptional, IsString, IsEnum, Length } from 'class-validator';
import { notification_type } from '@prisma/client';

export class UpdateNotificationDto {
  @IsOptional()
  @IsString()
  @Length(3, 100)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(3, 500)
  message?: string;

  @IsOptional()
  @IsEnum(notification_type)
  type?: notification_type;

  @IsOptional()
  @IsBoolean()
  is_read?: boolean;
}
