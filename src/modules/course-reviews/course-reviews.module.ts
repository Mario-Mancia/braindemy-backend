import { Module } from '@nestjs/common';
import { CourseReviewsService } from './course-reviews.service';
import { CourseReviewsController } from './course-reviews.controller';

@Module({
  providers: [CourseReviewsService],
  controllers: [CourseReviewsController]
})
export class CourseReviewsModule {}
