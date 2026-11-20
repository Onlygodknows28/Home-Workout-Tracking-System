import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GoogleAuth } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateNotificationDto {
  type:
    | 'WORKOUT'
    | 'LEVEL_UP'
    | 'BUDDY_GIFT'
    | 'BUDDY_SYNC'
    | 'SHOP'
    | 'STREAK'
    | 'MESSAGE'
    | 'SYSTEM';
  title: string;
  message: string;
  link?: string;
}

export interface RegisterFcmDto {
  fcmToken?: string;
  reminderTime?: string;
  reminderEnabled?: boolean;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Dispatches a Web Push notification via Google Firebase Cloud Messaging (FCM HTTP v1 or Server Key).
   * Falls back cleanly if running with Hybrid Local Service Worker tokens (`sw_local_*`).
   */
  async sendFcmPushToToken(
    fcmToken: string | null | undefined,
    payload: { title: string; body: string; link?: string; type?: string },
  ): Promise<{ deliveredViaFcmCloud: boolean; provider: string }> {
    if (!fcmToken || fcmToken.startsWith('sw_local_')) {
      return { deliveredViaFcmCloud: false, provider: 'HYBRID_SERVICE_WORKER' };
    }

    try {
      // Option A: Firebase HTTP v1 API via FIREBASE_SERVICE_ACCOUNT_JSON
      const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (serviceAccountRaw) {
        const credentials = JSON.parse(serviceAccountRaw);
        if (typeof credentials.private_key === 'string') {
          credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
        }
        const projectId = credentials.project_id || process.env.FIREBASE_PROJECT_ID;
        if (projectId) {
          const auth = new GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
          });
          const accessToken = await auth.getAccessToken();
          if (accessToken) {
            const res = await fetch(
              `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  message: {
                    token: fcmToken,
                    notification: {
                      title: payload.title,
                      body: payload.body,
                    },
                    webpush: {
                      fcm_options: {
                        link: payload.link || '/workout',
                      },
                    },
                    data: {
                      link: payload.link || '/workout',
                      type: payload.type || 'STREAK',
                    },
                  },
                }),
              },
            );
            if (res.ok) {
              return { deliveredViaFcmCloud: true, provider: 'FIREBASE_CLOUD_MESSAGING_V1' };
            }
            const errBody = await res.text().catch(() => '');
            this.logger.warn(`FCM v1 HTTP ${res.status}: ${errBody.slice(0, 200)}`);
          }
        }
      }

      // Option B: Firebase Cloud Messaging Server Key
      const serverKey = process.env.FIREBASE_SERVER_KEY;
      if (serverKey) {
        const res = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            Authorization: `key=${serverKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: fcmToken,
            notification: {
              title: payload.title,
              body: payload.body,
              click_action: payload.link || '/workout',
            },
            data: {
              link: payload.link || '/workout',
              type: payload.type || 'STREAK',
            },
          }),
        });
        if (res.ok) {
          return { deliveredViaFcmCloud: true, provider: 'FIREBASE_CLOUD_MESSAGING' };
        }
      }
    } catch (err: any) {
      this.logger.warn(`FCM Cloud dispatch fallback: ${err?.message || err}`);
    }

    return { deliveredViaFcmCloud: false, provider: 'HYBRID_SERVICE_WORKER' };
  }

  async createNotification(userId: string, data: CreateNotificationDto) {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          type: data.type,
          title: data.title,
          message: data.message,
          link: data.link || null,
        },
      });

      // Non-blocking FCM Push dispatch if user has registered an FCM token
      this.prisma.user
        .findUnique({
          where: { id: userId },
          select: { fcmToken: true, reminderEnabled: true },
        })
        .then((u) => {
          if (u?.fcmToken && u.reminderEnabled !== false) {
            return this.sendFcmPushToToken(u.fcmToken, {
              title: data.title,
              body: data.message,
              link: data.link || '/workout',
              type: data.type,
            });
          }
        })
        .catch(() => {});

      return notification;
    } catch (err: any) {
      this.logger.error(`Error creating notification for user ${userId}:`, err);
      return null;
    }
  }

  async registerFcmToken(userId: string, dto: RegisterFcmDto) {
    const updateData: Record<string, any> = {};
    if (dto.fcmToken !== undefined) {
      updateData.fcmToken = dto.fcmToken;
    }
    if (dto.reminderTime !== undefined && /^\d{2}:\d{2}$/.test(dto.reminderTime)) {
      updateData.reminderTime = dto.reminderTime;
    }
    if (dto.reminderEnabled !== undefined) {
      updateData.reminderEnabled = Boolean(dto.reminderEnabled);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        fcmToken: true,
        reminderTime: true,
        reminderEnabled: true,
      },
    });

    return {
      success: true,
      fcmToken: updated.fcmToken,
      reminderTime: updated.reminderTime || '18:00',
      reminderEnabled: updated.reminderEnabled,
    };
  }

  async sendTestPushNotification(userId: string, lang: 'vi' | 'en' = 'vi') {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        currentStreak: true,
        fcmToken: true,
        reminderTime: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const title =
      lang === 'en'
        ? `🔥 FITVANT Workout Reminder (${user.reminderTime || '18:00'})`
        : `🔥 Nhắc Tập FITVANT (${user.reminderTime || '18:00'})`;
    const message =
      lang === 'en'
        ? `Hey ${user.name}! Your 15-min AI Calisthenics routine is ready. Protect your ${user.currentStreak || 1}-day streak now!`
        : `Chào ${user.name}! Giáo án AI 15 phút hôm nay đã sẵn sàng. Hãy vào tập ngay để bảo vệ chuỗi Streak ${user.currentStreak || 1} ngày!`;

    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: 'STREAK',
        title,
        message,
        link: '/workout',
      },
    });

    const fcmResult = await this.sendFcmPushToToken(user.fcmToken, {
      title,
      body: message,
      link: '/workout',
      type: 'STREAK',
    });

    return {
      success: true,
      provider: fcmResult.provider,
      deliveredViaFcmCloud: fcmResult.deliveredViaFcmCloud,
      notification,
    };
  }

  async getUserNotifications(userId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Seed initial welcome notifications at most once per user
    if (notifications.length === 0) {
      const seeded = await this.seedStarterNotifications(userId);
      if (seeded) {
        return this.getUserNotifications(userId);
      }
      return {
        notifications: [],
        unreadCount: 0,
      };
    }

    // Backfill flag for existing users who already have notifications
    await this.prisma.user.updateMany({
      where: { id: userId, starterNotificationsSeeded: false },
      data: { starterNotificationsSeeded: true },
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return {
      notifications,
      unreadCount,
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Thông báo không tồn tại.');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { success: true, message: 'Đã đánh dấu tất cả thông báo là đã đọc.' };
  }

  async deleteNotification(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Thông báo không tồn tại.');
    }

    await this.prisma.$transaction([
      this.prisma.notification.delete({
        where: { id: notificationId },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { starterNotificationsSeeded: true },
      }),
    ]);

    return { success: true, id: notificationId };
  }

  async clearAll(userId: string) {
    await this.prisma.$transaction([
      this.prisma.notification.deleteMany({
        where: { userId },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { starterNotificationsSeeded: true },
      }),
    ]);

    return { success: true, message: 'Đã xóa tất cả thông báo.' };
  }

  async seedStarterNotifications(userId: string): Promise<boolean> {
    const claimed = await this.prisma.user.updateMany({
      where: { id: userId, starterNotificationsSeeded: false },
      data: { starterNotificationsSeeded: true },
    });
    if (claimed.count === 0) return false;

    const starters: CreateNotificationDto[] = [
      {
        type: 'SYSTEM',
        title: 'Chào mừng đến với FitQuest!',
        message: 'Bạn đã nhận được 50 FitCoins và 1 Thẻ Bảo Vệ Chuỗi miễn phí trong hành trang.',
        link: '/shop',
      },
      {
        type: 'WORKOUT',
        title: 'Giáo án AI hôm nay đã sẵn sàng',
        message: 'Hệ thống đã chuẩn bị bài tập thể lực tối ưu cho bạn. Nhận XP và FitCoins ngay khi hoàn tất.',
        link: '/workout',
      },
      {
        type: 'BUDDY_SYNC',
        title: 'Tìm Bạn Tập Kỷ Luật Đồng Hành',
        message: 'Mở Radar AI để ghép đôi bạn tập có cùng chỉ số thể lực và cùng thực hiện nhiệm vụ Co-op 100 reps.',
        link: '/buddy',
      },
    ];

    const baseTime = Date.now();
    await this.prisma.notification.createMany({
      data: starters.map((item, idx) => ({
        userId,
        type: item.type,
        title: item.title,
        message: item.message,
        link: item.link || null,
        createdAt: new Date(baseTime + idx),
      })),
    });

    return true;
  }

  /**
   * Daily Evening Workout & Streak Protection Reminder Cron (18:00)
   * Dispatches In-App + Firebase Cloud Messaging (FCM) push notifications to users
   * who have not yet completed their daily workout.
   */
  @Cron(CronExpression.EVERY_DAY_AT_6PM)
  async handleEveningWorkoutReminderCron() {
    const today = new Date().toISOString().split('T')[0];
    this.logger.log(`Executing Daily Workout Reminder Cron Job for ${today}...`);

    try {
      const users = await this.prisma.user.findMany({
        where: {
          reminderEnabled: true,
        },
        select: {
          id: true,
          name: true,
          currentStreak: true,
          lastActiveDate: true,
          fcmToken: true,
        },
      });

      let remindedCount = 0;
      for (const user of users) {
        const lastActive = user.lastActiveDate
          ? user.lastActiveDate.toISOString().split('T')[0]
          : null;
        if (lastActive === today) continue;

        await this.createNotification(user.id, {
          type: 'STREAK',
          title: '🔥 Đừng Quên Giáo Án Tập Hôm Nay!',
          message:
            user.currentStreak > 0
              ? `Còn vài tiếng nữa là hết ngày! Hoàn thành 15 phút tập luyện ngay để bảo vệ chuỗi Streak ${user.currentStreak} ngày của bạn.`
              : 'Giáo án Calisthenics 15 phút hôm nay đã sẵn sàng. Hãy vào khởi động chuỗi Streak mới ngay nhé!',
          link: '/workout',
        });
        remindedCount++;
      }

      this.logger.log(`Evening workout reminders dispatched to ${remindedCount} user(s).`);
    } catch (err: any) {
      this.logger.warn(`Evening reminder cron skipped: ${err?.message || err}`);
    }
  }
}
