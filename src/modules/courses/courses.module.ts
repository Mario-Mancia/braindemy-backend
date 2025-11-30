import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';

/**
 * @public
 * Módulo de NestJS que encapsula toda la funcionalidad relacionada con la gestión de Cursos.
 *
 * Los módulos son la unidad básica de organización en NestJS y permiten agrupar controladores,
 * proveedores (servicios) y exportaciones para mantener el código limpio y con acoplamiento suelto.
 *
 * @Module metadata:
 * @property controllers: Define los controladores que manejan las peticiones HTTP para las rutas '/courses'.
 * @property providers: Define los servicios y otras dependencias que serán inyectadas en este módulo.
 * @property exports: Indica qué proveedores definidos en este módulo deben ser accesibles 
 * para otros módulos que lo importen es exportado para que otros módulos puedan interactuar con la lógica de cursos).
 *
 * @injectable
 */
@Module({
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService]
})
export class CoursesModule {}
