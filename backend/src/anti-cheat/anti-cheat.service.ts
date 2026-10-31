import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface TimeValidationInput {
  userId: string;
  workoutTitle: string;
  durationSeconds: number;
  totalReps: number;
  totalSets: number;
  estimatedDurationSec: number;
}

export interface SecurityValidationResult {
  isValid: boolean;
  isFlaggedCheat: boolean;
  grantedXp: number;
  grantedCoins: number;
  reason?: string;
}

@Injectable()
export class AntiCheatService {
  private readonly logger = new Logger(AntiCheatService.name);

  // Daily hard caps
  readonly MAX_DAILY_XP = 1500;
  readonly MAX_DAILY_COINS = 150;

  constructor(private prisma: PrismaService) {}

  calculateBiologicalMinTime(totalReps: number, totalSets: number, estimatedSec: number): number {
    // Biological baseline:
    // Calisthenics movements include isometric holds (e.g., 45s plank = 45 reps) and fast cadence exercises
    // (e.g. mountain climbers, rapid air squats at ~0.4s per rep).
    const minRepTime = totalReps * 0.4;
    // Routine minimum: at least 15% of estimated duration, with a floor of 20 seconds for micro-drills
    const baselineMin = Math.round(estimatedSec * 0.15);
    // Ceiling of 180s (3 mins) ensures high-intensity interval workouts are never falsely blocked
    return Math.min(Math.max(minRepTime, baselineMin, 20), 180);
  }

  async validateAndCapRewards(
    userId: string,
    calculatedXp: number,
    calculatedCoins: number,
    input: TimeValidationInput,
  ): Promise<SecurityValidationResult> {
    const minRequiredSec = this.calculateBiologicalMinTime(
      input.totalReps,
      input.totalSets,
      input.estimatedDurationSec,
    );

    // 1. Time Validation Check
    // If completion time is suspiciously low, flag as cheat, award 0 XP/Coins, and log,
    // but DO NOT crash the submission or trap the user in the UI.
    if (input.durationSeconds < minRequiredSec) {
      const reason = `Thời lượng buổi tập quá ngắn (${input.durationSeconds}s / tối thiểu ${minRequiredSec}s cho ${input.totalReps} reps). Đã lưu nhật ký với 0 XP và 0 FitCoins.`;
      
      this.logger.warn(`Anti-Cheat flagged user ${userId}: ${reason}`);

      await this.prisma.antiCheatLog.create({
        data: {
          userId,
          action: 'WORKOUT_SUBMISSION',
          estimatedDurationSec: input.estimatedDurationSec,
          actualDurationSec: input.durationSeconds,
          reason,
        },
      });

      return {
        isValid: true,
        isFlaggedCheat: true,
        grantedXp: 0,
        grantedCoins: 0,
        reason,
      };
    }

    // 2. Hard Daily Capping Check
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const today = new Date().toISOString().split('T')[0];
    const lastActive = user.lastActiveDate ? user.lastActiveDate.toISOString().split('T')[0] : null;

    let currentTodayXp = user.todayXpEarned;
    let currentTodayCoins = user.todayCoinsEarned;

    // Lazy daily reset: If user's last activity was on a previous calendar day, reset daily counters
    if (lastActive && lastActive !== today) {
      currentTodayXp = 0;
      currentTodayCoins = 0;
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          todayXpEarned: 0,
          todayCoinsEarned: 0,
        },
      });
      this.logger.log(`Lazy daily reset applied for user ${userId} on new day ${today}`);
    }

    const remainingXpCapacity = Math.max(0, this.MAX_DAILY_XP - currentTodayXp);
    const remainingCoinCapacity = Math.max(0, this.MAX_DAILY_COINS - currentTodayCoins);

    const finalXp = Math.min(calculatedXp, remainingXpCapacity);
    const finalCoins = Math.min(calculatedCoins, remainingCoinCapacity);

    if (finalXp < calculatedXp || finalCoins < calculatedCoins) {
      this.logger.log(
        `Daily cap applied for user ${userId}. XP capped: ${finalXp}/${calculatedXp}, Coins capped: ${finalCoins}/${calculatedCoins}`,
      );
    }

    return {
      isValid: true,
      isFlaggedCheat: false,
      grantedXp: finalXp,
      grantedCoins: finalCoins,
    };
  }
}
