import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

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
