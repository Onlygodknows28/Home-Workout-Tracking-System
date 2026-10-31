import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Gamification & Economy')
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('shop')
  @ApiOperation({ summary: 'Get list of available items in the FitCoin shop' })
  async getShopItems() {
    return this.gamificationService.getShopItems();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('level-info')
  @ApiOperation({ summary: 'Get current user XP level metrics and progress' })
  async getLevelInfo(@CurrentUser('xp') userXp: number) {
    return this.gamificationService.getLevelDetails(userXp || 0);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('inventory')
  @ApiOperation({ summary: 'Get inventory of current user' })
  async getInventory(@CurrentUser('id') userId: string) {
    return this.gamificationService.getUserInventory(userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('shop/buy/:itemId')
  @ApiOperation({ summary: 'Purchase an item using FitCoins' })
  async buyItem(
    @CurrentUser('id') userId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.gamificationService.buyShopItem(userId, itemId);
  }
}
