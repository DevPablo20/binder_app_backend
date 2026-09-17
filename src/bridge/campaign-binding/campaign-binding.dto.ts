import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/**
 * Um item do upsert.
 *
 * `clientId` e `platformId` não aparecem aqui de propósito: são cópia de escopo, lidas da conta
 * pelo serviço. Se o operador pudesse digitá-las, a cópia deixaria de ser cópia.
 */
export class CampaignBindingItemDto {
  @ApiProperty()
  @IsUUID()
  platformAccountId: string;

  @ApiProperty({ description: 'ID nativo da campanha na plataforma' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  externalCampaignId: string;

  @ApiProperty({ description: 'Campanha de negócio' })
  @IsUUID()
  campaignId: string;

  @ApiProperty()
  @IsUUID()
  channelId: string;

  @ApiProperty()
  @IsUUID()
  buyingTypeId: string;
}

export class UpsertCampaignBindingsDto {
  @ApiProperty({ type: [CampaignBindingItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CampaignBindingItemDto)
  items: CampaignBindingItemDto[];
}

export class CampaignBindingDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  platformAccountId: string;

  @ApiProperty()
  accountName: string;

  @ApiProperty()
  externalAccountId: string;

  @ApiProperty()
  externalCampaignId: string;

  @ApiProperty()
  clientId: string;

  @ApiProperty()
  clientName: string;

  @ApiProperty()
  platformId: string;

  @ApiProperty()
  platformName: string;

  @ApiProperty()
  campaignId: string;

  @ApiProperty()
  campaignName: string;

  @ApiProperty()
  channelId: string;

  @ApiProperty()
  channelName: string;

  @ApiProperty()
  buyingTypeId: string;

  @ApiProperty()
  buyingTypeName: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class UpsertCampaignBindingsResultDto {
  @ApiProperty()
  created: number;

  @ApiProperty()
  updated: number;

  @ApiProperty({
    description:
      'Classificações de ad_group apagadas por troca de campanha de negócio — trabalho de ' +
      'operador destruído, que a tela precisa avisar',
  })
  adGroupClassificationsRemoved: number;

  @ApiProperty({ type: [CampaignBindingDto] })
  bindings: CampaignBindingDto[];
}

export class CampaignBindingQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  platformId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  platformAccountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  campaignId?: string;
}

export class DeleteCampaignBindingsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  ids: string[];
}
