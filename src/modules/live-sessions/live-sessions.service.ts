import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateLiveSessionDto } from './dto/create-live-session.dto';
import { UpdateLiveSessionDto } from './dto/update-live-session.dto';

@Injectable()
export class LiveSessionsService {
    constructor(private prisma: PrismaService) { }

    create(dto: CreateLiveSessionDto) {
        return this.prisma.live_sessions.create({
            data: {
                ...dto,
            },
        });
    }

    findAll() {
        return this.prisma.live_sessions.findMany({
            include: {
                course: true,
                messages: true,
            },
        });
    }

    async findOne(id: string) {
        const session = await this.prisma.live_sessions.findUnique({
            where: { id },
            include: {
                course: true,
                messages: true,
            },
        });

        if (!session) {
            throw new NotFoundException('Live session no encontrada');
        }

        return session;
    }

    async update(id: string, dto: UpdateLiveSessionDto) {
        await this.findOne(id);

        return this.prisma.live_sessions.update({
            where: { id },
            data: { ...dto },
        });
    }

    async remove(id: string) {
        await this.findOne(id);

        return this.prisma.live_sessions.delete({
            where: { id },
        });
    }
}
