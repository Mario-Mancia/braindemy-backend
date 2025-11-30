import { IsUUID, IsOptional, IsEnum } from 'class-validator';
import { enrollment_status } from '@prisma/client';

export class CreateCourseEnrollmentDto {
  @IsUUID()
  course_id: string;

  @IsOptional()
  @IsUUID()
  payment_id?: string;

  @IsOptional()
  @IsEnum(enrollment_status)
  status?: enrollment_status;
}
