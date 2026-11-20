import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class SendMessageDto {
  @IsString()
  content: string;
}

@ApiTags('Direct Messages (User-to-User Chat)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('contacts')
  @ApiOperation({ summary: 'List all real users with latest message preview and unread counts' })
  async getContacts(@CurrentUser('id') userId: string) {
    return this.messagesService.getContacts(userId);
  }

  @Get('conversation/:partnerId')
  @ApiOperation({ summary: 'Get 1-1 message history with a specific user and mark incoming messages read' })
  async getConversation(
    @CurrentUser('id') userId: string,
    @Param('partnerId') partnerId: string,
  ) {
    return this.messagesService.getConversation(userId, partnerId);
  }

  @Post('send/:partnerId')
  @ApiOperation({ summary: 'Send a direct message to another user and trigger FCM Push Notification' })
  async sendMessage(
    @CurrentUser('id') userId: string,
    @Param('partnerId') partnerId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagesService.sendMessage(userId, partnerId, dto.content);
  }
}
