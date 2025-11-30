import { Controller, Post, Get, Patch, Delete, Param, Body, Req, Query } from '@nestjs/common';
import { CourseEnrollmentService } from './course-enrollment.service';
import { CreateCourseEnrollmentDto } from './dto/create-course-enrollment.dto';
import { UpdateCourseEnrollmentDto } from './dto/update-course-enrollment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { CourseEnrollmentFilterDto } from './dto/course-enrollments-filter.dto';
import type { Request } from 'express';
import { AuthUser } from 'src/common/types/auth-user.type';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

/**
 * @public
 * Controlador de API responsable de manejar todas las solicitudes HTTP relacionadas con 
 * la gestión de Inscripciones de Usuarios a Cursos.
 *
 * La ruta base para todos los endpoints es `/course-enrollments`.
 *
 * Este controlador garantiza que:
 * 1. Cualquier usuario autenticado puede inscribirse a un curso (operación POST).
 * 2. Las operaciones administrativas (actualización y eliminación) están reservadas 
 * al rol 'admin' mediante guardias a nivel de método.
 *
 * @injectable
 */
@UseGuards(JwtAuthGuard)
@Controller('course-enrollments')
export class CourseEnrollmentController {

    /**
     * @param service El servicio de lógica de negocio para la gestión de inscripciones a cursos (CourseEnrollmentService).
     */
    constructor(private service: CourseEnrollmentService) { }

    // -------------------------------------------------------------
    //  ENDPOINT: POST /course-enrollments
    // -------------------------------------------------------------

    /**
     * Crea un nuevo registro de inscripción, inscribiendo al usuario autenticado en un curso.
     *
     * @access Autenticado (cualquier rol con token válido).
     * @param dto El DTO con el ID del curso al que se inscribe (CreateCourseEnrollmentDto).
     * @param req La solicitud Express, que contiene el objeto de usuario autenticado (AuthUser).
     * @returns El objeto de la inscripción creada.
     */
    @Post()
    create(
        @Body() dto: CreateCourseEnrollmentDto,
        @Req() req: Request
    ) {
        const user = req.user as AuthUser;
        return this.service.create(dto, user.id);
    }

    // -------------------------------------------------------------
    //  ENDPOINT: GET /course-enrollments
    // -------------------------------------------------------------

    /**
     * Obtiene una lista paginada de inscripciones, permitiendo la aplicación de filtros (ej. por curso, por usuario).
     *
     * Nota: La lógica de negocio debe determinar qué roles pueden ver todas las inscripciones.
     *
     * @access Autenticado (cualquier rol con token válido).
     * @param filters Los parámetros de filtrado y paginación (CourseEnrollmentFilterDto).
     * @returns Una lista paginada de inscripciones.
     */
    @Get()
    findAll(@Query() filters: CourseEnrollmentFilterDto) {
        return this.service.findAll(filters);
    }

    // -------------------------------------------------------------
    //  ENDPOINT: GET /course-enrollments/:id
    // -------------------------------------------------------------

    /**
     * Obtiene los detalles de una inscripción específica por su ID.
     *
     * Nota: La lógica de servicio debe verificar si el usuario tiene derecho a ver esta inscripción
     * (ser 'admin', el 'teacher' del curso, o el 'student' inscrito).
     *
     * @access Autenticado (cualquier rol con token válido).
     * @param id El ID único de la inscripción.
     * @returns El objeto de la inscripción solicitada.
     */
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    // -------------------------------------------------------------
    //  ENDPOINT: PATCH /course-enrollments/:id
    // -------------------------------------------------------------

    /**
     * Actualiza el estado o los detalles de una inscripción (ej. cambiar de estado 'pendiente' a 'completado').
     *
     * @access Restringido a rol: **'admin'**.
     * @param id El ID único de la inscripción a actualizar.
     * @param dto Los datos parciales de actualización (UpdateCourseEnrollmentDto).
     * @returns El objeto de la inscripción actualizada.
     */
    @Patch(':id')
    @Roles('admin')
    @UseGuards(RolesGuard)
    update(
        @Param('id') id: string,
        @Body() dto: UpdateCourseEnrollmentDto,
    ) {
        return this.service.update(id, dto);
    }

    // -------------------------------------------------------------
    //  ENDPOINT: DELETE /course-enrollments/:id
    // -------------------------------------------------------------

    /**
     * Elimina un registro de inscripción.
     *
     * @access Restringido a rol: **'admin'**.
     * @param id El ID único de la inscripción a eliminar.
     * @returns El objeto de la inscripción eliminada (o un mensaje de éxito).
     */
    @Delete(':id')
    @Roles('admin')
    @UseGuards(RolesGuard)
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}