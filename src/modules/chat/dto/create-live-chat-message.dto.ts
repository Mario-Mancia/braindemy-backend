import { IsUUID, IsString } from 'class-validator';

export class CreateLiveChatMessageDto {
  @IsUUID()
  session_id: string;

  @IsUUID()
  sender_id: string;

  @IsString()
  message: string;
}