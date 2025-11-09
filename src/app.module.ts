import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CoursesModule } from './modules/courses/courses.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { StreamingModule } from './modules/streaming/streaming.module';
import { ChatModule } from './modules/chat/chat.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [AuthModule, UsersModule, CoursesModule, EnrollmentsModule, PaymentsModule, StreamingModule, ChatModule, NotificationsModule, AdminModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
