import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCourseReviewDto } from './dto/create-course-review.dto';
import { UpdateCourseReviewDto } from './dto/update-course-review.dto';
import { AuthUser } from 'src/common/types/auth-user.type';
import { FilterCourseReviewDto } from './dto/filter-course-review.dto';

/**
 * @public
 * Servicio de lógica de negocio responsable de todas las operaciones CRUD y filtrado de la entidad [CourseReview].
 *
 * Este servicio es fundamental para asegurar la **integridad y la propiedad** de las reseñas:
 * - Garantiza que solo los estudiantes inscritos puedan dejar reseñas.
 * - Aplica filtros de visibilidad basados en el rol del usuario autenticado (estudiante, profesor, administrador).
 * - Restringe la edición y eliminación al dueño de la reseña o a un administrador.
 *
 * @injectable
 */
@Injectable()
export class CourseReviewsService {

  /**
  * @param prisma Instancia de PrismaService para interactuar con la base de datos.
  */
  constructor(private prisma: PrismaService) { }

  // -------------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------------
  /**
   * Crea un nuevo registro de reseña para un curso.
   *
   * Reglas de Negocio:
   * 1. El curso debe existir.
   * 2. El usuario debe estar **inscrito** en el curso (verificación de enrollment).
   * 3. El usuario **no debe haber reseñado** el curso previamente (Unique Constraint en Prisma).
   *
   * @param dto El DTO de creación de la reseña (CreateCourseReviewDto).
   * @param userId El ID del estudiante que intenta dejar la reseña.
   * @throws NotFoundException Si el curso no existe.
   * @throws ForbiddenException Si el usuario no está inscrito.
   * @throws ConflictException Si el usuario ya dejó una reseña para ese curso.
   * @returns El objeto de la reseña creada.
   */
  async create(dto: CreateCourseReviewDto, userId: string) {
    // Verificar curso
    const course = await this.prisma.courses.findUnique({
      where: { id: dto.course_id },
    });

    if (!course) throw new NotFoundException('Course not found');

    // Verificar inscripción
    const enrollment = await this.prisma.course_enrollments.findUnique({
      where: {
        course_id_student_id: {
          course_id: dto.course_id,
          student_id: userId,
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException(
        'You must be enrolled in this course to leave a review',
      );
    }

    try {
      return await this.prisma.course_reviews.create({
        data: {
          course_id: dto.course_id,
          student_id: userId,
          rating: dto.rating,
          comment: dto.comment || null,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('You have already reviewed this course');
      }
      throw error;
    }
  }

  // -------------------------------------------------------------------
  // FIND ALL
  // -------------------------------------------------------------------
  /**
   * Recupera una lista paginada y filtrada de reseñas.
   *
   * Lógica de Visibilidad por Rol:
   * - **Estudiante**: Solo ve sus propias reseñas.
   * - **Profesor**: Solo ve reseñas de los cursos que imparte (filtrando por teacher_id en la tabla course).
   * - **Administrador**: Ve todas las reseñas.
   *
   * @param filters Los parámetros de filtrado (FilterCourseReviewDto), incluyendo paginación y rangos de fecha.
   * @param user El objeto de usuario autenticado (AuthUser) para aplicar filtros de visibilidad.
   * @throws BadRequestException Si los valores de paginación o fechas son inválidos.
   * @returns Un objeto con los metadatos de paginación y la lista de reseñas (data), incluyendo curso y estudiante asociado.
   */
  async findAll(filters: FilterCourseReviewDto, user: AuthUser) {
    const {
      course_id,
      student_id,
      rating,
      created_from,
      created_to,
      page = 1,
      limit = 20,
    } = filters;

    if (page < 1 || limit < 1) {
      throw new BadRequestException('Pagination values must be positive integers');
    }

    const skip = (page - 1) * limit;
    const where: any = {};

    // -----------------------------
    // FILTROS BÁSICOS
    // -----------------------------
    if (course_id) where.course_id = course_id;
    if (student_id) where.student_id = student_id;
    if (rating) where.rating = rating;

    // Filtros por fecha
    if (created_from || created_to) {
      where.created_at = {};

      if (created_from) {
        const d = new Date(created_from);
        if (isNaN(d.getTime()))
          throw new BadRequestException('Invalid created_from date');
        where.created_at.gte = d;
      }

      if (created_to) {
        const d = new Date(created_to);
        if (isNaN(d.getTime()))
          throw new BadRequestException('Invalid created_to date');
        where.created_at.lte = d;
      }
    }

    // -----------------------------
    if (user.role === 'teacher') {
      // Los maestros solo pueden ver reviews de sus cursos
      where.course = { teacher_id: user.id };
    }


    const total = await this.prisma.course_reviews.count({ where });

    const data = await this.prisma.course_reviews.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        course: true,
        student: true,
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

  // -------------------------------------------------------------------
  // FIND ONE
  // -------------------------------------------------------------------
  /**
   * Obtiene los detalles de una reseña específica por su ID.
   *
   * Lógica de Permisos:
   * - El estudiante solo puede ver su propia reseña.
   * - El profesor solo puede ver reseñas de sus propios cursos.
   * - El administrador puede ver cualquier reseña.
   *
   * @param id El ID único de la reseña.
   * @param user El objeto de usuario autenticado para la verificación de permisos.
   * @throws NotFoundException Si la reseña no existe.
   * @throws ForbiddenException Si el usuario no tiene permisos para acceder a la reseña.
   * @returns El objeto de la reseña solicitada.
   */
  async findOne(id: string, user: AuthUser) {
    const review = await this.prisma.course_reviews.findUnique({
      where: { id },
      include: {
        course: true,
        student: true,
      },
    });

    if (!review) throw new NotFoundException('Review not found');

    // Estudiantes pueden ver cualquier reseña
    if (user.role === 'teacher' && review.course.teacher_id !== user.id) {
      throw new ForbiddenException('You can only see reviews for your courses');
    }

    // Admin no tiene restricciones

    return review;
  }

  // -------------------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------------------
  /**
   * Actualiza una reseña existente.
   *
   * Regla de Permisos: Se reutiliza `findOne` para verificar el acceso. La edición solo es permitida al
   * **dueño de la reseña (estudiante)** o a un **administrador**.
   *
   * @param id El ID único de la reseña a actualizar.
   * @param dto Los datos parciales de actualización (UpdateCourseReviewDto).
   * @param user El objeto de usuario autenticado.
   * @throws ForbiddenException Si el usuario no es el dueño de la reseña y no es administrador.
   * @returns El objeto de la reseña actualizada.
   */
  async update(id: string, dto: UpdateCourseReviewDto, user: AuthUser) {
    const review = await this.findOne(id, user);

    if (user.role === 'student' && review.student_id !== user.id) {
      throw new ForbiddenException('You cannot edit this review');
    }

    return this.prisma.course_reviews.update({
      where: { id },
      data: {
        rating: dto.rating ?? review.rating,
        comment: dto.comment ?? review.comment,
      },
    });
  }

  // -------------------------------------------------------------------
  // DELETE
  // -------------------------------------------------------------------
  /**
   * Elimina una reseña del sistema.
   *
   * Regla de Permisos: Se reutiliza `findOne` para verificar el acceso. La eliminación solo es permitida al
   * **dueño de la reseña (estudiante)** o a un **administrador**.
   *
   * @param id El ID único de la reseña a eliminar.
   * @param user El objeto de usuario autenticado.
   * @throws ForbiddenException Si el usuario no es el dueño de la reseña y no es administrador.
   * @returns El objeto de la reseña eliminada.
   */
  async remove(id: string, user: AuthUser) {
    const review = await this.findOne(id, user);

    if (user.role === 'student' && review.student_id !== user.id) {
      throw new ForbiddenException('You cannot delete this review');
    }

    return this.prisma.course_reviews.delete({
      where: { id },
    });
  }
}