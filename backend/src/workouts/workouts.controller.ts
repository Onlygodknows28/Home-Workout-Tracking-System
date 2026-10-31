import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WorkoutsService } from './workouts.service';
import { CreateWorkoutLogDto, DailyCheckinDto } from './dto/create-workout-log.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Workouts & Daily Tracking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @Post('submit')
  @ApiOperation({ summary: 'Submit completed workout log with 1-tap RPE score and verify anti-cheat' })
  async submitWorkout(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateWorkoutLogDto,
  ) {
    return this.workoutsService.submitWorkoutLog(userId, dto);
  }

  @Post('checkin')
  @ApiOperation({ summary: '1-tap Daily Nutrition Check-in (Deficit, Maintenance, Surplus)' })
  async submitDailyCheckin(
    @CurrentUser('id') userId: string,
    @Body() dto: DailyCheckinDto,
  ) {
    return this.workoutsService.submitDailyCheckin(userId, dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get history of completed workouts' })
  async getHistory(@CurrentUser('id') userId: string) {
    return this.workoutsService.getWorkoutLogs(userId);
  }

  @Get('today-status')
  @ApiOperation({ summary: 'Get today completion status, daily checkin, streak & level info' })
  async getTodayStatus(@CurrentUser('id') userId: string) {
    return this.workoutsService.getTodayStatus(userId);
  }
}
