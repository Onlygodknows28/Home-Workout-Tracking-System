import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  RecommendationService,
  AiChatRequestDto,
  ConfigureGeminiKeyDto,
} from './recommendation.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Recommendation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get('daily')
  @ApiOperation({
    summary: 'Get daily personalized Hybrid AI workout recommendation with medical & RPE adaptation',
  })
  async getDailyRecommendation(@CurrentUser('id') userId: string) {
    return this.recommendationService.generateDailyRecommendation(userId);
  }

  @Get('auxiliary')
  @ApiOperation({
    summary: 'Get targeted Core & Mobility auxiliary finisher session for athletes with RPE 1 (Too Easy)',
  })
  async getAuxiliaryRecommendation(@CurrentUser('id') userId: string) {
    return this.recommendationService.generateAuxiliaryRecommendation(userId);
  }

  @Post('config-key')
  @ApiOperation({
    summary: 'Verify and configure Google Gemini API Key at runtime',
  })
  async configureGeminiKey(@Body() body: ConfigureGeminiKeyDto) {
    return this.recommendationService.configureGeminiApiKey(body?.apiKey);
  }

  @Post('chat')
  @ApiOperation({
    summary: 'Chat with context-aware FITVANT AI Coach (Gemini LLM + Hybrid Medical Expert Engine)',
  })
  async chatWithAiCoach(@CurrentUser('id') userId: string, @Body() body: AiChatRequestDto) {
    return this.recommendationService.chatWithAiCoach(userId, body);
  }
}
