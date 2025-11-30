import {
  IsUUID,
  IsString,
  IsOptional,
  IsEnum,
  Length,
} from 'class-validator';
import { notification_type } from '@prisma/client';

export class CreateNotificationDto {
  @IsUUID()
  user_id: string;

  @IsString()
  @Length(3, 100)
  title: string;

  @IsString()
  @Length(3, 500)
  message: string;

  @IsOptional()
  @IsEnum(notification_type)
  type?: notification_type;
}
