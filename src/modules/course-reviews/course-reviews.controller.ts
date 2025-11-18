import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { CourseReviewsService } from './course-reviews.service';
import { CreateCourseReviewDto } from './dto/create-course-review.dto';
import { UpdateCourseReviewDto } from './dto/update-course-review.dto';

@Controller('course-reviews')
export class CourseReviewsController {
    constructor(private readonly service: CourseReviewsService) { }

    @Post()
    create(@Body() dto: CreateCourseReviewDto) {
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
    update(@Param('id') id: string, @Body() dto: UpdateCourseReviewDto) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
