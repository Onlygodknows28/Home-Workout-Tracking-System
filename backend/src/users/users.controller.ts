import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { OnboardingDto, UpdateProfileDto } from './dto/onboarding.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile and stats' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Post('onboarding')
  @ApiOperation({ summary: 'Complete initial onboarding (BMI, Pushups, Injuries)' })
  async completeOnboarding(
    @CurrentUser('id') userId: string,
    @Body() dto: OnboardingDto,
  ) {
    return this.usersService.completeOnboarding(userId, dto);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update profile parameters' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }
}
