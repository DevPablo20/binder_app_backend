import { Role } from "./roles/roles.enum";

export type UserSignature = {
    id: string;
    name: string;
    role: Role;
    companyIds: string[];
}