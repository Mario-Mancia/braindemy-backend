import { IsOptional, IsUUID, IsEnum } from 'class-validator';
import { enrollment_status } from '@prisma/client';

export class UpdateCourseEnrollmentDto {
  @IsOptional()
  @IsUUID()
  payment_id?: string;

  @IsOptional()
  @IsEnum(enrollment_status)
  status?: enrollment_status;
}