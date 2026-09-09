import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export enum AnalyticsGroupBy {
  Company = 'company',
  Client = 'client',
  Campaign = 'campaign',
  Platform = 'platform',
  Channel = 'channel',
  BuyingType = 'buying_type',
  SubGrouping = 'sub_grouping',
  Date = 'date',
}

export class AnalyticsMetricsQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  campaignId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  platformId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  channelId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  buyingTypeId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  subGroupingId?: string;

  @ApiPropertyOptional({
    description: 'Inclusive start date (YYYY-MM-DD). Default: 29 days ago.',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string;

  @ApiPropertyOptional({
    description: 'Inclusive end date (YYYY-MM-DD). Default: today.',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string;

  @ApiPropertyOptional({
    enum: AnalyticsGroupBy,
    description:
      'Breakdown dimension. If omitted, auto-selects the next level after the deepest filter.',
  })
  @IsOptional()
  @IsEnum(AnalyticsGroupBy)
  @Type(() => String)
  groupBy?: AnalyticsGroupBy;
}

export class MetricBlockDto {
  @ApiPropertyOptional()
  key?: string;

  @ApiPropertyOptional()
  label?: string;

  @ApiPropertyOptional({ description: 'Present on series points' })
  date?: string;

  @ApiProperty()
  impressions: number;

  @ApiProperty({ description: 'Sum of spend' })
  cost: number;

  @ApiProperty()
  clicks: number;

  @ApiProperty()
  videoViews: number;

  @ApiProperty()
  videoViews100p: number;

  @ApiProperty()
  engagement: number;

  @ApiPropertyOptional({ nullable: true })
  cpm: number | null;

  @ApiPropertyOptional({ nullable: true })
  cpc: number | null;

  @ApiPropertyOptional({ nullable: true })
  cpvc: number | null;

  @ApiPropertyOptional({ nullable: true })
  cpe: number | null;

  @ApiPropertyOptional({ nullable: true })
  ctr: number | null;

  @ApiPropertyOptional({ nullable: true })
  vtr: number | null;

  @ApiPropertyOptional({ nullable: true })
  vtrc: number | null;

  @ApiPropertyOptional({ nullable: true })
  er: number | null;
}

export class AnalyticsMetricsResponseDto {
  @ApiProperty({ enum: AnalyticsGroupBy })
  groupBy: AnalyticsGroupBy;

  @ApiProperty()
  from: string;

  @ApiProperty()
  to: string;

  @ApiProperty({ type: MetricBlockDto })
  totals: MetricBlockDto;

  @ApiProperty({ type: [MetricBlockDto] })
  series: MetricBlockDto[];

  @ApiProperty({ type: [MetricBlockDto] })
  breakdown: MetricBlockDto[];
}

export class AnalyticsChatMessageDto {
  @ApiProperty({ enum: ['user', 'model'] })
  @IsIn(['user', 'model'])
  role: 'user' | 'model';

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  content: string;
}

export class AnalyticsChatRequestDto {
  @ApiProperty({ description: 'Pergunta do usuário sobre métricas/insights' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  message: string;

  @ApiPropertyOptional({ type: [AnalyticsChatMessageDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => AnalyticsChatMessageDto)
  history?: AnalyticsChatMessageDto[];

  @ApiPropertyOptional({
    type: AnalyticsMetricsQueryDto,
    description: 'Filtros atuais do dashboard usados como contexto padrão',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AnalyticsMetricsQueryDto)
  context?: AnalyticsMetricsQueryDto;
}

export class AnalyticsChatResponseDto {
  @ApiProperty()
  reply: string;
}
