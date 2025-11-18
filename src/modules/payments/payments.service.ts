import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentsService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreatePaymentDto) {
        return this.prisma.payments.create({
            data: {
                user_id: dto.user_id,
                amount: dto.amount,
                type: dto.type,
                reference: dto.reference,
                status: dto.status,
            },
        });
    }

    async findAll() {
        return this.prisma.payments.findMany({
            include: {
                user: true,
            },
        });
    }

    async findOne(id: string) {
        const payment = await this.prisma.payments.findUnique({
            where: { id },
            include: { user: true },
        });

        if (!payment) throw new NotFoundException('Payment not found');
        return payment;
    }

    async update(id: string, dto: UpdatePaymentDto) {
        await this.findOne(id);

        return this.prisma.payments.update({
            where: { id },
            data: dto,
        });
    }

    async remove(id: string) {
        await this.findOne(id);

        return this.prisma.payments.delete({
            where: { id },
        });
    }
}
