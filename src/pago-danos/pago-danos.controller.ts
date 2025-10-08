import { Controller, Get, Post, Patch, Body, Param, UseGuards, Logger } from '@nestjs/common';
import { PagoDanosService, CreatePagoDanosDto, UpdatePagoDanosDto } from './pago-danos.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/user.decorator';
import type { UserFromToken } from '../auth/jwt-auth.guard';

@Controller('pago-danos')
export class PagoDanosController {
  private readonly logger = new Logger(PagoDanosController.name);

  constructor(private readonly pagoDanosService: PagoDanosService) {}

  // Crear un nuevo pago por daños
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createDto: CreatePagoDanosDto, @GetUser() user: UserFromToken) {
    this.logger.log(`💰 [Controller] Creando pago por daños para reserva ${createDto.reservaId}`);
    
    // Solo admins pueden crear pagos por daños
    if (!['SUPER_USER', 'USER_ADMIN'].includes(user.rol)) {
      throw new Error('No tienes permisos para registrar pagos por daños');
    }
    
    return this.pagoDanosService.create(createDto, user);
  }

  // Obtener pagos por reserva
  @Get('reserva/:reservaId')
  @UseGuards(JwtAuthGuard)
  async findByReserva(@Param('reservaId') reservaId: string) {
    return this.pagoDanosService.findByReserva(Number(reservaId));
  }

  // Obtener un pago específico
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.pagoDanosService.findOne(Number(id));
  }

  // Actualizar estado del pago
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdatePagoDanosDto,
    @GetUser() user: UserFromToken
  ) {
    this.logger.log(`💰 [Controller] Actualizando pago ${id}`);
    
    // Solo admins pueden actualizar pagos
    if (!['SUPER_USER', 'USER_ADMIN'].includes(user.rol)) {
      throw new Error('No tienes permisos para actualizar pagos por daños');
    }
    
    return this.pagoDanosService.update(Number(id), updateDto, user);
  }

  // Marcar como pagado (después de Stripe)
  @Patch(':id/marcar-pagado')
  @UseGuards(JwtAuthGuard)
  async marcarComoPagado(
    @Param('id') id: string,
    @Body() body: { stripeSessionId: string; stripePaymentId: string },
    @GetUser() user: UserFromToken
  ) {
    this.logger.log(`✅ [Controller] Marcando como pagado: ${id}`);
    
    return this.pagoDanosService.marcarComoPagado(
      Number(id),
      body.stripeSessionId,
      body.stripePaymentId,
      user
    );
  }

  // Obtener todos los pagos pendientes
  @Get('pendientes/all')
  @UseGuards(JwtAuthGuard)
  async findPendientes(@GetUser() user: UserFromToken) {
    // Solo admins pueden ver todos los pagos pendientes
    if (!['SUPER_USER', 'USER_ADMIN'].includes(user.rol)) {
      throw new Error('No tienes permisos para ver pagos pendientes');
    }
    
    return this.pagoDanosService.findPendientes();
  }
}