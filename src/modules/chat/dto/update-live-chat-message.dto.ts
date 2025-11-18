import { PartialType } from '@nestjs/mapped-types';
import { CreateLiveChatMessageDto } from './create-live-chat-message.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateLiveChatMessageDto extends PartialType(CreateLiveChatMessageDto) {
  @IsOptional()
  @IsBoolean()
  is_deleted?: boolean;
}