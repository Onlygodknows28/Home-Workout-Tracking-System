import { Controller, Get, Patch, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications and unread counter for current user' })
  async getNotifications(@CurrentUser('id') userId: string) {
    return this.notificationsService.getUserNotifications(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark specific notification as read' })
  async markAsRead(
    @CurrentUser('id') userId: string,
    @Param('id') notificationId: string,
  ) {
    return this.notificationsService.markAsRead(userId, notificationId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a single notification' })
  async deleteNotification(
    @CurrentUser('id') userId: string,
    @Param('id') notificationId: string,
  ) {
    return this.notificationsService.deleteNotification(userId, notificationId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear all notifications' })
  async clearAll(@CurrentUser('id') userId: string) {
    return this.notificationsService.clearAll(userId);
  }
}
