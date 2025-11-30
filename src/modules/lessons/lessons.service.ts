import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { FindLessonsDto } from './dto/find-lessons.dto';
import { AuthUser } from 'src/common/types/auth-user.type';

/**
 * @public
 * Servicio de lógica de negocio responsable de todas las operaciones CRUD y de acceso
 *  (visibilidad) para la entidad [Lesson].
 *
 * Este servicio implementa seguridad estricta basada en la relación [Lección -> Curso -> Profesor]
 *  y [Lección -> Curso -> Inscripción -> Estudiante]:
 * - **Propiedad (Profesor/Admin)**: Solo el profesor dueño del curso o un administrador
 *  pueden crear, editar y eliminar lecciones.
 * - **Visibilidad (Estudiante)**: Un estudiante solo puede ver lecciones de cursos en los que esté inscrito.
 * - **Integridad**: Asegura que la posición de la lección sea única dentro de un curso.
 *
 * @injectable
 */
@Injectable()
export class LessonsService {

    /**
     * @param prisma Instancia de PrismaService para interactuar con la base de datos.
     */
    constructor(private prisma: PrismaService) { }

    // -------------------------------------------------------------
    // CREATE (Creación de Lección)
    // -------------------------------------------------------------
    /**
     * Crea una nueva lección en un curso específico.
     *
     * Reglas de Negocio:
     * 1. El curso debe existir.
     * 2. **Permiso de Propiedad**: Si el usuario es 'teacher', debe ser el `teacher_id` del curso. El rol 'admin' tiene acceso total.
     * 3. **Unicidad de Posición**: No puede existir otra lección con la misma `position` en el mismo `course_id`.
     *
     * @param dto El DTO de creación de la lección (CreateLessonDto).
     * @param user El objeto de usuario autenticado para la verificación de permisos.
     * @throws NotFoundException Si el curso no existe.
     * @throws ForbiddenException Si el profesor no es el dueño del curso.
     * @throws ConflictException Si ya existe una lección con esa posición en el curso.
     * @returns El objeto de la lección creada.
     */
    async create(dto: CreateLessonDto, user: AuthUser) {
        const course = await this.prisma.courses.findUnique({
            where: { id: dto.course_id },
            select: { id: true, teacher_id: true },
        });

        if (!course) throw new NotFoundException('Course not found');

        if (user.role === 'teacher' && course.teacher_id !== user.id) {
            throw new ForbiddenException('You can only create lessons for your own courses');
        }

        const existingAtPosition = await this.prisma.lessons.findFirst({
            where: { course_id: dto.course_id, position: dto.position },
            select: { id: true },
        });

        if (existingAtPosition) {
            throw new ConflictException('A lesson with this position already exists in the course');
        }

        try {
            return await this.prisma.lessons.create({
                data: {
                    course_id: dto.course_id,
                    title: dto.title,
                    content: dto.content ?? null,
                    video_url: dto.video_url ?? null,
                    file_url: dto.file_url ?? null,
                    position: dto.position,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
        } catch (err: any) {
            if (err.code === 'P2002') {
                throw new ConflictException('A lesson with this position already exists in the course');
            }
            throw err;
        }
    }

    // -------------------------------------------------------------
    // FIND ALL (Listado y Visibilidad)
    // -------------------------------------------------------------
    /**
     * Obtiene una lista paginada y filtrada de lecciones.
     *
     * Lógica de Visibilidad (RBAC):
     * - **Admin**: Ve todas las lecciones, aplicando los filtros de consulta.
     * - **Teacher**: Solo ve lecciones de los cursos donde es el `teacher_id`.
     * - **Student**: Solo ve lecciones de los cursos en los que está **inscrito** (`course_enrollments`).
     *
     * @param q Los parámetros de consulta (FindLessonsDto), incluyendo filtros, paginación y orden.
     * @param user El objeto de usuario autenticado.
     * @throws BadRequestException Si los valores de paginación son inválidos.
     * @returns Un objeto con los metadatos de paginación y la lista de lecciones (data), incluyendo información básica del curso.
     */
    async findAll(q: FindLessonsDto, user: AuthUser) {
        const {
            course_id,
            search,
            has_video,
            has_file,
            page = 1,
            limit = 20,
            orderBy = 'position',
            sort = 'asc',
        } = q as any;

        if (page < 1 || limit < 1) {
            throw new BadRequestException('Page and limit must be positive integers');
        }

        const take = Math.min(limit, 100);
        const skip = (page - 1) * take;

        const where: any = {};

        if (course_id) where.course_id = course_id;

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (typeof has_video === 'string') {
            if (has_video === 'true') where.video_url = { not: null };
            else if (has_video === 'false') where.video_url = null;
        }

        if (typeof has_file === 'string') {
            if (has_file === 'true') where.file_url = { not: null };
            else if (has_file === 'false') where.file_url = null;
        }

        if (user.role === 'teacher') {
            where.course = { teacher_id: user.id };
        }

        if (user.role === 'student') {
            const enrollments = await this.prisma.course_enrollments.findMany({
                where: { student_id: user.id },
                select: { course_id: true },
            });

            const courseIds = enrollments.map((e) => e.course_id);
            if (course_id) {
                if (!courseIds.includes(course_id)) {
                    return { page, limit: take, total: 0, totalPages: 0, data: [] };
                }
            } else {
                if (courseIds.length === 0) {
                    return { page, limit: take, total: 0, totalPages: 0, data: [] };
                }
                where.course_id = { in: courseIds };
            }
        }

        const allowedOrder = ['position', 'created_at', 'updated_at', 'title'];
        const orderField = allowedOrder.includes(orderBy) ? orderBy : 'position';
        const direction = String(sort).toLowerCase() === 'desc' ? 'desc' : 'asc';

        const total = await this.prisma.lessons.count({ where });

        const data = await this.prisma.lessons.findMany({
            where,
            skip,
            take,
            orderBy: { [orderField]: direction },
            include: {
                course: { select: { id: true, teacher_id: true, title: true } },
            },
        });

        return {
            page,
            limit: take,
            total,
            totalPages: Math.ceil(total / take),
            data,
        };
    }

    // -------------------------------------------------------------
    // FIND ONE (Detalle y Acceso)
    // -------------------------------------------------------------
    /**
     * Obtiene los detalles de una lección específica por su ID.
     *
     * Lógica de Permisos de Acceso:
     * - **Admin**: Acceso total.
     * - **Teacher**: Acceso si es el dueño del curso al que pertenece la lección.
     * - **Student**: Acceso solo si existe un registro en [course_enrollments] para su ID y el ID del curso de la lección.
     *
     * @param id El ID único de la lección.
     * @param user El objeto de usuario autenticado.
     * @throws NotFoundException Si la lección no existe.
     * @throws ForbiddenException Si el usuario no cumple con las reglas de acceso/propiedad/inscripción.
     * @returns El objeto de la lección solicitada, incluyendo el curso.
     */
    async findOne(id: string, user: AuthUser) {
        const lesson = await this.prisma.lessons.findUnique({
            where: { id },
            include: { course: true },
        });

        if (!lesson) throw new NotFoundException('Lesson not found');

        if (user.role === 'teacher' && lesson.course.teacher_id !== user.id) {
            throw new ForbiddenException('You can only access lessons of your own courses');
        }

        if (user.role === 'student') {
            const enrollment = await this.prisma.course_enrollments.findUnique({
                where: { course_id_student_id: { course_id: lesson.course_id, student_id: user.id } },
            });
            if (!enrollment) {
                throw new ForbiddenException('You must be enrolled to access this lesson');
            }
        }

        return lesson;
    }

    // -------------------------------------------------------------
    // UPDATE (Actualización)
    // -------------------------------------------------------------
    /**
     * Actualiza la información de una lección existente.
     *
     * Reglas de Negocio:
     * 1. **Permiso de Propiedad**: Solo el profesor dueño del curso o un administrador puede editar.
     * 2. **Unicidad de Posición**: Si se intenta cambiar la `position`, se debe verificar que no exista conflicto en el curso.
     *
     * @param id El ID único de la lección a actualizar.
     * @param dto Los datos parciales de actualización (UpdateLessonDto).
     * @param user El objeto de usuario autenticado.
     * @throws NotFoundException Si la lección no existe.
     * @throws ForbiddenException Si el profesor no es el dueño del curso.
     * @throws ConflictException Si la nueva posición genera un conflicto.
     * @returns El objeto de la lección actualizada.
     */
    async update(id: string, dto: UpdateLessonDto, user: AuthUser) {
        const lesson = await this.prisma.lessons.findUnique({
            where: { id },
            include: { course: true },
        });
        if (!lesson) throw new NotFoundException('Lesson not found');

        if (user.role === 'teacher' && lesson.course.teacher_id !== user.id) {
            throw new ForbiddenException('You can only edit lessons of your own courses');
        }

        if (dto.position && dto.position !== lesson.position) {
            const conflict = await this.prisma.lessons.findFirst({
                where: { course_id: lesson.course_id, position: dto.position },
                select: { id: true },
            });
            if (conflict) {
                throw new ConflictException('Another lesson already uses this position in the course');
            }
        }

        const updated = await this.prisma.lessons.update({
            where: { id },
            data: {
                title: dto.title ?? lesson.title,
                content: dto.content ?? lesson.content,
                video_url: dto.video_url ?? lesson.video_url,
                file_url: dto.file_url ?? lesson.file_url,
                position: dto.position ?? lesson.position,
                updated_at: new Date(),
            },
        });

        return updated;
    }

    // -------------------------------------------------------------
    // DELETE (Eliminación)
    // -------------------------------------------------------------
    /**
     * Elimina una lección del sistema.
     *
     * Regla de Permisos: Solo el profesor dueño del curso o un administrador pueden eliminar la lección.
     *
     * @param id El ID único de la lección a eliminar.
     * @param user El objeto de usuario autenticado.
     * @throws NotFoundException Si la lección no existe.
     * @throws ForbiddenException Si el profesor no es el dueño del curso.
     * @returns Un mensaje de éxito.
     */
    async remove(id: string, user: AuthUser) {
        const lesson = await this.prisma.lessons.findUnique({
            where: { id },
            include: { course: true },
        });

        if (!lesson) throw new NotFoundException('Lesson not found');

        if (user.role === 'teacher' && lesson.course.teacher_id !== user.id) {
            throw new ForbiddenException('You can only delete lessons of your own courses');
        }

        await this.prisma.lessons.delete({ where: { id } });

        return { message: 'Lesson deleted successfully' };
    }
}