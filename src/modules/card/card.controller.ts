import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { CardService } from './card.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthUser } from 'src/common/types/auth-user.type';

/**
 * @public
 * Controlador de API responsable de manejar todas las solicitudes HTTP relacionadas
 *  con la gestión de Tarjetas de Pago (referencias a tarjetas de crédito/débito).
 *
 * La ruta base para todos los endpoints es `/cards`.
 *
 * Este controlador aplica seguridad de propiedad: permite a los usuarios autenticados (student, teacher)
 * gestionar sus propias tarjetas, mientras que el rol 'admin' mantiene control total
 *  y acceso a todos los recursos.
 *
 * @injectable
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cards')
export class CardController {

  /**
  * @param service El servicio de lógica de negocio para la gestión de tarjetas (CardService).
  */
  constructor(private readonly service: CardService) { }

  // -------------------------------------------------------------
  //  ENDPOINT: POST /cards
  // -------------------------------------------------------------

  /**
   * Registra una nueva tarjeta de pago asociada al usuario autenticado.
   *
   * @access Abierto a roles: **'student'**, **'teacher'** y **'admin'**.
   * @param req La solicitud HTTP, que contiene el ID del usuario autenticado (AuthUser).
   * @param dto Los datos de creación de la tarjeta (CreateCardDto).
   * @returns El objeto de la tarjeta creada.
   */
  @Post()
  @Roles('student', 'teacher', 'admin')
  create(
    @Req() req: Request & { user: AuthUser },
    @Body() dto: CreateCardDto,
  ) {
    return this.service.create(dto, req.user.id);
  }

  // -------------------------------------------------------------
  //  ENDPOINT: GET /cards
  // -------------------------------------------------------------

  /**
   * Obtiene una lista completa de todas las tarjetas de pago registradas en el sistema.
   *
   * @access Restringido a rol: **'admin'**.
   * @returns Una lista de todos los objetos de tarjetas.
   */
  @Get()
  @Roles('admin')
  findAll() {
    return this.service.findAll();
  }

  // -------------------------------------------------------------
  //  ENDPOINT: GET /cards/:id
  // -------------------------------------------------------------

  /**
   * Obtiene los detalles de una tarjeta específica por su ID.
   *
   * Regla de Seguridad: Solo el **administrador** o el **dueño de la tarjeta** (el user_id asociado)
   * pueden acceder a la información.
   *
   * @access Abierto a roles: **'student'**, **'teacher'** y **'admin'** (con verificación de propiedad).
   * @param req La solicitud HTTP, que contiene el objeto de usuario autenticado para la verificación.
   * @param id El ID único de la tarjeta.
   * @throws ForbiddenException Si un usuario intenta ver la tarjeta de otra persona sin ser administrador.
   * @returns El objeto de la tarjeta solicitada.
   */
  @Get(':id')
  @Roles('student', 'teacher', 'admin')
  async findOne(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
  ) {
    const card = await this.service.findOne(id);

    if (req.user.role !== 'admin' && card.user_id !== req.user.id) {
      throw new ForbiddenException('No tienes permisos para ver esta tarjeta');
    }

    return card;
  }

  // -------------------------------------------------------------
  //  ENDPOINT: PATCH /cards/:id
  // -------------------------------------------------------------

  /**
   * Actualiza la información de una tarjeta de pago (ej. cambiar la etiqueta o el estado).
   *
   * Regla de Seguridad: Solo el **administrador** o el **dueño de la tarjeta** pueden realizar la actualización.
   *
   * @access Abierto a roles: **'student'**, **'teacher'** y **'admin'** (con verificación de propiedad).
   * @param req La solicitud HTTP, que contiene el objeto de usuario autenticado.
   * @param id El ID único de la tarjeta a actualizar.
   * @param dto Los datos parciales de actualización (UpdateCardDto).
   * @throws ForbiddenException Si un usuario intenta actualizar la tarjeta de otra persona sin ser administrador.
   * @returns El objeto de la tarjeta actualizada.
   */
  @Patch(':id')
  @Roles('student', 'teacher', 'admin')
  async update(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
    @Body() dto: UpdateCardDto,
  ) {
    const card = await this.service.findOne(id);

    if (req.user.role !== 'admin' && card.user_id !== req.user.id) {
      throw new ForbiddenException('No puedes actualizar tarjetas de otros usuarios');
    }

    return this.service.update(id, dto);
  }

  // -------------------------------------------------------------
  //  ENDPOINT: DELETE /cards/:id
  // -------------------------------------------------------------

  /**
   * Elimina el registro de una tarjeta de pago.
   *
   * Regla de Seguridad: Solo el **administrador** o el **dueño de la tarjeta** pueden realizar la eliminación.
   *
   * @access Abierto a roles: **'student'**, **'teacher'** y **'admin'** (con verificación de propiedad).
   * @param req La solicitud HTTP, que contiene el objeto de usuario autenticado.
   * @param id El ID único de la tarjeta a eliminar.
   * @throws ForbiddenException Si un usuario intenta eliminar la tarjeta de otra persona sin ser administrador.
   * @returns El objeto de la tarjeta eliminada.
   */
  @Delete(':id')
  @Roles('student', 'teacher', 'admin')
  async remove(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
  ) {
    const card = await this.service.findOne(id);

    if (req.user.role !== 'admin' && card.user_id !== req.user.id) {
      throw new ForbiddenException('No puedes eliminar tarjetas de otros usuarios');
    }

    return this.service.remove(id);
  }
}
