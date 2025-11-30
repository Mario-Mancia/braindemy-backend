import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateClassCommentDto } from './dto/create-class-comment.dto';
import { UpdateClassCommentDto } from './dto/update-class-comment.dto';
import { ClassCommentsService } from './class-comments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthUser } from 'src/common/types/auth-user.type';

/**
 * @public
 * Controlador de API responsable de manejar todas las solicitudes HTTP relacionadas con la gestión de Comentarios de Clase (Class Comments).
 *
 * La ruta base para todos los endpoints es `/class-comments`.
 *
 * Este controlador facilita la interacción entre usuarios dentro de un contexto de curso específico, asegurando:
 * 1. **Creación**: Abierta a estudiantes y profesores para fomentar el diálogo.
 * 2. **Modificación/Eliminación**: Restringida al creador del comentario (estudiante) o a un administrador para moderación.
 *
 * @injectable
 */
@Controller('class-comments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassCommentsController {
  /**
     * @param service El servicio de lógica de negocio para la gestión de comentarios de clase (ClassCommentsService).
     */
  constructor(private readonly service: ClassCommentsService) { }

  // -------------------------------------------------------------
  //  ENDPOINT: POST /class-comments
  // -------------------------------------------------------------

  /**
   * Crea un nuevo comentario de clase asociado a una lección o curso.
   *
   * Regla de Negocio: El servicio debe verificar que el usuario autenticado esté inscrito o enseñando el curso asociado.
   *
   * @access Restringido a roles: **'student'** y **'teacher'**.
   * @param dto Los datos de la creación del comentario (CreateClassCommentDto).
   * @param req La solicitud HTTP, que contiene el ID del usuario autenticado.
   * @returns El objeto del comentario creado.
   */
  @Post()
  @Roles('student', 'teacher')
  create(@Body() dto: CreateClassCommentDto, @Req() req: { user: AuthUser }) {
    return this.service.create(dto, req.user.id);
  }

  // -------------------------------------------------------------
  //  ENDPOINT: GET /class-comments/course/:courseId
  // -------------------------------------------------------------

  /**
   * Obtiene todos los comentarios asociados a un curso específico.
   *
   * Regla de Seguridad: La lógica de servicio debe restringir la visibilidad solo a los usuarios
   * que son **participantes** del curso (inscritos, profesores, o administradores).
   *
   * @access Abierto a roles: **'student'**, **'teacher'** y **'admin'** (con verificación de acceso al curso).
   * @param courseId El ID del curso cuyos comentarios se desean obtener.
   * @param req La solicitud HTTP, que contiene el objeto de usuario autenticado para la verificación de acceso.
   * @returns Una lista de comentarios del curso.
   */
  @Get('course/:courseId')
  findByCourse(
    @Param('courseId') courseId: string,
    @Req() req: { user: AuthUser },
  ) {
    return this.service.findByCourse(courseId, req.user);
  }

  // -------------------------------------------------------------
  //  ENDPOINT: GET /class-comments/:id
  // -------------------------------------------------------------

  /**
   * Obtiene los detalles de un comentario específico por su ID.
   *
   * Regla de Seguridad: El servicio debe verificar que el usuario tenga permiso para acceder al curso al que pertenece el comentario.
   *
   * @access Abierto a roles: **'student'**, **'teacher'** y **'admin'** (con verificación de acceso al curso).
   * @param id El ID único del comentario.
   * @param req La solicitud HTTP, que contiene el objeto de usuario autenticado.
   * @returns El objeto del comentario solicitado.
   */
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.service.findOne(id, req.user);
  }

  // -------------------------------------------------------------
  //  ENDPOINT: PATCH /class-comments/:id
  // -------------------------------------------------------------

  /**
   * Actualiza el contenido de un comentario existente.
   *
   * Regla de Seguridad: Solo el **creador (student)** del comentario o un **administrador** pueden editarlo.
   *
   * @access Restringido a roles: **'student'** y **'admin'**.
   * @param id El ID único del comentario a actualizar.
   * @param dto Los datos parciales de actualización (UpdateClassCommentDto).
   * @param req La solicitud HTTP, que contiene el objeto de usuario autenticado.
   * @returns El objeto del comentario actualizado.
   */
  @Patch(':id')
  @Roles('student', 'admin')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClassCommentDto,
    @Req() req: { user: AuthUser },
  ) {
    return this.service.update(id, dto, req.user);
  }

  // -------------------------------------------------------------
  //  ENDPOINT: DELETE /class-comments/:id
  // -------------------------------------------------------------

  /**
   * Elimina un comentario del sistema.
   *
   * Regla de Seguridad: Solo el **creador (student)** del comentario o un **administrador** pueden eliminarlo.
   *
   * @access Restringido a roles: **'student'** y **'admin'**.
   * @param id El ID único del comentario a eliminar.
   * @param req La solicitud HTTP, que contiene el objeto de usuario autenticado.
   * @returns El objeto del comentario eliminado.
   */
  @Delete(':id')
  @Roles('student', 'admin')
  remove(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.service.remove(id, req.user);
  }
}