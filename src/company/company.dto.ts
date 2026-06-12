import { ApiProperty } from '@nestjs/swagger';

export class CompanySummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  shortId: string;

  @ApiProperty()
  status: boolean;
}

export class CompanyDetailDto extends CompanySummaryDto {
  @ApiProperty()
  description: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
