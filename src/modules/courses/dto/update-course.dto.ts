import { IsOptional, IsString, IsNumber, Min, IsBoolean, IsInt, IsObject, ValidateNested } from 'class-validator';
import { CourseSettingsDto } from './course-settings.dto';
import { Type } from 'class-transformer';
import { CourseScheduleDto } from './course-schedule.dto';

/**
 * @public
 * Data Transfer Object (DTO) utilizado para **actualizar parcialmente** los datos de un curso existente.
 *
 * La clave de este DTO es que **todos los campos son opcionales** (`@IsOptional()`),
 * lo que permite al usuario enviar solo las propiedades que desea modificar (ej. solo el precio o el título)
 * sin afectar los datos existentes.
 *
 * @property title (Opcional) El nuevo título del curso.
 * @property description (Opcional) Una nueva descripción para el curso.
 * @property category (Opcional) Una nueva categoría temática.
 * @property price (Opcional) El nuevo costo del curso. Debe ser un número no negativo (`>= 0`).
 * @property schedule (Opcional) La nueva definición de horario del curso. Los datos deben ser válidos según su DTO.
 * @property settings (Opcional) La nueva configuración de políticas del curso (ej. comentarios, intentos máximos).
 *  Los datos deben ser válidos según su DTO.
 * @property level (Opcional) El nuevo nivel de dificultad.
 * @property color (Opcional) Un nuevo código de color asociado.
 * @property cover_url (Opcional) La nueva URL de la imagen de portada del curso.
 * @property duration (Opcional) La nueva duración total estimada del curso.
 * @property max_students (Opcional) El nuevo número máximo de estudiantes permitidos.
 * @property is_active (Opcional) El nuevo estado de disponibilidad del curso.
 */
export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  price?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CourseScheduleDto)
  schedule?: CourseScheduleDto;

    @IsOptional()
  @ValidateNested()
  @Type(() => CourseSettingsDto)
  settings?: CourseSettingsDto;

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  cover_url?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsInt()
  max_students?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}