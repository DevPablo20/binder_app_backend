import { Role } from 'src/common/role.enum';

export type UserSignature = {
    id: string;
    name: string;
    role: Role;
    companyIds: string[];
}