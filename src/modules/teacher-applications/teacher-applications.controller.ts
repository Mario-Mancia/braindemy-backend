import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { TeacherApplicationsService } from './teacher-applications.service';
import { CreateTeacherApplicationDto } from './dto/create-teacher-application.dto';
import { UpdateTeacherApplicationDto } from './dto/update-teacher-application.dto';
import { AdminReviewTeacherApplicationDto } from './dto/admin-review-teacher-application.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import type { Request as ExpressRequest } from 'express';

/**
 * @public
 * Controlador de API responsable de manejar todas las solicitudes HTTP relacionadas con las aplicaciones
 * de los usuarios para convertirse en profesores.
 *
 * La ruta base para todos los endpoints es `/teacher-applications`.
 *
 * Este controlador implementa un flujo de trabajo de revisión: permite a los usuarios crear y
 * modificar su propia solicitud, y proporciona endpoints restringidos para que los administradores
 * puedan revisarlas y cambiar su estado.
 *
 * @injectable
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('teacher-applications')
export class TeacherApplicationsController {
    /**
     * @param service El servicio de lógica de negocio para la gestión de solicitudes de profesor (TeacherApplicationsService).
     */
    constructor(
        private readonly service: TeacherApplicationsService,
    ) { }

    // -------------------------------------------------------------
    //  ENDPOINT: POST /teacher-applications
    // -------------------------------------------------------------

    /**
     * Permite a un usuario crear una nueva solicitud para convertirse en profesor.
     *
     * Nota: La lógica de negocio en el servicio debe asegurar que solo se pueda crear una solicitud por usuario
     * y que el usuario aún no sea un profesor activo.
     *
     * @access Restringido a rol: **'teacher'** (rol por defecto tras el registro).
     * @param dto Los datos de la aplicación (CreateTeacherApplicationDto).
     * @param req La solicitud Express, que contiene el ID del usuario autenticado.
     * @returns El objeto de la solicitud creada.
     */
    @Post()
    @Roles('teacher') // rol inicial asignado al registrarse
    create(
        @Body() dto: CreateTeacherApplicationDto,
        @Req() req: ExpressRequest
    ) {
        const userId = (req.user as any).id;
        return this.service.create(dto, userId);
    }

    // -------------------------------------------------------------
    //  ENDPOINT: GET /teacher-applications/me
    // -------------------------------------------------------------

    /**
     * Recupera el estado y los detalles de la solicitud de profesor del usuario autenticado.
     *
     * @access Restringido a rol: **'teacher'**.
     * @param req La solicitud Express, que contiene el ID del usuario autenticado.
     * @returns El objeto de la solicitud del usuario, o un error si no existe.
     */
    @Get('me')
    @Roles('teacher')
    getMyApplication(@Req() req: ExpressRequest) {
        const userId = (req.user as any).id;
        return this.service.getMyApplication(userId);
    }

    // -------------------------------------------------------------
    //  ENDPOINT: GET /teacher-applications
    // -------------------------------------------------------------

    /**
     * Obtiene una lista de todas las solicitudes de profesor en el sistema, idealmente filtradas por estado (pendiente, aprobada, rechazada).
     *
     * @access Restringido a rol: **'admin'**.
     * @returns Una lista de todas las solicitudes de profesor.
     */
    @Get()
    @Roles('admin')
    findAll() {
        return this.service.findAll();
    }

    // GET /teacher-applications/pending
    @Get('pending')
    @Roles('admin')
    async getPending() {
        const data = await this.service.findPending();
        return { data };
    }

    @Get(':id')
    @Roles('admin')
    async findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    // -------------------------------------------------------------
    //  ENDPOINT: PATCH /teacher-applications/me
    // -------------------------------------------------------------

    /**
     * Permite al usuario actualizar su propia solicitud de profesor.
     *
     * Regla de Negocio: La lógica de servicio debe asegurar que la actualización solo sea posible
     * si el estado actual de la solicitud es **'pending'**.
     *
     * @access Restringido a rol: **'teacher'**.
     * @param dto Los datos parciales de actualización (UpdateTeacherApplicationDto).
     * @param req La solicitud Express, que contiene el ID del usuario autenticado.
     * @returns El objeto de la solicitud actualizada.
     */
    @Patch('me')
    @Roles('teacher')
    update(
        @Body() dto: UpdateTeacherApplicationDto,
        @Req() req: ExpressRequest
    ) {
        const userId = (req.user as any).id;
        return this.service.updateMyApplication(userId, dto);
    }

    // -------------------------------------------------------------
    //  ENDPOINT: PATCH /teacher-applications/:id/review
    // -------------------------------------------------------------

    /**
     * Procesa la revisión de una solicitud de profesor, permitiendo al administrador aprobarla o rechazarla.
     *
     * La lógica de servicio es responsable de:
     * 1. Cambiar el estado de la aplicación.
     * 2. Si es aprobada, crear el perfil de profesor y/o actualizar el rol del usuario.
     *
     * @access Restringido a rol: **'admin'**.
     * @param id El ID de la solicitud a revisar.
     * @param dto Los datos de la revisión (AdminReviewTeacherApplicationDto), incluyendo el nuevo estado.
     * @returns El objeto de la solicitud después de la revisión.
     */
    @Patch(':id/review')
    @Roles('admin')
    adminReview(
        @Param('id') id: string,
        @Body() dto: AdminReviewTeacherApplicationDto
    ) {
        return this.service.adminReview(id, dto);
    }
}
