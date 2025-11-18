import { Module } from '@nestjs/common';
import { LiveSessionsService } from './live-sessions.service';
import { LiveSessionsController } from './live-sessions.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [LiveSessionsService],
  controllers: [LiveSessionsController],
  exports: [LiveSessionsService]
})
export class LiveSessionsModule {}
