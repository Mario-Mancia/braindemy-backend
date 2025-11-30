import {
  IsOptional,
  IsUUID,
  IsString,
  IsInt,
  Min,
  IsBooleanString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class FindLessonsDto {
  @IsOptional()
  @IsUUID()
  course_id?: string;

  @IsOptional()
  @IsString()
  search?: string; // busca en title y content

  @IsOptional()
  @IsBooleanString()
  has_video?: 'true' | 'false';

  @IsOptional()
  @IsBooleanString()
  has_file?: 'true' | 'false';

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  limit: number = 20;

  @IsOptional()
  @IsString()
  orderBy?: string; // position | created_at | updated_at | title

  @IsOptional()
  @IsString()
  sort?: string; // asc | desc
}