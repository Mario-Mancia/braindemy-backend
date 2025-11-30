import { IsOptional, IsUUID, IsEnum, IsString, Matches } from 'class-validator';
import { enrollment_status } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CourseEnrollmentFilterDto {
    @IsOptional()
    @IsUUID()
    course_id?: string;

    @IsOptional()
    @IsUUID()
    student_id?: string;

    @IsOptional()
    @IsUUID()
    teacher_id?: string;

    @IsOptional()
    @IsEnum(enrollment_status)
    status?: enrollment_status;

    @IsOptional()
    @IsString()
    startDate?: string;

    @IsOptional()
    @IsString()
    endDate?: string;


    @IsOptional()
    @Matches(/^[a-zA-Z_]+\:(asc|desc)$/)
    sort?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit: number = 10;
}