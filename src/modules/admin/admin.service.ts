import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTeacherDto } from '../teachers/dto/create-teacher.dto';

@Injectable()
export class AdminService {
    constructor(private readonly prisma: PrismaService) { }

    getDashboardData() {
        return {
            totalUsers: this.prisma.users.count(),
            totalTeachers: this.prisma.teachers.count(),
            totalCourses: this.prisma.courses.count(),
        };
    }

    getAllUsers() {
        return this.prisma.users.findMany();
    }

    createTeacher(dto: CreateTeacherDto) {
        return this.prisma.teachers.create({ data: dto });
    }
}
