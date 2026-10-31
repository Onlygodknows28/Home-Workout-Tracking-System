import { Module } from '@nestjs/common';
import { BuddyService } from './buddy.service';
import { BuddyController } from './buddy.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [BuddyController],
  providers: [BuddyService],
  exports: [BuddyService],
})
export class BuddyModule {}
