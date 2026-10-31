import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

export interface LevelInfo {
  level: number;
  currentXp: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
  xpRemainingToNextLevel: number;
}

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(private prisma: PrismaService) {}

  // Mathematical Root-Curve Formula: Level = floor(sqrt(XP / 100)) + 1
  calculateLevel(totalXp: number): number {
    if (totalXp <= 0) return 1;
    return Math.floor(Math.sqrt(totalXp / 100)) + 1;
  }

  // Inverse formula: XP needed for level L = (L - 1)^2 * 100
  getXpRequiredForLevel(level: number): number {
    if (level <= 1) return 0;
    return Math.pow(level - 1, 2) * 100;
  }

  getLevelDetails(totalXp: number): LevelInfo {
    const level = this.calculateLevel(totalXp);
    const xpForCurrentLevel = this.getXpRequiredForLevel(level);
    const xpForNextLevel = this.getXpRequiredForLevel(level + 1);

    const levelSpan = xpForNextLevel - xpForCurrentLevel;
    const currentProgress = totalXp - xpForCurrentLevel;
    const progressPercent = Math.min(100, Math.max(0, Math.round((currentProgress / levelSpan) * 100)));
    const xpRemainingToNextLevel = Math.max(0, xpForNextLevel - totalXp);

    return {
      level,
      currentXp: totalXp,
      xpForCurrentLevel,
      xpForNextLevel,
      progressPercent,
      xpRemainingToNextLevel,
    };
  }

  async awardWorkoutRewards(userId: string, earnedXp: number, earnedCoins: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const newTotalXp = user.xp + earnedXp;
    const newLevel = this.calculateLevel(newTotalXp);
    const hasLeveledUp = newLevel > user.level;

    // Update streak logic
    const today = new Date().toISOString().split('T')[0];
    const lastActive = user.lastActiveDate ? user.lastActiveDate.toISOString().split('T')[0] : null;

    let baseTodayXp = user.todayXpEarned;
    let baseTodayCoins = user.todayCoinsEarned;
    if (lastActive && lastActive !== today) {
      baseTodayXp = 0;
      baseTodayCoins = 0;
    }

    let newStreak = user.currentStreak;
    if (!lastActive) {
      newStreak = 1;
    } else if (lastActive !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (lastActive === yesterday) {
        newStreak += 1;
      } else {
        newStreak = 1; // Streak reset if gap is > 1 day
      }
    }

    const highestStreak = Math.max(user.highestStreak, newStreak);

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        xp: newTotalXp,
        level: newLevel,
        fitCoins: user.fitCoins + earnedCoins,
        currentStreak: newStreak,
        highestStreak,
        lastActiveDate: new Date(),
        todayXpEarned: baseTodayXp + earnedXp,
        todayCoinsEarned: baseTodayCoins + earnedCoins,
      },
    });

    return {
      user: updatedUser,
      hasLeveledUp,
      previousLevel: user.level,
      newLevel,
      earnedXp,
      earnedCoins,
      levelInfo: this.getLevelDetails(newTotalXp),
    };
  }

  // Shop & Inventory methods
  async getShopItems() {
    return this.prisma.shopItem.findMany({
      orderBy: { priceCoins: 'asc' },
    });
  }

  async buyShopItem(userId: string, itemId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const item = await this.prisma.shopItem.findUnique({ where: { id: itemId } });

    if (!user) throw new NotFoundException('User not found');
    if (!item) throw new NotFoundException('Shop item not found');

    if (user.fitCoins < item.priceCoins) {
      throw new BadRequestException(
        `Không đủ FitCoin (Cần ${item.priceCoins} FitCoins, hiện có ${user.fitCoins} FitCoins)`,
      );
    }

    // Deduct coins and add to inventory
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          fitCoins: user.fitCoins - item.priceCoins,
          ...(item.itemType === 'STREAK_FREEZE'
            ? { streakFreezeCount: user.streakFreezeCount + 1 }
            : {}),
        },
      });

      const existingInv = await tx.userInventory.findUnique({
        where: {
          userId_itemId: { userId, itemId },
        },
      });

      if (existingInv) {
        await tx.userInventory.update({
          where: { id: existingInv.id },
          data: { quantity: existingInv.quantity + 1 },
        });
      } else {
        await tx.userInventory.create({
          data: {
            userId,
            itemId,
            quantity: 1,
          },
        });
      }
    });

    const refreshedUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { inventory: { include: { item: true } } },
    });

    return {
      message: `Đã mua thành công ${item.name}!`,
      item,
      user: refreshedUser,
    };
  }

  async getUserInventory(userId: string) {
    return this.prisma.userInventory.findMany({
      where: { userId },
      include: { item: true },
    });
  }

  // Daily Midnight Cron Job: 00:00 UTC / System Local Time
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyResetCron() {
    this.logger.log('Executing Daily Reset Cron Job at 00:00...');
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const users = await this.prisma.user.findMany();

    for (const user of users) {
      const lastActive = user.lastActiveDate ? user.lastActiveDate.toISOString().split('T')[0] : null;

      let streakUpdate = user.currentStreak;
      let freezeUpdate = user.streakFreezeCount;

      // If user did not work out yesterday and has active streak
      if (user.currentStreak > 0 && lastActive !== yesterday && lastActive !== new Date().toISOString().split('T')[0]) {
        if (user.streakFreezeCount > 0) {
          // Consume 1 streak freeze to protect streak
          freezeUpdate -= 1;
          this.logger.log(`User ${user.email} streak protected by Streak Freeze!`);
        } else {
          // Reset streak to 0
          streakUpdate = 0;
          this.logger.log(`User ${user.email} streak reset to 0 due to inactivity.`);
        }
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          todayXpEarned: 0,
          todayCoinsEarned: 0,
          currentStreak: streakUpdate,
          streakFreezeCount: freezeUpdate,
          lastDailyReset: new Date(),
        },
      });
    }

    this.logger.log(`Daily reset complete for ${users.length} users.`);
  }
}
