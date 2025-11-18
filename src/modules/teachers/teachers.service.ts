import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { CreateTeacherDto } from './dto/create-teacher.dto';

@Injectable()
export class TeachersService {
    constructor(private prisma: PrismaService) { }

    // Crear un teacher
    async create(data: CreateTeacherDto) {

        // 1) Verificar que el user exista
        const user = await this.prisma.users.findUnique({
            where: { id: data.user_id },
        });
        if (!user) {
            throw new NotFoundException('Usuario asociado no encontrado');
        }

        // 2) Verificar que ese usuario no tenga ya un teacher asociado
        const existing = await this.prisma.teachers.findUnique({
            where: { user_id: data.user_id },
        });
        if (existing) {
            throw new ConflictException('Este usuario ya está registrado como teacher');
        }

        // 3) Crear el teacher
        const created = await this.prisma.teachers.create({
            data: {
                user_id: data.user_id,
                image_url: data.image_url ?? null,
                bio: data.bio ?? null,
                specialty: data.specialty ?? null,
            },
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

        return created;
    }


    // Obtener todos los teachers
    async findAll() {
        return this.prisma.teachers.findMany({
            include: {
                user: true,
                courses: true,
                subscriptions: true,
            },
        });
    }

    // Obtener un teacher por ID
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

    // Actualizar un teacher
    async update(id: string, data: UpdateTeacherDto) {
        const exists = await this.prisma.teachers.findUnique({ where: { id } });

        if (!exists) throw new NotFoundException('Teacher not found');

        return this.prisma.teachers.update({
            where: { id },
            data,
        });
    }

    // Eliminar teacher
    async delete(id: string) {
        const exists = await this.prisma.teachers.findUnique({ where: { id } });

        if (!exists) throw new NotFoundException('Teacher not found');

        return this.prisma.teachers.delete({ where: { id } });
    }
}

