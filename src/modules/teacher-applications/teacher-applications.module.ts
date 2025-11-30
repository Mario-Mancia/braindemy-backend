import { Module } from '@nestjs/common';
import { TeacherApplicationsController } from './teacher-applications.controller';
import { TeacherApplicationsService } from './teacher-applications.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [TeacherApplicationsController],
  providers: [TeacherApplicationsService, PrismaService]
})
export class TeacherApplicationsModule {}
