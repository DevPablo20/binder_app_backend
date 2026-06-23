import { SetMetadata } from '@nestjs/common';
import { Role } from 'src/shared/role.enum';

export const IS_PRIVATE_KEY = 'private';
export const Private = (...roles: Role[]) => SetMetadata(IS_PRIVATE_KEY, roles);
