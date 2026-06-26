export const SEED_COMPANY_NAME = 'Binder-DF';
export const SEED_COMPANY_DESCRIPTION = 'Unidade Binder Brasília-DF';

export const SEED_CLIENT_NAME = 'Caixa';
export const SEED_CLIENT_DESCRIPTION = 'Caixa Econômica Federal';

export const SEED_CAMPAIGN_NAME = 'Always ON 2026';
export const SEED_CAMPAIGN_DESCRIPTION =
  'Campanha Anual da Caixa Economica Federal para exercício de 2026';

export const SEED_BUYING_TYPES = [
  { name: 'CPM', description: 'Cost per thousand impressions' },
  { name: 'CPV', description: 'Cost per view' },
  { name: 'CPC', description: 'Cost per click' },
  { name: 'CPA', description: 'Cost per acquisition' },
  { name: 'CPE', description: 'Cost per engagement' },
] as const;

export const SEED_PLATFORM_NAME = 'TikTok';
export const SEED_PLATFORM_DESCRIPTION =
  'TikTok Ads — short-form video advertising for awareness, engagement, and performance';

export const SEED_CHANNELS = [
  {
    name: 'TikTok Ads',
    description: 'In-feed and display ads on TikTok',
    buyingTypeNames: ['CPC', 'CPV', 'CPM'] as const,
  },
  {
    name: 'TikTok Search',
    description: 'Ads in TikTok search results',
    buyingTypeNames: ['CPC'] as const,
  },
] as const;

export const SEED_FORMATS = [
  {
    name: 'Video',
    description: 'Video creative format',
    subFormats: [
      { name: 'Motion', description: 'Animated video creative' },
      { name: 'Externa', description: 'External video placement' },
      { name: 'GIF', description: 'Short looping video creative' },
    ],
  },
  {
    name: 'Static',
    description: 'Static image creative format',
    subFormats: [
      { name: 'Card', description: 'Single-card static creative' },
      { name: 'Carrossel', description: 'Multi-card swipeable static creative' },
    ],
  },
] as const;

export const SEED_GROUPINGS = [
  {
    name: 'Territory',
    description: 'Territorial business dimension',
    subGroupings: [
      { name: 'Crédito', description: 'Crédito' },
      { name: 'Ações PJ', description: 'Ações PJ' },
      {
        name: 'Oportunidades e Clientes',
        description: 'Oportunidades e Clientes',
      },
      { name: 'Institucional', description: 'Institucional' },
      { name: 'Canais', description: 'Canais' },
      { name: 'Captação', description: 'Captação' },
    ],
  },
  {
    name: 'Persona',
    description: 'Customer persona dimension',
    subGroupings: [
      { name: 'Cliente Azul', description: 'Cliente Azul' },
      { name: 'Cliente Especial', description: 'Cliente Especial' },
      { name: 'Cliente Singular', description: 'Cliente Singular' },
      { name: 'Cliente Geral', description: 'Cliente Geral' },
    ],
  },
] as const;
