import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ensureSeedData } from './seed-data';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    try {
      await ensureSeedData(this, this.logger);
    } catch (err) {
      this.logger.warn(
        `Auto-seed skipped (ensure schema is pushed with prisma db push): ${(err as Error)?.message || err}`,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
