import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, $Enums } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUsersFiltersDto } from './dto/get-user-filter.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';

/**
 * @public
 * Servicio central de lógica de negocio responsable de todas las operaciones CRUD y estadísticas globales para la entidad [User].
 *
 * Este servicio maneja:
 * 1. **Seguridad**: Hash de contraseñas (usando `bcrypt`) durante la creación y actualización.
 * 2. **Control de Acceso**: Implementa reglas de propiedad y rol (`admin`) para la edición de perfiles (`updateUser`).
 * 3. **Administración**: Permite la búsqueda filtrada y la actualización de rol/estado (uso administrativo).
 * 4. **Estadísticas**: Proporciona conteos globales, por rol y por estado del sistema.
 *
 * @injectable
 */
@Injectable()
export class UsersService {
  /**
     * @private
     * Instancia de PrismaClient para interactuar directamente con la base de datos.
     */
  private prisma = new PrismaClient();

  // --------------------------------------------------------------------
  // AUTHENTICATION & CORE METHODS
  // --------------------------------------------------------------------

  /**
   * Busca un usuario por su dirección de correo electrónico.
   *
   * Este método se utiliza típicamente en los procesos de inicio de sesión y validación de unicidad.
   *
   * @param email La dirección de correo electrónico del usuario.
   * @returns El objeto de usuario encontrado o `null` si no existe.
   */
  async findByEmail(email: string) {
    return this.prisma.users.findUnique({ where: { email } });
  }

  /**
     * Crea un nuevo usuario en el sistema.
     *
     * Regla de Seguridad: La contraseña se hashea con **bcrypt** antes de ser almacenada.
     *
     * @param dto Los datos del nuevo usuario (CreateUserDto).
     * @returns El objeto de usuario creado (sin el hash de la contraseña).
     */
  async create(dto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.users.create({
      data: {
        first_name: dto.first_name,
        last_name: dto.last_name,
        email: dto.email,
        password_hash: hashedPassword,
        birthdate: dto.birthdate ? new Date(dto.birthdate) : undefined,
        timezone: dto.timezone ?? undefined
      },
      // No devolvemos password_hash
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        status: true,
        birthdate: true,
        timezone: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  // --------------------------------------------------------------------
  // FIND ALL (Administración y Listado)
  // --------------------------------------------------------------------

  /**
   * Recupera una lista paginada de usuarios, permitiendo filtros avanzados.
   *
   * Permite filtrar por: `role`, `status` y `search` (en nombre o email).
   *
   * @access Típicamente restringido al rol 'admin' a nivel de controlador.
   * @param filters Los parámetros de filtrado y paginación (GetUsersFiltersDto).
   * @returns Un objeto con los datos de usuario y metadatos de paginación.
   */
  async findAll(filters: GetUsersFiltersDto) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filters.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.role) where.role = filters.role as $Enums.user_role;
    if (filters.status) where.status = filters.status as $Enums.user_status;

    if (filters.search) {
      where.OR = [
        { first_name: { contains: filters.search, mode: 'insensitive' } },
        { last_name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const total = await this.prisma.users.count({ where });

    const users = await this.prisma.users.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        status: true,
        birthdate: true,
        timezone: true,
        created_at: true,
      }
    });

    return {
      data: users,
      total,
      page,
      limit,
      hasMore: skip + users.length < total
    };
  }

  // --------------------------------------------------------------------
  // FIND ONE (Detalle)
  // --------------------------------------------------------------------

  /**
   * Obtiene los detalles de un usuario específico por su ID, excluyendo el hash de la contraseña.
   *
   * @param id El ID único del usuario.
   * @throws NotFoundException Si el usuario no es encontrado.
   * @returns El objeto de usuario solicitado.
   */
  async findOne(id: string) {
    const user = await this.prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        status: true,
        birthdate: true,
        timezone: true,
        created_at: true,
        updated_at: true,
      }
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    return user;
  }

  // --------------------------------------------------------------------
  // UPDATE (General / Usuario)
  // --------------------------------------------------------------------

  /**
   * Actualiza el perfil de un usuario.
   *
   * Reglas de Seguridad:
   * 1. Solo el **propio usuario** o un **administrador** pueden realizar la actualización.
   * 2. Si se proporciona `new_password`, la contraseña antigua es reemplazada por el nuevo hash.
   *
   * @param id El ID del usuario a actualizar.
   * @param dto Los datos parciales para la actualización (UpdateUserDto).
   * @param requester El objeto del usuario autenticado que realiza la solicitud.
   * @throws NotFoundException Si el usuario no existe.
   * @throws ForbiddenException Si el solicitante intenta editar a otro usuario sin ser administrador.
   * @returns El objeto de usuario actualizado (sin el hash de la contraseña).
   */
  async updateUser(id: string, dto: UpdateUserDto, requester: any) {
    const existing = await this.prisma.users.findUnique({ where: { id } });

    if (!existing) throw new NotFoundException('Usuario no encontrado');

    if (requester.id !== id && requester.role !== 'admin') {
      throw new ForbiddenException('No puedes editar a otros usuarios.');
    }

    let password_hash = existing.password_hash;
    if (dto.new_password) {
      password_hash = await bcrypt.hash(dto.new_password, 10);
    }

    let birthdate = existing.birthdate;
    if (dto.birthdate) {
      const d = new Date(dto.birthdate);
      if (isNaN(d.getTime())) throw new BadRequestException('Fecha inválida');
      birthdate = d;
    }

    return this.prisma.users.update({
      where: { id },
      data: {
        first_name: dto.first_name ?? existing.first_name,
        last_name: dto.last_name ?? existing.last_name,
        timezone: dto.timezone ?? existing.timezone,
        birthdate,
        password_hash,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        status: true,
        birthdate: true,
        timezone: true,
      }
    });
  }

  // --------------------------------------------------------------------
  // UPDATE (Administrador)
  // --------------------------------------------------------------------

  /**
   * Actualiza atributos sensibles de un usuario (rol o estado) típicamente reservados para la administración.
   *
   * @access Solo debe ser invocado por administradores.
   * @param id El ID del usuario a actualizar.
   * @param dto Los datos de actualización (AdminUpdateUserDto).
   * @throws NotFoundException Si el usuario no existe.
   * @returns El objeto de usuario actualizado con los nuevos valores de rol y estado.
   */
  async updateUserAdmin(id: string, dto: AdminUpdateUserDto) {
    const existing = await this.prisma.users.findUnique({ where: { id } });

    if (!existing) throw new NotFoundException('Usuario no encontrado');

    return this.prisma.users.update({
      where: { id },
      data: {
        role: dto.role ?? existing.role,
        status: dto.status ?? existing.status,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        role: true,
        status: true,
        email: true
      }
    });
  }

  // --------------------------------------------------------------------
  // DELETE
  // --------------------------------------------------------------------

  /**
   * Elimina un usuario del sistema.
   *
   * @param id El ID del usuario a eliminar.
   * @throws NotFoundException Si el usuario no existe (a través de `findOne`).
   * @returns El objeto de usuario eliminado.
   */
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.users.delete({ where: { id } });
  }


  // --------------------------------------------------------------------
  // DASHBOARD & STATS METHODS
  // --------------------------------------------------------------------

  /**
   * Calcula estadísticas de alto nivel del sistema.
   *
   * @returns Un objeto con el total de usuarios, profesores, estudiantes y usuarios activos.
   */
  async getGlobalStats() {
    const [totalUsers, totalTeachers, totalStudents, activeUsers] =
      await Promise.all([
        this.prisma.users.count(),
        this.prisma.users.count({
          where: { role: $Enums.user_role.teacher },
        }),
        this.prisma.users.count({
          where: { role: $Enums.user_role.student },
        }),
        this.prisma.users.count({
          where: { status: $Enums.user_status.active },
        }),
      ]);

    return {
      totalUsers,
      totalTeachers,
      totalStudents,
      activeUsers,
    };
  }

  /**
     * Calcula el número de usuarios por cada rol (Teacher, Student, Admin).
     *
     * @returns Un objeto con los conteos de cada rol.
     */
  async getRoleStats() {
    const [teachers, students, admins] = await Promise.all([
      this.prisma.users.count({
        where: { role: $Enums.user_role.teacher },
      }),
      this.prisma.users.count({
        where: { role: $Enums.user_role.student },
      }),
      this.prisma.users.count({
        where: { role: $Enums.user_role.admin },
      }),
    ]);

    return {
      teachers,
      students,
      admins,
    };
  }

  /**
     * Calcula el número de usuarios por estado (Active, Banned, Pending Verification).
     *
     * @returns Un objeto con los conteos de cada estado.
     */
  async getStatusStats() {
    const [active, banned, pending] = await Promise.all([
      this.prisma.users.count({
        where: { status: $Enums.user_status.active },
      }),
      this.prisma.users.count({
        where: { status: $Enums.user_status.banned },
      }),
      this.prisma.users.count({
        where: { status: $Enums.user_status.pending_verification },
      }),
    ]);

    return {
      active,
      banned,
      pending_verification: pending,
    };
  }

  /**
     * Obtiene solo el número total de profesores.
     *
     * @returns El número total de usuarios con el rol 'teacher'.
     */
  async getTeachersCount() {
    const result = await this.prisma.users.count({
      where: { role: $Enums.user_role.teacher },
    });
    return result;
  }

  /**
     * Obtiene solo el número total de estudiantes.
     *
     * @returns El número total de usuarios con el rol 'student'.
     */
  async getStudentsCount() {
    const result = await this.prisma.users.count({
      where: { role: $Enums.user_role.student },
    });

    console.log("Students count desde backend:", result);
    return result;
  }

  /**
     * Combina todas las estadísticas clave en un solo objeto para el dashboard.
     *
     * @returns Un objeto que agrupa las estadísticas globales, por rol y por estado.
     */
  async getAllStats() {
    const [global, roles, status] = await Promise.all([
      this.getGlobalStats(),
      this.getRoleStats(),
      this.getStatusStats(),
    ]);

    return {
      global,
      roles,
      status,
    };
  }
}
