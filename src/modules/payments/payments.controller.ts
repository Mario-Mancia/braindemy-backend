import { Controller, Post, Get, Patch, Delete, Param, Body, BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment.dto';

@Controller('payments')
export class PaymentsController {
    constructor(private paymentsService: PaymentsService) {}

    @Post()
    create(@Body() dto: CreatePaymentDto) {
        return this.paymentsService.create(dto);
    }

    @Get()
    findAll() {
        return this.paymentsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.paymentsService.findOne(id);
    }

    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body() dto: UpdatePaymentStatusDto) {
        return this.paymentsService.updateStatus(id, dto.status);
    }

    // Eliminación deshabilitada
    @Delete(':id')
    remove() {
        throw new BadRequestException('Los pagos no pueden ser eliminados por motivos de auditoría');
    }
}