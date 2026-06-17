import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';
import { Role } from 'src/common/role.enum';

export class UserCompanyMembershipDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  companyId: string;

  @ApiProperty()
  isActive: boolean;
}

export class UserWithMembershipDto {
  @ApiProperty({ description: 'User UUID' })
  id: string;

  @ApiProperty({ description: 'UserCompany row UUID — used for revoke' })
  membershipId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty()
  isActive: boolean;
}

export class CompanyWithMembershipDto {
  @ApiProperty({ description: 'Company UUID' })
  id: string;

  @ApiProperty({ description: 'UserCompany row UUID — used for revoke' })
  membershipId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  isActive: boolean;
}

export class SyncUserCompaniesDto {
  @ApiProperty({ type: [String], description: 'Desired active company IDs' })
  @IsArray()
  @IsUUID('4', { each: true })
  companyIds: string[];
}
