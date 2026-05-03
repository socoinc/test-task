import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClickHouseClient, createClient } from '@clickhouse/client';

type JsonRow = Record<string, unknown>;

@Injectable()
export class ClickHouseService implements OnModuleInit {
  private readonly logger = new Logger(ClickHouseService.name);
  private readonly client: ClickHouseClient;
  private tablesEnsured = false;
  private ensureTablesPromise: Promise<void> | null = null;

  constructor(private readonly configService: ConfigService) {
    this.client = createClient({
      url: this.configService.getOrThrow<string>('CLICKHOUSE_URL'),
      username: this.configService.getOrThrow<string>('CLICKHOUSE_USERNAME'),
      password: this.configService.getOrThrow<string>('CLICKHOUSE_PASSWORD'),
      database: this.configService.getOrThrow<string>('CLICKHOUSE_DATABASE'),
    });
  }

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    try {
      await this.ensureTables();
    } catch (error) {
      this.logger.warn(
        `ClickHouse tables initialization failed: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  async ping(): Promise<'OK' | 'UNAVAILABLE'> {
    try {
      const result = await this.client.ping();
      return result.success ? 'OK' : 'UNAVAILABLE';
    } catch (error) {
      this.logger.warn(
        `ClickHouse ping failed: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
      return 'UNAVAILABLE';
    }
  }

  async insertRows(table: string, rows: JsonRow[]): Promise<void> {
    if (rows.length === 0) {
      return;
    }

    await this.ensureTables();
    await this.client.insert({
      table,
      values: rows,
      format: 'JSONEachRow',
    });
  }

  async query<T>(
    query: string,
    params?: Record<string, unknown>,
  ): Promise<T[]> {
    await this.ensureTables();

    const resultSet = await this.client.query({
      query,
      format: 'JSONEachRow',
      query_params: params,
    });

    return resultSet.json<T>();
  }

  private async ensureTables(): Promise<void> {
    if (this.tablesEnsured) {
      return;
    }

    if (!this.ensureTablesPromise) {
      this.ensureTablesPromise = this.createTables().finally(() => {
        this.ensureTablesPromise = null;
      });
    }

    await this.ensureTablesPromise;
    this.tablesEnsured = true;
  }

  private async createTables(): Promise<void> {
    await this.client.command({
      query: `
        CREATE TABLE IF NOT EXISTS users
        (
          user_id String,
          email String,
          name String,
          phone String,
          is_active Bool,
          created_at DateTime,
          updated_at DateTime,
          version UInt64
        )
        ENGINE = ReplacingMergeTree(version)
        ORDER BY user_id
      `,
    });

    await this.client.command({
      query: `
        CREATE TABLE IF NOT EXISTS promocodes
        (
          promocode_id String,
          code String,
          description String,
          discount_percent UInt16,
          total_usage_limit UInt32,
          per_user_usage_limit UInt32,
          used_count UInt32,
          is_active Bool,
          starts_at Nullable(DateTime),
          expires_at Nullable(DateTime),
          created_by String,
          created_at DateTime,
          updated_at DateTime,
          version UInt64
        )
        ENGINE = ReplacingMergeTree(version)
        ORDER BY (code, promocode_id)
      `,
    });

    await this.client.command({
      query: `
        CREATE TABLE IF NOT EXISTS orders
        (
          order_id String,
          user_id String,
          user_email String,
          user_name String,
          amount Float64,
          discount_amount Float64,
          final_amount Float64,
          promocode_id Nullable(String),
          promocode_code Nullable(String),
          created_at DateTime,
          updated_at DateTime,
          version UInt64
        )
        ENGINE = ReplacingMergeTree(version)
        ORDER BY (user_id, created_at, order_id)
      `,
    });

    await this.client.command({
      query: `
        CREATE TABLE IF NOT EXISTS promo_usages
        (
          usage_id String,
          promocode_id String,
          promocode_code String,
          user_id String,
          user_email String,
          user_name String,
          order_id String,
          order_amount Float64,
          discount_amount Float64,
          applied_at DateTime
        )
        ENGINE = MergeTree
        ORDER BY (promocode_code, applied_at, user_id)
      `,
    });
  }
}
