import { Module } from '@nestjs/common';
import { LessonProgressService } from './lesson-progress.service';
import { LessonProgressController } from './lesson-progress.controller';

@Module({
  providers: [LessonProgressService],
  controllers: [LessonProgressController]
})
export class LessonProgressModule {}
