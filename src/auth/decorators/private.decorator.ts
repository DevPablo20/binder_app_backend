import { SetMetadata } from '@nestjs/common'
import { Role } from '../roles/roles.enum'

export const IS_PRIVATE_KEY = 'private'
export const Private = (...roles: Role[]) => SetMetadata(IS_PRIVATE_KEY, roles)