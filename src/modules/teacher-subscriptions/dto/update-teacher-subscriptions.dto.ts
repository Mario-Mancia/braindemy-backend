import { PartialType } from '@nestjs/mapped-types';
import { CreateTeacherSubscriptionsDto } from './create-teacher-subscriptions.dto';

export class UpdateTeacherSubscriptionsDto extends PartialType(CreateTeacherSubscriptionsDto) {}
