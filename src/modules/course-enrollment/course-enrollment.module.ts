import { Module } from '@nestjs/common';
import { CourseEnrollmentController } from './course-enrollment.controller';
import { CourseEnrollmentService } from './course-enrollment.service';

@Module({
  controllers: [CourseEnrollmentController],
  providers: [CourseEnrollmentService]
})
export class CourseEnrollmentModule {}
