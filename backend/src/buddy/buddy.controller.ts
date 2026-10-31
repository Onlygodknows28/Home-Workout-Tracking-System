import { Body, Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BuddyService } from './buddy.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class GiftFreezeDto {
  note?: string;
}

@ApiTags('Accountability Buddy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('buddy')
export class BuddyController {
  constructor(private readonly buddyService: BuddyService) {}

  @Get('my-buddy')
  @ApiOperation({ summary: 'Get current active buddy, shared streak, and today co-op mission' })
  async getMyBuddy(@CurrentUser('id') userId: string) {
    return this.buddyService.getMyBuddy(userId);
  }

  @Get('matchmaking')
  @ApiOperation({ summary: 'Find top matched workout buddy candidates by similarity (BMI, Pushups, Goals)' })
  async findMatches(@CurrentUser('id') userId: string) {
    return this.buddyService.findBuddyMatches(userId);
  }

  @Post('connect/:targetUserId')
  @ApiOperation({ summary: 'Connect and pair up with a workout buddy' })
  async connectBuddy(
    @CurrentUser('id') userId: string,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.buddyService.connectBuddy(userId, targetUserId);
  }

  @Post('gift-freeze/:targetUserId')
  @ApiOperation({ summary: 'Gift a Streak Freeze item to buddy' })
  async giftFreeze(
    @CurrentUser('id') userId: string,
    @Param('targetUserId') targetUserId: string,
    @Body() dto: GiftFreezeDto,
  ) {
    return this.buddyService.giftStreakFreeze(userId, targetUserId, dto.note);
  }

  @Post('unpair')
  @ApiOperation({ summary: 'Unpair / Break current active buddy connection' })
  async unpairBuddy(@CurrentUser('id') userId: string) {
    return this.buddyService.unpairBuddy(userId);
  }
}
