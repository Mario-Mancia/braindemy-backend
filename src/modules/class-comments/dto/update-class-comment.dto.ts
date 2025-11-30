import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateClassCommentDto {

    @IsString()
    @MinLength(1)
    @MaxLength(500)
    @Matches(/\S/, { message: 'Comment cannot be empty or whitespace' })
    comment: string;
}
