import { Controller, Post, Get, Patch, Delete, Body, Param } from '@nestjs/common';
import { TeacherSubscriptionsService } from './teacher-subscriptions.service';
import { CreateTeacherSubscriptionsDto } from './dto/create-teacher-subscriptions.dto';
import { UpdateTeacherSubscriptionsDto } from './dto/update-teacher-subscriptions.dto';

@Controller('teacher-subscriptions')
export class TeacherSubscriptionsController {
    constructor(private service: TeacherSubscriptionsService) { }

    @Post()
    create(@Body() dto: CreateTeacherSubscriptionsDto) {
        return this.service.create(dto);
    }

    @Get()
    findAll() {
        return this.service.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() dto: UpdateTeacherSubscriptionsDto,
    ) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
