import { Injectable, NotFoundException, ConflictException, } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { GetStudentsFiltersDto } from './dto/get-student-filter.dto';

/**
 * @public
 * Servicio de lógica de negocio responsable de todas las operaciones CRUD y de gestión para la entidad [Student].
 *
 * Este servicio separa las responsabilidades en dos grupos principales:
 * 1. **Métodos de Estudiante**: Permiten al usuario gestionar su propio perfil usando su `user_id` como clave de acceso.
 * 2. **Métodos de Administración**: Permiten a los administradores buscar, filtrar y gestionar cualquier perfil de estudiante usando el `id` interno del perfil.
 *
 * @injectable
 */
@Injectable()
export class StudentsService {

  /**
     * @param prisma Instancia de PrismaService para interactuar con la base de datos.
     */
  constructor(private readonly prisma: PrismaService) { }

  // --------------------------
  // STUDENT METHODS (Gestiona su propio perfil)
  // --------------------------

  /**
   * Crea un nuevo perfil de estudiante asociado a un usuario existente.
   *
   * Regla de Negocio: Garantiza que solo pueda existir un perfil de estudiante por cada ID de usuario (`user_id`).
   *
   * @param dto Los datos del perfil del estudiante a crear (CreateStudentDto).
   * @param userId El ID del usuario al que se vinculará el perfil de estudiante.
   * @throws ConflictException Si ya existe un perfil de estudiante para este usuario.
   * @returns El objeto del perfil de estudiante creado.
   */
  async create(dto: CreateStudentDto, userId: string) {
    const existing = await this.prisma.students.findUnique({
      where: { user_id: userId },
    });

    if (existing) {
      throw new ConflictException(
        'Ya existe un perfil de estudiante para este usuario',
      );
    }

    return this.prisma.students.create({
      data: {
        user_id: userId,
        ...dto,
      },
    });
  }

  /**
     * Obtiene el perfil de estudiante del usuario autenticado.
     *
     * @param userId El ID del usuario autenticado.
     * @throws NotFoundException Si el usuario no tiene un perfil de estudiante.
     * @returns El objeto del estudiante, incluyendo la información de usuario, inscripciones y reseñas.
     */
  async getMyStudentProfile(userId: string) {
    const student = await this.prisma.students.findUnique({
      where: { user_id: userId },
      include: {
        user: true,
        enrollments: true,
        reviews: true,
      },
    });

    if (!student) {
      throw new NotFoundException('No tienes un perfil de estudiante');
    }

    return student;
  }

  /**
     * Actualiza el perfil de estudiante del usuario autenticado.
     *
     * @param userId El ID del usuario autenticado cuyo perfil se actualizará.
     * @param dto Los datos parciales para la actualización (UpdateStudentDto).
     * @returns El objeto del perfil de estudiante actualizado.
     */
  async updateByUserId(userId: string, dto: UpdateStudentDto) {
    return this.prisma.students.update({
      where: { user_id: userId },
      data: {
        ...dto,
        updated_at: new Date(),
      },
    });
  }

  /**
     * Elimina el perfil de estudiante asociado al usuario autenticado.
     *
     * @param userId El ID del usuario autenticado cuyo perfil de estudiante se eliminará.
     * @returns El objeto del perfil de estudiante eliminado.
     */
  async removeByUserId(userId: string) {
    return this.prisma.students.delete({
      where: { user_id: userId },
    });
  }


  // --------------------------
  // ADMIN METHODS (Gestiona cualquier perfil)
  // --------------------------

  /**
   * Obtiene una lista de perfiles de estudiantes, permitiendo filtros y paginación.
   *
   * Permite filtrar por: `academy`, `academic_level` y `search` (búsqueda en biografía y nombre de usuario).
   *
   * @access Solo debe ser llamado por administradores.
   * @param filters Los parámetros de filtrado y paginación (GetStudentsFiltersDto).
   * @returns Una lista paginada de perfiles de estudiante, incluyendo la información de usuario.
   */
  async findAll(filters: GetStudentsFiltersDto) {
    const { academy, academic_level, search, page = '1', limit = '10' } = filters;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (academy) where.academy = academy;
    if (academic_level) where.academic_level = academic_level;

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

    return this.prisma.students.findMany({
      skip,
      take: Number(limit),
      where,
      include: {
        user: true,
      },
    });
  }

  /**
     * Obtiene los detalles de un perfil de estudiante específico por su ID interno.
     *
     * @access Solo debe ser llamado por administradores o sistemas de gestión interna.
     * @param id El ID interno del perfil de estudiante.
     * @throws NotFoundException Si el perfil de estudiante no existe.
     * @returns El objeto del estudiante, incluyendo información de usuario, inscripciones y reseñas.
     */
  async findOne(id: string) {
    const student = await this.prisma.students.findUnique({
      where: { id },
      include: {
        user: true,
        enrollments: true,
        reviews: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    return student;
  }

  /**
     * Actualiza un perfil de estudiante específico por su ID interno.
     *
     * @access Solo debe ser llamado por administradores.
     * @param id El ID interno del perfil de estudiante a actualizar.
     * @param dto Los datos parciales para la actualización (UpdateStudentDto).
     * @returns El objeto del perfil de estudiante actualizado.
     */
  async update(id: string, dto: UpdateStudentDto) {
    return this.prisma.students.update({
      where: { id },
      data: {
        ...dto,
        updated_at: new Date(),
      },
    });
  }

  /**
     * Elimina un perfil de estudiante específico por su ID interno.
     *
     * @access Solo debe ser llamado por administradores.
     * @param id El ID interno del perfil de estudiante a eliminar.
     * @returns El objeto del perfil de estudiante eliminado.
     */
  async remove(id: string) {
    return this.prisma.students.delete({
      where: { id },
    });
  }
}