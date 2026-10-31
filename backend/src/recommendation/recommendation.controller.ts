import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RecommendationService } from './recommendation.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Recommendation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get('daily')
  @ApiOperation({ summary: 'Get daily personalized AI workout recommendation with progression/regression' })
  async getDailyRecommendation(@CurrentUser('id') userId: string) {
    return this.recommendationService.generateDailyRecommendation(userId);
  }
}
