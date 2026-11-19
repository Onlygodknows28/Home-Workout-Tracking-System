import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ensureSeedData } from './seed-data';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    try {
      await this.$executeRawUnsafe(`
        ALTER TABLE "User"
        ADD COLUMN IF NOT EXISTS "fcmToken" TEXT,
        ADD COLUMN IF NOT EXISTS "reminderTime" TEXT DEFAULT '18:00',
        ADD COLUMN IF NOT EXISTS "reminderEnabled" BOOLEAN NOT NULL DEFAULT true;
      `);
    } catch (err) {
      this.logger.warn(`Auto-migration check for FCM columns skipped: ${(err as Error)?.message || err}`);
    }
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
