import { Controller, Body, Delete, Get, Param, Patch, Post, UseGuards, Query, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { GetUsersFiltersDto } from './dto/get-user-filter.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import type { Request as ExpressRequest } from 'express';

/**
 * @public
 * Controlador de API responsable de manejar todas las solicitudes HTTP relacionadas con la gestión de usuarios.
 *
 * La ruta base para todos los endpoints es `/users`.
 *
 * Este controlador está protegido globalmente por {@link JwtAuthGuard} y {@link RolesGuard},
 * asegurando que todas las operaciones requieran autenticación, y delegando la verificación
 * de roles específicos a los métodos individuales cuando es necesario (ej., endpoints de administrador).
 *
 * @injectable
 */
@Controller('users')
export class UsersController {

  /**
     * @param usersService El servicio de lógica de negocio para la gestión de usuarios.
     */
  constructor(private readonly usersService: UsersService) { }

  // -------------------------------------------------------------
  //  ENDPOINT DE ESTADÍSTICAS (STATS)
  // -------------------------------------------------------------

  /**
   * Obtiene el conteo total de usuarios en el sistema.
   * @access Autenticado.
   * @returns Un objeto con el número total de usuarios.
   */
  @Get('stats/global')
  @UseGuards(JwtAuthGuard)
  getGlobalStats() {
    return this.usersService.getGlobalStats();
  }

  /**
     * Obtiene el conteo de usuarios agrupado por rol (ej., admin, teacher, student).
     * @access Autenticado.
     * @returns Un objeto o lista con el conteo por rol.
     */
  @Get('stats/roles')
  @UseGuards(JwtAuthGuard)
  getRoleStats() {
    return this.usersService.getRoleStats();
  }

  /**
     * Obtiene el conteo de usuarios agrupado por estado de cuenta (ej., activo, inactivo, pendiente).
     * @access Autenticado.
     * @returns Un objeto o lista con el conteo por estado.
     */
  @Get('stats/status')
  @UseGuards(JwtAuthGuard)
  getStatusStats() {
    return this.usersService.getStatusStats();
  }

  /**
     * Obtiene el número total de usuarios registrados como profesores.
     * @access Autenticado.
     * @returns El número total de profesores.
     */
  @Get('stats/teachers')
  @UseGuards(JwtAuthGuard)
  getTeachersCount() {
    return this.usersService.getTeachersCount();
  }

  /**
     * Obtiene el número total de usuarios registrados como estudiantes.
     * @access Autenticado.
     * @returns El número total de estudiantes.
     */
  @Get('stats/students')
  @UseGuards(JwtAuthGuard)
  getStudentsCount() {
    return this.usersService.getStudentsCount();
  }

  /**
     * Obtiene todas las estadísticas de usuario en una sola respuesta consolidada.
     * @access Autenticado.
     * @returns Un objeto que contiene todas las métricas de conteo de usuarios.
     */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  getAllStats() {
    return this.usersService.getAllStats();
  }

  // -------------------------------------------------------------
  //  OPERACIONES CRUD
  // -------------------------------------------------------------

  /**
   * Crea un nuevo usuario.
   * @access Autenticado. Nota: La lógica de negocio puede permitir la creación sin token
   * si se usa este endpoint para registro público, pero el guard global lo restringe actualmente.
   * @param dto Los datos de creación del usuario ({@link CreateUserDto}).
   * @returns El objeto del usuario creado.
   */
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  /**
     * Obtiene una lista paginada de usuarios, permitiendo la aplicación de filtros.
     * @access Autenticado.
     * @param filters Los parámetros de filtrado y paginación ({@link GetUsersFiltersDto}).
     * @returns Una lista paginada de usuarios que cumplen con los criterios de filtrado.
     */
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query() filters: GetUsersFiltersDto) {
    return this.usersService.findAll(filters);
  }

  /**
     * Obtiene los detalles de un usuario específico por su ID.
     * @access Autenticado.
     * @param id El ID único del usuario (UUID).
     * @returns El objeto del usuario solicitado.
     */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  /**
     * Actualiza la información personal de un usuario.
     *
     * Nota: La lógica de negocio en el servicio debe restringir esta acción para que solo
     * el usuario autenticado pueda editar su propia cuenta.
     *
     * @access Autenticado.
     * @param id El ID del usuario a actualizar.
     * @param dto Los datos parciales de actualización (UpdateUserDto).
     * @param req La solicitud Express, que contiene el objeto de usuario autenticado.
     * @returns El objeto del usuario actualizado.
     */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Request() req: ExpressRequest
  ) {
    return this.usersService.updateUser(id, dto, req.user);
  }

  /**
     * Actualiza el rol o el estado de cuenta de un usuario.
     *
     * @access Restringido a rol: **'admin'**.
     * @param id El ID del usuario a modificar.
     * @param dto Los datos de actualización de administrador (AdminUpdateUserDto).
     * @returns El objeto del usuario modificado.
     */
  @Patch(':id/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateAdmin(
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto
  ) {
    return this.usersService.updateUserAdmin(id, dto);
  }

  /**
     * Elimina un usuario del sistema.
     *
     * Nota: La lógica de negocio debe verificar los permisos antes de la eliminación.
     *
     * @access Autenticado.
     * @param id El ID del usuario a eliminar.
     * @returns El objeto del usuario eliminado (o un mensaje de éxito).
     */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}