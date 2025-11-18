import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    register(@Body() dto: CreateUserDto, @Req() req: any) {
        return this.authService.register(dto, req);
    }

    @Post('login')
    login(@Body() dto: LoginDto, @Req() req: any) {
        return this.authService.login(dto, req);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Req() req: any) {
        return {
            message: 'Perfil obtenido con éxito',
            user: req.user,
        };
    }

    @Post('refresh')
    refresh(@Body('refreshToken') refreshToken: string) {
        return this.authService.refreshToken(refreshToken);
    }

    @Post('logout')
    logout(@Body('refreshToken') refreshToken: string) {
        return this.authService.logout(refreshToken);
    }
}
