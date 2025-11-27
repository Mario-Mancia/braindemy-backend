import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseFilterDto } from './dto/course-filter.dto';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  // Crear curso
  async create(dto: CreateCourseDto) {
    return this.prisma.courses.create({
      data: {
        teacher_id: dto.teacher_id,
        title: dto.title,
        description: dto.description ?? null,
        price: dto.price ?? 0,
        schedule: dto.schedule ?? {},
        category: dto.category ?? null,
        is_active: dto.is_active ?? true,
      },
    });
  }

  // Filtrar + paginar
  async findAll(filters: CourseFilterDto) {
    const {
      search,
      category,
      teacher_id,
      min_price,
      max_price,
      is_active,
      page,
      limit,
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = {
      ...(category && { category }),
      ...(teacher_id && { teacher_id }),
      ...(typeof is_active === 'boolean' && { is_active }),
      ...(min_price && { price: { gte: min_price } }),
      ...(max_price && { price: { lte: max_price } }),

      ...(search && {
        OR: [
          {
            title: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ],
      }),
    };

    const total = await this.prisma.courses.count({ where });

    const data = await this.prisma.courses.findMany({
      where,
      skip,
      take: limit,
      include: {
        teacher: {
          select: {
            id: true,
            specialty: true,
            user: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
        reviews: true,
        enrollments: true,
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

  // Obtener uno
  async findOne(id: string) {
    const course = await this.prisma.courses.findUnique({
      where: { id },
      include: {
        teacher: {
          include: { user: true },
        },
        enrollments: true,
        reviews: true,
        liveSessions: true,
      },
    });

    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  // Actualizar
  async update(id: string, dto: UpdateCourseDto) {
    await this.findOne(id);

    return this.prisma.courses.update({
      where: { id },
      data: dto,
    });
  }

  // Eliminar
  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.courses.delete({ where: { id } });
  }
}