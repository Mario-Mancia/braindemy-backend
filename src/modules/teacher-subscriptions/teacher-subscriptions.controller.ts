import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TeacherSubscriptionsService } from './teacher-subscriptions.service';
import { CreateTeacherSubscriptionsDto } from './dto/create-teacher-subscriptions.dto';
import { UpdateTeacherSubscriptionsDto } from './dto/update-teacher-subscriptions.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthUser } from 'src/common/types/auth-user.type';

/**
 * @public
 * Controlador de API responsable de manejar todas las solicitudes HTTP relacionadas con las suscripciones de los profesores
 * (ej., planes de pago para usar la plataforma).
 *
 * La ruta base para todos los endpoints es `/teacher-subscriptions`.
 *
 * Este controlador está protegido por los guardias (JwtAuthGuard, RolesGuard) y aplica una seguridad de acceso muy granular,
 * delegando la mayoría de las operaciones administrativas (lectura total, modificación, eliminación) al rol 'admin'.
 *
 * @injectable
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('teacher-subscriptions')
export class TeacherSubscriptionsController {

    /**
     * @param service El servicio de lógica de negocio para la gestión de suscripciones de profesores (TeacherSubscriptionsService).
     */
    constructor(private readonly service: TeacherSubscriptionsService) { }

    // -------------------------------------------------------------
    //  ENDPOINT: POST /teacher-subscriptions
    // -------------------------------------------------------------

    /**
     * Permite a un profesor crear un nuevo plan de suscripción para su cuenta.
     *
     * @access Restringido a rol: **'teacher'**.
     * @param req La solicitud HTTP, que contiene el objeto de usuario autenticado.
     * @param dto Los datos necesarios para la creación de la suscripción (CreateTeacherSubscriptionsDto).
     * @returns El objeto de la nueva suscripción creada.
     */
    @Post()
    @Roles('teacher')
    create(
        @Req() req: Request & { user: AuthUser },
        @Body() dto: CreateTeacherSubscriptionsDto,
    ) {
        return this.service.create(req.user.id, dto);
    }

    // -------------------------------------------------------------
    //  ENDPOINT: GET /teacher-subscriptions
    // -------------------------------------------------------------

    /**
     * Obtiene una lista completa de todas las suscripciones de todos los profesores en el sistema.
     *
     * @access Restringido a rol: **'admin'**.
     * @returns Una lista de todas las suscripciones de profesor.
     */
    @Get()
    @Roles('admin')
    findAll() {
        return this.service.findAll();
    }

    // -------------------------------------------------------------
    //  ENDPOINT: GET /teacher-subscriptions/:id
    // -------------------------------------------------------------

    /**
     * Obtiene los detalles de una suscripción específica por su ID.
     *
     * Nota: El servicio (TeacherSubscriptionsService.findOneSecure) implementa una **regla de acceso estricta**:
     * - El administrador puede ver cualquier suscripción.
     * - El profesor solo puede ver su propia suscripción, incluso si intenta acceder a otra ID.
     *
     * @access Restringido a roles: **'admin'** y **'teacher'**.
     * @param req La solicitud HTTP, que contiene el objeto de usuario autenticado.
     * @param id El ID único de la suscripción.
     * @returns El objeto de la suscripción solicitada.
     */
    @Get(':id')
    @Roles('admin', 'teacher')
    findOne(
        @Req() req: Request & { user: AuthUser },
        @Param('id') id: string,
    ) {
        return this.service.findOneSecure(id, req.user);
    }

    // -------------------------------------------------------------
    //  ENDPOINT: PATCH /teacher-subscriptions/:id
    // -------------------------------------------------------------

    /**
     * Actualiza una suscripción de profesor existente (ej. cambiar estado, fecha de expiración).
     *
     * @access Restringido a rol: **'admin'**.
     * @param id El ID único de la suscripción a actualizar.
     * @param dto Los datos parciales de actualización (UpdateTeacherSubscriptionsDto).
     * @returns El objeto de la suscripción actualizada.
     */
    @Patch(':id')
    @Roles('admin')
    update(@Param('id') id: string, @Body() dto: UpdateTeacherSubscriptionsDto) {
        return this.service.update(id, dto);
    }

    // -------------------------------------------------------------
    //  ENDPOINT: DELETE /teacher-subscriptions/:id
    // -------------------------------------------------------------

    /**
     * Elimina una suscripción de profesor.
     *
     * @access Restringido a rol: **'admin'**.
     * @param id El ID único de la suscripción a eliminar.
     * @returns El objeto de la suscripción eliminada (o un mensaje de éxito).
     */
    @Delete(':id')
    @Roles('admin')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}