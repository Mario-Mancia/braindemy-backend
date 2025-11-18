import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { LiveSessionsService } from './live-sessions.service';
import { CreateLiveSessionDto } from './dto/create-live-session.dto';
import { UpdateLiveSessionDto } from './dto/update-live-session.dto';

@Controller('live-sessions')
export class LiveSessionsController {
    constructor(private readonly service: LiveSessionsService) { }

    @Post()
    create(@Body() dto: CreateLiveSessionDto) {
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
    update(@Param('id') id: string, @Body() dto: UpdateLiveSessionDto) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
