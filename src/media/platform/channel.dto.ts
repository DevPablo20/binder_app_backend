import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class ChannelSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  platformId: string;
}

export class ChannelDetailDto extends ChannelSummaryDto {
  @ApiProperty()
  description: string;

  @ApiProperty({ type: [String] })
  buyingTypeIds: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CreateChannelItemDto {
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

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  buyingTypeIds?: string[];
}

export class CreateChannelsDto {
  @ApiProperty()
  @IsUUID()
  platformId: string;

  @ApiProperty({ type: [CreateChannelItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Informe ao menos um canal' })
  @ValidateNested({ each: true })
  @Type(() => CreateChannelItemDto)
  channels: CreateChannelItemDto[];
}

export class UpdateChannelDto {
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

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  buyingTypeIds?: string[];
}

export class UpdateChannelItemDto extends UpdateChannelDto {
  @ApiProperty()
  @IsUUID()
  id: string;
}

export class BulkUpdateChannelsDto {
  @ApiProperty({ type: [UpdateChannelItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateChannelItemDto)
  channels: UpdateChannelItemDto[];
}
