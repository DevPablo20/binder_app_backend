import { CanActivate, ExecutionContext, HttpException, HttpStatus, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { DATA_SOURCE } from '../database/constants';
import { DataSource } from 'typeorm';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import { IS_PRIVATE_KEY } from './decorators/private.decorator';
import { Role } from './roles/roles.enum';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/user/user.entity';
import { UserSignature } from './userSignature.type';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name)
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    private reflector: Reflector,
    @Inject(DATA_SOURCE) private dataSource: DataSource
  ) { }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(IS_PRIVATE_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    const request = context.switchToHttp().getRequest()
    const token = this.extractTokenFromRequest(request)

    try {
      if (isPublic) {
        return true
      }
      if (!token) {
        throw new HttpException('Usuário não autenticado', HttpStatus.UNAUTHORIZED)
      }
      const payload = await this.jwtService.verifyAsync(
        token,
        {
          secret: this.configService.get('JWT_SECRET_KEY')
        }
      )

      const user = await this.dataSource.manager.findOne(User, {
        where: { id: payload.id },
        relations: { companies: true }
      })

      if (!user) throw new HttpException('Usuário não autenticado', HttpStatus.UNAUTHORIZED)


      const userSignature: UserSignature = {
        id: user.id,
        name: user.name,
        role: user.role,
        companyIds: user.companies?.map((company) => company.id) ?? [],
      }

      request['userSignature'] = userSignature


      if (requiredRoles && requiredRoles.length > 0) {
        const hasRole = requiredRoles.includes(userSignature.role);
        if (!hasRole) throw new HttpException('Permissão insuficiente para o usuário', HttpStatus.UNAUTHORIZED)
      }

      return true
    } catch (err) {
      this.logger.error(err)
      throw err
    }
  }

  private extractTokenFromRequest(request: Request): string | undefined {
    const authCookie = request.cookies?.access_token;
    if (authCookie?.startsWith('Bearer ')) {
      return authCookie.split(' ')[1];
    }

    const authHeader = request.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }

    return undefined
  }
}