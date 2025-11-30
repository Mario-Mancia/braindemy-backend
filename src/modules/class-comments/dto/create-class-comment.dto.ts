import { IsUUID, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateClassCommentDto {
    @IsUUID()
    course_id: string;

    @IsString()
    @MinLength(1)
    @MaxLength(500)
    @Matches(/\S/, { message: 'Comment cannot be empty or whitespace' })
    comment: string;
}