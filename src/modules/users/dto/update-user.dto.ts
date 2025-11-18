import { IsOptional, IsString, MinLength, IsDateString } from 'class-validator';

export class UpdateUserDto {
    @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsDateString()
  birthdate?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}