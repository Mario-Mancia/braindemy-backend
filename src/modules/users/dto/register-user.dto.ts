import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsDateString, IsEnum, IsIn} from 'class-validator'
import { user_role, user_status } from '@prisma/client';

export class RegisterUserDto {
  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsEmail({}, { message: 'El correo electrónico no es válido.' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  password: string;

  @IsOptional()
  @IsDateString()
  birthdate?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsIn(['student', 'teacher'])
  role?: 'student' | 'teacher';
}