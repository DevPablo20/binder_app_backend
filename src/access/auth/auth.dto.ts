import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDTO {
  @ApiProperty()
  @IsEmail(
    {},
    {
      message: 'O Email deve ser válido',
    },
  )
  email: string;

  @ApiProperty()
  @IsString({
    message: 'A Senha deve ser uma string',
  })
  @MinLength(1, {
    message: 'A Senha é obrigatória',
  })
  password: string;
}

export class ForgottenPasswordDTO {
  @ApiProperty()
  @IsEmail(
    {},
    {
      message: 'O Email deve ser válido',
    },
  )
  email: string;
}

export class ResetPasswordDTO {
  @ApiProperty()
  @IsString({
    message: 'O Token deve ser uma string',
  })
  @MinLength(1, {
    message: 'O Token é obrigatório',
  })
  token: string;

  @ApiProperty()
  @IsString({
    message: 'A Senha deve ser uma string',
  })
  @MinLength(8, {
    message: 'A Senha informada deve conter no mínimo 8 caracteres',
  })
  @MaxLength(32, {
    message: 'A Senha informada deve conter na máximo 32 caracteres',
  })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Senha fraca: sua senha deve conter números, letras maiúsculas, letras minúsculas e caracteres especiais',
  })
  password: string;
}
