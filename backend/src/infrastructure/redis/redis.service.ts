import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisClientType, createClient } from 'redis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: RedisClientType;
  private connectionPromise: Promise<void> | null = null;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.getOrThrow<string>('REDIS_HOST');
    const port = this.configService.getOrThrow<string>('REDIS_PORT');

    this.client = createClient({
      socket: {
        host,
        port: Number(port),
      },
    });

    this.client.on('error', (error) => {
      if (error instanceof Error) {
        this.logger.error(`Redis error: ${error.message}`, error.stack);
        return;
      }

      this.logger.error(`Redis error: ${String(error)}`);
    });
  }

  async ping(): Promise<'PONG' | 'UNAVAILABLE'> {
    try {
      await this.ensureConnected();
      const response = await this.client.ping();
      return response === 'PONG' ? 'PONG' : 'UNAVAILABLE';
    } catch (error) {
      this.logger.warn(
        `Redis ping failed: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
      return 'UNAVAILABLE';
    }
  }

  async get(key: string): Promise<string | null> {
    await this.ensureConnected();
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    await this.ensureConnected();

    if (ttlSeconds) {
      await this.client.set(key, value, {
        EX: ttlSeconds,
      });
      return;
    }

    await this.client.set(key, value);
  }

  async delete(key: string): Promise<void> {
    await this.ensureConnected();
    await this.client.del(key);
  }

  async deleteByPattern(pattern: string): Promise<void> {
    await this.ensureConnected();

    const keysToDelete: string[] = [];

    for await (const keyChunk of this.client.scanIterator({
      MATCH: pattern,
      COUNT: 100,
    })) {
      if (Array.isArray(keyChunk)) {
        keysToDelete.push(...keyChunk);
        continue;
      }

      keysToDelete.push(keyChunk);
    }

    if (keysToDelete.length > 0) {
      await this.client.del(keysToDelete);
    }
  }

  async acquireLock(
    key: string,
    token: string,
    ttlMs: number,
  ): Promise<boolean> {
    await this.ensureConnected();

    const result = await this.client.set(key, token, {
      NX: true,
      PX: ttlMs,
    });

    return result === 'OK';
  }

  async releaseLock(key: string, token: string): Promise<void> {
    await this.ensureConnected();

    const currentToken = await this.client.get(key);

    if (currentToken === token) {
      await this.client.del(key);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }

  private async ensureConnected(): Promise<void> {
    if (this.client.isOpen) {
      return;
    }

    if (!this.connectionPromise) {
      this.connectionPromise = this.client
        .connect()
        .then(() => undefined)
        .finally(() => {
          this.connectionPromise = null;
        });
    }

    await this.connectionPromise;
  }
}
