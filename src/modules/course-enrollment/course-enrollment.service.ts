import { Injectable, ConflictException, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCourseEnrollmentDto } from './dto/create-course-enrollment.dto';
import { UpdateCourseEnrollmentDto } from './dto/update-course-enrollment.dto';
import { CourseEnrollmentFilterDto } from './dto/course-enrollments-filter.dto';

/**
 * @public
 * Servicio de lógica de negocio responsable de todas las operaciones CRUD y filtros avanzados para la entidad [CourseEnrollment].
 *
 * Este servicio gestiona la relación de inscripción de un estudiante en un curso, aplicando las siguientes reglas clave:
 * - **Restricción de Dueño**: Los profesores no pueden inscribirse en sus propios cursos.
 * - **Unicidad**: Evita la doble inscripción del mismo estudiante en el mismo curso.
 * - **Búsqueda Avanzada**: Permite filtrar y ordenar inscripciones por curso, estudiante, profesor, estado y rango de fechas.
 *
 * @injectable
 */
@Injectable()
export class CourseEnrollmentService {

  /**
     * @param prisma Instancia de PrismaService para interactuar con la base de datos.
     */
  constructor(private prisma: PrismaService) { }

  // -------------------------------------------------------------
  // CREATE (Inscripción de Estudiante)
  // -------------------------------------------------------------
  /**
   * Inscribe a un estudiante en un curso específico.
   *
   * Reglas de Negocio:
   * 1. El curso debe existir.
   * 2. El `studentId` no debe ser el `teacher_id` del curso.
   * 3. La combinación (`course_id`, `studentId`) debe ser única (no doble inscripción).
   * 4. El estado se inicializa como 'active' si no se especifica.
   *
   * @param dto El DTO de creación de la inscripción (CreateCourseEnrollmentDto).
   * @param studentId El ID del estudiante que se está inscribiendo.
   * @throws NotFoundException Si el curso no existe.
   * @throws ForbiddenException Si el estudiante es el profesor del curso.
   * @throws ConflictException Si el estudiante ya está inscrito en el curso.
   * @returns El objeto de la inscripción creada.
   */
  async create(dto: CreateCourseEnrollmentDto, studentId: string) {
    const course = await this.prisma.courses.findUnique({
      where: { id: dto.course_id },
    });

    if (!course) throw new NotFoundException('Course not found');

    if (course.teacher_id === studentId) {
      throw new ForbiddenException('Teachers cannot enroll in their own course');
    }

    const exists = await this.prisma.course_enrollments.findUnique({
      where: {
        course_id_student_id: {
          course_id: dto.course_id,
          student_id: studentId,
        },
      },
    });

    if (exists) {
      throw new ConflictException('You are already enrolled in this course');
    }

    return this.prisma.course_enrollments.create({
      data: {
        course_id: dto.course_id,
        student_id: studentId,
        payment_id: dto.payment_id ?? null,
        status: dto.status ?? 'active',
      },
    });
  }

  // -------------------------------------------------------------
  // FIND ALL + FILTERS + PAGINATION
  // -------------------------------------------------------------
  /**
   * Recupera una lista paginada de inscripciones, permitiendo filtros detallados.
   *
   * Permite filtrar por: `course_id`, `student_id`, `teacher_id` (a través de la relación con el curso), `status`, y rango de fechas (`startDate`, `endDate`).
   *
   * @param filters El DTO con los parámetros de filtrado, paginación y ordenamiento (CourseEnrollmentFilterDto).
   * @throws BadRequestException Si las fechas de inicio o fin son inválidas.
   * @returns Un objeto con metadatos de paginación (`total`, `totalPages`, `page`, `limit`) y la lista de inscripciones (`data`).
   */
  async findAll(filters: CourseEnrollmentFilterDto) {
    const {
      course_id,
      student_id,
      teacher_id,
      status,
      startDate,
      endDate,
      sort,
    } = filters;

    const page = Math.max(filters.page ?? 1, 1);
    const limit = Math.min(filters.limit ?? 10, 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filtrado directo
    if (course_id) where.course_id = course_id;
    if (student_id) where.student_id = student_id;
    if (status) where.status = status;

    // Filtrar por teacher_id usando relación
    if (teacher_id) {
      where.course = { teacher_id };
    }

    // Validación segura de fechas
    if (startDate || endDate) {
      where.enrolled_at = {};

      if (startDate) {
        const d = new Date(startDate);
        if (isNaN(d.getTime())) {
          throw new BadRequestException('Invalid startDate');
        }
        where.enrolled_at.gte = d;
      }

      if (endDate) {
        const d = new Date(endDate);
        if (isNaN(d.getTime())) {
          throw new BadRequestException('Invalid endDate');
        }
        where.enrolled_at.lte = d;
      }
    }

    // Ordenamiento dinámico
    let orderBy: any = { enrolled_at: 'desc' };

    if (sort) {
      const [field, direction] = sort.split(':');

      // Permite solo asc/desc
      if (direction && ['asc', 'desc'].includes(direction)) {
        orderBy = { [field]: direction };
      }
    }

    const total = await this.prisma.course_enrollments.count({ where });

    const data = await this.prisma.course_enrollments.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        course: true,
        student: true,
        payment: true,
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
   * Obtiene los detalles de una inscripción específica por su ID.
   *
   * @param id El ID único de la inscripción.
   * @throws NotFoundException Si la inscripción no existe.
   * @returns El objeto de la inscripción solicitada, incluyendo el curso, el estudiante y la información de pago.
   */
  async findOne(id: string) {
    const enrollment = await this.prisma.course_enrollments.findUnique({
      where: { id },
      include: {
        course: true,
        student: true,
        payment: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    return enrollment;
  }

  // -------------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------------
  /**
   * Actualiza el estado o la referencia de pago de una inscripción existente.
   *
   * @param id El ID único de la inscripción a actualizar.
   * @param dto Los datos parciales de actualización (UpdateCourseEnrollmentDto).
   * @throws NotFoundException Si la inscripción no existe (a través de `findOne`).
   * @throws ConflictException Si la actualización resulta en un registro duplicado (ej. violación de clave única, aunque es improbable aquí).
   * @returns El objeto de la inscripción actualizada.
   */
  async update(id: string, dto: UpdateCourseEnrollmentDto) {
    await this.findOne(id);

    try {
      return this.prisma.course_enrollments.update({
        where: { id },
        data: {
          payment_id: dto.payment_id ?? undefined,
          status: dto.status ?? undefined,
          updated_at: new Date(),
        },
      });
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw new ConflictException('Duplicated record');
      }
      throw err;
    }
  }

  // -------------------------------------------------------------
  // DELETE
  // -------------------------------------------------------------
  /**
   * Elimina un registro de inscripción del sistema.
   *
   * @param id El ID único de la inscripción a eliminar.
   * @throws NotFoundException Si la inscripción no existe (a través de `findOne`).
   * @returns El objeto de la inscripción eliminada.
   */
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.course_enrollments.delete({ where: { id } });
  }
}