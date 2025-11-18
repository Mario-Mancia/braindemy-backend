import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

@Controller('teachers')
export class TeachersController {
    constructor(private readonly teachersService: TeachersService) { }

    @Post()
    create(@Body() dto: CreateTeacherDto) {
        return this.teachersService.create(dto);
    }

    @Get()
    findAll() {
        return this.teachersService.findAll();
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
