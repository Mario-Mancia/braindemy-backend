import { IsOptional, IsString, IsUUID, IsNumber, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * @public
 * Data Transfer Object (DTO) utilizado para aplicar filtros y parámetros de paginación
 * al recuperar una lista de cursos.
 *
 * Todos los campos son opcionales (`@IsOptional()`), permitiendo al usuario enviar
 * solo los criterios de filtrado que necesita (ej. solo por precio o solo por categoría).
 *
 * @property search (Opcional) Término de búsqueda de texto libre para buscar cursos por título o descripción.
 * @property category (Opcional) Filtra los cursos por una categoría específica (ej. 'Programación', 'Diseño').
 * @property teacher_id (Opcional) Filtra los cursos para mostrar solo aquellos impartidos por un profesor con un ID UUID específico.
 * @property min_price (Opcional) Precio mínimo requerido para el curso. Debe ser un número.
 * @property max_price (Opcional) Precio máximo requerido para el curso. Debe ser un número.
 * @property is_active (Opcional) Filtra los cursos por estado; `true` para cursos activos/disponibles, `false` para inactivos.
 * @property page (Opcional) El número de página actual de resultados. El valor por defecto es 1. Debe ser un número entero >= 1.
 * @property limit (Opcional) El número máximo de elementos a devolver por página. El valor por defecto es 10. Debe ser un número entero >= 1.
 */
export class CourseFilterDto {
  @IsOptional()
  @IsString()
  search?: string;


  @IsOptional()
  @IsString()
  category?: string;


  @IsOptional()
  @IsUUID()
  teacher_id?: string;


  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  min_price?: number;


  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  max_price?: number;


  @IsOptional()
  @IsBoolean()
  is_active?: boolean;


  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page: number = 1;


  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit: number = 10;
}
