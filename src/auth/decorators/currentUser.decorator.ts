import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserSignature } from '../userSignature.type';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserSignature => {
    const request = ctx.switchToHttp().getRequest();
    return request.userSignature;
  },
);
