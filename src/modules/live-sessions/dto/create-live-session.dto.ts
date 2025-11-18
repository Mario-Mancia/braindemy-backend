import { IsUUID, IsString, IsDateString, IsOptional, IsBoolean } from 'class-validator';

export class CreateLiveSessionDto {
  @IsUUID()
  course_id: string;

  @IsString()
  session_url: string;

  @IsDateString()
  start_time: string;

  @IsOptional()
  @IsDateString()
  end_time?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}