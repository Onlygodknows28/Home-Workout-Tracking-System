import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  private isAutomatedTestAccount(u: { email?: string | null; name?: string | null }): boolean {
    const email = (u.email || '').trim().toLowerCase();
    const name = (u.name || '').trim().toLowerCase();
    if (
      email.startsWith('test_') ||
      email.startsWith('test-') ||
      email.startsWith('e2e_') ||
      email.startsWith('probe_') ||
      email.startsWith('audit_') ||
      email.endsWith('@test.com') ||
      email.endsWith('@fitvant.test')
    ) {
      return true;
    }
    if (
      name === 'test schema' ||
      name === 'test reload' ||
      name === 'test user' ||
      name.startsWith('test ') ||
      name.startsWith('e2e ')
    ) {
      return true;
    }
    return false;
  }

  /**
   * Lists all real users in the system along with conversation metadata
   * (last message preview, unread count, active buddy badge).
   */
  async getContacts(userId: string) {
    const [otherUsers, activePair, recentMessages] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { not: userId } },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          level: true,
          currentStreak: true,
          profile: {
            select: {
              fitnessLevel: true,
              primaryGoal: true,
            },
          },
        },
      }),
      this.prisma.buddyPair.findFirst({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
          status: { in: ['ACTIVE', 'active'] },
        },
        select: {
          user1Id: true,
          user2Id: true,
        },
      }),
      this.prisma.directMessage.findMany({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
        orderBy: { createdAt: 'desc' },
        take: 400,
      }),
    ]);

    const activeBuddyId = activePair
      ? activePair.user1Id === userId
        ? activePair.user2Id
        : activePair.user1Id
      : null;

    // Build last message & unread count per peer user
    const lastMessageByPeer = new Map<
      string,
      { content: string; createdAt: Date; senderId: string }
    >();
    const unreadByPeer = new Map<string, number>();

    for (const msg of recentMessages) {
      const peerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!lastMessageByPeer.has(peerId)) {
        lastMessageByPeer.set(peerId, {
          content: msg.content,
          createdAt: msg.createdAt,
          senderId: msg.senderId,
        });
      }
      if (msg.receiverId === userId && !msg.isRead) {
        unreadByPeer.set(peerId, (unreadByPeer.get(peerId) || 0) + 1);
      }
    }

    const contacts = otherUsers
      .filter((u) => !this.isAutomatedTestAccount(u))
      .map((u) => {
        const lastMsg = lastMessageByPeer.get(u.id) || null;
        return {
          userId: u.id,
          name: u.name || u.email.split('@')[0],
          avatar:
            u.avatar ||
            `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.name || u.email)}`,
          level: u.level || 1,
          currentStreak: u.currentStreak || 0,
          fitnessLevel: u.profile?.fitnessLevel || 'BEGINNER',
          primaryGoal: u.profile?.primaryGoal || 'GENERAL_FITNESS',
          isBuddy: u.id === activeBuddyId,
          unreadCount: unreadByPeer.get(u.id) || 0,
          lastMessage: lastMsg
            ? {
                content: lastMsg.content,
                createdAt: lastMsg.createdAt.toISOString(),
                fromMe: lastMsg.senderId === userId,
              }
            : null,
        };
      })
      .sort((a, b) => {
        // 1. Conversations with recent messages first
        if (a.lastMessage && b.lastMessage) {
          return (
            new Date(b.lastMessage.createdAt).getTime() -
            new Date(a.lastMessage.createdAt).getTime()
          );
        }
        if (a.lastMessage) return -1;
        if (b.lastMessage) return 1;
        // 2. Active Buddy next
        if (a.isBuddy !== b.isBuddy) return a.isBuddy ? -1 : 1;
        // 3. Alphabetical
        return a.name.localeCompare(b.name);
      });

    const totalUnread = contacts.reduce((sum, c) => sum + c.unreadCount, 0);

    return {
      contacts,
      totalUnread,
    };
  }

  /**
   * Fetches the 1-1 message history between userId and partnerId and marks incoming messages read.
   */
  async getConversation(userId: string, partnerId: string) {
    if (userId === partnerId) {
      throw new BadRequestException('Không thể mở hội thoại với chính mình.');
    }

    const [partner, messages] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: partnerId },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          level: true,
          currentStreak: true,
          profile: {
            select: {
              fitnessLevel: true,
              primaryGoal: true,
            },
          },
        },
      }),
      this.prisma.directMessage.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: partnerId },
            { senderId: partnerId, receiverId: userId },
          ],
        },
        orderBy: { createdAt: 'asc' },
        take: 100,
      }),
    ]);

    if (!partner) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }

    // Mark unread messages sent by partner to current user as read
    const hasUnread = messages.some((m) => m.senderId === partnerId && !m.isRead);
    if (hasUnread) {
      await this.prisma.directMessage.updateMany({
        where: {
          senderId: partnerId,
          receiverId: userId,
          isRead: false,
        },
        data: { isRead: true },
      });
    }

    return {
      partner: {
        userId: partner.id,
        name: partner.name || partner.email.split('@')[0],
        avatar:
          partner.avatar ||
          `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
            partner.name || partner.email,
          )}`,
        level: partner.level || 1,
        currentStreak: partner.currentStreak || 0,
        fitnessLevel: partner.profile?.fitnessLevel || 'BEGINNER',
        primaryGoal: partner.profile?.primaryGoal || 'GENERAL_FITNESS',
      },
      messages: messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        receiverId: m.receiverId,
        content: m.content,
        isRead: m.senderId === partnerId ? true : m.isRead,
        createdAt: m.createdAt.toISOString(),
        fromMe: m.senderId === userId,
      })),
    };
  }

  /**
   * Sends a 1-1 direct message and dispatches an FCM Web Push notification to the recipient.
   */
  async sendMessage(userId: string, partnerId: string, rawContent: string) {
    if (userId === partnerId) {
      throw new BadRequestException('Không thể gửi tin nhắn cho chính mình.');
    }

    const content = (rawContent || '').trim();
    if (!content) {
      throw new BadRequestException('Nội dung tin nhắn không được để trống.');
    }
    if (content.length > 1000) {
      throw new BadRequestException('Tin nhắn tối đa 1000 ký tự.');
    }

    const [sender, receiver] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      }),
      this.prisma.user.findUnique({
        where: { id: partnerId },
        select: { id: true, name: true, fcmToken: true, reminderEnabled: true },
      }),
    ]);

    if (!sender || !receiver) {
      throw new NotFoundException('Không tìm thấy người nhận tin nhắn.');
    }

    const created = await this.prisma.directMessage.create({
      data: {
        senderId: userId,
        receiverId: partnerId,
        content,
      },
    });

    // Non-blocking Firebase Cloud Messaging (FCM) Web Push to recipient
    if (receiver.fcmToken && receiver.reminderEnabled !== false) {
      const senderName = sender.name || sender.email.split('@')[0];
      this.notificationsService
        .sendFcmPushToToken(receiver.fcmToken, {
          title: `💬 ${senderName}`,
          body: content.length > 120 ? `${content.slice(0, 117)}...` : content,
          link: `/messages?user=${userId}`,
          type: 'SYSTEM',
        })
        .catch(() => {});
    }

    return {
      id: created.id,
      senderId: created.senderId,
      receiverId: created.receiverId,
      content: created.content,
      isRead: created.isRead,
      createdAt: created.createdAt.toISOString(),
      fromMe: true,
    };
  }
}
