import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() //Declara el módulo como global
@Module({
  providers: [PrismaService],
  exports: [PrismaModule]
})
export class PrismaModule {}
