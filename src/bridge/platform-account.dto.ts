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

export class PlatformAccountSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  externalAccountId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  clientId: string;

  @ApiProperty()
  platformId: string;
}

export class PlatformAccountDetailDto extends PlatformAccountSummaryDto {
  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CreatePlatformAccountDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  externalAccountId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty()
  @IsUUID()
  clientId: string;

  @ApiProperty()
  @IsUUID()
  platformId: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePlatformAccountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePlatformAccountItemDto extends UpdatePlatformAccountDto {
  @ApiProperty()
  @IsUUID()
  id: string;
}

export class BulkUpdatePlatformAccountsDto {
  @ApiProperty({ type: [UpdatePlatformAccountItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePlatformAccountItemDto)
  platformAccounts: UpdatePlatformAccountItemDto[];
}

export class PlatformAccountQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  platformId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
