import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateNotificationDto {
  type: 'WORKOUT' | 'LEVEL_UP' | 'BUDDY_GIFT' | 'BUDDY_SYNC' | 'SHOP' | 'STREAK' | 'SYSTEM';
  title: string;
  message: string;
  link?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

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
      return notification;
    } catch (err: any) {
      this.logger.error(`Error creating notification for user ${userId}:`, err);
      return null;
    }
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
}
