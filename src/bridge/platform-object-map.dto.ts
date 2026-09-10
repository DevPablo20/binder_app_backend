import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { PlatformObjectType } from 'src/shared/platform-object-type.enum';

export class PlatformObjectMapSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: PlatformObjectType })
  objectType: PlatformObjectType;

  @ApiProperty()
  externalId: string;

  @ApiPropertyOptional({ nullable: true })
  externalName?: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  platformAccountId: string;

  @ApiProperty()
  externalAccountId: string;

  @ApiProperty()
  accountName: string;

  @ApiProperty()
  platformId: string;

  @ApiProperty()
  platformName: string;

  @ApiProperty()
  clientId: string;

  @ApiProperty()
  clientName: string;

  @ApiProperty()
  campaignId: string;

  @ApiProperty()
  campaignName: string;

  @ApiPropertyOptional({ nullable: true })
  channelId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  channelName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  buyingTypeId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  buyingTypeName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  formatId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  subFormatId?: string | null;

  @ApiProperty({ type: [String] })
  subGroupingIds: string[];
}

export class PlatformObjectMapDetailDto extends PlatformObjectMapSummaryDto {
  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CreatePlatformObjectMapDto {
  @ApiProperty()
  @IsUUID()
  platformAccountId: string;

  @ApiProperty({ enum: PlatformObjectType })
  @IsEnum(PlatformObjectType)
  objectType: PlatformObjectType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  externalId: string;

  @ApiProperty()
  @IsUUID()
  campaignId: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  externalName?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  channelId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  buyingTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  formatId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  subFormatId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  subGroupingIds?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class BulkCreatePlatformObjectMapItemDto {
  @ApiProperty()
  @IsUUID()
  platformAccountId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  externalId: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  externalName?: string | null;
}

export class BulkCreatePlatformObjectMapsDto {
  @ApiProperty({ enum: PlatformObjectType })
  @IsEnum(PlatformObjectType)
  objectType: PlatformObjectType;

  @ApiProperty()
  @IsUUID()
  campaignId: string;

  @ApiProperty({ type: [BulkCreatePlatformObjectMapItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkCreatePlatformObjectMapItemDto)
  items: BulkCreatePlatformObjectMapItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  channelId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  buyingTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  formatId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  subFormatId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  subGroupingIds?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePlatformObjectMapDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  externalName?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  campaignId?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  channelId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  buyingTypeId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  formatId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  subFormatId?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  subGroupingIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePlatformObjectMapItemDto extends UpdatePlatformObjectMapDto {
  @ApiProperty()
  @IsUUID()
  id: string;
}

export class BulkUpdatePlatformObjectMapsDto {
  @ApiProperty({ type: [UpdatePlatformObjectMapItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePlatformObjectMapItemDto)
  platformObjectMaps: UpdatePlatformObjectMapItemDto[];
}

export class PlatformObjectMapQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  platformAccountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  platformId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  campaignId?: string;

  @ApiPropertyOptional({ enum: PlatformObjectType })
  @IsOptional()
  @IsEnum(PlatformObjectType)
  objectType?: PlatformObjectType;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}

export class BulkDeletePlatformObjectMapsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  ids: string[];
}
