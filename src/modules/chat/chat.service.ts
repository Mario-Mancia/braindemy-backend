import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateLiveChatMessageDto } from './dto/create-live-chat-message.dto';
import { UpdateLiveChatMessageDto } from './dto/update-live-chat-message.dto';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    create(dto: CreateLiveChatMessageDto) {
        return this.prisma.live_chat_messages.create({
            data: {
                ...dto,
            },
        });
    }

    findAll() {
        return this.prisma.live_chat_messages.findMany({
            include: {
                session: true,
                sender: true,
            },
            orderBy: { sent_at: 'asc' },
        });
    }

    async findOne(id: string) {
        const msg = await this.prisma.live_chat_messages.findUnique({
            where: { id },
            include: {
                session: true,
                sender: true,
            },
        });

        if (!msg) throw new NotFoundException('Mensaje no encontrado');

        return msg;
    }

    async update(id: string, dto: UpdateLiveChatMessageDto) {
        await this.findOne(id);

        return this.prisma.live_chat_messages.update({
            where: { id },
            data: { ...dto },
        });
    }

    async remove(id: string) {
        await this.findOne(id);

        return this.prisma.live_chat_messages.delete({
            where: { id },
        });
    }
}
