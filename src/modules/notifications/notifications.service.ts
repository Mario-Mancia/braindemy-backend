import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { notification_type } from '@prisma/client';
import { AuthUser } from 'src/common/types/auth-user.type';

/**
 * @public
 * Servicio de lógica de negocio responsable de todas las operaciones CRUD y el control de acceso para la entidad [Notification].
 *
 * Este servicio es crítico para la comunicación del sistema, aplicando seguridad en dos niveles:
 * 1. **Creación/Envío**: Define a quién puede notificar cada rol (Admin -> cualquiera; Teacher -> solo sus estudiantes).
 * 2. **Gestión (Find/Update/Remove)**: Implementa la regla de **Propiedad** estricta, donde un usuario solo puede gestionar (ver, marcar como leído, eliminar) las notificaciones dirigidas a sí mismo, a menos que sea un Administrador.
 *
 * @injectable
 */
@Injectable()
export class NotificationsService {
    /**
     * @param prisma Instancia de PrismaService para interactuar con la base de datos.
     */
    constructor(private prisma: PrismaService) { }

    // --------------------------------------------------------------------
    // CREATE (Envío de Notificación)
    // --------------------------------------------------------------------
    /**
     * Crea y envía una nueva notificación al usuario objetivo (`dto.user_id`).
     *
     * Lógica de Permisos de Envío:
     * - **Admin**: Permite el envío a cualquier usuario.
     * - **Teacher**: Solo puede enviar notificaciones a usuarios que son **estudiantes inscritos** en al menos uno de sus cursos.
     * - **Otros roles (incluyendo Student)**: Prohibido enviar.
     *
     * @param dto El DTO de creación de la notificación (CreateNotificationDto).
     * @param auth El objeto de usuario autenticado que intenta crear la notificación.
     * @throws NotFoundException Si el usuario objetivo (`user_id`) no existe.
     * @throws ForbiddenException Si el rol del remitente no tiene permiso para notificar al objetivo.
     * @returns El objeto de la notificación creada.
     */
    async create(dto: CreateNotificationDto, auth: AuthUser) {
        const targetUser = await this.prisma.users.findUnique({
            where: { id: dto.user_id },
            select: { id: true },
        });

        if (!targetUser) {
            throw new NotFoundException('Target user not found');
        }

        // Administrador → puede enviar a cualquier usuario
        if (auth.role === 'admin') {
            return this.createNotification(dto);
        }

        // Teacher → solo enviar a alumnos de sus cursos
        if (auth.role === 'teacher') {
            const isStudentOfTeacher = await this.prisma.course_enrollments.findFirst({
                where: {
                    student_id: dto.user_id,
                    course: {
                        teacher_id: auth.id,
                    },
                },
            });

            if (!isStudentOfTeacher) {
                throw new ForbiddenException(
                    'You can only send notifications to students in your courses',
                );
            }

            return this.createNotification({
                ...dto,
                type: dto.type ?? 'course',
            });
        }

        throw new ForbiddenException('You cannot send notifications');
    }

    /**
     * Función privada auxiliar para la creación real del registro de notificación.
     * @private
     * @param dto Los datos para la creación en Prisma.
     * @returns La notificación creada.
     */
    private createNotification(dto: CreateNotificationDto) {
        return this.prisma.notifications.create({
            data: {
                user_id: dto.user_id,
                title: dto.title,
                message: dto.message,
                type: dto.type ?? 'system',
            },
        });
    }

    // --------------------------------------------------------------------
    // FIND ALL (Listado)
    // --------------------------------------------------------------------
    /**
     * Recupera una lista de notificaciones, filtrada por el destinatario y opcionalmente por tipo.
     *
     * Lógica de Visibilidad:
     * - **Admin**: Ve todas las notificaciones en el sistema (opcionalmente filtradas por tipo).
     * - **Otros roles**: Solo ven las notificaciones donde `user_id` coincide con su propio ID (`auth.id`).
     *
     * @param auth El objeto de usuario autenticado.
     * @param type Tipo de notificación para filtrar (opcional).
     * @throws BadRequestException Si el tipo de notificación proporcionado es inválido.
     * @returns Una lista de notificaciones ordenadas por fecha de creación descendente.
     */
    async findAll(auth: AuthUser, type?: string) {
        let enumType: notification_type | undefined;

        if (type) {
            // Validar que sea un valor permitido
            if (!Object.values(notification_type).includes(type as notification_type)) {
                throw new BadRequestException(`Invalid notification type: ${type}`);
            }
            enumType = type as notification_type;
        }

        if (auth.role === 'admin') {
            return this.prisma.notifications.findMany({
                where: {
                    type: enumType,
                },
                orderBy: { created_at: 'desc' },
            });
        }

        return this.prisma.notifications.findMany({
            where: {
                user_id: auth.id,
                type: enumType,
            },
            orderBy: { created_at: 'desc' },
        });
    }

    // --------------------------------------------------------------------
    // FIND ONE (Detalle)
    // --------------------------------------------------------------------
    /**
     * Obtiene los detalles de una notificación específica por su ID.
     *
     * Regla de Propiedad: Solo el **destinatario** de la notificación o un **administrador** puede acceder a ella.
     *
     * @param id El ID único de la notificación.
     * @param auth El objeto de usuario autenticado.
     * @throws NotFoundException Si la notificación no existe.
     * @throws ForbiddenException Si el usuario no es el destinatario ni el administrador.
     * @returns El objeto de la notificación solicitada.
     */
    async findOne(id: string, auth: AuthUser) {
        const notif = await this.prisma.notifications.findUnique({
            where: { id },
        });

        if (!notif) {
            throw new NotFoundException('Notification not found');
        }

        if (auth.role !== 'admin' && notif.user_id !== auth.id) {
            throw new ForbiddenException(
                'You do not have access to this notification',
            );
        }

        return notif;
    }

    /// --------------------------------------------------------------------
    // UPDATE (Actualización del estado)
    // --------------------------------------------------------------------
    /**
     * Actualiza una notificación existente.
     *
     * Lógica de Permisos de Edición:
     * - **Admin**: Puede actualizar cualquier campo (título, mensaje, estado, etc.) en cualquier notificación.
     * - **Otros roles**: Solo pueden actualizar el campo `is_read` (marcar como leído/no leído) en sus propias notificaciones.
     *
     * @param id El ID único de la notificación a actualizar.
     * @param dto Los datos parciales de actualización (UpdateNotificationDto).
     * @param auth El objeto de usuario autenticado.
     * @throws ForbiddenException Si un usuario no administrador intenta modificar campos distintos de `is_read`.
     * @returns El objeto de la notificación actualizada.
     */
    async update(id: string, dto: UpdateNotificationDto, auth: AuthUser) {
        const notif = await this.findOne(id, auth);

        // Usuario común → solo marcar como leído
        if (auth.role !== 'admin') {
            if ('is_read' in dto && Object.keys(dto).length === 1) {
                return this.prisma.notifications.update({
                    where: { id },
                    data: { is_read: dto.is_read },
                });
            }

            throw new ForbiddenException(
                'You can only mark notifications as read',
            );
        }

        // Admin → editar todo
        return this.prisma.notifications.update({
            where: { id },
            data: { ...dto },
        });
    }

    // --------------------------------------------------------------------
    // REMOVE (Eliminación)
    // --------------------------------------------------------------------
    /**
     * Elimina una notificación del buzón del usuario.
     *
     * Regla de Propiedad: Solo el **destinatario** de la notificación o un **administrador** pueden eliminarla.
     *
     * @param id El ID único de la notificación a eliminar.
     * @param auth El objeto de usuario autenticado.
     * @throws ForbiddenException Si el usuario no es el destinatario ni el administrador.
     * @returns El objeto de la notificación eliminada.
     */
    async remove(id: string, auth: AuthUser) {
        const notif = await this.findOne(id, auth);

        if (auth.role !== 'admin' && notif.user_id !== auth.id) {
            throw new ForbiddenException(
                'You cannot delete this notification',
            );
        }

        return this.prisma.notifications.delete({
            where: { id },
        });
    }
}
