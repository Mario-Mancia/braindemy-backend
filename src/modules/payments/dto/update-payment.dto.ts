import { IsEnum } from 'class-validator';
import { payment_status } from '@prisma/client';

export class UpdatePaymentStatusDto {
  @IsEnum(payment_status)
  status: payment_status;
}