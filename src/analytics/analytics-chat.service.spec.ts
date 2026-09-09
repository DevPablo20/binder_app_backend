import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AnalyticsChatService } from './analytics-chat.service';
import { AnalyticsService } from './analytics.service';
import { Role } from 'src/shared/role.enum';
import type { UserSignature } from 'src/access/auth/userSignature.type';

describe('AnalyticsChatService', () => {
  const allowedCompany = '11111111-1111-1111-1111-111111111111';
  const otherCompany = '22222222-2222-2222-2222-222222222222';

  const editor: UserSignature = {
    id: 'user-1',
    name: 'Editor',
    role: Role.Editor,
    companyIds: [allowedCompany],
  };

  let analyticsService: { getMetrics: jest.Mock };
  let config: { get: jest.Mock };
  let service: AnalyticsChatService;

  beforeEach(() => {
    analyticsService = {
      getMetrics: jest.fn(),
    };
    config = {
      get: jest.fn((key: string) => {
        if (key === 'GEMINI_API_KEY') return 'test-key';
        if (key === 'GEMINI_MODEL') return 'gemini-3.1-flash-lite';
        return undefined;
      }),
    };
    service = new AnalyticsChatService(
      analyticsService as unknown as AnalyticsService,
      config as unknown as ConfigService,
    );
  });

  it('returns 503 when GEMINI_API_KEY is missing', async () => {
    config.get.mockImplementation(() => undefined);
    await expect(
      service.chat({ message: 'Quanto investimos?' }, editor),
    ).rejects.toMatchObject({
      status: 503,
    });
  });

  it('passes ACL denial from getMetrics back through the tool path', async () => {
    const executeTool = (
      service as unknown as {
        executeTool: (
          call: { name: string; id?: string; args?: Record<string, unknown> },
          context: Record<string, unknown>,
          caller: UserSignature,
        ) => Promise<{ functionResponse?: { response?: { error?: string } } }>;
      }
    ).executeTool.bind(service);

    analyticsService.getMetrics.mockRejectedValue(
      new ForbiddenException('Sem acesso a esta empresa'),
    );

    const part = await executeTool(
      {
        name: 'get_metrics',
        id: 'call-1',
        args: { companyId: otherCompany },
      },
      { companyId: allowedCompany },
      editor,
    );

    expect(analyticsService.getMetrics).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: otherCompany }),
      editor,
    );
    expect(part.functionResponse?.response?.error).toContain(
      'Sem acesso a esta empresa',
    );
  });

  it('merges dashboard context defaults into get_metrics args', async () => {
    const executeTool = (
      service as unknown as {
        executeTool: (
          call: { name: string; id?: string; args?: Record<string, unknown> },
          context: Record<string, unknown>,
          caller: UserSignature,
        ) => Promise<unknown>;
      }
    ).executeTool.bind(service);

    analyticsService.getMetrics.mockResolvedValue({
      groupBy: 'platform',
      from: '2026-06-01',
      to: '2026-07-29',
      totals: {
        impressions: 1000,
        cost: 50,
        clicks: 20,
        videoViews: 0,
        videoViews100p: 0,
        engagement: 0,
        cpm: 50,
        cpc: 2.5,
        cpvc: null,
        cpe: null,
        ctr: 0.02,
        vtr: null,
        vtrc: null,
        er: null,
      },
      series: [],
      breakdown: [],
    });

    await executeTool(
      { name: 'get_metrics', id: 'call-2', args: { groupBy: 'platform' } },
      {
        companyId: allowedCompany,
        from: '2026-06-01',
        to: '2026-07-29',
      },
      editor,
    );

    expect(analyticsService.getMetrics).toHaveBeenCalledWith(
      {
        companyId: allowedCompany,
        clientId: undefined,
        campaignId: undefined,
        platformId: undefined,
        channelId: undefined,
        buyingTypeId: undefined,
        subGroupingId: undefined,
        from: '2026-06-01',
        to: '2026-07-29',
        groupBy: 'platform',
      },
      editor,
    );
  });
});
