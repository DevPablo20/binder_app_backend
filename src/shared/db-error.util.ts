import { HttpException, HttpStatus } from '@nestjs/common';

const UNIQUE_VIOLATION = '23505';
const FOREIGN_KEY_VIOLATION = '23503';

interface DriverError {
  code?: string;
  detail?: string;
}

/**
 * Traduz recusa do Postgres em erro de negócio.
 *
 * No Bridge as regras de escopo são FK composta e índice único: quem recusa é o banco, não o
 * serviço. Esta tradução é o que transforma a recusa em algo que o operador entende na tela —
 * sem ela, a constraint vira 500 e a regra fica invisível.
 *
 * A chave do mapa são as **colunas** da constraint, lidas do `detail` do Postgres
 * (`Key (channel_id, buying_type_id)=(…) is not present in table "channel_buying_type".`), e não
 * o nome da constraint: o TypeORM gera nomes com hash, que mudam a cada mexida na entidade.
 */
export function asConstraintViolation(
  error: unknown,
  messages: Record<string, string>,
): unknown {
  const driver = extractDriverError(error);

  if (
    driver?.code !== UNIQUE_VIOLATION &&
    driver?.code !== FOREIGN_KEY_VIOLATION
  ) {
    return error;
  }

  const columns = readKeyColumns(driver.detail);
  const message = columns ? messages[columns] : undefined;

  return message ? new HttpException(message, HttpStatus.CONFLICT) : error;
}

function extractDriverError(error: unknown): DriverError | undefined {
  if (typeof error !== 'object' || error === null) return undefined;

  const candidate = error as { driverError?: DriverError } & DriverError;
  return candidate.driverError ?? candidate;
}

/** `Key (a, b)=(…) …` → `a,b`. */
function readKeyColumns(detail?: string): string | null {
  const match = detail?.match(/Key \(([^)]+)\)=/);
  if (!match) return null;

  return match[1]
    .split(',')
    .map((column) => column.trim().replace(/^"|"$/g, ''))
    .join(',');
}
