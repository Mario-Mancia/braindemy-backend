import { IsUUID, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { subscription_status } from '@prisma/client';

export class CreateTeacherSubscriptionsDto {
  @IsUUID()
  teacher_id: string;

  @IsUUID()
  subscription_id: string;

  @IsOptional()
  @IsUUID()
  payment_id?: string;

  @IsDateString()
  start_date: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsEnum(subscription_status)
  status?: subscription_status;
}
