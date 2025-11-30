import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment.dto';
import { payment_status } from '@prisma/client';

/**
 * @public
 * Servicio de lógica de negocio responsable de todas las operaciones CRUD y de estado para la entidad [Payment].
 *
 * Este servicio mantiene la **integridad de los datos financieros**:
 * - Aplica validaciones básicas (monto > 0).
 * - Establece un estado inicial 'pending' para nuevos pagos.
 * - Prohíbe explícitamente la eliminación de registros de pago por motivos de auditoría.
 *
 * @injectable
 */
@Injectable()
export class PaymentsService {

  /**
  * @param prisma Instancia de PrismaService para interactuar con la base de datos.
  */
  constructor(private prisma: PrismaService) { }

  // -------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------
  /**
   * Crea un nuevo registro de pago asociado a un usuario.
   *
   * Reglas de Negocio:
   * 1. El monto (`amount`) debe ser estrictamente mayor que cero.
   * 2. El pago se inicializa con el estado **"pending"**.
   *
   * @param userId El ID del usuario que realiza el pago.
   * @param dto El DTO con los detalles del pago (CreatePaymentDto).
   * @throws BadRequestException Si el monto es menor o igual a cero.
   * @returns El objeto del pago creado.
   */
  async create(userId: string, dto: CreatePaymentDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    return this.prisma.payments.create({
      data: {
        user_id: userId,
        amount: dto.amount,
        type: dto.type,
        reference: dto.reference,
        status: "pending",
      },
    });
  }

  // -------------------------------------------------------------
  // FIND ALL
  // -------------------------------------------------------------
  /**
   * Recupera una lista de todos los registros de pago en el sistema.
   *
   * @access Típicamente restringido al rol 'admin' a nivel de controlador.
   * @returns Una lista de todos los pagos, incluyendo la información del usuario asociado.
   */
  async findAll() {
    return this.prisma.payments.findMany({
      include: { user: true },
      orderBy: { created_at: 'desc' },
    });
  }

  // -------------------------------------------------------------
  // FIND ONE
  // -------------------------------------------------------------
  /**
   * Obtiene los detalles de un pago específico por su ID.
   *
   * @param id El ID único del pago.
   * @throws NotFoundException Si el pago no existe.
   * @returns El objeto del pago solicitado, incluyendo la información del usuario.
   */
  async findOne(id: string) {
    const payment = await this.prisma.payments.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!payment) throw new NotFoundException('Payment not found');

    return payment;
  }

  // -------------------------------------------------------------
  // UPDATE STATUS
  // -------------------------------------------------------------
  /**
   * Actualiza el estado de un pago existente (ej. a 'completed', 'failed', 'refunded').
   *
   * @access Típicamente restringido al rol 'admin' a nivel de controlador.
   * @param id El ID único del pago a actualizar.
   * @param status El nuevo estado del pago (payment_status).
   * @returns El objeto del pago actualizado.
   */
  async updateStatus(id: string, status: payment_status) {
    await this.findOne(id);

    return this.prisma.payments.update({
      where: { id },
      data: {
        status,
        updated_at: new Date(),
      },
    });
  }

  // -------------------------------------------------------------
  // REMOVE
  // -------------------------------------------------------------
  /**
   * Prohíbe la eliminación de cualquier registro de pago.
   *
   * Regla de Auditoría: Los datos de pagos deben ser inmutables para fines de contabilidad y auditoría.
   *
   * @throws BadRequestException Siempre se lanza para indicar que la eliminación está prohibida.
   */
  async remove() {
    throw new BadRequestException(
      'No se pueden eliminar registros de pagos por razones de auditoría',
    );
  }
}