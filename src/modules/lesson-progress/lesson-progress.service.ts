import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthUser } from 'src/common/types/auth-user.type';
import { CreateLessonProgressDto } from './dto/create-lesson-progress.dto';
import { UpdateLessonProgressDto } from './dto/update-lesson-progress.dto';
import { LessonProgressFilterDto } from './dto/lesson-progress-filter.dto';

/**
 * @public
 * Servicio de lógica de negocio responsable de todas las operaciones CRUD y el control de acceso para la entidad [LessonProgress].
 *
 * Este servicio asegura el correcto seguimiento del avance de los estudiantes en las lecciones, implementando:
 * - Restricciones de **creación** (solo estudiantes).
 * - Filtros de **visibilidad** por rol (Estudiante ve solo lo suyo; Profesor solo ve sus cursos; Admin ve todo).
 * - Verificación de **propiedad** para la modificación y eliminación (solo dueño o admin).
 *
 * @injectable
 */
@Injectable()
export class LessonProgressService {

    /**
     * @param prisma Instancia de PrismaService para interactuar con la base de datos.
     */
    constructor(private prisma: PrismaService) { }

    // -------------------------------------------------------------
    // CREATE (Registro de inicio de lección)
    // -------------------------------------------------------------
    /**
     * Crea un nuevo registro de progreso para una lección específica.
     *
     * Reglas de Negocio:
     * 1. Solo el rol **'student'** puede iniciar un registro de progreso.
     * 2. La lección debe existir.
     * 3. (Implícito, pero fundamental) El estudiante debe estar inscrito en el curso de la lección para que la acción tenga sentido.
     *
     * @param dto El DTO de creación del progreso (CreateLessonProgressDto), conteniendo el ID de la lección.
     * @param user El objeto de usuario autenticado para la verificación de rol y obtención del `student_id`.
     * @throws ForbiddenException Si el usuario no es un estudiante.
     * @throws NotFoundException Si la lección no existe.
     * @returns El objeto de progreso de lección creado.
     */
    async create(dto: CreateLessonProgressDto, user: AuthUser) {
        if (user.role !== 'student') {
            throw new ForbiddenException('Solo los estudiantes pueden crear su progreso.');
        }

        const lesson = await this.prisma.lessons.findUnique({
            where: { id: dto.lesson_id },
        });

        if (!lesson) {
            throw new NotFoundException('La lección no existe.');
        }

        return this.prisma.lesson_progress.create({
            data: {
                lesson_id: dto.lesson_id,
                student_id: user.id,
            },
        });
    }

    // -------------------------------------------------------------
    // FIND ALL (Listado y Visibilidad)
    // -------------------------------------------------------------
    /**
     * Obtiene una lista de registros de progreso, aplicando filtros de consulta y restricciones de acceso por rol (RBAC).
     *
     * Lógica de Visibilidad:
     * - **Student**: Los filtros se anulan y se restringe a `where.student_id = user.id`.
     * - **Teacher**: Solo puede ver el progreso de los estudiantes en los cursos donde es el `teacher_id`.
     * - **Admin**: Ve todos los registros.
     *
     * @param filters Los parámetros de filtrado (LessonProgressFilterDto).
     * @param user El objeto de usuario autenticado.
     * @returns Una lista de registros de progreso, incluyendo los detalles de la lección y el estudiante.
     */
    async findAll(filters: LessonProgressFilterDto, user: AuthUser) {
        const where: any = {};

        if (filters.lesson_id) where.lesson_id = filters.lesson_id;
        if (filters.student_id) where.student_id = filters.student_id;

        // Student: solo su propio progreso
        if (user.role === 'student') {
            where.student_id = user.id;
        }

        // Teacher: solo progreso de sus lecciones
        if (user.role === 'teacher') {
            where.lesson = {
                course: {
                    teacher_id: user.id,
                },
            };
        }

        return this.prisma.lesson_progress.findMany({
            where,
            include: {
                lesson: {
                    include: {
                        course: true,
                    },
                },
                student: true,
            },
        });
    }

    // -------------------------------------------------------------
    // FIND ONE (Detalle y Acceso)
    // -------------------------------------------------------------
    /**
     * Obtiene los detalles de un registro de progreso específico por su ID.
     *
     * Lógica de Permisos:
     * - **Admin**: Acceso total.
     * - **Student**: Solo puede acceder si `progress.student_id` coincide con `user.id`.
     * - **Teacher**: Solo puede acceder si `progress.lesson.course.teacher_id` coincide con `user.id`.
     *
     * @param id El ID único del progreso.
     * @param user El objeto de usuario autenticado.
     * @throws NotFoundException Si el progreso no existe.
     * @throws ForbiddenException Si el usuario no cumple con las reglas de acceso/propiedad.
     * @returns El objeto de progreso de lección solicitado, incluyendo lección y curso.
     */
    async findOne(id: string, user: AuthUser) {
        const progress = await this.prisma.lesson_progress.findUnique({
            where: { id },
            include: {
                lesson: {
                    include: {
                        course: true,
                    },
                },
            },
        });

        if (!progress) throw new NotFoundException('Progreso no encontrado.');

        // Student: solo su propio progreso
        if (user.role === 'student' && progress.student_id !== user.id) {
            throw new ForbiddenException('No puedes ver el progreso de otro estudiante.');
        }

        // Teacher: solo lecciones suyas
        if (user.role === 'teacher' && progress.lesson.course.teacher_id !== user.id) {
            throw new ForbiddenException('No puedes ver progreso de cursos que no enseñas.');
        }

        return progress;
    }

    // -------------------------------------------------------------
    // UPDATE (Actualización de Progreso)
    // -------------------------------------------------------------
    /**
     * Actualiza el progreso de una lección (ej. marcándola como completada).
     *
     * Regla de Propiedad: Solo el **dueño del progreso** (el estudiante) o un **administrador** pueden modificarlo.
     *
     * @param id El ID único del progreso a actualizar.
     * @param dto Los datos parciales de actualización (UpdateLessonProgressDto), conteniendo típicamente `is_completed`.
     * @param user El objeto de usuario autenticado.
     * @throws NotFoundException Si el progreso no existe.
     * @throws ForbiddenException Si el usuario no es el dueño ni el administrador.
     * @returns El objeto de progreso de lección actualizado.
     */
    async update(id: string, dto: UpdateLessonProgressDto, user: AuthUser) {
        const progress = await this.prisma.lesson_progress.findUnique({
            where: { id },
        });

        if (!progress) throw new NotFoundException('Progreso no encontrado.');

        if (user.role !== 'admin' && user.id !== progress.student_id) {
            throw new ForbiddenException(
                'Solo el estudiante dueño del progreso o un administrador puede modificarlo.',
            );
        }

        const data: any = {};

        if (dto.is_completed !== undefined) {
            data.is_completed = dto.is_completed;
            data.completed_at = dto.is_completed ? new Date() : null;
        }

        return this.prisma.lesson_progress.update({
            where: { id },
            data,
        });
    }

    // -------------------------------------------------------------
    // REMOVE (Eliminación)
    // -------------------------------------------------------------
    /**
     * Elimina un registro de progreso de lección.
     *
     * Regla de Propiedad: Solo el **dueño del progreso** (el estudiante) o un **administrador** pueden eliminarlo.
     *
     * @param id El ID único del progreso a eliminar.
     * @param user El objeto de usuario autenticado.
     * @throws NotFoundException Si el progreso no existe.
     * @throws ForbiddenException Si el usuario no es el dueño ni el administrador.
     * @returns El objeto de progreso de lección eliminado.
     */
    async remove(id: string, user: AuthUser) {
        const progress = await this.prisma.lesson_progress.findUnique({ where: { id } });

        if (!progress) throw new NotFoundException('Progreso no encontrado.');

        if (user.role !== 'admin' && user.id !== progress.student_id) {
            throw new ForbiddenException('No puedes eliminar este progreso.');
        }

        return this.prisma.lesson_progress.delete({ where: { id } });
    }
}