import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, $Enums } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUsersFiltersDto } from './dto/get-user-filter.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';

@Injectable()
export class UsersService {
  private prisma = new PrismaClient();

  /** FIND BY EMAIL */
  async findByEmail(email: string) {
    return this.prisma.users.findUnique({ where: { email } });
  }

  /** CREATE USER */
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

  /** FIND ALL */
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

  /** FIND ONE – ahora sin password */
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

  /** UPDATE */
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
  /** DELETE */
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.users.delete({ where: { id } });
  }


  /** ======= GLOBAL STATS ======= */
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

  /** ======= ROLES STATS ======= */
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

  /** ======= STATUS STATS ======= */
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

  /** ======= COUNT TEACHERS ======= */
  async getTeachersCount() {
    const result = await this.prisma.users.count({
      where: { role: $Enums.user_role.teacher },
    });
    return result;
  }

  /** ======= COUNT STUDENTS ======= */
  async getStudentsCount() {
    const result = await this.prisma.users.count({
      where: { role: $Enums.user_role.student },
    });

    console.log("Students count desde backend:", result);
    return result;
  }

  /** ======= ALL STATS (COMBINADO) ======= */
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
