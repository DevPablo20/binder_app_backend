import { Role } from 'src/shared/role.enum';

export type UserSignature = {
  id: string;
  name: string;
  role: Role;
  companyIds: string[];
};
