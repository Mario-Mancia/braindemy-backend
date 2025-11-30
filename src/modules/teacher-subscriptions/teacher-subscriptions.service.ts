import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTeacherSubscriptionsDto } from './dto/create-teacher-subscriptions.dto';
import { UpdateTeacherSubscriptionsDto } from './dto/update-teacher-subscriptions.dto';
import { AuthUser } from 'src/common/types/auth-user.type';

/**
 * @public
 * Servicio de lógica de negocio responsable de gestionar las suscripciones de los profesores ([TeacherSubscription]).
 *
 * Este servicio rastrea los planes de suscripción que un profesor ha adquirido, implementando:
 * 1. **Validación de Fechas**: Asegura que la fecha de finalización no sea anterior a la de inicio.
 * 2. **Seguridad de Acceso**: Restringe el acceso a la información detallada de la suscripción (usando `findOneSecure`) solo al profesor dueño o a un administrador.
 * 3. **Operaciones CRUD** básicas para la gestión interna de las suscripciones.
 *
 * @injectable
 */
@Injectable()
export class TeacherSubscriptionsService {
    /**
     * @param prisma Instancia de PrismaService para interactuar con la base de datos.
     */
    constructor(private prisma: PrismaService) { }

    // --------------------------------------------------------------------
    // CREATE (Registro de Suscripción)
    // --------------------------------------------------------------------
    /**
     * Crea un nuevo registro de suscripción para un profesor.
     *
     * Regla de Negocio: La `end_date` no debe ser anterior a la `start_date`.
     *
     * @param teacherId El ID del profesor al que se asocia la suscripción.
     * @param dto Los datos de la suscripción a crear (CreateTeacherSubscriptionsDto).
     * @throws BadRequestException Si la `end_date` es anterior a la `start_date`.
     * @returns El objeto de la suscripción de profesor creada.
     */
    async create(teacherId: string, dto: CreateTeacherSubscriptionsDto) {
        // Validación start < end
        if (dto.end_date && new Date(dto.end_date) < new Date(dto.start_date)) {
            throw new BadRequestException('end_date cannot be before start_date');
        }

        return this.prisma.teacher_subscriptions.create({
            data: {
                teacher_id: teacherId,
                subscription_id: dto.subscription_id,
                payment_id: dto.payment_id,
                start_date: new Date(dto.start_date),
                end_date: dto.end_date ? new Date(dto.end_date) : null,
                status: dto.status ?? 'active',
            },
        });
    }

    // --------------------------------------------------------------------
    // FIND ALL (Listado general para Admin)
    // --------------------------------------------------------------------
    /**
     * Obtiene una lista de todas las suscripciones de profesor registradas.
     *
     * @access Típicamente restringido al rol 'admin' a nivel de controlador.
     * @returns Una lista de suscripciones, incluyendo los detalles del profesor, la suscripción y el pago asociado.
     */
    async findAll() {
        return this.prisma.teacher_subscriptions.findMany({
            include: {
                teacher: true,
                subscription: true,
                payment: true,
            },
        });
    }

    // --------------------------------------------------------------------
    // FIND ONE (Detalle sin seguridad de rol)
    // --------------------------------------------------------------------
    /**
     * Obtiene los detalles de una suscripción específica por su ID.
     *
     * Nota: Este método no aplica la verificación de rol y propiedad; es usado internamente.
     *
     * @param id El ID único de la suscripción de profesor.
     * @throws NotFoundException Si el registro no es encontrado.
     * @returns El objeto de la suscripción de profesor solicitada.
     */
    async findOne(id: string) {
        const record = await this.prisma.teacher_subscriptions.findUnique({
            where: { id },
            include: {
                teacher: true,
                subscription: true,
                payment: true,
            },
        });

        if (!record) {
            throw new NotFoundException('Teacher subscription not found');
        }

        return record;
    }

    // --------------------------------------------------------------------
    // FIND ONE SECURE (Detalle con seguridad de rol)
    // --------------------------------------------------------------------
    /**
     * Obtiene los detalles de una suscripción específica con verificación de propiedad.
     *
     * Regla de Seguridad: Solo el **profesor dueño** o un **administrador** pueden acceder al registro.
     *
     * @param id El ID único de la suscripción de profesor.
     * @param user El objeto de usuario autenticado.
     * @throws NotFoundException Si el registro no es encontrado (a través de `findOne`).
     * @throws ForbiddenException Si un profesor intenta acceder a la suscripción de otro profesor.
     * @returns El objeto de la suscripción de profesor solicitada.
     */
    async findOneSecure(id: string, user: AuthUser) {
        const record = await this.findOne(id);

        if (user.role === 'teacher' && record.teacher_id !== user.id) {
            throw new ForbiddenException('You cannot access another teacher’s subscription');
        }

        return record;
    }

    // --------------------------------------------------------------------
    // UPDATE
    // --------------------------------------------------------------------
    /**
     * Actualiza la información de una suscripción de profesor existente.
     *
     * @param id El ID único de la suscripción a actualizar.
     * @param dto Los datos parciales para la actualización (UpdateTeacherSubscriptionsDto).
     * @throws NotFoundException Si la suscripción no existe (a través de `findOne`).
     * @returns El objeto de la suscripción actualizada.
     */
    async update(id: string, dto: UpdateTeacherSubscriptionsDto) {
        await this.findOne(id); // valida existencia

        return this.prisma.teacher_subscriptions.update({
            where: { id },
            data: {
                ...(dto.subscription_id && { subscription_id: dto.subscription_id }),
                ...(dto.payment_id && { payment_id: dto.payment_id }),
                ...(dto.start_date && { start_date: new Date(dto.start_date) }),
                ...(dto.end_date && { end_date: new Date(dto.end_date) }),
                ...(dto.status && { status: dto.status }),
            },
        });
    }

    // --------------------------------------------------------------------
    // REMOVE
    // --------------------------------------------------------------------
    /**
     * Elimina un registro de suscripción de profesor.
     *
     * @param id El ID único de la suscripción a eliminar.
     * @throws NotFoundException Si la suscripción no existe (a través de `findOne`).
     * @returns El objeto de la suscripción eliminada.
     */
    async remove(id: string) {
        await this.findOne(id);

        return this.prisma.teacher_subscriptions.delete({
            where: { id },
        });
    }
}
