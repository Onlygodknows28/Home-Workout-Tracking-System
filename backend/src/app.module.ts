import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ExercisesModule } from './exercises/exercises.module';
import { WorkoutsModule } from './workouts/workouts.module';
import { RecommendationModule } from './recommendation/recommendation.module';
import { GamificationModule } from './gamification/gamification.module';
import { BuddyModule } from './buddy/buddy.module';
import { AntiCheatModule } from './anti-cheat/anti-cheat.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    ExercisesModule,
    WorkoutsModule,
    RecommendationModule,
    GamificationModule,
    BuddyModule,
    AntiCheatModule,
    NotificationsModule,
  ],
})
export class AppModule {}
