import { IsUUID, IsOptional, IsNumber, IsString, IsEnum, Min, MaxLength } from 'class-validator';
import { payment_type } from '@prisma/client';

export class CreatePaymentDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(payment_type)
  type: payment_type;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reference?: string;
}