import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';

import { LessonProgressService } from './lesson-progress.service';

import { CreateLessonProgressDto } from './dto/create-lesson-progress.dto';
import { UpdateLessonProgressDto } from './dto/update-lesson-progress.dto';
import { LessonProgressFilterDto } from './dto/lesson-progress-filter.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthUser } from 'src/common/types/auth-user.type';

/**
 * @public
 * Controlador de API responsable de manejar todas las solicitudes HTTP relacionadas con el seguimiento
 *  del Progreso de Lecciones (Lesson Progress).
 *
 * La ruta base para todos los endpoints es `/lesson-progress`.
 *
 * Este controlador garantiza que:
 * - La creación y actualización del progreso son responsabilidades primarias del **Estudiante**.
 * - El **Profesor** y el **Administrador** pueden monitorear el progreso (visibilidad).
 * - Todas las operaciones están sujetas a la verificación de propiedad en el servicio.
 *
 * @injectable
 */
@Controller('lesson-progress')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LessonProgressController {

    /**
     * @param service El servicio de lógica de negocio para la gestión del progreso de lecciones (LessonProgressService).
     */
    constructor(private readonly service: LessonProgressService) { }

    // -------------------------------------------------------------
    //  ENDPOINT: POST /lesson-progress
    // -------------------------------------------------------------

    /**
     * Crea un nuevo registro de progreso de lección para el usuario autenticado (ej., iniciando una lección).
     *
     * Regla de Negocio: La lógica de servicio debe verificar que el usuario sea un estudiante inscrito en el curso de la lección.
     *
     * @access Restringido a rol: **'student'**.
     * @param dto Los datos iniciales del progreso (CreateLessonProgressDto).
     * @param req La solicitud HTTP, que contiene el objeto de usuario autenticado (AuthUser).
     * @returns El objeto de progreso de lección creado.
     */
    @Post()
    @Roles('student')
    create(
        @Body() dto: CreateLessonProgressDto,
        @Req() req: { user: AuthUser },
    ) {
        return this.service.create(dto, req.user);
    }

    // -------------------------------------------------------------
    //  ENDPOINT: GET /lesson-progress
    // -------------------------------------------------------------

    /**
     * Obtiene una lista paginada de registros de progreso, permitiendo filtros (ej. por lección o por estudiante).
     *
     * Lógica de Visibilidad: La lógica de servicio debe restringir los resultados:
     * - **Estudiante**: Solo ve su propio progreso.
     * - **Profesor**: Solo ve el progreso de las lecciones en sus cursos.
     * - **Admin**: Ve todos los registros.
     *
     * @access Abierto a roles: **'admin'**, **'teacher'** y **'student'** (con restricciones de visibilidad en el servicio).
     * @param filters Los parámetros de filtrado (LessonProgressFilterDto).
     * @param req La solicitud HTTP, que contiene el objeto de usuario autenticado.
     * @returns Una lista paginada de registros de progreso.
     */
    @Get()
    @Roles('admin', 'teacher', 'student')
    findAll(
        @Query() filters: LessonProgressFilterDto,
        @Req() req: { user: AuthUser },
    ) {
        return this.service.findAll(filters, req.user);
    }

    // -------------------------------------------------------------
    //  ENDPOINT: GET /lesson-progress/:id
    // -------------------------------------------------------------

    /**
     * Obtiene los detalles de un registro de progreso específico por su ID.
     *
     * Lógica de Visibilidad: El servicio debe verificar que el usuario sea el **dueño** del progreso,
     *  el **profesor** del curso, o un **administrador**.
     *
     * @access Abierto a roles: **'admin'**, **'teacher'** y **'student'** (con verificación de acceso en el servicio).
     * @param id El ID único del registro de progreso.
     * @param req La solicitud HTTP, que contiene el objeto de usuario autenticado.
     * @returns El objeto de progreso de lección solicitado.
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
    //  ENDPOINT: PATCH /lesson-progress/:id
    // -------------------------------------------------------------

    /**
     * Actualiza el progreso de una lección (ej., tiempo de reproducción, estado 'completado').
     *
     * Regla de Seguridad: Solo el **estudiante dueño** del registro o un **administrador** pueden actualizarlo.
     *
     * @access Restringido a roles: **'student'** y **'admin'** (con verificación de propiedad en el servicio).
     * @param id El ID único del registro de progreso a actualizar.
     * @param dto Los datos parciales de actualización (UpdateLessonProgressDto).
     * @param req La solicitud HTTP, que contiene el objeto de usuario autenticado.
     * @returns El objeto de progreso de lección actualizado.
     */
    @Patch(':id')
    @Roles('student', 'admin')
    update(
        @Param('id') id: string,
        @Body() dto: UpdateLessonProgressDto,
        @Req() req: { user: AuthUser },
    ) {
        return this.service.update(id, dto, req.user);
    }

    // -------------------------------------------------------------
    //  ENDPOINT: DELETE /lesson-progress/:id
    // -------------------------------------------------------------

    /**
     * Elimina un registro de progreso de lección.
     *
     * Regla de Seguridad: Solo el **estudiante dueño** del registro o un **administrador** pueden eliminarlo.
     *
     * @access Restringido a roles: **'student'** y **'admin'** (con verificación de propiedad en el servicio).
     * @param id El ID único del registro de progreso a eliminar.
     * @param req La solicitud HTTP, que contiene el objeto de usuario autenticado.
     * @returns El objeto de progreso de lección eliminado.
     */
    @Delete(':id')
    @Roles('student', 'admin')
    remove(
        @Param('id') id: string,
        @Req() req: { user: AuthUser },
    ) {
        return this.service.remove(id, req.user);
    }
}