import { Role } from './role.enum';

const ROLE_RANK: Record<Role, number> = {
  [Role.Viewer]: 1,
  [Role.Editor]: 2,
  [Role.Superadmin]: 3,
};

export function hasMinRole(userRole: Role, minRole: Role): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[minRole];
}
