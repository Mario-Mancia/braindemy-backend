import { Injectable, NotFoundException, ConflictException, ForbiddenException, } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTeacherApplicationDto } from './dto/create-teacher-application.dto';
import { UpdateTeacherApplicationDto } from './dto/update-teacher-application.dto';
import { AdminReviewTeacherApplicationDto } from './dto/admin-review-teacher-application.dto';
import { teacher_application_status } from '@prisma/client';

/**
 * @public
 * Servicio de lógica de negocio responsable de gestionar las solicitudes de usuarios para convertirse en profesores ([TeacherApplication]).
 *
 * Este servicio implementa un flujo de trabajo de aplicación crucial con las siguientes responsabilidades:
 * 1. **Control de Duplicados**: Garantiza que solo pueda haber una solicitud pendiente o resuelta por usuario.
 * 2. **Gestión del Solicitante**: Permite al usuario crear, ver y actualizar su solicitud solo si está en estado 'pending'.
 * 3. **Proceso de Revisión (Admin)**: Permite a los administradores revisar, aprobar o rechazar la solicitud, y automáticamente crea un perfil de Profesor si es aprobada.
 *
 * @injectable
 */
@Injectable()
export class TeacherApplicationsService {
  /**
     * @param prisma Instancia de PrismaService para interactuar con la base de datos.
     */
  constructor(private prisma: PrismaService) { }

  // -------------------------------------------------------------------
  // CREATE (Creación de Solicitud)
  // -------------------------------------------------------------------
  /**
   * Crea una nueva solicitud para convertirse en profesor.
   *
   * Regla de Negocio: Solo permite la creación si el usuario no tiene una solicitud existente (pending, approved, or rejected).
   *
   * @param dto Los datos iniciales de la solicitud (CreateTeacherApplicationDto).
   * @param userId El ID del usuario que realiza la solicitud.
   * @throws ConflictException Si ya existe una solicitud para este usuario.
   * @returns El objeto de la solicitud creada.
   */
  async create(dto: CreateTeacherApplicationDto, userId: string) {
    const existing = await this.prisma.teachers_applications.findUnique({
      where: { user_id: userId },
    });

    if (existing)
      throw new ConflictException('Ya tienes una solicitud creada');

    return this.prisma.teachers_applications.create({
      data: {
        user_id: userId,
        ...dto,
      },
    });
  }

  // -------------------------------------------------------------------
  // GET MY APPLICATION (Vista del Solicitante)
  // -------------------------------------------------------------------
  /**
   * Obtiene los detalles de la solicitud de profesor del usuario autenticado.
   *
   * @param userId El ID del usuario cuya solicitud se busca.
   * @throws NotFoundException Si el usuario no tiene una solicitud creada.
   * @returns El objeto de la solicitud de profesor.
   */
  async getMyApplication(userId: string) {
    const app = await this.prisma.teachers_applications.findUnique({
      where: { user_id: userId },
    });

    if (!app) throw new NotFoundException('No tienes una solicitud creada');

    return app;
  }

  // -------------------------------------------------------------------
  // FIND ALL (Vista del Administrador)
  // -------------------------------------------------------------------
  /**
   * Obtiene una lista de todas las solicitudes de profesor.
   *
   * @access Típicamente restringido al rol 'admin' o 'super admin' a nivel de controlador.
   * @returns Una lista de todas las solicitudes, incluyendo la información de usuario, ordenadas por fecha de creación descendente.
   */
  async findAll() {
    return this.prisma.teachers_applications.findMany({
      orderBy: { created_at: 'desc' },
      include: { user: true },
    });
  }

  // -------------------------------------------------------------------
  // UPDATE MY APPLICATION (Edición del Solicitante)
  // -------------------------------------------------------------------
  /**
   * Actualiza la solicitud del usuario autenticado.
   *
   * Regla de Edición: Solo permite la actualización si la solicitud se encuentra en estado **'pending'**.
   *
   * @param userId El ID del usuario autenticado.
   * @param dto Los datos parciales para actualizar la solicitud (UpdateTeacherApplicationDto).
   * @throws NotFoundException Si no existe una solicitud para el usuario.
   * @throws ForbiddenException Si la solicitud ya fue revisada (no está en estado 'pending').
   * @returns El objeto de la solicitud actualizado.
   */
  async updateMyApplication(
    userId: string,
    dto: UpdateTeacherApplicationDto
  ) {
    const app = await this.prisma.teachers_applications.findUnique({
      where: { user_id: userId },
    });

    if (!app) throw new NotFoundException('No tienes una solicitud');

    if (app.status !== teacher_application_status.pending) {
      throw new ForbiddenException(
        'Solo puedes editar tu solicitud mientras está pendiente'
      );
    }

    return this.prisma.teachers_applications.update({
      where: { user_id: userId },
      data: {
        ...dto,
        updated_at: new Date(),
      },
    });
  }

  // -------------------------------------------------------------------
  // ADMIN REVIEW (Revisión y Promoción)
  // -------------------------------------------------------------------
  /**
   * Permite a un administrador revisar y cambiar el estado de la solicitud.
   *
   * Lógica de Promoción:
   * - Si el estado es **'approved'**: Se crea automáticamente un nuevo registro en la tabla `teachers`
   * y se vincula la solicitud con el nuevo perfil de profesor.
   * - Si el estado es **'rejected'**: Solo se actualiza el estado y el comentario administrativo.
   *
   * @access Típicamente restringido al rol 'admin' a nivel de controlador.
   * @param id El ID único de la solicitud a revisar.
   * @param dto Los datos de la revisión (estado y comentario administrativo).
   * @throws NotFoundException Si la solicitud no es encontrada.
   * @returns Un objeto que contiene la solicitud actualizada y el nuevo perfil de profesor (si fue aprobado).
   */
  async adminReview(
    id: string,
    dto: AdminReviewTeacherApplicationDto
  ) {
    const app = await this.prisma.teachers_applications.findUnique({
      where: { id },
    });

    if (!app) throw new NotFoundException('Solicitud no encontrada');

    // Actualizar estado primero
    const updated = await this.prisma.teachers_applications.update({
      where: { id },
      data: {
        status: dto.status,
        admin_comment: dto.admin_comment,
        updated_at: new Date(),
      },
    });

    // Si es rechazada → no crear teacher
    if (dto.status === teacher_application_status.rejected) return updated;

    // Si es aprobada → crear teacher
    const teacher = await this.prisma.teachers.create({
      data: {
        user_id: app.user_id,
        bio: app.bio,
        specialty: app.specialty,
      },
    });

    // vincular teachers_applications → teachers
    await this.prisma.teachers_applications.update({
      where: { id },
      data: { teachersId: teacher.id },
    });

    return {
      application: updated,
      teacher,
    };
  }
}
