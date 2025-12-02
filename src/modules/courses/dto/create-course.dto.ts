import { IsString, IsOptional, IsNumber, Min, IsInt, IsBoolean, IsObject, ValidateNested, IsArray, IsUUID } from 'class-validator';
import { CourseScheduleDto } from './course-schedule.dto';
import { Type } from 'class-transformer';
import { CourseSettingsDto } from './course-settings.dto';

/**
 * @public
 * Data Transfer Object (DTO) principal utilizado para crear un nuevo curso en el sistema.
 *
 * Este DTO encapsula la información fundamental y los sub-objetos de configuración
 * necesarios para definir un curso completo. Se utiliza en el endpoint de creación.
 *
 * @property title El título obligatorio del curso. Debe ser una cadena de texto.
 * @property description (Opcional) Una descripción detallada del contenido del curso.
 * @property category (Opcional) La categoría temática a la que pertenece el curso (ej. 'Tecnología').
 * @property price (Opcional) El costo del curso. Debe ser un número no negativo (`>= 0`).
 * @property schedule (Opcional) El bloque de horario del curso. Los datos deben ser válidos según el DTO.
 * @property settings (Opcional) La configuración de políticas del curso (ej. comentarios, certificados).
 *  Los datos deben ser válidos según su DTO.
 * @property level (Opcional) El nivel de dificultad del curso (ej. 'Básico', 'Intermedio').
 * @property color (Opcional) Un código de color asociado al curso para fines de UI.
 * @property cover_url (Opcional) La URL de la imagen de portada del curso.
 * @property duration (Opcional) La duración total estimada del curso (ej. "10 horas").
 * @property max_students (Opcional) El número máximo de estudiantes permitidos en el curso. Debe ser un número entero.
 * @property is_active (Opcional) Indica si el curso está disponible públicamente desde el momento de su creación.
 */
export class CreateCourseDto {

  @IsString()
  @IsUUID() // Opcional, pero recomendado si usas UUIDs
  teacher_id: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  price?: number;

  @IsOptional()
  @IsArray() // <--- AGREGAR ESTO
  @ValidateNested({ each: true }) // <--- AGREGAR "each: true" para validar cada objeto del array
  @Type(() => CourseScheduleDto)
  schedule?: CourseScheduleDto[];

  /*
  @IsOptional()
  @ValidateNested()
  @Type(() => CourseScheduleDto)
  schedule?: CourseScheduleDto;*/

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
