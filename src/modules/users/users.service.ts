import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });

    if (exists) {
      throw new ConflictException('Ya existe un usuario con este email.');
    }

    const hashed = await bcrypt.hash(dto.password, 10);

    return this.prisma.users.create({
      data: {
        first_name: dto.first_name,
        last_name: dto.last_name,
        email: dto.email,
        password_hash: hashed,
        birthdate: dto.birthdate ? new Date(dto.birthdate) : undefined,
        timezone: dto.timezone,
        role: dto.role,
        status: dto.status,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        status: true,
        created_at: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.users.findUnique({
      where: { email },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.users.findUnique({
      where: { id },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    return user;
  }

  async findAll() {
    return this.prisma.users.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        status: true,
        created_at: true,
      },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const existing = await this.prisma.users.findUnique({ where: { id } });

    if (!existing) throw new NotFoundException('Usuario no encontrado');

    let password_hash;

    if (dto.password) {
      password_hash = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.users.update({
      where: { id },
      data: {
        first_name: dto.first_name,
        last_name: dto.last_name,
        birthdate: dto.birthdate ? new Date(dto.birthdate) : undefined,
        timezone: dto.timezone,
        ...(password_hash && { password_hash }),
      },
    });
  }

  async remove(id: string) {
    return this.prisma.users.delete({
      where: { id },
    });
  }
}
