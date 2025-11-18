import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CoursesModule } from './modules/courses/courses.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { StreamingModule } from './modules/streaming/streaming.module';
import { ChatModule } from './modules/chat/chat.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import databaseConfig from './config/database.config';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { StudentsModule } from './modules/students/students.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { TeacherSubscriptionsModule } from './modules/teacher-subscriptions/teacher-subscriptions.module';
import { LiveSessionsModule } from './modules/live-sessions/live-sessions.module';
import { CourseEnrollmentModule } from './modules/course-enrollment/course-enrollment.module';
import { CourseReviewsModule } from './modules/course-reviews/course-reviews.module';
import { CardModule } from './modules/card/card.module';
import jwtConfig from './config/jwt.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig]
    }),
    AuthModule, 
    UsersModule, 
    CoursesModule,
    PaymentsModule, 
    StreamingModule, 
    ChatModule, 
    NotificationsModule, 
    AdminModule, 
    PrismaModule, TeachersModule, StudentsModule, ReviewsModule, SubscriptionsModule, TeacherSubscriptionsModule, LiveSessionsModule, CourseEnrollmentModule, CourseReviewsModule, CardModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
