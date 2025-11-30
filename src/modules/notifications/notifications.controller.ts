import {
    Body,
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Req,
    UseGuards,
    Query,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

import { AuthUser } from 'src/common/types/auth-user.type';

/**
 * @public
 * Controlador de API responsable de manejar todas las solicitudes HTTP relacionadas con
 *  la gestión de Notificaciones del Usuario.
 *
 * La ruta base para todos los endpoints es `/notifications`.
 *
 * Este controlador segmenta el acceso:
 * 1. **Creación**: Solo roles con capacidad de envío masivo (**'admin'**, **'teacher'**).
 * 2. **Gestión Personal (CRUD de Lectura/Actualización/Eliminación)**: Abierto a todos 
 * los roles autenticados, pero estrictamente sujeto a la **propiedad** de la notificación definida en el servicio.
 *
 * @injectable
 */
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
    /**
     * @param service El servicio de lógica de negocio para la gestión de notificaciones (NotificationsService).
     */
    constructor(private readonly service: NotificationsService) { }

    // -------------------------------------------------------------
    //  ENDPOINT: POST /notifications
    // -------------------------------------------------------------

    /**
     * Crea y envía una nueva notificación a uno o varios usuarios.
     *
     * Regla de Negocio: El servicio debe manejar la lógica de destino (ej., notificar
     *  a todos los estudiantes de un curso).
     *
     * @access Restringido a roles: **'admin'** y **'teacher'**.
     * @param dto Los datos de la notificación a crear (CreateNotificationDto).
     * @param req La solicitud HTTP, que contiene el usuario que origina la notificación (AuthUser).
     * @returns El objeto de la notificación creada o una lista de notificaciones enviadas.
     */
    @Post()
    @Roles('admin', 'teacher')
    create(
        @Body() dto: CreateNotificationDto,
        @Req() req: { user: AuthUser },
    ) {
        return this.service.create(dto, req.user);
    }

    // -------------------------------------------------------------
    //  ENDPOINT: GET /notifications
    // -------------------------------------------------------------

    /**
     * Obtiene una lista de todas las notificaciones destinadas al usuario autenticado.
     *
     * Regla de Seguridad: La lógica de servicio aplica un filtro estricto para mostrar solo las notificaciones
     * donde el `user_id` de la notificación coincide con el `user.id` del solicitante.
     *
     * @access Abierto a roles: **'admin'**, **'teacher'** y **'student'**.
     * @param type Filtro opcional para buscar por tipo de notificación.
     * @param req La solicitud HTTP, que contiene el objeto de usuario autenticado.
     * @returns Una lista de notificaciones del usuario.
     */
    @Get()
    @Roles('admin', 'teacher', 'student')
    findAll(
        @Query('type') type: string,
        @Req() req: { user: AuthUser },
    ) {
        return this.service.findAll(req.user, type);
    }

    // -------------------------------------------------------------
    //  ENDPOINT: GET /notifications/:id
    // -------------------------------------------------------------

    /**
     * Obtiene los detalles de una notificación específica por su ID.
     *
     * Regla de Seguridad: El servicio debe verificar que el usuario autenticado sea el **destinatario** o un **administrador**.
     *
     * @access Abierto a roles: **'admin'**, **'teacher'** y **'student'** (con verificación de propiedad).
     * @param id El ID único de la notificación.
     * @param req La solicitud HTTP, que contiene el objeto de usuario autenticado.
     * @returns El objeto de la notificación solicitada.
     */
    @Get(':id')
    @Roles('admin', 'teacher', 'student')
    findOne(
        @Param('id') id: string,
        @Req() req: { user: AuthUser },
    ) {
        return this.service.findOne(id, req.user);
    }

    // -------------------------------------------------------------
    //  ENDPOINT: PATCH /notifications/:id
    // -------------------------------------------------------------

    /**
     * Actualiza el estado de una notificación (ej., marcar como leída/no leída).
     *
     * Regla de Seguridad: Solo el **destinatario** o un **administrador** pueden actualizar la notificación.
     *
     * @access Abierto a roles: **'admin'**, **'teacher'** y **'student'** (con verificación de propiedad).
     * @param id El ID único de la notificación a actualizar.
     * @param dto Los datos parciales de actualización (UpdateNotificationDto).
     * @param req La solicitud HTTP, que contiene el objeto de usuario autenticado.
     * @returns El objeto de la notificación actualizada.
     */
    @Patch(':id')
    @Roles('admin', 'teacher', 'student')
    update(
        @Param('id') id: string,
        @Body() dto: UpdateNotificationDto,
        @Req() req: { user: AuthUser },
    ) {
        return this.service.update(id, dto, req.user);
    }

    // -------------------------------------------------------------
    //  ENDPOINT: DELETE /notifications/:id
    // -------------------------------------------------------------

    /**
     * Elimina una notificación del buzón del usuario.
     *
     * Regla de Seguridad: Solo el **destinatario** o un **administrador** pueden eliminar la notificación.
     *
     * @access Abierto a roles: **'admin'**, **'teacher'** y **'student'** (con verificación de propiedad).
     * @param id El ID único de la notificación a eliminar.
     * @param req La solicitud HTTP, que contiene el objeto de usuario autenticado.
     * @returns El objeto de la notificación eliminada.
     */
    @Delete(':id')
    @Roles('admin', 'teacher', 'student')
    remove(
        @Param('id') id: string,
        @Req() req: { user: AuthUser },
    ) {
        return this.service.remove(id, req.user);
    }
}