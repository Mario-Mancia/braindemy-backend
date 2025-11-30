import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseFilterDto } from './dto/course-filter.dto';

/**
 * @public
 * Servicio de lógica de negocio responsable de todas las operaciones CRUD y filtrado
 * de la entidad [Course].
 *
 * Este servicio interactúa directamente con la capa de acceso a datos a través de
 * la instancia de PrismaService y aplica las reglas de negocio, incluyendo
 * validaciones de roles y permisos de acceso.
 *
 * @injectable
 */
@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) { }

  // -------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------
  /**
     * Crea un nuevo registro de curso.
     *
     * Regla de Negocio: **Solo los usuarios con el rol de profesor** pueden crear un curso.
     *
     * @param dto El DTO de creación de curso con los datos validados CreateCourseDTO.
     * @param userId El ID del usuario que intenta crear el curso (obtenido del token).
     * @throws ForbiddenException Si el usuario no está registrado como profesor.
     * @returns El objeto del curso creado.
     */
  async create(dto: CreateCourseDto, userId: string) {
    // Solo profesores pueden crear cursos
    const teacher = await this.prisma.teachers.findUnique({
      where: { id: userId },
    });

    if (!teacher)
      throw new ForbiddenException('Solo profesores pueden crear cursos');

    return this.prisma.courses.create({
      data: {
        teacher_id: userId,
        title: dto.title,
        description: dto.description ?? null,
        category: dto.category ?? null,
        price: dto.price ?? 0,
        color: dto.color ?? null,
        cover_url: dto.cover_url ?? null,
        level: dto.level ?? null,
        duration: dto.duration ?? null,
        max_students: dto.max_students ?? 50,
        is_active: dto.is_active ?? true,

        // JSON fields
        schedule: dto.schedule ? { ...dto.schedule } : undefined,
        settings: dto.settings ? { ...dto.settings } : undefined,
      },
    });
  }

  // -------------------------------------------------------------
  // FIND ALL (Filtros + paginación)
  // -------------------------------------------------------------
  /**
     * Recupera una lista paginada de cursos aplicando filtros opcionales.
     *
     * La consulta construye dinámicamente el objeto `where` de Prisma para aplicar
     * filtros por: categoría, profesor, estado activo, rango de precios y búsqueda
     * de texto (en modo insensible a mayúsculas y minúsculas) en título y descripción.
     *
     * @param filters Los parámetros de filtrado y paginación CourseFilterDTO.
     * @returns Un objeto con los metadatos de paginación (`page`, `limit`, `total`, `totalPages`)
     * y la lista de cursos (`data`), incluyendo información básica del profesor.
     */
  async findAll(filters: CourseFilterDto) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.category) where.category = filters.category;
    if (filters.teacher_id) where.teacher_id = filters.teacher_id;
    if (typeof filters.is_active === 'boolean')
      where.is_active = filters.is_active;

    if (filters.min_price)
      where.price = { ...(where.price ?? {}), gte: filters.min_price };

    if (filters.max_price)
      where.price = { ...(where.price ?? {}), lte: filters.max_price };

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const total = await this.prisma.courses.count({ where });

    const data = await this.prisma.courses.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },

      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data,
    };
  }

  // -------------------------------------------------------------
  // FIND ONE
  // -------------------------------------------------------------
  /**
     * Obtiene los detalles completos de un curso por su ID.
     *
     * @param id El ID único del curso.
     * @throws NotFoundException Si el curso no existe.
     * @returns El objeto del curso, incluyendo sus relaciones (profesor, lecciones, revisiones, etc.).
     */
  async findOne(id: string) {
    const course = await this.prisma.courses.findUnique({
      where: { id },
      include: {
        teacher: { include: { user: true } },
        enrollments: true,
        reviews: true,
        liveSessions: true,
        lessons: true,
      },
    });

    if (!course) throw new NotFoundException('Curso no encontrado');

    return course;
  }

  // -------------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------------
  /**
     * Actualiza parcialmente los datos de un curso.
     *
     * Regla de Negocio: **Solo el administrador o el profesor que creó el curso** tienen permiso
     * para modificarlo.
     *
     * @param id El ID del curso a actualizar.
     * @param dto Los datos parciales de actualización ({@link UpdateCourseDto}).
     * @param user El objeto de usuario autenticado para la verificación de roles.
     * @throws NotFoundException Si el curso no existe.
     * @throws ForbiddenException Si el usuario no tiene los permisos necesarios.
     * @returns El objeto del curso actualizado.
     */
  async update(id: string, dto: UpdateCourseDto, user: any) {
    const course = await this.prisma.courses.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Curso no encontrado');

    // Solo admin o profesor dueño del curso
    if (user.role !== 'admin' && course.teacher_id !== user.id) {
      throw new ForbiddenException('No tienes permisos para editar este curso');
    }

    return this.prisma.courses.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.cover_url !== undefined && { cover_url: dto.cover_url }),
        ...(dto.level !== undefined && { level: dto.level }),
        ...(dto.duration !== undefined && { duration: dto.duration }),

        price: dto.price ?? undefined,
        max_students: dto.max_students ?? undefined,
        is_active: dto.is_active ?? undefined,

        // JSON fields si vienen definidos
        schedule: dto.schedule ? { ...dto.schedule } : undefined,
        settings: dto.settings ? { ...dto.settings } : undefined,

        updated_at: new Date(),
      },
    });
  }

  // -------------------------------------------------------------
  // DELETE
  // -------------------------------------------------------------
  /**
     * Elimina un curso del sistema.
     *
     * Regla de Negocio: **Solo el administrador o el profesor que creó el curso** tienen permiso
     * para eliminarlo.
     *
     * @param id El ID del curso a eliminar.
     * @param user El objeto de usuario autenticado para la verificación de roles.
     * @throws NotFoundException Si el curso no existe.
     * @throws ForbiddenException Si el usuario no tiene los permisos necesarios.
     * @returns El objeto del curso eliminado (si la operación fue exitosa).
     */
  async remove(id: string, user: any) {
    const course = await this.prisma.courses.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Curso no encontrado');

    if (user.role !== 'admin' && course.teacher_id !== user.id) {
      throw new ForbiddenException('No tienes permisos para eliminar este curso');
    }

    return this.prisma.courses.delete({ where: { id } });
  }
}