import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateCourseDto) {
        return this.prisma.courses.create({
            data: {
                teacher_id: dto.teacher_id,
                title: dto.title,
                description: dto.description,
                price: dto.price ?? 0,
                schedule: dto.schedule ?? {},
                category: dto.category,
                is_active: dto.is_active ?? true,
            },
        });
    }

    async findAll() {
        return this.prisma.courses.findMany({
            include: {
                teacher: true,
                enrollments: true,
                reviews: true,
                liveSessions: true,
            },
        });
    }

    async findOne(id: string) {
        const course = await this.prisma.courses.findUnique({
            where: { id },
            include: {
                teacher: true,
                enrollments: true,
                reviews: true,
                liveSessions: true,
            },
        });

        if (!course) throw new NotFoundException('Course not found');

        return course;
    }

    async update(id: string, dto: UpdateCourseDto) {
        await this.findOne(id);

        return this.prisma.courses.update({
            where: { id },
            data: {
                teacher_id: dto.teacher_id,
                title: dto.title,
                description: dto.description,
                price: dto.price,
                schedule: dto.schedule,
                category: dto.category,
                is_active: dto.is_active,
            },
        });
    }

    async remove(id: string) {
        await this.findOne(id);

        return this.prisma.courses.delete({
            where: { id },
        });
    }
}
