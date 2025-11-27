import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { TeacherFilterDto } from './dto/teacher-filter.dto';

@Injectable()
export class TeachersService {
    constructor(private prisma: PrismaService) {}

    async create(data: CreateTeacherDto) {
        const user = await this.prisma.users.findUnique({
            where: { id: data.user_id },
        });

        if (!user) throw new NotFoundException('Usuario asociado no encontrado');

        const existing = await this.prisma.teachers.findUnique({
            where: { user_id: data.user_id },
        });

        if (existing) {
            throw new ConflictException('Este usuario ya está registrado como teacher');
        }

        return this.prisma.teachers.create({
            data,
            select: {
                id: true,
                user_id: true,
                image_url: true,
                bio: true,
                specialty: true,
                rating: true,
                active_courses_count: true,
                created_at: true,
            },
        });
    }

    async findAll(filters: TeacherFilterDto) {
        const { search, specialty, min_rating, max_rating, page, limit } = filters;

        const skip = (page - 1) * limit;

        const where: any = {
            ...(specialty && { specialty }),

            ...(min_rating !== undefined && {
                rating: { gte: min_rating }
            }),

            ...(max_rating !== undefined && {
                rating: { lte: max_rating }
            }),
        };

        // ✔ Si hay búsqueda, agregamos el OR
        if (search) {
            where.OR = [
                {
                    bio: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
                {
                    user: {
                        is: {
                            OR: [
                                {
                                    first_name: {
                                        contains: search,
                                        mode: 'insensitive',
                                    },
                                },
                                {
                                    last_name: {
                                        contains: search,
                                        mode: 'insensitive',
                                    },
                                },
                            ],
                        },
                    },
                },
            ];
        }

        const total = await this.prisma.teachers.count({ where });

        const data = await this.prisma.teachers.findMany({
            where,
            skip,
            take: limit,
            include: {
                user: true,
                courses: true,
                subscriptions: true,
            },
            orderBy: { created_at: 'desc' },
        });

        return {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            data,
        };
    }

    async findOne(id: string) {
        const teacher = await this.prisma.teachers.findUnique({
            where: { id },
            include: {
                user: true,
                courses: true,
                subscriptions: true,
            },
        });

        if (!teacher) throw new NotFoundException('Teacher not found');
        return teacher;
    }

    async update(id: string, data: UpdateTeacherDto) {
        const exists = await this.prisma.teachers.findUnique({
            where: { id },
        });
        if (!exists) throw new NotFoundException('Teacher not found');

        return this.prisma.teachers.update({
            where: { id },
            data,
        });
    }

    async delete(id: string) {
        const exists = await this.prisma.teachers.findUnique({ where: { id } });
        if (!exists) throw new NotFoundException('Teacher not found');

        return this.prisma.teachers.delete({ where: { id } });
    }
}