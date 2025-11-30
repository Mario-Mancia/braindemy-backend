import { IsUUID, IsString, IsInt, Min, Max, MaxLength, Length, Matches, IsOptional } from 'class-validator';

/**
 * @public
 * Data Transfer Object (DTO) utilizado para la creación de un nuevo registro de tarjeta
 * asociado a un usuario.
 *
 * Este DTO encapsula los datos necesarios para almacenar una referencia a una tarjeta
 * (no la información completa y sensible) y garantiza que los datos cumplan con las
 * reglas de validación de negocio antes de ser procesados.
 *
 * @property brand La marca de la tarjeta (ej. Visa, Mastercard). Máximo 20 caracteres.
 * @property last4 Los últimos cuatro dígitos del número de tarjeta. Máximo 4 caracteres.
 * @property expire_month El mes de expiración de la tarjeta (de 1 a 12).
 * @property expire_year El año de expiración de la tarjeta (con un rango limitado).
 * @property label (Opcional) Una etiqueta o alias que el usuario puede asignar a la tarjeta (ej. "Tarjeta de Trabajo"). Máximo 50 caracteres.
 */
export class CreateCardDto {
@IsUUID()
user_id: string;


@IsString()
@MaxLength(20)
brand: string;


@IsString()
@Length(4, 4)
@Matches(/^\d{4}$/, { message: 'last4 debe contener exactamente 4 dígitos numéricos' })
last4: string;


@IsInt()
@Min(1)
@Max(12)
expire_month: number;


@IsInt()
@Min(2024)
@Max(2100)
expire_year: number;


@IsOptional()
@IsString()
@MaxLength(50)
label?: string;
}