import { Module } from '@nestjs/common';
import { ClassCommentsService } from './class-comments.service';
import { ClassCommentsController } from './class-comments.controller';

@Module({
  providers: [ClassCommentsService],
  controllers: [ClassCommentsController]
})
export class ClassCommentsModule {}
