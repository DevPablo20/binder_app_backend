import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { UserWithMembershipDto } from 'src/user-company/user-company.dto';

export class CompanySummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  isActive: boolean;
}

export class CompanyDetailDto extends CompanySummaryDto {
  @ApiProperty()
  description: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CompanyWithUsersDto extends CompanyDetailDto {
  @ApiProperty({ type: [UserWithMembershipDto] })
  users: UserWithMembershipDto[];
}

export class CreateCompanyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCompanyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCompanyItemDto extends UpdateCompanyDto {
  @ApiProperty()
  @IsUUID()
  id: string;
}

export class BulkUpdateCompaniesDto {
  @ApiProperty({ type: [UpdateCompanyItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateCompanyItemDto)
  companies: UpdateCompanyItemDto[];
}
