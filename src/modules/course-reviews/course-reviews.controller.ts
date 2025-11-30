import { Controller, Get, Post, Patch, Delete, Body, Param, Req, Query } from '@nestjs/common';
import { CourseReviewsService } from './course-reviews.service';
import { CreateCourseReviewDto } from './dto/create-course-review.dto';
import { UpdateCourseReviewDto } from './dto/update-course-review.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthUser } from 'src/common/types/auth-user.type';
import { FilterCourseReviewDto } from './dto/filter-course-review.dto';

/**
 * @public
 * Controlador de API responsable de manejar todas las solicitudes HTTP relacionadas con la gestión
 *  de Reseñas y Calificaciones de Cursos.
 *
 * La ruta base para todos los endpoints es `/course-reviews`.
 *
 * Este controlador aplica seguridad de acceso a nivel de método, asegurando que:
 * 1. Solo los estudiantes inscritos puedan crear reseñas.
 * 2. La modificación/eliminación de una reseña se restringe al dueño (estudiante) o a un administrador.
 *
 * @injectable
 */
@Controller('course-reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CourseReviewsController {

  /**
  * @param service El servicio de lógica de negocio para la gestión de reseñas de cursos (CourseReviewsService).
  */
  constructor(private readonly service: CourseReviewsService) { }


  // -------------------------------------------------------------
  //  ENDPOINT: POST /course-reviews
  // -------------------------------------------------------------

  /**
   * Crea una nueva reseña (calificación y comentario) para un curso.
   *
   * Regla de Negocio: La lógica de servicio debe validar que el usuario esté **inscrito** en el curso antes de permitir la creación.
   *
   * @access Restringido a rol: **'student'**.
   * @param dto Los datos de la reseña (CreateCourseReviewDto).
   * @param req La solicitud HTTP, que contiene el ID del usuario autenticado (AuthUser).
   * @returns El objeto de la reseña creada.
   */
  @Post()
  @Roles('student')
  create(@Body() dto: CreateCourseReviewDto, @Req() req: { user: AuthUser }) {
    return this.service.create(dto, req.user.id);
  }

  // -------------------------------------------------------------
  //  ENDPOINT: GET /course-reviews
  // -------------------------------------------------------------

  /**
   * Obtiene una lista de todas las reseñas, permitiendo filtros (ej. por curso, por calificación).
   *
   * Nota: La lógica de servicio debe restringir la visibilidad de las reseñas según el rol (ej., los profesores solo ven las de sus cursos).
   *
   * @access Autenticado (cualquier rol con token válido).
   * @param filters Los parámetros de filtrado (FilterCourseReviewDto).
   * @param req La solicitud HTTP, que contiene el objeto de usuario autenticado.
   * @returns Una lista de reseñas filtradas.
   */
  @Get()
  findAll(@Query() filters: FilterCourseReviewDto, @Req() req: { user: AuthUser }) {
    return this.service.findAll(filters, req.user);
  }

  // -------------------------------------------------------------
  //  ENDPOINT: GET /course-reviews/:id
  // -------------------------------------------------------------

  /**
   * Obtiene los detalles de una reseña específica por su ID.
   *
   * Regla de Seguridad: La lógica de servicio debe verificar si el usuario tiene derecho a ver la reseña (pública o restringida).
   *
   * @access Autenticado (cualquier rol con token válido).
   * @param id El ID único de la reseña.
   * @param req La solicitud HTTP, que contiene el objeto de usuario autenticado.
   * @returns El objeto de la reseña solicitada.
   */
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.service.findOne(id, req.user);
  }

  // -------------------------------------------------------------
  //  ENDPOINT: PATCH /course-reviews/:id
  // -------------------------------------------------------------

  /**
   * Actualiza una reseña existente.
   *
   * Regla de Seguridad: Solo el **dueño de la reseña** (el estudiante que la creó) o un **administrador** pueden realizar la actualización.
   *
   * @access Restringido a roles: **'student'** y **'admin'** (con verificación de propiedad en el servicio).
   * @param id El ID único de la reseña a actualizar.
   * @param dto Los datos parciales de actualización (UpdateCourseReviewDto).
   * @param req La solicitud HTTP, que contiene el objeto de usuario autenticado.
   * @returns El objeto de la reseña actualizada.
   */
  @Patch(':id')
  @Roles('student', 'admin')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCourseReviewDto,
    @Req() req: { user: AuthUser },
  ) {
    return this.service.update(id, dto, req.user);
  }

  // -------------------------------------------------------------
  //  ENDPOINT: DELETE /course-reviews/:id
  // -------------------------------------------------------------

  /**
   * Elimina una reseña del sistema.
   *
   * Regla de Seguridad: Solo el **dueño de la reseña** o un **administrador** pueden realizar la eliminación.
   *
   * @access Restringido a roles: **'student'** y **'admin'** (con verificación de propiedad en el servicio).
   * @param id El ID único de la reseña a eliminar.
   * @param req La solicitud HTTP, que contiene el objeto de usuario autenticado.
   * @returns El objeto de la reseña eliminada.
   */
  @Delete(':id')
  @Roles('student', 'admin')
  remove(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.service.remove(id, req.user);
  }
}