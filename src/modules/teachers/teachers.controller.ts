import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Query, Req } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { TeacherFilterDto } from './dto/teacher-filter.dto';
import type { Request as ExpressRequest } from 'express';

/**
 * @public
 * Controlador de API responsable de manejar todas las solicitudes HTTP relacionadas con la gestión de Profesores.
 *
 * La ruta base para todos los endpoints es `/teachers`.
 *
 * Este controlador aplica seguridad a nivel global mediante JwtAuthGuard y RolesGuard,
 * restringiendo el acceso y las operaciones según el rol del usuario autenticado.
 *
 * @injectable
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('teachers')
export class TeachersController {

  /**
  * @param teachersService El servicio de lógica de negocio para la gestión de profesores.
  */
  constructor(private readonly teachersService: TeachersService) { }

  // -------------------------------------------------------------
  //  ENDPOINT: POST /teachers
  // -------------------------------------------------------------

  /**
   * Crea un nuevo registro de profesor.
   *
   * Nota: La creación directa de un perfil de profesor está reservada a la administración.
   *
   * @access Restringido a rol: **'admin'**.
   * @param dto Los datos de creación del profesor (CreateTeacherDto).
   * @returns El objeto del profesor creado.
   */
  @Post()
  @Roles('admin')
  create(@Body() dto: CreateTeacherDto) {
    return this.teachersService.create(dto);
  }

  // -------------------------------------------------------------
  //  ENDPOINT: GET /teachers
  // -------------------------------------------------------------

  /**
   * Obtiene una lista de todos los perfiles de profesor, aplicando filtros opcionales.
   *
   * @access Restringido a roles: **'admin'** y **'teacher'**.
   * @param filters Los parámetros de filtrado (TeacherFilterDto).
   * @returns Una lista de objetos de profesores que cumplen con los criterios de filtrado.
   */
  @Get()
  @Roles('admin', 'teacher')
  findAll(@Query() filters: TeacherFilterDto) {
    return this.teachersService.findAll(filters);
  }

  // -------------------------------------------------------------
  //  ENDPOINT: GET /teachers/:id
  // -------------------------------------------------------------

  /**
   * Obtiene los detalles de un profesor específico por su ID.
   *
   * @access Restringido a roles: **'admin'** y **'teacher'**.
   * @param id El ID único del profesor (UUID).
   * @returns El objeto del profesor solicitado.
   */
  @Get(':id')
  @Roles('admin', 'teacher')
  findOne(@Param('id') id: string) {
    return this.teachersService.findOne(id);
  }

  // -------------------------------------------------------------
  //  ENDPOINT: PATCH /teachers/:id
  // -------------------------------------------------------------

  /**
   * Actualiza el perfil de un profesor.
   *
   * La lógica de negocio en el servicio debe asegurar que solo un administrador
   * o el profesor dueño del perfil puedan realizar la actualización.
   *
   * @access Restringido a roles: **'admin'** y **'teacher'**.
   * @param id El ID del profesor a actualizar.
   * @param dto Los datos parciales de actualización ({@link UpdateTeacherDto}).
   * @param req La solicitud Express, que contiene el objeto de usuario autenticado.
   * @returns El objeto del profesor actualizado.
   */
  @Patch(':id')
  @Roles('admin', 'teacher')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTeacherDto,
    @Req() req: ExpressRequest
  ) {
    return this.teachersService.update(id, dto, req.user);
  }

  // -------------------------------------------------------------
  //  ENDPOINT: DELETE /teachers/:id
  // -------------------------------------------------------------

  /**
   * Elimina un registro de profesor.
   *
   * @access Restringido a rol: **'admin'**.
   * @param id El ID del profesor a eliminar.
   * @returns El objeto del profesor eliminado (o un mensaje de éxito).
   */
  @Delete(':id')
  @Roles('admin')
  delete(@Param('id') id: string) {
    return this.teachersService.delete(id);
  }
}