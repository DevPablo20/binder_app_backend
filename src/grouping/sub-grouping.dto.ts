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

export class SubGroupingSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  groupingId: string;
}

export class SubGroupingDetailDto extends SubGroupingSummaryDto {
  @ApiProperty()
  description: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CreateSubGroupingItemDto {
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

export class CreateSubGroupingsDto {
  @ApiProperty()
  @IsUUID()
  groupingId: string;

  @ApiProperty({ type: [CreateSubGroupingItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Informe ao menos um sub-agrupamento' })
  @ValidateNested({ each: true })
  @Type(() => CreateSubGroupingItemDto)
  subGroupings: CreateSubGroupingItemDto[];
}

export class UpdateSubGroupingDto {
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

export class UpdateSubGroupingItemDto extends UpdateSubGroupingDto {
  @ApiProperty()
  @IsUUID()
  id: string;
}

export class BulkUpdateSubGroupingsDto {
  @ApiProperty({ type: [UpdateSubGroupingItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSubGroupingItemDto)
  subGroupings: UpdateSubGroupingItemDto[];
}
