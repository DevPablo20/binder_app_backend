import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'src/common/role.enum';
import { CompanySummaryDto } from 'src/company/company.dto';

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

export class MeResponseDto extends UserDetailDto {}

export class RevokeUserCompanyResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  companyId: string;

  @ApiProperty()
  isActive: boolean;
}
