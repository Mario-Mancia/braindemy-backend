import { Controller, Post, Body, Get, Param, Patch, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import type { Request as ExpressRequest } from 'express';
import { GetStudentsFiltersDto } from './dto/get-student-filter.dto';

/**
 * @public
 * Controlador de API responsable de manejar todas las solicitudes HTTP relacionadas con la
 *  gestión de Perfiles de Estudiante.
 *
 * La ruta base para todos los endpoints es `/students`.
 *
 * Este controlador segmenta sus responsabilidades en dos áreas principales:
 * 1. Operaciones de **Autogestión** del perfil (accesibles solo para el rol 'student').
 * 2. Operaciones de **Administración** (CRUD completo, accesibles solo para el rol 'admin').
 *
 * @injectable
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {

  /**
  * @param studentsService El servicio de lógica de negocio para la gestión de estudiantes (StudentsService).
  */
  constructor(private readonly studentsService: StudentsService) { }

  // -------------------------------------------------------------
  //  ENDPOINT DE AUTOGESTIÓN (ROL: STUDENT)
  // -------------------------------------------------------------

  /**
   * Crea el perfil de estudiante para el usuario autenticado.
   *
   * Nota: La lógica de negocio debe verificar que el perfil de estudiante no exista previamente.
   *
   * @access Restringido a rol: **'student'**.
   * @param dto Los datos de creación del perfil (CreateStudentDto).
   * @param req La solicitud Express, que contiene el ID del usuario autenticado.
   * @returns El objeto del perfil de estudiante creado.
   */
  @Post()
  @Roles('student')
  create(@Body() dto: CreateStudentDto, @Req() req: ExpressRequest) {
    const userId = (req.user as any).id;
    return this.studentsService.create(dto, userId);
  }

  /**
     * Obtiene el perfil de estudiante del usuario autenticado.
     *
     * @access Restringido a rol: **'student'**.
     * @param req La solicitud Express, que contiene el ID del usuario autenticado.
     * @returns El objeto del perfil de estudiante del usuario.
     */
  @Get('me')
  @Roles('student')
  getMyProfile(@Req() req: ExpressRequest) {
    const userId = (req.user as any).id;
    return this.studentsService.getMyStudentProfile(userId);
  }

  /**
     * Actualiza el perfil de estudiante del usuario autenticado.
     *
     * @access Restringido a rol: **'student'**.
     * @param dto Los datos parciales de actualización (UpdateStudentDto).
     * @param req La solicitud Express, que contiene el ID del usuario autenticado.
     * @returns El objeto del perfil de estudiante actualizado.
     */
  @Patch('me')
  @Roles('student')
  updateMe(
    @Body() dto: UpdateStudentDto,
    @Req() req: ExpressRequest
  ) {
    const userId = (req.user as any).id;
    return this.studentsService.updateByUserId(userId, dto);
  }

  /**
     * Elimina el perfil de estudiante del usuario autenticado.
     *
     * @access Restringido a rol: **'student'**.
     * @param req La solicitud Express, que contiene el ID del usuario autenticado.
     * @returns El objeto del perfil de estudiante eliminado.
     */
  @Delete('me')
  @Roles('student')
  deleteMe(@Req() req: ExpressRequest) {
    const userId = (req.user as any).id;
    return this.studentsService.removeByUserId(userId);
  }


  // -------------------------------------------------------------
  //  ENDPOINT DE ADMINISTRACIÓN (ROL: ADMIN)
  // -------------------------------------------------------------

  /**
   * Obtiene una lista paginada de todos los perfiles de estudiante, permitiendo aplicar filtros.
   *
   * @access Restringido a rol: **'admin'**.
   * @param filters Los parámetros de filtrado y paginación (GetStudentsFiltersDto).
   * @returns Una lista paginada de perfiles de estudiante.
   */
  @Get()
  @Roles('admin')
  findAll(@Query() filters: GetStudentsFiltersDto) {
    return this.studentsService.findAll(filters);
  }

  /**
     * Obtiene los detalles de un perfil de estudiante específico por su ID.
     *
     * @access Restringido a rol: **'admin'**.
     * @param id El ID único del perfil de estudiante.
     * @returns El objeto del perfil de estudiante solicitado.
     */
  @Get(':id')
  @Roles('admin')
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  /**
     * Actualiza el perfil de cualquier estudiante por su ID, ejecutado por un administrador.
     *
     * @access Restringido a rol: **'admin'**.
     * @param id El ID del perfil de estudiante a actualizar.
     * @param dto Los datos parciales de actualización (UpdateStudentDto).
     * @returns El objeto del perfil de estudiante actualizado.
     */
  @Patch(':id')
  @Roles('admin')
  updateByAdmin(
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto
  ) {
    return this.studentsService.update(id, dto);
  }

  /**
     * Elimina el perfil de cualquier estudiante por su ID, ejecutado por un administrador.
     *
     * @access Restringido a rol: **'admin'**.
     * @param id El ID del perfil de estudiante a eliminar.
     * @returns El objeto del perfil de estudiante eliminado.
     */
  @Delete(':id')
  @Roles('admin')
  deleteByAdmin(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }
}
