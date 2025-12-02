import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { TeacherFilterDto } from './dto/teacher-filter.dto';

/**
 * @public
 * Servicio de lógica de negocio responsable de todas las operaciones CRUD y filtros avanzados para la entidad [Teacher].
 *
 * Este servicio gestiona los perfiles de los profesores, implementando:
 * 1. **Validación de Unicidad**: Asegura que solo exista un perfil de profesor por usuario.
 * 2. **Búsqueda Avanzada**: Permite filtrar por especialidad, rango de rating y búsqueda por texto en nombre/biografía.
 * 3. **Seguridad de Edición**: Restringe la actualización de un perfil solo al propio profesor o a un administrador.
 * 4. **Validación de Datos**: Valida que el rating se mantenga en el rango [0, 5].
 *
 * @injectable
 */
@Injectable()
export class TeachersService {
  /**
     * @param prisma Instancia de PrismaService para interactuar con la base de datos.
     */
  constructor(private prisma: PrismaService) { }

  // -------------------------------------------------------------
  // CREATE (Creación de Perfil de Profesor)
  // -------------------------------------------------------------
  /**
   * Crea un nuevo perfil de profesor asociado a un usuario existente.
   *
   * Este método se utiliza típicamente internamente o por un administrador después de un proceso de aprobación.
   *
   * @param data Los datos del perfil del profesor a crear (CreateTeacherDto), incluyendo el `user_id`.
   * @throws NotFoundException Si el usuario asociado (`user_id`) no existe.
   * @throws ConflictException Si el usuario ya tiene un perfil de profesor.
   * @returns El objeto del perfil de profesor creado con un conjunto selecto de campos.
   */
  async create(data: CreateTeacherDto) {
    const user = await this.prisma.users.findUnique({
      where: { id: data.user_id },
    });

    if (!user) throw new NotFoundException('Usuario asociado no encontrado');

    const existing = await this.prisma.teachers.findUnique({
      where: { user_id: data.user_id },
    });

    if (existing) {
      throw new ConflictException('Este usuario ya es teacher');
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

  // -------------------------------------------------------------
  // FIND ALL (Listado y Filtros)
  // -------------------------------------------------------------
  /**
   * Obtiene una lista paginada de perfiles de profesores, con opciones avanzadas de filtrado.
   *
   * Permite filtrar por: `specialty`, rango de `min_rating`/`max_rating`, y `search` (en nombre o biografía).
   *
   * @param filters El DTO con los parámetros de filtrado y paginación (TeacherFilterDto).
   * @returns Un objeto con metadatos de paginación y la lista de profesores (`data`), incluyendo sus cursos y suscripciones.
   */
  async findAll(filters: TeacherFilterDto) {
    const { search, specialty, min_rating, max_rating, page, limit } = filters;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (specialty) where.specialty = specialty;

    if (min_rating !== undefined) where.rating = { gte: min_rating };
    if (max_rating !== undefined) {
      where.rating = { ...(where.rating || {}), lte: max_rating };
    }

    if (search) {
      where.OR = [
        { bio: { contains: search, mode: 'insensitive' } },
        {
          user: {
            is: {
              OR: [
                { first_name: { contains: search, mode: 'insensitive' } },
                { last_name: { contains: search, mode: 'insensitive' } },
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

  // -------------------------------------------------------------
  // FIND ONE (Detalle)
  // -------------------------------------------------------------
  /**
   * Obtiene los detalles completos de un perfil de profesor específico por su ID interno.
   *
   * @param id El ID único del perfil de profesor.
   * @throws NotFoundException Si el profesor no es encontrado.
   * @returns El objeto del profesor solicitado, incluyendo usuario, cursos y suscripciones.
   */
  async findOne(id: string) {
    const teacher = await this.prisma.teachers.findUnique({
      where: { id },
      include: {
        user: true,
        courses: true,
        subscriptions: true,
      },
    });

    if (!teacher) throw new NotFoundException('Teacher no encontrado');
    return teacher;
  }

  // -------------------------------------------------------------
  // CHECK STATUS (verifica si el user tiene perfil teacher)
  // -------------------------------------------------------------

  /**
   * Verifica si el usuario ya tiene un perfil en la tabla `teachers`.
   *
   * @param userId El ID del usuario autenticado.
   * @returns { status: 'missing_profile' | 'has_profile' }
   */
  async checkTeacherStatus(userId: string) {
    const teacher = await this.prisma.teachers.findUnique({
      where: { user_id: userId },
      select: { id: true },
    });

    if (!teacher) return { status: 'missing_profile' };

    return { status: 'has_profile', teacherId: teacher.id }; // ← añadir teacherId
  }


  // -------------------------------------------------------------
  // UPDATE (Edición)
  // -------------------------------------------------------------
  /**
   * Actualiza la información de un perfil de profesor.
   *
   * Reglas de Seguridad: Solo el **administrador** o el **profesor dueño** del perfil pueden editarlo.
   * Regla de Negocio: Valida que el `rating` (si se actualiza) esté en el rango de 0 a 5.
   *
   * @param id El ID interno del perfil de profesor a actualizar.
   * @param data Los datos parciales para la actualización (UpdateTeacherDto).
   * @param requester El objeto del usuario autenticado que intenta realizar la actualización.
   * @throws NotFoundException Si el profesor no existe.
   * @throws ForbiddenException Si el usuario no tiene permisos para editar el perfil.
   * @throws BadRequestException Si el rating proporcionado es inválido.
   * @returns El objeto del perfil de profesor actualizado.
   */
  async update(id: string, data: UpdateTeacherDto, requester: any) {
    const teacher = await this.prisma.teachers.findUnique({
      where: { id },
    });

    if (!teacher) throw new NotFoundException('Teacher no encontrado');

    // Solo admin o dueño del perfil
    if (requester.role !== 'admin' && requester.id !== teacher.user_id) {
      throw new ForbiddenException('No puedes editar el perfil de otro teacher');
    }

    // Validación rating segura
    if (data.rating !== undefined && (data.rating < 0 || data.rating > 5)) {
      throw new BadRequestException('Rating debería ser entre 0–5');
    }

    return this.prisma.teachers.update({
      where: { id },
      data,
    });
  }

  // -------------------------------------------------------------
  // DELETE (Eliminación)
  // -------------------------------------------------------------
  /**
   * Elimina un perfil de profesor del sistema.
   *
   * @access Típicamente restringido al rol 'admin' a nivel de controlador.
   * @param id El ID interno del perfil de profesor a eliminar.
   * @throws NotFoundException Si el profesor no existe.
   * @returns El objeto del perfil de profesor eliminado.
   */
  async delete(id: string) {
    const exists = await this.prisma.teachers.findUnique({
      where: { id },
    });

    if (!exists) throw new NotFoundException('Teacer no encontrado');

    return this.prisma.teachers.delete({
      where: { id },
    });
  }
} 