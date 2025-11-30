import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

/**
 * @public
 * Servicio de lógica de negocio responsable de gestionar los modelos de Suscripción (Subscription Plans) del sistema.
 *
 * Este servicio proporciona las operaciones CRUD fundamentales para la gestión interna de los planes de pago
 * que los usuarios pueden adquirir (ej., planes premium, acceso total, etc.).
 *
 * @injectable
 */
@Injectable()
export class SubscriptionsService {
  /**
     * @param prisma Instancia de PrismaService para interactuar con la base de datos.
     */
  constructor(private prisma: PrismaService) { }

  // --------------------------------------------------------------------
  // CREATE
  // --------------------------------------------------------------------
  /**
   * Crea un nuevo modelo de suscripción (ej., un nuevo plan con precio y duración).
   *
   * @param data Los datos necesarios para crear la suscripción (CreateSubscriptionDto).
   * @returns El objeto de la suscripción recién creada.
   */
  async create(data: CreateSubscriptionDto) {
    return this.prisma.subscriptions.create({
      data,
    });
  }

  // --------------------------------------------------------------------
  // FIND ALL
  // --------------------------------------------------------------------
  /**
   * Recupera una lista de todos los modelos de suscripción disponibles en el sistema.
   *
   * @returns Una lista de todos los objetos de suscripción.
   */
  async findAll() {
    return this.prisma.subscriptions.findMany();
  }

  // --------------------------------------------------------------------
  // FIND ONE
  // --------------------------------------------------------------------
  /**
   * Obtiene los detalles de un modelo de suscripción específico por su ID.
   *
   * @param id El ID único de la suscripción.
   * @throws NotFoundException Si el modelo de suscripción no es encontrado.
   * @returns El objeto de la suscripción solicitada.
   */
  async findOne(id: string) {
    const subscription = await this.prisma.subscriptions.findUnique({
      where: { id },
    });

    if (!subscription) throw new NotFoundException('Subscription not found');

    return subscription;
  }

  // --------------------------------------------------------------------
  // UPDATE
  // --------------------------------------------------------------------
  /**
   * Actualiza la información de un modelo de suscripción existente (ej., cambiar el precio o el nombre del plan).
   *
   * @param id El ID único de la suscripción a actualizar.
   * @param data Los datos parciales para la actualización (UpdateSubscriptionDto).
   * @throws NotFoundException Si el modelo de suscripción no es encontrado.
   * @returns El objeto de la suscripción actualizada.
   */
  async update(id: string, data: UpdateSubscriptionDto) {
    try {
      return await this.prisma.subscriptions.update({
        where: { id },
        data,
      });
    } catch {
      throw new NotFoundException('Subscription not found');
    }
  }

  // --------------------------------------------------------------------
  // REMOVE
  // --------------------------------------------------------------------
  /**
   * Elimina un modelo de suscripción del sistema.
   *
   * @param id El ID único de la suscripción a eliminar.
   * @throws NotFoundException Si el modelo de suscripción no es encontrado.
   * @returns El objeto de la suscripción eliminada.
   */
  async remove(id: string) {
    try {
      return await this.prisma.subscriptions.delete({
        where: { id },
      });
    } catch {
      throw new NotFoundException('Subscription not found');
    }
  }
}
