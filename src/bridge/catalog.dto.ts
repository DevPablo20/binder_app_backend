import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';

export enum CatalogQueryObjectType {
  Account = 'account',
  Campaign = 'campaign',
  AdGroup = 'ad_group',
  Ad = 'ad',
}

export class CatalogQueryDto {
  @ApiPropertyOptional({ enum: CatalogQueryObjectType })
  @IsOptional()
  @IsEnum(CatalogQueryObjectType)
  objectType?: CatalogQueryObjectType;

  @ApiPropertyOptional({
    description: 'When true, return only lake items not yet mapped in Bridge',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (value === true || value === 'true' || value === '1') return true;
    if (value === false || value === 'false' || value === '0') return false;
    return value;
  })
  @IsBoolean()
  unmatchedOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Scope enrichment to PlatformAccounts of this client',
  })
  @IsOptional()
  @IsUUID()
  clientId?: string;
}

export class CatalogItemDto {
  @ApiProperty()
  platform: string;

  @ApiProperty({ enum: CatalogQueryObjectType })
  objectType: CatalogQueryObjectType;

  @ApiProperty()
  accountId: string;

  @ApiProperty()
  accountName: string;

  @ApiPropertyOptional({ nullable: true })
  campaignId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  campaignName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  adGroupId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  adGroupName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  adId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  adName?: string | null;

  @ApiProperty({
    description: 'Whether this lake identity already has a Bridge mapping',
  })
  isMapped: boolean;

  @ApiPropertyOptional({
    nullable: true,
    description:
      'Existing PlatformAccount id when the account (or parent) is mapped',
  })
  platformAccountId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Existing PlatformObjectMap id when the object is mapped',
  })
  platformObjectMapId?: string | null;
}
