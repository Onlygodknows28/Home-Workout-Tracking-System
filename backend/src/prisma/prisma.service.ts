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
      await this.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "DirectMessage" (
          "id" TEXT NOT NULL,
          "senderId" TEXT NOT NULL,
          "receiverId" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "isRead" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "DirectMessage_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "DirectMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "DirectMessage_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);
      await this.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "DirectMessage_senderId_receiverId_createdAt_idx"
        ON "DirectMessage"("senderId", "receiverId", "createdAt");
      `);
      await this.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "DirectMessage_receiverId_isRead_idx"
        ON "DirectMessage"("receiverId", "isRead");
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
