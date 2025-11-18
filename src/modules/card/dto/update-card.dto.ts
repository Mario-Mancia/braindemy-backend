import { PartialType } from '@nestjs/mapped-types';
import { CreateCardDto } from './create-card.dto';
import { IsBoolean, IsOptional, IsNumber } from 'class-validator';

export class UpdateCardDto extends PartialType(CreateCardDto) {
  @IsOptional()
  @IsNumber()
  balance?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}