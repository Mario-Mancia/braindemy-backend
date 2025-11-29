import { Controller, Body, Delete, Get, Param, Patch, Post, UseGuards, Query, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { GetUsersFiltersDto } from './dto/get-user-filter.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import type { Request as ExpressRequest } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  // ======= STATS ENDPOINTS ======= //
  @Get('stats/global')
  getGlobalStats() {
    return this.usersService.getGlobalStats();
  }

  @Get('stats/roles')
  getRoleStats() {
    return this.usersService.getRoleStats();
  }

  @Get('stats/status')
  getStatusStats() {
    return this.usersService.getStatusStats();
  }

  @Get('stats/teachers')
  getTeachersCount() {
    return this.usersService.getTeachersCount();
  }

  @Get('stats/students')
  getStudentsCount() {
    return this.usersService.getStudentsCount();
  }

  @Get('stats')
  getAllStats() {
    return this.usersService.getAllStats();
  }

  // CREATE
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  // FIND ALL WITH FILTERS
  @Get()
  findAll(@Query() filters: GetUsersFiltersDto) {
    return this.usersService.findAll(filters);
  }

  // FIND ONE
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // UPDATE (solo edición personal)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Request() req: ExpressRequest
  ) {
    return this.usersService.updateUser(id, dto, req.user);
  }

  // UPDATE ADMIN (para cambiar role y status)
  @Patch(':id/admin')
  @Roles('admin')
  updateAdmin(
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto
  ) {
    return this.usersService.updateUserAdmin(id, dto);
  }

  // DELETE
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}