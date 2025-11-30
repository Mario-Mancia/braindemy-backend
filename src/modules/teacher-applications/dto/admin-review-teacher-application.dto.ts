import { IsEnum, IsOptional, IsString } from 'class-validator';
import { teacher_application_status } from '@prisma/client';

export class AdminReviewTeacherApplicationDto {
  @IsEnum(teacher_application_status)
  status: teacher_application_status;

  @IsOptional()
  @IsString()
  admin_comment?: string;
}
