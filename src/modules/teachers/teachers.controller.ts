import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { TeacherFilterDto } from './dto/teacher-filter.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'teacher')
@Controller('teachers')
export class TeachersController {
    constructor(private readonly teachersService: TeachersService) { }

    @Post()
    create(@Body() dto: CreateTeacherDto) {
        return this.teachersService.create(dto);
    }

    @Get()
    findAll(@Query() filters: TeacherFilterDto) {
        return this.teachersService.findAll(filters);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.teachersService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateTeacherDto) {
        return this.teachersService.update(id, dto);
    }

    @Delete(':id')
    delete(@Param('id') id: string) {
        return this.teachersService.delete(id);
    }
}