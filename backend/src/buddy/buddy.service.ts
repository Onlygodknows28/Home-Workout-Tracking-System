import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

export interface BuddyMatchCandidate {
  userId: string;
  name: string;
  avatar: string;
  bmi: number;
  fitnessLevel: string;
  pushupBaseline: number;
  primaryGoal: string;
  similarityScore: number; // 0 to 100%
}

@Injectable()
export class BuddyService {
  private readonly logger = new Logger(BuddyService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // Calculate similarity between two user profiles (0 - 100%)
  calculateSimilarity(p1: any, p2: any): number {
    const bmiDiff = Math.abs(p1.bmi - p2.bmi);
    const bmiScore = Math.max(0, 100 - bmiDiff * 8);

    const pushupDiff = Math.abs(p1.pushupBaseline - p2.pushupBaseline);
    const pushupScore = Math.max(0, 100 - pushupDiff * 3);

    const goalScore = p1.primaryGoal === p2.primaryGoal ? 100 : 40;
    const fitnessScore = p1.fitnessLevel === p2.fitnessLevel ? 100 : 50;

    const weightedScore = bmiScore * 0.3 + pushupScore * 0.3 + goalScore * 0.25 + fitnessScore * 0.15;
    return Math.round(weightedScore);
  }

  async getMyBuddy(userId: string) {
    const today = new Date().toISOString().split('T')[0];

    const pair = await this.prisma.buddyPair.findFirst({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
        status: 'ACTIVE',
      },
      include: {
        user1: { include: { profile: true } },
        user2: { include: { profile: true } },
        missions: {
          where: { date: today },
        },
      },
    });

    if (!pair) {
      return { hasBuddy: false, pair: null, mission: null };
    }

    const isUser1 = pair.user1Id === userId;
    const me = isUser1 ? pair.user1 : pair.user2;
    const partner = isUser1 ? pair.user2 : pair.user1;

    let mission = pair.missions[0];
    if (!mission) {
      mission = await this.prisma.buddyMission.create({
        data: {
          buddyPairId: pair.id,
          date: today,
          title: 'Đồng Lòng Vượt Ngưỡng 100 Reps',
          description: 'Cả hai bạn cùng tập luyện và đóng góp tổng cộng ít nhất 100 reps hôm nay.',
          targetReps: 100,
          rewardCoins: 25,
        },
      });
    }

    const myProgress = isUser1 ? mission.user1Progress : mission.user2Progress;
    const partnerProgress = isUser1 ? mission.user2Progress : mission.user1Progress;
    const myCompleted = isUser1 ? mission.user1Completed : mission.user2Completed;
    const partnerCompleted = isUser1 ? mission.user2Completed : mission.user1Completed;
    const bothCompleted = myCompleted && partnerCompleted;

    const totalRepsToday = mission.user1Progress + mission.user2Progress;
    const missionProgressPercent = Math.min(100, Math.round((totalRepsToday / mission.targetReps) * 100));

    return {
      hasBuddy: true,
      pairId: pair.id,
      sharedStreak: pair.sharedStreak,
      partner: {
        id: partner.id,
        name: partner.name,
        avatar: partner.avatar,
        level: partner.level,
        currentStreak: partner.currentStreak,
        streakFreezeCount: partner.streakFreezeCount,
        profile: partner.profile,
      },
      mission: {
        id: mission.id,
        title: mission.title,
        description: mission.description,
        targetReps: mission.targetReps,
        myProgress,
        partnerProgress,
        totalRepsToday,
        missionProgressPercent,
        myCompleted,
        partnerCompleted,
        bothCompleted,
        rewardCoins: mission.rewardCoins,
        isClaimed: mission.isClaimed,
      },
    };
  }

  // Radar Matchmaking to find ideal workout partners
  async findBuddyMatches(userId: string): Promise<BuddyMatchCandidate[]> {
    const me = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!me || !me.profile) {
      throw new BadRequestException('Vui lòng hoàn thành Onboarding trước khi tìm bạn tập');
    }

    const otherUsers = await this.prisma.user.findMany({
      where: {
        id: { not: userId },
        profile: { isNot: null },
      },
      include: { profile: true },
      take: 20,
    });

    const candidates: BuddyMatchCandidate[] = otherUsers
      .map((u) => {
        const score = this.calculateSimilarity(me.profile, u.profile);
        return {
          userId: u.id,
          name: u.name,
          avatar: u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.name)}`,
          bmi: u.profile?.bmi || 22,
          fitnessLevel: u.profile?.fitnessLevel || 'BEGINNER',
          pushupBaseline: u.profile?.pushupBaseline || 10,
          primaryGoal: u.profile?.primaryGoal || 'MUSCLE_GAIN',
          similarityScore: score,
        };
      })
      .sort((a, b) => b.similarityScore - a.similarityScore);

    return candidates;
  }

  // Connect / Pair up with a buddy (1-1 Active Model)
  async connectBuddy(userId: string, targetUserId: string) {
    return this.pairUsers(userId, targetUserId);
  }

  /**
   * Thiết lập quan hệ 1-1 tuyệt đối giữa requester và targetUser.
   * Chặn hoàn toàn trường hợp 1 user có nhiều active buddy cùng lúc.
   * Xử lý race conditions bằng Prisma Interactive Transaction.
   */
  async pairUsers(requesterId: string, targetUserId: string) {
    if (requesterId === targetUserId) {
      throw new BadRequestException('Không thể kết nối với chính mình');
    }

    // Chuẩn hóa thứ tự để đảm bảo tính nhất quán (user1Id luôn < user2Id)
    const [sortedUser1, sortedUser2] = requesterId < targetUserId 
      ? [requesterId, targetUserId] 
      : [targetUserId, requesterId];

    // Sử dụng Interactive Transaction để đảm bảo tính nguyên tử (Atomicity)
    // và ngăn chặn Race Condition (spam click hoặc 2 user cùng bấm ghép đôi cùng lúc)
    const newPair = await this.prisma.$transaction(async (tx) => {
      // 1. Kiểm tra requester có đang trong bất kỳ quan hệ ACTIVE nào không (cả user1Id lẫn user2Id)
      const requesterActivePair = await tx.buddyPair.findFirst({
        where: {
          OR: [{ user1Id: requesterId }, { user2Id: requesterId }],
          status: { in: ['ACTIVE', 'active'] },
        },
      });

      if (requesterActivePair) {
        throw new ConflictException(
          'Bạn hiện đã có một người bạn đồng hành đang hoạt động. Vui lòng hủy kết nối hiện tại trước khi ghép đôi mới.',
        );
      }

      // 2. Kiểm tra targetUser có đang trong bất kỳ quan hệ ACTIVE nào không (cả user1Id lẫn user2Id)
      const targetActivePair = await tx.buddyPair.findFirst({
        where: {
          OR: [{ user1Id: targetUserId }, { user2Id: targetUserId }],
          status: { in: ['ACTIVE', 'active'] },
        },
      });

      if (targetActivePair) {
        throw new ConflictException(
          'Đối phương hiện đã có bạn đồng hành đang hoạt động. Vui lòng chọn một người bạn tập khác.',
        );
      }

      // 3. Tạo bản ghi ghép đôi mới
      return await tx.buddyPair.create({
        data: {
          user1Id: sortedUser1,
          user2Id: sortedUser2,
          status: 'ACTIVE',
          sharedStreak: 0,
        },
      });
    });

    // Lấy thông tin người gửi để gửi notification sau khi transaction hoàn tất thành công
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
      select: { name: true },
    });

    await this.notificationsService.createNotification(targetUserId, {
      type: 'BUDDY_SYNC',
      title: 'Bạn Tập Đồng Hành Mới',
      message: `${requester?.name || 'Một thành viên'} đã kết nối làm bạn tập của bạn! Cùng nhau duy trì kỷ luật nhé.`,
      link: '/buddy',
    });

    return {
      message: 'Ghép đôi bạn tập thành công! Cùng nhau duy trì kỷ luật nhé.',
      pair: newPair,
    };
  }

  // Hủy ghép đôi (Unpair / Break buddy) - chuyển status thành 'BROKEN'
  async unpairBuddy(userId: string) {
    const activePair = await this.prisma.buddyPair.findFirst({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
        status: { in: ['ACTIVE', 'active'] },
      },
    });

    if (!activePair) {
      throw new NotFoundException('Bạn hiện không có bạn đồng hành nào đang hoạt động.');
    }

    const partnerId = activePair.user1Id === userId ? activePair.user2Id : activePair.user1Id;

    const updated = await this.prisma.buddyPair.update({
      where: { id: activePair.id },
      data: { status: 'BROKEN' },
    });

    // Thông báo cho bạn tập
    await this.notificationsService.createNotification(partnerId, {
      type: 'BUDDY_SYNC',
      title: 'Hủy Ghép Đôi Bạn Tập',
      message: 'Người bạn tập của bạn đã hủy ghép đôi. Bạn có thể tìm bạn tập mới trên Radar.',
      link: '/buddy',
    });

    return {
      message: 'Đã hủy kết nối bạn đồng hành thành công.',
      pair: updated,
    };
  }

  // Gift a Streak Freeze to Buddy (e.g. if buddy is sick or injured)
  async giftStreakFreeze(fromUserId: string, toUserId: string, note?: string) {
    const sender = await this.prisma.user.findUnique({ where: { id: fromUserId } });
    const recipient = await this.prisma.user.findUnique({ where: { id: toUserId } });

    if (!sender) throw new NotFoundException('Sender not found');
    if (!recipient) throw new NotFoundException('Recipient not found');

    if (sender.streakFreezeCount <= 0) {
      throw new BadRequestException('Bạn không có Thẻ bảo vệ chuỗi nào trong túi đồ để tặng');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: fromUserId },
        data: { streakFreezeCount: { decrement: 1 } },
      });

      await tx.user.update({
        where: { id: toUserId },
        data: { streakFreezeCount: { increment: 1 } },
      });

      await tx.streakGiftLog.create({
        data: {
          fromUserId,
          toUserId,
          giftType: 'STREAK_FREEZE',
          note: note || 'Tặng bạn một tấm thẻ bảo vệ chuỗi để nghỉ ngơi hồi phục!',
        },
      });
    });

    // Send notification to recipient
    await this.notificationsService.createNotification(toUserId, {
      type: 'BUDDY_GIFT',
      title: 'Nhận Thẻ Bảo Vệ Chuỗi',
      message: `${sender.name} vừa tặng bạn 1 Thẻ Bảo Vệ Chuỗi: "${note || 'Tặng bạn một tấm thẻ bảo vệ chuỗi để nghỉ ngơi hồi phục!'}"`,
      link: '/shop',
    });

    return {
      message: `Đã tặng 1 Thẻ bảo vệ chuỗi cho ${recipient.name}!`,
      remainingFreezes: sender.streakFreezeCount - 1,
    };
  }
}
