import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AntiCheatService } from '../anti-cheat/anti-cheat.service';
import { GamificationService } from '../gamification/gamification.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateWorkoutLogDto, DailyCheckinDto } from './dto/create-workout-log.dto';

@Injectable()
export class WorkoutsService {
  private readonly logger = new Logger(WorkoutsService.name);

  constructor(
    private prisma: PrismaService,
    private antiCheatService: AntiCheatService,
    private gamificationService: GamificationService,
    private notificationsService: NotificationsService,
  ) {}

  async submitWorkoutLog(userId: string, dto: CreateWorkoutLogDto) {
    const exercises = dto.exercises || [];
    const totalReps = exercises.reduce(
      (acc, curr) => acc + (curr.setsCompleted || 1) * (curr.repsPerSet || 1),
      0,
    );
    const totalSets = exercises.reduce((acc, curr) => acc + (curr.setsCompleted || 1), 0);

    // 1. Calculate Base XP & Coins with safe fallbacks
    let rawXp = exercises.reduce(
      (acc, curr) =>
        acc +
        (curr.setsCompleted || 1) *
          (curr.repsPerSet || 1) *
          (curr.difficulty || 2) *
          2,
      0,
    );

    if (!rawXp || isNaN(rawXp)) {
      rawXp = Math.max(totalReps * 2, 60);
    }

    // RPE Exertion Multiplier:
    // - Easy (1): receives XP, but less than other RPEs (0.85x multiplier)
    // - Optimal (2): 1.15x multiplier
    // - Hard (3): 1.25x multiplier
    if (dto.rpeScore === 1) {
      rawXp = Math.max(30, Math.round(rawXp * 0.85));
    } else if (dto.rpeScore === 2) {
      rawXp = Math.max(40, Math.round(rawXp * 1.15));
    } else if (dto.rpeScore === 3) {
      rawXp = Math.max(50, Math.round(rawXp * 1.25));
    }

    const rawCoins = Math.max(10, Math.round(15 + totalReps / 10));
    const estimatedBurn = Math.round(dto.durationSeconds * 0.12 + totalReps * 0.4);

    // 2. Anti-Cheat Security & Daily Cap Validation
    const securityResult = await this.antiCheatService.validateAndCapRewards(
      userId,
      rawXp,
      rawCoins,
      {
        userId,
        workoutTitle: dto.workoutTitle,
        durationSeconds: dto.durationSeconds,
        totalReps,
        totalSets,
        estimatedDurationSec: (dto.estimatedDurationMin || 15) * 60,
      },
    );

    // 3. Save Workout Log
    const workoutLog = await this.prisma.workoutLog.create({
      data: {
        userId,
        workoutTitle: dto.workoutTitle,
        startedAt: new Date(dto.startedAt),
        completedAt: new Date(dto.completedAt),
        durationSeconds: dto.durationSeconds,
        totalReps,
        rpeScore: dto.rpeScore,
        calorieBurnEstimate: estimatedBurn,
        earnedXp: securityResult.grantedXp,
        earnedCoins: securityResult.grantedCoins,
        isFlaggedCheat: securityResult.isFlaggedCheat,
        detailsJson: JSON.stringify(dto.exercises),
      },
    });

    // 4. Award XP, Coins, Update Level & Streak
    const rewardResult = await this.gamificationService.awardWorkoutRewards(
      userId,
      securityResult.grantedXp,
      securityResult.grantedCoins,
    );

    // 5. Update Buddy Missions if user has an active partner
    await this.updateBuddyMissionProgress(userId, totalReps);

    // 6. Generate In-App Notifications
    await this.notificationsService.createNotification(userId, {
      type: 'WORKOUT',
      title: 'Hoàn Thành Buổi Tập!',
      message: `Bạn đã hoàn thành ${totalReps} reps trong ${Math.round(dto.durationSeconds / 60)} phút. Nhận +${securityResult.grantedXp} XP và +${securityResult.grantedCoins} FitCoins.`,
      link: '/workout',
    });

    if (rewardResult.hasLeveledUp) {
      await this.notificationsService.createNotification(userId, {
        type: 'LEVEL_UP',
        title: `Chúc Mừng: Lên Cấp ${rewardResult.newLevel}!`,
        message: `Sức mạnh và thể lực của bạn đã đạt mốc mới: Level ${rewardResult.newLevel}. Tiếp tục giữ vững phong độ!`,
        link: '/profile',
      });
    }

    return {
      message: securityResult.isFlaggedCheat
        ? 'Buổi tập quá ngắn để nhận thưởng đầy đủ. Đã lưu nhật ký thể lực.'
        : 'Buổi tập đã được ghi nhận thành công!',
      workoutLog,
      rewards: {
        earnedXp: securityResult.grantedXp,
        earnedCoins: securityResult.grantedCoins,
        hasLeveledUp: rewardResult.hasLeveledUp,
        newLevel: rewardResult.newLevel,
        currentStreak: rewardResult.user.currentStreak,
        levelInfo: rewardResult.levelInfo,
        isFlaggedCheat: securityResult.isFlaggedCheat,
        cheatReason: securityResult.reason,
      },
    };
  }

  private async updateBuddyMissionProgress(userId: string, repsCompleted: number) {
    const today = new Date().toISOString().split('T')[0];

    const activePair = await this.prisma.buddyPair.findFirst({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
        status: 'ACTIVE',
      },
      include: {
        missions: {
          where: { date: today },
        },
      },
    });

    if (!activePair) return;

    let mission = activePair.missions[0];
    if (!mission) {
      mission = await this.prisma.buddyMission.create({
        data: {
          buddyPairId: activePair.id,
          date: today,
          title: 'Đồng Lòng Vượt Ngưỡng (Co-op 100 Reps)',
          description: 'Cả hai bạn cùng tập luyện và đóng góp tổng cộng ít nhất 100 reps hôm nay.',
          targetReps: 100,
          rewardCoins: 25,
        },
      });
    }

    const isUser1 = activePair.user1Id === userId;
    const newProgress1 = isUser1 ? mission.user1Progress + repsCompleted : mission.user1Progress;
    const newProgress2 = !isUser1 ? mission.user2Progress + repsCompleted : mission.user2Progress;
    const user1Completed = isUser1 ? true : mission.user1Completed;
    const user2Completed = !isUser1 ? true : mission.user2Completed;

    await this.prisma.buddyMission.update({
      where: { id: mission.id },
      data: {
        user1Progress: newProgress1,
        user2Progress: newProgress2,
        user1Completed,
        user2Completed,
      },
    });

    // If both completed today, advance shared streak consecutively
    if (user1Completed && user2Completed && activePair.lastSyncedDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      let newSharedStreak = 1;
      // If pair completed yesterday, streak advances consecutively
      if (activePair.lastSyncedDate === yesterday) {
        newSharedStreak = (activePair.sharedStreak || 0) + 1;
      } else {
        // Continuity broken (gap > 1 day) -> start a fresh consecutive streak of 1
        newSharedStreak = 1;
      }

      await this.prisma.buddyPair.update({
        where: { id: activePair.id },
        data: {
          sharedStreak: newSharedStreak,
          lastSyncedDate: today,
        },
      });
      this.logger.log(
        `Buddy Pair ${activePair.id} shared streak updated to ${newSharedStreak} (lastSyncedDate: ${activePair.lastSyncedDate}, today: ${today})`,
      );
    }
  }

  // Daily Nutrition Check-in (1-tap input, strictly limited to once per day)
  async submitDailyCheckin(userId: string, dto: DailyCheckinDto) {
    const today = new Date().toISOString().split('T')[0];

    const existingCheckin = await this.prisma.dailyCheckin.findUnique({
      where: {
        userId_date: { userId, date: today },
      },
    });

    if (existingCheckin) {
      throw new BadRequestException(
        'Bạn đã hoàn thành check-in dinh dưỡng hôm nay rồi. Mỗi ngày chỉ nhận thưởng 1 lần!',
      );
    }

    const [checkin] = await this.prisma.$transaction([
      this.prisma.dailyCheckin.create({
        data: {
          userId,
          date: today,
          calorieType: dto.calorieType,
          energyLevel: dto.energyLevel ?? 3,
          notes: dto.notes,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          fitCoins: { increment: 5 },
          todayCoinsEarned: { increment: 5 },
        },
      }),
    ]);

    return {
      message: 'Check-in dinh dưỡng thành công (+5 FitCoins)!',
      checkin,
    };
  }

  async getWorkoutLogs(userId: string) {
    return this.prisma.workoutLog.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      take: 20,
    });
  }

  async getTodayStatus(userId: string) {
    const today = new Date().toISOString().split('T')[0];

    const [todayWorkout, todayCheckin, user] = await Promise.all([
      this.prisma.workoutLog.findFirst({
        where: {
          userId,
          completedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.prisma.dailyCheckin.findUnique({
        where: { userId_date: { userId, date: today } },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          xp: true,
          level: true,
          fitCoins: true,
          currentStreak: true,
          highestStreak: true,
          streakFreezeCount: true,
          todayXpEarned: true,
          todayCoinsEarned: true,
          lastActiveDate: true,
        },
      }),
    ]);

    const lastActive = user?.lastActiveDate ? user.lastActiveDate.toISOString().split('T')[0] : null;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const isNewDay = lastActive && lastActive !== today;

    let currentStreak = user?.currentStreak || 0;
    let streakFreezeCount = user?.streakFreezeCount || 0;
    let lastActiveDate = user?.lastActiveDate || null;

    // Consistency Check: If user has an active streak, but missed yesterday (lastActive is neither today nor yesterday):
    if (user && currentStreak > 0 && lastActive && lastActive !== today && lastActive !== yesterday) {
      const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0];
      if (streakFreezeCount > 0 && lastActive === twoDaysAgo) {
        // Missed exactly yesterday and has a freeze: auto-consume freeze to protect streak!
        streakFreezeCount -= 1;
        lastActiveDate = new Date(Date.now() - 86400000);
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            streakFreezeCount,
            lastActiveDate,
          },
        });
        this.logger.log(`Lazy streak check: Protected streak for user ${userId} using 1 freeze.`);
      } else {
        // Gap > 1 day or no freeze available: streak is broken
        currentStreak = 0;
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            currentStreak: 0,
          },
        });
        this.logger.log(`Lazy streak check: Reset streak to 0 for user ${userId} due to broken continuity.`);
      }
    }

    const userStats = user
      ? {
          ...user,
          currentStreak,
          streakFreezeCount,
          lastActiveDate,
          todayXpEarned: isNewDay ? 0 : user.todayXpEarned,
          todayCoinsEarned: isNewDay ? 0 : user.todayCoinsEarned,
        }
      : null;

    const levelInfo = this.gamificationService.getLevelDetails(user?.xp || 0);

    return {
      hasWorkedOutToday: !!todayWorkout,
      todayWorkout,
      hasCheckedInToday: !!todayCheckin,
      todayCheckin,
      userStats,
      levelInfo,
    };
  }
}
