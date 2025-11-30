import { Controller, Post, Get, Patch, Delete, Param, Body, BadRequestException, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AuthUser } from 'src/common/types/auth-user.type';

/**
 * @public
 * Controlador de API responsable de manejar todas las solicitudes HTTP relacionadas
 *  con la gestión de Pagos y Transacciones.
 *
 * La ruta base para todos los endpoints es `/payments`.
 *
 * Este controlador aplica una lógica de seguridad crucial:
 * - La creación de pagos está abierta a todos los roles autenticados.
 * - La lectura total (findAll) y la manipulación de estados (updateStatus) están reservadas al rol 'admin'.
 * - La lectura individual (findOne) incluye una **verificación de propiedad**
 *  para asegurar que los usuarios solo accedan a sus propios pagos.
 *
 * @injectable
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {

    /**
     * @param paymentsService El servicio de lógica de negocio para la gestión de pagos (PaymentsService).
     */
    constructor(private paymentsService: PaymentsService) { }

    // -------------------------------------------------------------
    //  ENDPOINT: POST /payments
    // -------------------------------------------------------------

    /**
     * Crea un nuevo registro de pago (ej. al completar una transacción en un proveedor externo).
     *
     * @access Abierto a roles: **'student'**, **'teacher'** y **'admin'**.
     * @param req La solicitud HTTP, que contiene el ID del usuario autenticado (AuthUser).
     * @param dto Los datos necesarios para la creación del pago (CreatePaymentDto).
     * @returns El objeto del pago creado.
     */
    @Post()
    @Roles('student', 'teacher', 'admin')
    create(
        @Req() req: Request & { user: AuthUser },
        @Body() dto: CreatePaymentDto,
    ) {
        return this.paymentsService.create(req.user.id, dto);
    }

    // -------------------------------------------------------------
    //  ENDPOINT: GET /payments
    // -------------------------------------------------------------

    /**
     * Obtiene una lista completa de todos los pagos registrados en el sistema.
     *
     * @access Restringido a rol: **'admin'**.
     * @returns Una lista de todos los objetos de pago.
     */
    @Get()
    @Roles('admin')
    findAll() {
        return this.paymentsService.findAll();
    }

    // -------------------------------------------------------------
    //  ENDPOINT: GET /payments/:id
    // -------------------------------------------------------------

    /**
     * Obtiene los detalles de un pago específico por su ID.
     *
     * Regla de Seguridad: Solo el **administrador** o el **dueño del pago** (el usuario_id asociado) pueden acceder a la información.
     *
     * @access Abierto a roles: **'admin'**, **'teacher'** y **'student'** (con restricción de propiedad).
     * @param req La solicitud HTTP, que contiene el objeto de usuario autenticado para la verificación de propiedad.
     * @param id El ID único del pago.
     * @throws ForbiddenException Si un usuario intenta ver el pago de otra persona sin ser administrador.
     * @returns El objeto del pago solicitado.
     */
    @Get(':id')
    @Roles('admin', 'teacher', 'student')
    async findOne(
        @Req() req: Request & { user: AuthUser },
        @Param('id') id: string,
    ) {
        const payment = await this.paymentsService.findOne(id);

        if (req.user.role !== 'admin' && payment.user_id !== req.user.id) {
            throw new ForbiddenException('No puedes ver pagos de otras personas');
        }

        return payment;
    }

    // -------------------------------------------------------------
    //  ENDPOINT: PATCH /payments/:id/status
    // -------------------------------------------------------------

    /**
     * Actualiza el estado de un pago (ej. de 'pendiente' a 'completado').
     *
     * @access Restringido a rol: **'admin'**.
     * @param id El ID único del pago a actualizar.
     * @param dto El DTO con el nuevo estado (UpdatePaymentStatusDto).
     * @returns El objeto del pago actualizado.
     */
    @Patch(':id/status')
    @Roles('admin')
    updateStatus(
        @Param('id') id: string,
        @Body() dto: UpdatePaymentStatusDto,
    ) {
        return this.paymentsService.updateStatus(id, dto.status);
    }

    // -------------------------------------------------------------
    //  ENDPOINT: DELETE /payments/:id
    // -------------------------------------------------------------

    /**
     * Deniega la eliminación de registros de pago por motivos de auditoría y contabilidad.
     *
     * @throws BadRequestException Siempre se lanza para indicar que la eliminación de pagos está prohibida.
     * @returns Nunca retorna un valor, siempre lanza una excepción.
     */
    @Delete(':id')
    remove() {
        throw new BadRequestException('Los pagos no pueden ser eliminados por motivos de auditoría');
    }
}