import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'alex@example.com' })
  @IsEmail({}, { message: 'Địa chỉ email không đúng định dạng' })
  email: string;

  @ApiProperty({ example: 'Password123', minLength: 6, maxLength: 64 })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @MaxLength(64, { message: 'Mật khẩu không được vượt quá 64 ký tự' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)/, {
    message: 'Mật khẩu phải chứa cả chữ cái và chữ số',
  })
  password: string;

  @ApiProperty({ example: 'Alex Nguyen' })
  @IsString()
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  @Length(2, 50, { message: 'Họ và tên phải từ 2 đến 50 ký tự' })
  name: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb' })
  @IsOptional()
  @IsString()
  avatar?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'alex@example.com' })
  @IsEmail({}, { message: 'Địa chỉ email không đúng định dạng' })
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password: string;
}

export class GoogleAuthDto {
  @ApiProperty({
    description: 'Google ID token credential returned from Google Identity Services popup',
  })
  @IsString()
  @IsNotEmpty({ message: 'Google credential token không được để trống' })
  credential: string;
}
