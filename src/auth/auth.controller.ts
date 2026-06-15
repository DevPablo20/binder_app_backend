import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  Param,
} from '@nestjs/common';
import { ForgottenPasswordDTO, LoginDTO, ResetPasswordDTO } from './auth.dto';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import type { Response } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login', description: 'Autenticação de usuário' })
  async login(@Res() res: Response, @Body() body: LoginDTO) {
    const { token, expiresDate } = await this.authService.login(res, body);

    return res.status(HttpStatus.OK).json({
      token,
      expiresAt: expiresDate,
    });
  }

  @Public()
  @ApiCookieAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout',
    description: 'Remover autenticação do usuário logado',
  })
  async logout(@Res() res: Response) {
    return await this.authService.logout(res);
  }

  @Public()
  @ApiCookieAuth()
  @Post('password/forgot')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Esqueci a senha',
    description: 'Envia email para alterar a senha do usuário',
  })
  async forgotPassword(@Body() body: ForgottenPasswordDTO) {
    return await this.authService.forgotPassword(body);
  }

  @Public()
  @ApiCookieAuth()
  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset de senha',
    description: 'Rota callback para redefinir a senha',
  })
  async resetPassword(@Body() body: ResetPasswordDTO) {
    return await this.authService.resetPassword(body);
  }
}
