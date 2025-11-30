import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

/**
 * @public
 * Servicio de lógica de negocio responsable de todas las operaciones CRUD para la entidad [Card] (referencias a tarjetas de crédito/débito).
 *
 * Este servicio implementa lógica de negocio clave, incluyendo:
 * - Verificación de la existencia del usuario.
 * - Validación de duplicados (basada en marca, últimos 4 dígitos y fecha de caducidad).
 * - Verificación de que la tarjeta no esté caducada.
 * - Asignación de un balance inicial basado en el rol del usuario ('teacher' 500, 'student' 150).
 *
 * @injectable
 */
@Injectable()
export class CardService {

  /**
     * @param prisma Instancia de PrismaService para interactuar con la base de datos.
     */
  constructor(private prisma: PrismaService) { }

  // -------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------
  /**
   * Registra una nueva tarjeta de pago asociada al usuario.
   *
   * Reglas de Negocio:
   * 1. El usuario debe existir.
   * 2. La tarjeta no debe ser un duplicado (misma marca, últimos 4 dígitos y fecha de caducidad para el mismo usuario).
   * 3. La tarjeta debe tener una fecha de caducidad válida (no expirada).
   * 4. Asigna un balance inicial según el rol: Teacher ($500), Student ($150), Otros ($0).
   *
   * @param dto Los datos de creación de la tarjeta (CreateCardDto).
   * @param userId El ID del usuario al que se asocia la tarjeta.
   * @throws NotFoundException Si el usuario no es encontrado.
   * @throws BadRequestException Si la tarjeta es un duplicado o si está expirada.
   * @returns El objeto de la tarjeta creada, incluyendo el balance inicial.
   */
  async create(dto: CreateCardDto, userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const duplicate = await this.prisma.cards.findFirst({
      where: {
        user_id: userId,
        brand: dto.brand,
        last4: dto.last4,
        expire_month: dto.expire_month,
        expire_year: dto.expire_year,
      },
    });

    if (duplicate) {
      throw new BadRequestException('Esta tarjeta ya está registrada');
    }

    this.validateExpiration(dto.expire_month, dto.expire_year);

    const initialBalance =
      user.role === 'teacher' ? 500 :
        user.role === 'student' ? 150 : 0;

    return this.prisma.cards.create({
      data: {
        user_id: userId,
        brand: dto.brand,
        last4: dto.last4,
        expire_month: dto.expire_month,
        expire_year: dto.expire_year,
        label: dto.label,
        balance: initialBalance,
      },
    });
  }

  // -------------------------------------------------------------
  // FIND ALL
  // -------------------------------------------------------------
  /**
   * Recupera una lista de todas las tarjetas registradas en el sistema.
   *
   * @access Típicamente restringido al rol 'admin' a nivel de controlador.
   * @returns Una lista de todas las tarjetas, incluyendo la información básica del usuario asociado.
   */
  findAll() {
    return this.prisma.cards.findMany({
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            role: true,
          },
        },
      },
    });
  }

  // -------------------------------------------------------------
  // FIND ONE
  // -------------------------------------------------------------
  /**
   * Obtiene los detalles de una tarjeta específica por su ID.
   *
   * @param id El ID único de la tarjeta.
   * @throws NotFoundException Si la tarjeta no existe.
   * @returns El objeto de la tarjeta solicitada, incluyendo el usuario asociado.
   */
  async findOne(id: string) {
    const card = await this.prisma.cards.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            role: true,
          },
        },
      },
    });

    if (!card) throw new NotFoundException('Tarjeta no encontrada');
    return card;
  }

  // -------------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------------
  /**
   * Actualiza la información de una tarjeta existente.
   *
   * Regla de Negocio: Vuelve a validar la fecha de caducidad si esta se actualiza.
   *
   * @param id El ID único de la tarjeta a actualizar.
   * @param dto Los datos parciales de actualización (UpdateCardDto).
   * @throws NotFoundException Si la tarjeta no existe (a través de `findOne`).
   * @throws BadRequestException Si la nueva fecha de caducidad es inválida/expirada.
   * @returns El objeto de la tarjeta actualizada.
   */
  async update(id: string, dto: UpdateCardDto) {
    const card = await this.findOne(id);

    const expireMonth = dto.expire_month ?? card.expire_month;
    const expireYear = dto.expire_year ?? card.expire_year;

    this.validateExpiration(expireMonth, expireYear);

    return this.prisma.cards.update({
      where: { id },
      data: {
        ...dto,
        updated_at: new Date(),
      },
    });
  }

  // -------------------------------------------------------------
  // REMOVE
  // -------------------------------------------------------------
  /**
   * Elimina un registro de tarjeta del sistema.
   *
   * @param id El ID único de la tarjeta a eliminar.
   * @throws NotFoundException Si la tarjeta no existe (a través de `findOne`).
   * @returns El objeto de la tarjeta eliminada.
   */
  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.cards.delete({
      where: { id },
    });
  }

  // -------------------------------------------------------------
  // PRIVATE VALIDATION
  // -------------------------------------------------------------
  /**
   * Método privado que verifica si la fecha de caducidad (mes y año) es posterior a la fecha actual.
   *
   * @private
   * @param month El mes de caducidad (1-12).
   * @param year El año de caducidad (completo, ej. 2025).
   * @throws BadRequestException Si la fecha es igual o anterior al mes actual.
   */
  private validateExpiration(month: number, year: number) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (year < currentYear) {
      throw new BadRequestException('La tarjeta ya está expirada (año inválido)');
    }

    if (year === currentYear && month < currentMonth) {
      throw new BadRequestException('La tarjeta ya está expirada (mes inválido)');
    }
  }
}

