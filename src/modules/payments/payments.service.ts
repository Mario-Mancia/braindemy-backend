import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment.dto';
import { payment_status } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePaymentDto) {
    return this.prisma.payments.create({
      data: {
        user_id: dto.user_id,
        amount: dto.amount,
        type: dto.type,
        reference: dto.reference,
        status: "pending",
      },
    });
  }

  async findAll() {
    return this.prisma.payments.findMany({
      include: { user: true },
      orderBy: { created_at: 'desc' },
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

  // Solo se pueden actualizar los estados del pago.
  async updateStatus(id: string, status: payment_status) {
    await this.findOne(id);

    return this.prisma.payments.update({
      where: { id },
      data: { status, updated_at: new Date() },
    });
  }

  // No se permite la eliminación de registros de pago
  async remove() {
    throw new BadRequestException('No se pueden eliminar registros de pagos');
  }
}