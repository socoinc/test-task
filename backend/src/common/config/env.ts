const requiredString = (value: string | undefined, key: string): string => {
  if (!value || value.trim().length === 0) {
    throw new Error(`Environment variable ${key} is required`);
  }

  return value;
};

const optionalString = (value: string | undefined, fallback: string): string =>
  value?.trim() || fallback;

const numberAsString = (
  value: string | undefined,
  fallback: number,
  key: string,
): string => {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return String(fallback);
  }

  const parsedValue = Number(normalizedValue);

  if (!Number.isFinite(parsedValue)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }

  return String(parsedValue);
};

export const validateEnv = (
  config: Record<string, string | undefined>,
): Record<string, string> => ({
  PORT: numberAsString(config.PORT, 3001, 'PORT'),
  MONGO_URI: requiredString(config.MONGO_URI, 'MONGO_URI'),
  JWT_SECRET: requiredString(config.JWT_SECRET, 'JWT_SECRET'),
  JWT_EXPIRES_IN: optionalString(config.JWT_EXPIRES_IN, '1d'),
  REDIS_HOST: optionalString(config.REDIS_HOST, 'localhost'),
  REDIS_PORT: numberAsString(config.REDIS_PORT, 6379, 'REDIS_PORT'),
  CLICKHOUSE_URL: requiredString(config.CLICKHOUSE_URL, 'CLICKHOUSE_URL'),
  CLICKHOUSE_USERNAME: requiredString(
    config.CLICKHOUSE_USERNAME,
    'CLICKHOUSE_USERNAME',
  ),
  CLICKHOUSE_PASSWORD: requiredString(
    config.CLICKHOUSE_PASSWORD,
    'CLICKHOUSE_PASSWORD',
  ),
  CLICKHOUSE_DATABASE: requiredString(
    config.CLICKHOUSE_DATABASE,
    'CLICKHOUSE_DATABASE',
  ),
});
