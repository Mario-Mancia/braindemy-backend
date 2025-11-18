import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '../auth/dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class AuthService {
    constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // -- SECCIÓN DE REGISTRO
  async register(dto: CreateUserDto, req?: any) {
    const user = await this.usersService.create(dto);

    const { accessToken, refreshToken } = this.generateTokens(
      user.id,
      user.email,
      user.role,
    );

    await this.saveRefreshToken(user.id, refreshToken, req);

    return {
      message: 'Usuario registrado con éxito',
      user,
      accessToken,
      refreshToken,
    };
  }

  // -- SECCIÓN DE LOGIN

  async login(dto: LoginDto, req?: any) {
    const user = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password_hash);

    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const { accessToken, refreshToken } = this.generateTokens(
      user.id,
      user.email,
      user.role,
    );

    await this.saveRefreshToken(user.id, refreshToken, req);

    return {
      message: 'Login exitoso',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.created_at,
      },
    };
  }

  // -- GENERACIÓN DE LOS TOKENS

  private generateTokens(id: string, email: string, role: string) {
    const accessToken = this.jwtService.sign(
      { sub: id, email, role },
      { expiresIn: '15m' },
    );

    const refreshToken = this.jwtService.sign(
      { sub: id },
      { expiresIn: '30d' },
    );

    return { accessToken, refreshToken };
  }

  // -- GUARDAR TOKEN EN BASE DE DATOS
  
  private async saveRefreshToken(userId: string, token: string, req: any) {
  await this.prisma.refresh_tokens.deleteMany({
    where: { user_id: userId },
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  return this.prisma.refresh_tokens.create({
    data: {
      user_id: userId,
      token,
      user_agent: req?.headers?.['user-agent'] ?? null,
      ip_address: req?.ip ?? null,
      expires_at: expiresAt,
    },
  });
}

  // -- REFRESCAR LA SESIÓN

  async refreshToken(refreshToken: string) {
    const stored = await this.prisma.refresh_tokens.findUnique({
      where: { token: refreshToken },
    });

    if (!stored) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (new Date() > stored.expires_at) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    let payload;
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch {
      throw new UnauthorizedException('Token corrupto o manipulado');
    }

    const user = await this.prisma.users.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // Rotación: eliminar viejo token y crear nuevos
    await this.prisma.refresh_tokens.delete({
      where: { token: refreshToken },
    });

    const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(
      user.id,
      user.email,
      user.role,
    );

    await this.saveRefreshToken(user.id, newRefreshToken, {
      headers: {},
      ip: null,
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  // -- CERRAR LA SESIÓN
  async logout(refreshToken: string) {
    await this.prisma.refresh_tokens.deleteMany({
      where: { token: refreshToken },
    });

    return { message: 'Sesión cerrada correctamente' };
  }

  // -- VALIDACIONES PARA GUARDS
  async validateUser(payload: any) {
    return this.prisma.users.findUnique({
      where: { id: payload.sub },
    });
  }
}
