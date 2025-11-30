import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

/**
 * @public
 * Controlador de API responsable de manejar todas las solicitudes HTTP relacionadas con la gestión de los **Planes de Suscripción** principales de la plataforma.
 *
 * La ruta base para todos los endpoints es `/subscriptions`.
 *
 * Este controlador aplica una **restricción global** de acceso al rol 'admin' (administrador) mediante la combinación de los guardias (JwtAuthGuard, RolesGuard) y el decorador @Roles('admin') a nivel de clase, lo que asegura que solo los administradores puedan manipular la lista de planes disponibles.
 *
 * @injectable
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('subscriptions')
export class SubscriptionsController {

  /**
  * @param subscriptionsService El servicio de lógica de negocio para la gestión de planes de suscripción (SubscriptionsService).
  */
  constructor(private readonly subscriptionsService: SubscriptionsService) { }

  // -------------------------------------------------------------
  //  ENDPOINT: POST /subscriptions
  // -------------------------------------------------------------

  /**
   * Crea un nuevo plan de suscripción disponible en la plataforma.
   *
   * @access Restringido a rol: **'admin'**.
   * @param dto Los datos de creación del plan (CreateSubscriptionDto).
   * @returns El objeto del plan de suscripción creado.
   */
  @Post()
  create(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(dto);
  }

  // -------------------------------------------------------------
  //  ENDPOINT: GET /subscriptions
  // -------------------------------------------------------------

  /**
   * Obtiene una lista de todos los planes de suscripción disponibles.
   *
   * @access Restringido a rol: **'admin'**.
   * @returns Una lista de todos los planes de suscripción.
   */
  @Get()
  findAll() {
    return this.subscriptionsService.findAll();
  }

  // -------------------------------------------------------------
  //  ENDPOINT: GET /subscriptions/:id
  // -------------------------------------------------------------

  /**
   * Obtiene los detalles de un plan de suscripción específico por su ID.
   *
   * @access Restringido a rol: **'admin'**.
   * @param id El ID único del plan de suscripción.
   * @returns El objeto del plan de suscripción solicitado.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(id);
  }

  // -------------------------------------------------------------
  //  ENDPOINT: PATCH /subscriptions/:id
  // -------------------------------------------------------------

  /**
   * Actualiza un plan de suscripción existente.
   *
   * @access Restringido a rol: **'admin'**.
   * @param id El ID único del plan de suscripción a actualizar.
   * @param dto Los datos parciales de actualización (UpdateSubscriptionDto).
   * @returns El objeto del plan de suscripción actualizado.
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSubscriptionDto) {
    return this.subscriptionsService.update(id, dto);
  }

  // -------------------------------------------------------------
  //  ENDPOINT: DELETE /subscriptions/:id
  // -------------------------------------------------------------

  /**
   * Elimina un plan de suscripción del sistema.
   *
   * @access Restringido a rol: **'admin'**.
   * @param id El ID único del plan de suscripción a eliminar.
   * @returns El objeto del plan eliminado (o un mensaje de éxito).
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subscriptionsService.remove(id);
  }
}
