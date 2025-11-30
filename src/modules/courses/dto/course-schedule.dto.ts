import { IsString } from "class-validator";

/**
 * @public
 * Data Transfer Object (DTO) que define un bloque de tiempo para la programación
 * (schedule) de un curso, especificando el día y la hora de inicio y fin.
 *
 * Este DTO se utiliza típicamente como parte de un DTO más grande (como un CreateCourseDto)
 * donde un curso puede tener múltiples entradas de horario (ej. Lunes 10:00-11:30, Miércoles 10:00-11:30).
 *
 * @property day El día de la semana en que se imparte la clase (ej. "Lunes", "Miércoles").
 * @property start_time La hora de inicio de la clase en formato de cadena (ej. "10:00", "09:30").
 * @property end_time La hora de finalización de la clase en formato de cadena (ej. "11:30", "11:00").
 */
export class CourseScheduleDto {
  @IsString()
  day: string;

  @IsString()
  start_time: string; 

  @IsString()
  end_time: string;
}