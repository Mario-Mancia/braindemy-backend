import { IsUUID, IsOptional, IsNumber, IsString, IsEnum } from 'class-validator';
import { payment_type, payment_status } from '@prisma/client';

export class CreatePaymentDto {
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @IsNumber()
  amount: number;

  @IsEnum(payment_type)
  type: payment_type;

  @IsOptional()
  @IsString()
  reference?: string;
}
