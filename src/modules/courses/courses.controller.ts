import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Query, Req } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseFilterDto } from './dto/course-filter.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import type { Request as ExpressRequest } from 'express';

/**
 * @public
 * Controlador de API responsable de manejar todas las solicitudes HTTP relacionadas con los cursos.
 *
 * La ruta base para todos los endpoints es `/courses`.
 *
 * Este controlador aplica seguridad a nivel global utilizando AuthGuard y RolesGuard.
 * para asegurar que solo los usuarios autenticados puedan acceder a los recursos.
 *
 * @injectable
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courses')
export class CoursesController {

  /**
     * @param service El servicio de lógica de negocio para la gestión de cursos.
     */
  constructor(private readonly service: CoursesService) { }

  // -------------------------------------------------------------------------
  //  ENDPOINT: POST /courses
  // -------------------------------------------------------------------------

  /**
   * Crea un nuevo curso en el sistema.
   *
   * @access Restringido a roles: **'teacher'** y **'admin'**.
   * @param req La solicitud Express, que contiene el objeto de usuario autenticado.
   * @param dto Los datos de validación para la creación del curso.
   * @returns El objeto del curso recién creado.
   */
  @Post()
  @Roles('teacher', 'admin')
  create(@Req() req: ExpressRequest, @Body() dto: CreateCourseDto) {
    const user = req.user as any;
    return this.service.create(dto, user.id);
  }

  // -------------------------------------------------------------------------
  //  ENDPOINT: GET /courses
  // -------------------------------------------------------------------------

  /**
   * Obtiene una lista paginada de cursos, permitiendo la aplicación de diversos filtros.
   *
   * @access Autenticado (cualquier usuario con token válido).
   * @param filters Los parámetros de filtrado y paginación ({@link CourseFilterDto}).
   * @returns Una lista paginada de cursos que cumplen con los criterios de filtrado.
   */
  @Get()
  findAll(@Query() filters: CourseFilterDto) {
    return this.service.findAll(filters);
  }

  // -------------------------------------------------------------------------
  //  ENDPOINT: GET /courses/:id
  // -------------------------------------------------------------------------

  /**
   * Obtiene los detalles completos de un curso específico por su ID.
   *
   * @access Autenticado (cualquier usuario con token válido).
   * @param id El ID único del curso (UUID).
   * @returns El objeto del curso solicitado.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // -------------------------------------------------------------------------
  //  ENDPOINT: PATCH /courses/:id
  // -------------------------------------------------------------------------

  /**
   * Actualiza parcialmente los datos de un curso.
   *
   * Nota: La lógica de negocio debe garantizar que solo el profesor creador o un administrador
   * pueda realizar esta operación.
   *
   * @access Restringido a roles: **'teacher'** y **'admin'**.
   * @param req La solicitud Express, que contiene el objeto de usuario autenticado.
   * @param id El ID único del curso a actualizar.
   * @param dto Los datos parciales de actualización ({@link UpdateCourseDto}).
   * @returns El objeto del curso actualizado.
   */
  @Patch(':id')
  @Roles('teacher', 'admin')
  update(
    @Req() req: ExpressRequest,
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
  ) {
    const user = req.user as any;
    return this.service.update(id, dto, user);
  }

  // -------------------------------------------------------------------------
  //  ENDPOINT: DELETE /courses/:id
  // -------------------------------------------------------------------------

  /**
   * Elimina un curso del sistema.
   *
   * Nota: La lógica de negocio debe garantizar que solo el profesor creador o un administrador
   * pueda realizar esta operación.
   *
   * @access Restringido a roles: **'teacher'** y **'admin'**.
   * @param req La solicitud Express, que contiene el objeto de usuario autenticado.
   * @param id El ID único del curso a eliminar.
   * @returns Un resultado que indica que la eliminación fue exitosa.
   */
  @Delete(':id')
  @Roles('teacher', 'admin')
  remove(@Req() req: ExpressRequest, @Param('id') id: string) {
    const user = req.user as any;
    return this.service.remove(id, user);
  }
}