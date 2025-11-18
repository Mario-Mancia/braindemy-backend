import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
    constructor(private readonly prisma: PrismaService) {}

  // Crear estudiante
  async create(dto: CreateStudentDto) {
    return this.prisma.students.create({
      data: dto,
    });
  }

  // Obtener todos
  async findAll() {
    return this.prisma.students.findMany({
      include: {
        user: true,
        enrollments: true,
        reviews: true,
      },
    });
  }

  // Obtener por ID
  async findOne(id: string) {
    const student = await this.prisma.students.findUnique({
      where: { id },
      include: {
        user: true,
        enrollments: true,
        reviews: true,
      },
    });

    if (!student) throw new NotFoundException('Estudiante no encontrado');

    return student;
  }

  // Actualizar
  async update(id: string, dto: UpdateStudentDto) {
    await this.findOne(id); 

    return this.prisma.students.update({
      where: { id },
      data: dto,
    });
  }

  // Eliminar estudiante
  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.students.delete({
      where: { id },
    });
  }
}
