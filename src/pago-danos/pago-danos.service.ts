import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';
import type { UserFromToken } from '../auth/jwt-auth.guard';

export interface CreatePagoDanosDto {
  reservaId: number;
  montoDanos: number;
  descripcionDanos: string;
}

export interface UpdatePagoDanosDto {
  estadoPago?: 'PENDIENTE' | 'PAGADO' | 'CANCELADO';
  stripeSessionId?: string;
  stripePaymentId?: string;
  fechaPago?: Date;
}

@Injectable()
export class PagoDanosService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PagoDanosService.name);

  async onModuleInit() {
    await this.$connect();
  }

  // Crear un nuevo pago por daños
  async create(createDto: CreatePagoDanosDto, user: UserFromToken) {
    this.logger.log(`💰 [PagoDanos] Creando pago por daños para reserva ${createDto.reservaId} por ${user.nombre}`);
    
    return this.pagoDanos.create({
      data: {
        reservaId: createDto.reservaId,
        montoDanos: createDto.montoDanos,
        descripcionDanos: createDto.descripcionDanos,
        usuarioRegistra: user.nombre,
      },
      include: {
        reserva: {
          include: {
            area: true
          }
        }
      }
    });
  }

  // Obtener pagos de daños por reserva
  async findByReserva(reservaId: number) {
    return this.pagoDanos.findMany({
      where: { reservaId },
      include: {
        reserva: {
          include: {
            area: true
          }
        }
      },
      orderBy: {
        fechaRegistro: 'desc'
      }
    });
  }

  // Obtener un pago de daños por ID
  async findOne(id: number) {
    return this.pagoDanos.findUnique({
      where: { id },
      include: {
        reserva: {
          include: {
            area: true
          }
        }
      }
    });
  }

  // Actualizar estado del pago (cuando se procesa con Stripe)
  async update(id: number, updateDto: UpdatePagoDanosDto, user: UserFromToken) {
    this.logger.log(`💰 [PagoDanos] Actualizando pago ${id} por ${user.nombre}`);
    
    return this.pagoDanos.update({
      where: { id },
      data: {
        ...updateDto,
        usuarioActualiza: user.nombre,
      },
      include: {
        reserva: {
          include: {
            area: true
          }
        }
      }
    });
  }

  // Marcar como pagado después de Stripe
  async marcarComoPagado(id: number, stripeSessionId: string, stripePaymentId: string, user: UserFromToken) {
    this.logger.log(`✅ [PagoDanos] Marcando como pagado: ${id} con Stripe session: ${stripeSessionId}`);
    
    return this.update(id, {
      estadoPago: 'PAGADO',
      stripeSessionId,
      stripePaymentId,
      fechaPago: new Date()
    }, user);
  }

  // Obtener todos los pagos pendientes
  async findPendientes() {
    return this.pagoDanos.findMany({
      where: {
        estadoPago: 'PENDIENTE'
      },
      include: {
        reserva: {
          include: {
            area: true
          }
        }
      },
      orderBy: {
        fechaRegistro: 'desc'
      }
    });
  }
}