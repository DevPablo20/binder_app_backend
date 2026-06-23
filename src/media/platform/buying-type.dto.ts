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

export class BuyingTypeSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  isActive: boolean;
}

export class BuyingTypeDetailDto extends BuyingTypeSummaryDto {
  @ApiProperty()
  description: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CreateBuyingTypeItemDto {
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

export class CreateBuyingTypesDto {
  @ApiProperty({ type: [CreateBuyingTypeItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Informe ao menos um tipo de compra' })
  @ValidateNested({ each: true })
  @Type(() => CreateBuyingTypeItemDto)
  buyingTypes: CreateBuyingTypeItemDto[];
}

export class UpdateBuyingTypeDto {
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

export class UpdateBuyingTypeItemDto extends UpdateBuyingTypeDto {
  @ApiProperty()
  @IsUUID()
  id: string;
}

export class BulkUpdateBuyingTypesDto {
  @ApiProperty({ type: [UpdateBuyingTypeItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateBuyingTypeItemDto)
  buyingTypes: UpdateBuyingTypeItemDto[];
}
