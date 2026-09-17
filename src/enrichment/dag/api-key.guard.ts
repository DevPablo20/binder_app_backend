import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { Request } from 'express';

export const API_KEY_HEADER = 'x-api-key';

/**
 * Autenticação das rotas do DAG.
 *
 * Máquina não é usuário: o `AuthGuard` global exige JWT de um usuário real do banco, e robô não
 * tem empresa, não faz login e veria o token expirar. As rotas do DAG são `@Public()` para ele e
 * protegidas por chave de API — sem usuário fantasma na tabela `user`.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('ENRICHMENT_API_KEY');

    if (!expected) {
      throw new HttpException(
        'ENRICHMENT_API_KEY não configurada',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.header(API_KEY_HEADER);

    if (!provided || !matches(provided, expected)) {
      throw new HttpException('Não autorizado', HttpStatus.UNAUTHORIZED);
    }

    return true;
  }
}

function matches(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  // timingSafeEqual exige mesmo tamanho; comparar contra si mesmo mantém o custo constante
  if (providedBuffer.length !== expectedBuffer.length) {
    timingSafeEqual(expectedBuffer, expectedBuffer);
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}
