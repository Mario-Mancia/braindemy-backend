import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

@Injectable()
export class CardService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateCardDto) {
        const user = await this.prisma.users.findUnique({
            where: { id: dto.user_id },
        });

        if (!user) {
            throw new NotFoundException('El usuario no existe');
        }

        // Asignación automática según rol
        const initialBalance =
            user.role === 'teacher'
                ? 500
                : user.role === 'student'
                    ? 150
                    : 0;

        return this.prisma.cards.create({
            data: {
                user_id: dto.user_id,
                label: dto.label,
                balance: initialBalance,
            },
        });
    }

    findAll() {
        return this.prisma.cards.findMany({
            include: {
                user: true,
            },
        });
    }

    async findOne(id: string) {
        const card = await this.prisma.cards.findUnique({
            where: { id },
            include: { user: true },
        });

        if (!card) throw new NotFoundException('Tarjeta no encontrada');

        return card;
    }

    async update(id: string, dto: UpdateCardDto) {
        await this.findOne(id);

        return this.prisma.cards.update({
            where: { id },
            data: dto,
        });
    }

    async remove(id: string) {
        await this.findOne(id);

        return this.prisma.cards.delete({
            where: { id },
        });
    }
}
