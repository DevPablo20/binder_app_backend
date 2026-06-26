import 'reflect-metadata';
import { logSeed, withDataSource } from './seed-helpers';
import { seedAccess } from './access.seed';
import { seedBusiness } from './business.seed';
import { seedMedia } from './media.seed';

type SeedLayer = 'access' | 'business' | 'media';

const LAYER_ORDER: SeedLayer[] = ['access', 'business', 'media'];

const LAYER_RUNNERS: Record<SeedLayer, (ds: import('typeorm').DataSource) => Promise<void>> = {
  access: seedAccess,
  business: seedBusiness,
  media: seedMedia,
};

function printUsage(): void {
  console.log(`
Usage: node dist/system/database/seeds/run.js [options]

Options:
  --access    Run access layer seed only
  --business  Run business layer seed only
  --media     Run media layer seed only
  --all       Run all layer seeds (default when no flag is provided)

Examples:
  npm run seed:run
  npm run seed:access
  npm run seed:business
  npm run seed:media
  npm run seed:run -- --access --media
`);
}

function parseLayers(argv: string[]): SeedLayer[] {
  const flags = argv.filter((arg) => arg.startsWith('--'));

  if (flags.length === 0 || flags.includes('--all')) {
    return [...LAYER_ORDER];
  }

  const layers: SeedLayer[] = [];

  for (const flag of flags) {
    switch (flag) {
      case '--access':
        layers.push('access');
        break;
      case '--business':
        layers.push('business');
        break;
      case '--media':
        layers.push('media');
        break;
      default:
        console.error(`[seed] Flag desconhecida: ${flag}`);
        printUsage();
        process.exit(1);
    }
  }

  return LAYER_ORDER.filter((layer) => layers.includes(layer));
}

async function run(): Promise<void> {
  const layers = parseLayers(process.argv.slice(2));

  if (layers.length === 0) {
    printUsage();
    process.exit(1);
  }

  logSeed(`Executando camadas: ${layers.join(', ')}`);

  await withDataSource(async (dataSource) => {
    for (const layer of layers) {
      await LAYER_RUNNERS[layer](dataSource);
    }
  });
}

run();
