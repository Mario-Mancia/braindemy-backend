import { IsBoolean, IsNumber, IsOptional, Min } from "class-validator";

/**
 * @public
 * Data Transfer Object (DTO) utilizado para actualizar los ajustes opcionales de un curso.
 *
 * Todos los campos son opcionales (`@IsOptional()`), permitiendo la actualización parcial
 * de la configuración (ej. solo cambiar el número de intentos sin afectar la configuración
 * de comentarios).
 *
 * @property allow_comments (Opcional) Indica si los estudiantes pueden dejar comentarios o participar en foros dentro del curso. Debe ser un valor booleano.
 * @property allow_certificates (Opcional) Indica si el sistema debe emitir un certificado de finalización al aprobar el curso. Debe ser un valor booleano.
 * @property max_attempts (Opcional) El número máximo de intentos que los estudiantes tienen para completar las evaluaciones del curso. Debe ser un número entero mayor o igual a 1.
 */
export class CourseSettingsDto {
  @IsOptional()
  @IsBoolean()
  allow_comments?: boolean;

  @IsOptional()
  @IsBoolean()
  allow_certificates?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  max_attempts?: number;
}