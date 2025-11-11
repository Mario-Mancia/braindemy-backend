import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    async onModuleInit() {
        await this.$connect();
        console.log('Se ha logrado establecer la conexión a la base de datos mediante Prisma');

    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
