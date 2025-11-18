import { Injectable, NotFoundException  } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Injectable()
export class SubscriptionsService {

    constructor(private prisma: PrismaService) {}

    async create(data: CreateSubscriptionDto) {
    return this.prisma.subscriptions.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.subscriptions.findMany();
  }

  async findOne(id: string) {
    const subscription = await this.prisma.subscriptions.findUnique({
      where: { id },
    });

    if (!subscription) throw new NotFoundException('Subscription not found');

    return subscription;
  }

  async update(id: string, data: UpdateSubscriptionDto) {
    return this.prisma.subscriptions.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.subscriptions.delete({
      where: { id },
    });
  }
}
