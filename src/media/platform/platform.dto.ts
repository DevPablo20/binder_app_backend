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

export class PlatformSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({
    description: 'ETL lake catalog slug (e.g. tiktok, google, meta)',
    nullable: true,
  })
  catalogKey?: string | null;

  @ApiProperty()
  isActive: boolean;
}

export class PlatformDetailDto extends PlatformSummaryDto {
  @ApiProperty()
  description: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CreatePlatformDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    description: 'ETL lake catalog slug (e.g. tiktok, google, meta)',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  catalogKey?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePlatformDto {
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

  @ApiPropertyOptional({
    description: 'ETL lake catalog slug (e.g. tiktok, google, meta)',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  catalogKey?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePlatformItemDto extends UpdatePlatformDto {
  @ApiProperty()
  @IsUUID()
  id: string;
}

export class BulkUpdatePlatformsDto {
  @ApiProperty({ type: [UpdatePlatformItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePlatformItemDto)
  platforms: UpdatePlatformItemDto[];
}
