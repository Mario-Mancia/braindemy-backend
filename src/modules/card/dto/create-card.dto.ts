import { IsUUID, IsOptional, IsString } from 'class-validator';

export class CreateCardDto {
  @IsUUID()
  user_id: string;

  @IsOptional()
  @IsString()
  label?: string;
}