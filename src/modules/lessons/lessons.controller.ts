import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    Req,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { FindLessonsDto } from './dto/find-lessons.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthUser } from 'src/common/types/auth-user.type';

/**
 * @public
 * Controlador de API responsable de manejar todas las solicitudes HTTP relacionadas
 *  con la gestión de Lecciones (Lessons) dentro de los cursos.
 *
 * La ruta base para todos los endpoints es `/lessons`.
 *
 * Este controlador aplica seguridad basada en roles:
 * - Los **Profesores y Administradores** tienen acceso a las operaciones CRUD completas (Crear, Editar, Eliminar).
 * - Los **Estudiantes** tienen acceso a la lectura (Visualizar Lecciones), sujeta a la
 *  lógica de inscripción definida en el servicio.
 *
 * @injectable
 */
@Controller('lessons')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LessonsController {

    /**
     * @param service El servicio de lógica de negocio para la gestión de lecciones (LessonsService).
     */
    constructor(private readonly service: LessonsService) { }

    // -------------------------------------------------------------
    //  ENDPOINT: POST /lessons
    // -------------------------------------------------------------

    /**
     * Crea una nueva lección dentro de un curso.
     *
     * Regla de Negocio: El servicio debe verificar que el usuario autenticado sea el **profesor dueño** del curso.
     *
     * @access Restringido a roles: **'teacher'** y **'admin'**.
     * @param dto Los datos de creación de la lección (CreateLessonDto).
     * @param req La solicitud HTTP, que contiene el objeto de usuario autenticado (AuthUser).
     * @returns El objeto de la lección creada.
     */
    @Post()
    @Roles('teacher', 'admin')
    create(@Body() dto: CreateLessonDto, @Req() req: { user: AuthUser }) {
        return this.service.create(dto, req.user);
    }

    // -------------------------------------------------------------
    //  ENDPOINT: GET /lessons
    // -------------------------------------------------------------

    /**
     * Obtiene una lista de lecciones, permitiendo filtrado y paginación.
     *
     * Regla de Negocio: La lógica de servicio debe restringir las lecciones visibles a los estudiantes
     * solo a aquellos cursos en los que están **inscritos**.
     *
     * @access Abierto a roles: **'student'**, **'teacher'** y **'admin'** (con restricciones de visibilidad).
     * @param q Los parámetros de consulta para filtrado, paginación y ordenamiento (FindLessonsDto).
     * @param req La solicitud HTTP, que contiene el objeto de usuario autenticado.
     * @throws BadRequestException Si los campos de ordenamiento (`orderBy`) o dirección (`sort`) son inválidos.
     * @returns Una lista paginada de lecciones.
     */
    @Get()
    @Roles('student', 'teacher', 'admin')
    findAll(@Query() q: FindLessonsDto, @Req() req: { user: AuthUser }) {
        const allowedOrderFields = ['position', 'created_at', 'updated_at', 'title'];
        if (q.orderBy && !allowedOrderFields.includes(q.orderBy)) {
            throw new BadRequestException(`Invalid orderBy field. Allowed: ${allowedOrderFields.join(', ')}`);
        }
        if (q.sort && !['asc', 'desc'].includes(q.sort.toLowerCase())) {
            throw new BadRequestException('sort must be "asc" or "desc"');
        }
        return this.service.findAll(q, req.user);
    }

    // -------------------------------------------------------------
    //  ENDPOINT: GET /lessons/:id
    // -------------------------------------------------------------

    /**
     * Obtiene los detalles de una lección específica por su ID.
     *
     * Regla de Negocio: El servicio debe verificar los permisos:
     * - **Profesor/Admin**: Acceso si son dueños del curso.
     * - **Estudiante**: Acceso solo si está inscrito en el curso.
     *
     * @access Abierto a roles: **'student'**, **'teacher'** y **'admin'** (con verificación de acceso).
     * @param id El ID único de la lección.
     * @param req La solicitud HTTP, que contiene el objeto de usuario autenticado.
     * @returns El objeto de la lección solicitada.
     */
    @Get(':id')
    @Roles('student', 'teacher', 'admin')
    findOne(@Param('id') id: string, @Req() req: { user: AuthUser }) {
        return this.service.findOne(id, req.user);
    }

    // -------------------------------------------------------------
    //  ENDPOINT: PATCH /lessons/:id
    // -------------------------------------------------------------

    /**
     * Actualiza la información de una lección existente.
     *
     * Regla de Seguridad: Solo el **profesor dueño** del curso o un **administrador** pueden editar la lección.
     *
     * @access Restringido a roles: **'teacher'** y **'admin'**.
     * @param id El ID único de la lección a actualizar.
     * @param dto Los datos parciales de actualización (UpdateLessonDto).
     * @param req La solicitud HTTP, que contiene el objeto de usuario autenticado.
     * @returns El objeto de la lección actualizada.
     */
    @Patch(':id')
    @Roles('teacher', 'admin')
    update(
        @Param('id') id: string,
        @Body() dto: UpdateLessonDto,
        @Req() req: { user: AuthUser },
    ) {
        return this.service.update(id, dto, req.user);
    }

    // -------------------------------------------------------------
    //  ENDPOINT: DELETE /lessons/:id
    // -------------------------------------------------------------

    /**
     * Elimina una lección del sistema.
     *
     * Regla de Seguridad: Solo el **profesor dueño** del curso o un **administrador** pueden eliminar la lección.
     *
     * @access Restringido a roles: **'teacher'** y **'admin'**.
     * @param id El ID único de la lección a eliminar.
     * @param req La solicitud HTTP, que contiene el objeto de usuario autenticado.
     * @returns El objeto de la lección eliminada (o un mensaje de éxito).
     */
    @Delete(':id')
    @Roles('teacher', 'admin')
    remove(@Param('id') id: string, @Req() req: { user: AuthUser }) {
        return this.service.remove(id, req.user);
    }
}