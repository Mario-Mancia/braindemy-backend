import { IsBoolean, IsOptional, IsNumber, Min, IsInt, Max, IsString, MaxLength } from 'class-validator';

/**
 * @public
 * Data Transfer Object (DTO) utilizado para actualizar los detalles de una tarjeta existente.
 *
 * La característica clave de este DTO es que todos los campos son opcionales,
 * lo que permite al usuario enviar solo los campos que desea modificar (ej. solo el balance o la etiqueta),
 * dejando los demás intactos.
 *
 * @property balance (Opcional) El saldo actual de la tarjeta. Debe ser un número igual o mayor que cero.
 * @property is_active (Opcional) Indica el estado de la tarjeta: `true` si está activa y `false` si está suspendida. Debe ser un valor booleano.
 * @property expire_month (Opcional) El nuevo mes de expiración. Debe ser un número entre 1 y 12.
 * @property expire_year (Opcional) El nuevo año de expiración. Debe ser un número igual o mayor al año 2024.
 * @property label (Opcional) La nueva etiqueta o alias de la tarjeta (ej. "Tarjeta Personal").
 */
export class UpdateCardDto {
@IsOptional()
@IsNumber()
@Min(0)
balance?: number;


@IsOptional()
@IsBoolean()
is_active?: boolean;


@IsOptional()
@IsInt()
@Min(1)
@Max(12)
expire_month?: number;


@IsOptional()
@IsInt()
@Min(2024)
@Max(2100)
expire_year?: number;


@IsOptional()
@IsString()
@MaxLength(50)
label?: string;
}