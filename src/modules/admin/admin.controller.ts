import { Controller, Get, UseGuards, Post, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { CreateTeacherDto } from '../teachers/dto/create-teacher.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboardData();
  }

  @Get('users')
  getUsers() {
    return this.adminService.getAllUsers();
  }

  @Post('teacher')
  createTeacher(@Body() dto: CreateTeacherDto) {
    return this.adminService.createTeacher(dto);
  }
}
