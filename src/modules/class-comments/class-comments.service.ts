import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateClassCommentDto } from './dto/create-class-comment.dto';
import { UpdateClassCommentDto } from './dto/update-class-comment.dto';
import { AuthUser } from 'src/common/types/auth-user.type';

/**
 * @public
 * Servicio de lógica de negocio responsable de todas las operaciones CRUD y el control de acceso para la entidad [ClassComment].
 *
 * Este servicio implementa las **Reglas de Participación y Visibilidad** en los foros de clase:
 * 1. **Participación (Crear)**: Solo usuarios inscritos (estudiantes) o el profesor dueño del curso pueden crear comentarios.
 * 2. **Visibilidad (Find)**: Solo participantes del curso (inscritos, profesor dueño, o administrador) pueden ver los comentarios.
 * 3. **Moderación (Update/Delete)**: Solo el autor del comentario o un administrador pueden modificarlo/eliminarlo.
 *
 * @injectable
 */
@Injectable()
export class ClassCommentsService {
  /**
     * @param prisma Instancia de PrismaService para interactuar con la base de datos.
     */
  constructor(private prisma: PrismaService) { }

  // -------------------------------------------------------------------
  // CREATE (Creación de Comentario)
  // -------------------------------------------------------------------
  /**
   * Crea un nuevo comentario de clase.
   *
   * Reglas de Participación:
   * - **Student**: Debe estar inscrito en el curso (`course_enrollments`).
   * - **Teacher**: Debe ser el `teacher_id` del curso.
   * - **Admin**: No puede crear comentarios directamente a través de este endpoint.
   *
   * @param dto El DTO de creación del comentario (CreateClassCommentDto).
   * @param userId El ID del usuario que intenta crear el comentario.
   * @throws NotFoundException Si el curso o el usuario no existen.
   * @throws ForbiddenException Si el usuario no cumple las reglas de participación (no inscrito o no es dueño del curso).
   * @returns El objeto del comentario creado.
   */
  async create(dto: CreateClassCommentDto, userId: string) {
    const course = await this.prisma.courses.findUnique({
      where: { id: dto.course_id },
    });

    if (!course) throw new NotFoundException('Course not found');

    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) throw new NotFoundException('User not found');

    // ---------------------------------------------------
    // REGLAS POR ROL
    // ---------------------------------------------------

    if (user.role === 'student') {
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
          'You must be enrolled in this course to comment',
        );
      }
    }

    if (user.role === 'teacher') {
      if (course.teacher_id !== userId) {
        throw new ForbiddenException(
          'You can only comment on your own courses',
        );
      }
    }

    return this.prisma.class_comments.create({
      data: {
        course_id: dto.course_id,
        student_id: userId, // Campo se mantiene igual
        comment: dto.comment,
      },
    });
  }

  // -------------------------------------------------------------------
  // FIND BY COURSE (Listado)
  // -------------------------------------------------------------------
  /**
   * Obtiene una lista de todos los comentarios de un curso específico.
   *
   * Reglas de Visibilidad:
   * - **Admin**: Acceso total.
   * - **Teacher**: Solo si es el dueño (`teacher_id`) del curso.
   * - **Student**: Solo si está inscrito en el curso.
   *
   * @param courseId El ID del curso para el listado de comentarios.
   * @param user El objeto de usuario autenticado para la verificación de acceso.
   * @throws NotFoundException Si el curso no existe.
   * @throws ForbiddenException Si el usuario no es un participante autorizado del curso.
   * @returns Una lista de comentarios ordenados por fecha de creación descendente.
   */
  async findByCourse(courseId: string, user: AuthUser) {
    const course = await this.prisma.courses.findUnique({
      where: { id: courseId },
    });

    if (!course) throw new NotFoundException('Course not found');

    // Permitir ver comentarios a:
    // - maestros dueños
    // - alumnos inscritos
    // - admin
    if (user.role === 'teacher' && course.teacher_id !== user.id) {
      throw new ForbiddenException(
        'You can only access your own courses',
      );
    }

    if (user.role === 'student') {
      const enrollment = await this.prisma.course_enrollments.findUnique({
        where: {
          course_id_student_id: {
            course_id: courseId,
            student_id: user.id,
          },
        },
      });

      if (!enrollment) {
        throw new ForbiddenException(
          'You must be enrolled in this course to view comments',
        );
      }
    }

    return this.prisma.class_comments.findMany({
      where: { course_id: courseId },
      orderBy: { created_at: 'desc' },
    });
  }

  // -------------------------------------------------------------------
  // FIND ONE (Detalle)
  // -------------------------------------------------------------------
  /**
   * Obtiene los detalles de un comentario específico por su ID.
   *
   * Reglas de Visibilidad: Se aplican las mismas reglas de acceso al curso que en `findByCourse`.
   *
   * @param id El ID único del comentario.
   * @param user El objeto de usuario autenticado.
   * @throws NotFoundException Si el comentario no existe.
   * @throws ForbiddenException Si el usuario no tiene permiso para ver el curso al que pertenece el comentario.
   * @returns El objeto del comentario solicitado, incluyendo la información del curso.
   */
  async findOne(id: string, user: AuthUser) {
    const comment = await this.prisma.class_comments.findUnique({
      where: { id },
      include: {
        course: true,
      },
    });

    if (!comment) throw new NotFoundException('Comment not found');

    const course = comment.course;

    // Las mismas reglas que findByCourse
    if (user.role === 'teacher' && course.teacher_id !== user.id) {
      throw new ForbiddenException(
        'You can only access comments from your own courses',
      );
    }

    if (user.role === 'student') {
      const enrollment = await this.prisma.course_enrollments.findUnique({
        where: {
          course_id_student_id: {
            course_id: course.id,
            student_id: user.id,
          },
        },
      });

      if (!enrollment) {
        throw new ForbiddenException(
          'You must be enrolled in this course to view comments',
        );
      }
    }

    return comment;
  }

  // -------------------------------------------------------------------
  // UPDATE (Edición)
  // -------------------------------------------------------------------
  /**
   * Actualiza el contenido de un comentario.
   *
   * Reglas de Moderación: Solo el **autor** (`comment.student_id`) o un **administrador** pueden editar el comentario.
   *
   * @param id El ID único del comentario a actualizar.
   * @param dto Los datos de actualización (UpdateClassCommentDto).
   * @param user El objeto de usuario autenticado.
   * @throws NotFoundException Si el comentario no existe.
   * @throws ForbiddenException Si el usuario no es el autor ni el administrador.
   * @returns El objeto del comentario actualizado.
   */
  async update(id: string, dto: UpdateClassCommentDto, user: AuthUser) {
    const comment = await this.prisma.class_comments.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!comment) throw new NotFoundException('Comment not found');

    const course = comment.course;

    // Solo pueden actualizar:
    // - el autor (student or teacher)
    // - admin
    if (user.role !== 'admin' && comment.student_id !== user.id) {
      throw new ForbiddenException('You cannot edit this comment');
    }

    return this.prisma.class_comments.update({
      where: { id },
      data: {
        comment: dto.comment,
      },
    });
  }

  // -------------------------------------------------------------------
  // DELETE (Eliminación)
  // -------------------------------------------------------------------
  /**
   * Elimina un comentario del sistema.
   *
   * Reglas de Moderación: Solo el **autor** (`comment.student_id`) o un **administrador** pueden eliminar el comentario.
   *
   * @param id El ID único del comentario a eliminar.
   * @param user El objeto de usuario autenticado.
   * @throws NotFoundException Si el comentario no existe.
   * @throws ForbiddenException Si el usuario no es el autor ni el administrador.
   * @returns Un mensaje de éxito indicando que el comentario fue eliminado.
   */
  async remove(id: string, user: AuthUser) {
    const comment = await this.prisma.class_comments.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!comment) throw new NotFoundException('Comment not found');

    // Reglas:
    // - autor del comentario (student o teacher)
    // - admin
    if (user.role !== 'admin' && comment.student_id !== user.id) {
      throw new ForbiddenException('You cannot delete this comment');
    }

    await this.prisma.class_comments.delete({
      where: { id },
    });

    return { message: 'Comment deleted successfully' };
  }
}