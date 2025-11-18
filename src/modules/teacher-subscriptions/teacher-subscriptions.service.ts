import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTeacherSubscriptionsDto } from './dto/create-teacher-subscriptions.dto';
import { UpdateTeacherSubscriptionsDto } from './dto/update-teacher-subscriptions.dto';

@Injectable()
export class TeacherSubscriptionsService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateTeacherSubscriptionsDto) {
        return this.prisma.teacher_subscriptions.create({
            data: {
                teacher_id: dto.teacher_id,
                subscription_id: dto.subscription_id,
                payment_id: dto.payment_id,
                start_date: new Date(dto.start_date),
                end_date: dto.end_date ? new Date(dto.end_date) : null,
                status: dto.status,
            },
        });
    }

    async findAll() {
        return this.prisma.teacher_subscriptions.findMany({
            include: {
                teacher: true,
                subscription: true,
                payment: true,
            },
        });
    }

    async findOne(id: string) {
        const record = await this.prisma.teacher_subscriptions.findUnique({
            where: { id },
            include: {
                teacher: true,
                subscription: true,
                payment: true,
            },
        });

        if (!record) throw new NotFoundException('Teacher subscription not found');
        return record;
    }

    async update(id: string, dto: UpdateTeacherSubscriptionsDto) {
        await this.findOne(id);

        return this.prisma.teacher_subscriptions.update({
            where: { id },
            data: {
                teacher_id: dto.teacher_id,
                subscription_id: dto.subscription_id,
                payment_id: dto.payment_id,
                start_date: dto.start_date ? new Date(dto.start_date) : undefined,
                end_date: dto.end_date ? new Date(dto.end_date) : undefined,
                status: dto.status,
            },
        });
    }

    async remove(id: string) {
        await this.findOne(id);

        return this.prisma.teacher_subscriptions.delete({
            where: { id },
        });
    }
}
