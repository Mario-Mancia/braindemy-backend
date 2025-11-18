import { Injectable, ConflictException, NotFoundException} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCourseEnrollmentDto } from './dto/create-course-enrollment.dto';
import { UpdateCourseEnrollmentDto } from './dto/update-course-enrollment.dto';

@Injectable()
export class CourseEnrollmentService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateCourseEnrollmentDto) {
        // Validar que no exista ya la inscripción
        const exists = await this.prisma.course_enrollments.findUnique({
            where: {
                course_id_student_id: {
                    course_id: dto.course_id,
                    student_id: dto.student_id,
                },
            },
        });

        if (exists) {
            throw new ConflictException('Student is already enrolled in this course');
        }

        return this.prisma.course_enrollments.create({
            data: {
                course_id: dto.course_id,
                student_id: dto.student_id,
                payment_id: dto.payment_id ?? null,
                status: dto.status ?? 'active',
            },
        });
    }

    async findAll() {
        return this.prisma.course_enrollments.findMany({
            include: {
                course: true,
                student: true,
                payment: true,
            },
        });
    }

    async findOne(id: string) {
        const enrollment = await this.prisma.course_enrollments.findUnique({
            where: { id },
            include: {
                course: true,
                student: true,
                payment: true,
            },
        });

        if (!enrollment) throw new NotFoundException('Enrollment not found');

        return enrollment;
    }

    async update(id: string, dto: UpdateCourseEnrollmentDto) {
        await this.findOne(id);

        return this.prisma.course_enrollments.update({
            where: { id },
            data: { ...dto },
        });
    }

    async remove(id: string) {
        await this.findOne(id);

        return this.prisma.course_enrollments.delete({
            where: { id },
        });
    }
}
