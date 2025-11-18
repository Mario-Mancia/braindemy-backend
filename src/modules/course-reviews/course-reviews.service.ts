import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCourseReviewDto } from './dto/create-course-review.dto';
import { UpdateCourseReviewDto } from './dto/update-course-review.dto';

@Injectable()
export class CourseReviewsService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateCourseReviewDto) {
        try {
            return await this.prisma.course_reviews.create({
                data: {
                    ...dto,
                },
            });
        } catch (error) {
            if (error.code === 'P2002') {
                throw new ConflictException(
                    'El estudiante ya dejó una reseña para este curso.',
                );
            }
            throw error;
        }
    }

    findAll() {
        return this.prisma.course_reviews.findMany({
            include: {
                course: true,
                student: true,
            },
        });
    }

    async findOne(id: string) {
        const review = await this.prisma.course_reviews.findUnique({
            where: { id },
            include: {
                course: true,
                student: true,
            },
        });

        if (!review) {
            throw new NotFoundException('Review no encontrada');
        }

        return review;
    }

    async update(id: string, dto: UpdateCourseReviewDto) {
        await this.findOne(id);

        return this.prisma.course_reviews.update({
            where: { id },
            data: { ...dto },
        });
    }

    async remove(id: string) {
        await this.findOne(id);

        return this.prisma.course_reviews.delete({
            where: { id },
        });
    }
}
