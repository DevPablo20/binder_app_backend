import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, FindOptionsWhere, In, Repository } from 'typeorm';
import { PlatformAccount } from 'src/bridge/platform-account/platform-account.entity';
import { PlatformAdGroupClassification } from 'src/bridge/ad-group-classification/platform-ad-group-classification.entity';
import { UserSignature } from 'src/access/auth/userSignature.type';
import { Role } from 'src/shared/role.enum';
import { asConstraintViolation } from 'src/shared/db-error.util';
import { PlatformCampaignBinding } from './platform-campaign-binding.entity';
import {
  CampaignBindingDto,
  CampaignBindingItemDto,
  CampaignBindingQueryDto,
  DeleteCampaignBindingsDto,
  UpsertCampaignBindingsDto,
  UpsertCampaignBindingsResultDto,
} from './campaign-binding.dto';

/** As cinco regras de escopo, na voz de quem opera a tela. */
const CONSTRAINT_MESSAGES: Record<string, string> = {
  'platform_account_id,external_campaign_id':
    'Campanha já vinculada nesta conta',
  'platform_id,external_campaign_id':
    'Campanha já vinculada em outra conta desta plataforma',
  'campaign_id,client_id':
    'Regra 1 — a campanha de negócio não pertence ao cliente da conta',
  'channel_id,platform_id':
    'Regra 2 — o channel não pertence à plataforma da conta',
  'channel_id,buying_type_id':
    'Regra 3 — o buying type não é válido para este channel',
  'platform_account_id,client_id,platform_id':
    'Cliente ou plataforma divergem da conta',
};

@Injectable()
export class CampaignBindingService {
  constructor(
    @InjectRepository(PlatformCampaignBinding)
    private readonly bindingRepository: Repository<PlatformCampaignBinding>,
    @InjectRepository(PlatformAccount)
    private readonly platformAccountRepository: Repository<PlatformAccount>,
  ) {}

  async findAll(query: CampaignBindingQueryDto): Promise<CampaignBindingDto[]> {
    const where: FindOptionsWhere<PlatformCampaignBinding> = {};
    if (query.platformAccountId)
      where.platformAccountId = query.platformAccountId;
    if (query.platformId) where.platformId = query.platformId;
    if (query.clientId) where.clientId = query.clientId;
    if (query.campaignId) where.campaignId = query.campaignId;

    const bindings = await this.bindingRepository.find({
      where,
      relations: this.detailRelations,
      order: { externalCampaignId: 'ASC' },
    });

    return bindings.map((binding) => this.toDto(binding));
  }

  /**
   * Upsert pela chave natural `(platformAccountId, externalCampaignId)`.
   *
   * É a operação que a tela de Vinculação faz: "nesta conta, estas campanhas passam a ser esta
   * campanha de negócio, com este channel e este buying type". Resalvar a mesma seleção não pode
   * falhar — a tela mostra o estado atual, e salvar é declarar o estado desejado.
   */
  async upsert(
    dto: UpsertCampaignBindingsDto,
    caller: UserSignature,
  ): Promise<UpsertCampaignBindingsResultDto> {
    this.assertSuperadmin(caller.role, 'vincular campanhas');

    this.assertNoRepeatedKey(dto.items);

    const accountsById = await this.loadAccounts(dto.items);
    const existingByKey = await this.loadExisting(dto.items);

    const toSave: PlatformCampaignBinding[] = [];
    const campaignChanged: PlatformCampaignBinding[] = [];
    let created = 0;
    let updated = 0;

    for (const item of dto.items) {
      const account = accountsById.get(item.platformAccountId)!;
      const current = existingByKey.get(
        this.naturalKey(item.platformAccountId, item.externalCampaignId),
      );

      if (!current) {
        toSave.push(
          this.bindingRepository.create({
            platformAccountId: item.platformAccountId,
            externalCampaignId: item.externalCampaignId,
            campaignId: item.campaignId,
            channelId: item.channelId,
            buyingTypeId: item.buyingTypeId,
            // cópias de escopo: vêm da conta, nunca do payload
            clientId: account.clientId,
            platformId: account.platformId,
          }),
        );
        created += 1;
        continue;
      }

      const changed =
        current.campaignId !== item.campaignId ||
        current.channelId !== item.channelId ||
        current.buyingTypeId !== item.buyingTypeId;

      if (current.campaignId !== item.campaignId) {
        campaignChanged.push(current);
      }

      current.campaignId = item.campaignId;
      current.channelId = item.channelId;
      current.buyingTypeId = item.buyingTypeId;
      current.clientId = account.clientId;
      current.platformId = account.platformId;

      if (changed) {
        updated += 1;
        toSave.push(current);
      }
    }

    let adGroupClassificationsRemoved = 0;
    let savedIds: string[] = [];

    try {
      const result = await this.bindingRepository.manager.transaction(
        async (manager) => {
          const removed = await this.removeAdGroupClassifications(
            manager,
            campaignChanged,
          );
          const saved = await manager.save(PlatformCampaignBinding, toSave);
          return { removed, ids: saved.map((binding) => binding.id) };
        },
      );
      adGroupClassificationsRemoved = result.removed;
      savedIds = result.ids;
    } catch (error) {
      throw asConstraintViolation(error, CONSTRAINT_MESSAGES);
    }

    // a resposta devolve o estado de todos os itens do envio, inclusive os que não mudaram
    const ids = [
      ...new Set([
        ...savedIds,
        ...[...existingByKey.values()].map((binding) => binding.id),
      ]),
    ];

    return {
      created,
      updated,
      adGroupClassificationsRemoved,
      bindings: await this.findByIds(ids),
    };
  }

  async deleteMany(
    dto: DeleteCampaignBindingsDto,
    caller: UserSignature,
  ): Promise<void> {
    this.assertSuperadmin(caller.role, 'remover vínculos de campanha');

    const uniqueIds = [...new Set(dto.ids)];
    const bindings = await this.bindingRepository.find({
      where: { id: In(uniqueIds) },
    });

    if (bindings.length !== uniqueIds.length) {
      throw new HttpException(
        'Vínculo de campanha não encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.bindingRepository.remove(bindings);
  }

  /**
   * Trocar a campanha de negócio apaga as classificações de ad_group do binding, na mesma
   * transação e antes do update: os eixos eram da campanha antiga, e a FK da regra 5 barraria a
   * operação. Os ad_groups voltam para a fila de pendências, que é o sinal certo para quem opera.
   */
  private async removeAdGroupClassifications(
    manager: EntityManager,
    bindings: PlatformCampaignBinding[],
  ): Promise<number> {
    if (bindings.length === 0) return 0;

    const conditions: string[] = [];
    const parameters: Record<string, string> = {};

    bindings.forEach((binding, index) => {
      conditions.push(
        `(platform_account_id = :account${index} AND external_campaign_id = :campaign${index})`,
      );
      parameters[`account${index}`] = binding.platformAccountId;
      parameters[`campaign${index}`] = binding.externalCampaignId;
    });

    const { affected } = await manager
      .createQueryBuilder()
      .delete()
      .from(PlatformAdGroupClassification)
      .where(conditions.join(' OR '), parameters)
      .execute();

    return affected ?? 0;
  }

  private async loadAccounts(
    items: CampaignBindingItemDto[],
  ): Promise<Map<string, PlatformAccount>> {
    const ids = [...new Set(items.map((item) => item.platformAccountId))];
    const accounts = await this.platformAccountRepository.find({
      where: { id: In(ids) },
    });

    if (accounts.length !== ids.length) {
      throw new HttpException(
        'Conta de plataforma não encontrada',
        HttpStatus.NOT_FOUND,
      );
    }

    return new Map(accounts.map((account) => [account.id, account]));
  }

  private async loadExisting(
    items: CampaignBindingItemDto[],
  ): Promise<Map<string, PlatformCampaignBinding>> {
    const accountIds = [
      ...new Set(items.map((item) => item.platformAccountId)),
    ];
    const externalIds = [
      ...new Set(items.map((item) => item.externalCampaignId)),
    ];

    const candidates = await this.bindingRepository.find({
      where: {
        platformAccountId: In(accountIds),
        externalCampaignId: In(externalIds),
      },
    });

    const wanted = new Set(
      items.map((item) =>
        this.naturalKey(item.platformAccountId, item.externalCampaignId),
      ),
    );

    return new Map(
      candidates
        .map(
          (binding) =>
            [
              this.naturalKey(
                binding.platformAccountId,
                binding.externalCampaignId,
              ),
              binding,
            ] as const,
        )
        .filter(([key]) => wanted.has(key)),
    );
  }

  private async findByIds(ids: string[]): Promise<CampaignBindingDto[]> {
    if (ids.length === 0) return [];

    const bindings = await this.bindingRepository.find({
      where: { id: In(ids) },
      relations: this.detailRelations,
      order: { externalCampaignId: 'ASC' },
    });

    return bindings.map((binding) => this.toDto(binding));
  }

  private assertNoRepeatedKey(items: CampaignBindingItemDto[]): void {
    const seen = new Set<string>();

    for (const item of items) {
      const key = this.naturalKey(
        item.platformAccountId,
        item.externalCampaignId,
      );
      if (seen.has(key)) {
        throw new HttpException(
          `Campanha ${item.externalCampaignId} repetida no mesmo envio`,
          HttpStatus.BAD_REQUEST,
        );
      }
      seen.add(key);
    }
  }

  private naturalKey(platformAccountId: string, externalCampaignId: string) {
    return `${platformAccountId}:${externalCampaignId}`;
  }

  private get detailRelations() {
    return {
      platformAccount: { client: true, platform: true },
      campaign: true,
      channel: true,
      channelBuyingType: { buyingType: true },
    };
  }

  private assertSuperadmin(userRole: Role, action: string): void {
    if (userRole !== Role.Superadmin) {
      throw new HttpException(
        `Permissão insuficiente para ${action}`,
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private toDto(binding: PlatformCampaignBinding): CampaignBindingDto {
    return {
      id: binding.id,
      platformAccountId: binding.platformAccountId,
      accountName: binding.platformAccount.name,
      externalAccountId: binding.platformAccount.externalAccountId,
      externalCampaignId: binding.externalCampaignId,
      clientId: binding.clientId,
      clientName: binding.platformAccount.client.name,
      platformId: binding.platformId,
      platformName: binding.platformAccount.platform.name,
      campaignId: binding.campaignId,
      campaignName: binding.campaign.name,
      channelId: binding.channelId,
      channelName: binding.channel.name,
      buyingTypeId: binding.buyingTypeId,
      buyingTypeName: binding.channelBuyingType.buyingType.name,
      createdAt: binding.createdAt,
      updatedAt: binding.updatedAt,
    };
  }
}
