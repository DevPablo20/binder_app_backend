import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'src/shared/role.enum';
import { CompanySummaryDto } from 'src/access/company/company.dto';
import { CompanyWithMembershipDto } from 'src/access/user-company/user-company.dto';

export class UserSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty()
  isActive: boolean;
}

export class UserDetailDto extends UserSummaryDto {
  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: [CompanySummaryDto] })
  companies: CompanySummaryDto[];
}

export class UserWithCompaniesDto extends UserSummaryDto {
  @ApiProperty({ type: [CompanyWithMembershipDto] })
  companies: CompanyWithMembershipDto[];
}

export class MeResponseDto extends UserDetailDto {}
