import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateReservaDto } from './dto/update-reserva.dto';
import { PrismaClient, PagoStatus, MetodoPago, EstadoReserva } from 'generated/prisma';
import { EmailService } from '../email/email.service';

@Injectable()
export class ReservaService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger(ReservaService.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to the database');
  }

  async create(createReservaDto: CreateReservaDto) {
    // Validar que los campos requeridos estén presentes
    if (!createReservaDto.usuarioId) {
      throw new Error('usuarioId es requerido');
    }
    if (createReservaDto.costo === undefined || createReservaDto.costo === null) {
      throw new Error('costo es requerido');
    }

    // Preparar datos para Prisma - asegurándonos de que todos los campos requeridos estén presentes
    const reservaData = {
      areaId: createReservaDto.areaId,
      usuarioId: String(createReservaDto.usuarioId),
      inicio: new Date(createReservaDto.inicio),
      fin: new Date(createReservaDto.fin),
      estado: createReservaDto.estado || EstadoReserva.PENDING,
      costo: createReservaDto.costo,
      usuarioNombre: createReservaDto.usuarioNombre,
      usuarioRol: createReservaDto.usuarioRol
    };

    console.log('🔍 [Reserva Service] Datos que se enviarán a Prisma:', reservaData);

    // Crear la reserva y automáticamente generar la confirmación
    const reserva = await this.reserva.create({ 
      data: reservaData 
    });

    // Auto-generar confirmación
    const confirmacion = await this.confirmacion.create({
      data: {
        reservaId: reserva.id,
        codigoQr: `QR-${reserva.id}-${Date.now()}`, // Código QR único
        verificada: 'PENDING' // Estado inicial
      }
    });

    // Auto-generar pago-reserva
    const pago = await this.pagoReserva.create({
      data: {
        reservaId: reserva.id,
        metodoPago: MetodoPago.QR_CODE, // Por defecto QR
        monto: reserva.costo,
        estado: PagoStatus.PENDING,
        referenciaPago: `PAGO-RESERVA-${reserva.id}-${Date.now()}`
      }
    });

    this.logger.log(`Reserva ${reserva.id} creada con confirmación ${confirmacion.id} y pago ${pago.id}`);

    // Enviar email de confirmación de reserva
    try {
      await this.emailService.enviarConfirmacionReserva({
        emailDestino: createReservaDto.usuarioEmail || 'cliente@ejemplo.com', // Usar email del dto o default
        nombreUsuario: createReservaDto.usuarioNombre || 'Cliente',
        numeroReserva: reserva.id.toString(),
        nombreArea: `Área ${reserva.areaId}`,
        fechaReserva: reserva.inicio.toLocaleDateString('es-ES'),
        horaInicio: reserva.inicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        horaFin: reserva.fin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        precio: reserva.costo
      });
      
      this.logger.log(`📧 Email de confirmación enviado para reserva ${reserva.id}`);
    } catch (error) {
      this.logger.error(`❌ Error enviando email para reserva ${reserva.id}:`, error);
      // No fallar la creación de reserva por error de email
    }

    return {
      reserva,
      confirmacion,
      pago
    };
  }

  async findAll(user?: any) {
    console.log('📊 [Reserva Service] findAll llamado con usuario:', user);
    
    const whereCondition: any = {};
    
    // Si es USER_CASUAL, solo puede ver sus propias reservas
    if (user && user.rol === 'USER_CASUAL') {
      console.log('🔒 [Reserva Service] Filtrando para USER_CASUAL, ID:', user.id);
      whereCondition.usuarioId = String(user.id);
    } else {
      console.log('👑 [Reserva Service] Mostrando todas las reservas (ADMIN/SUPER)');
    }
    
    console.log('🔍 [Reserva Service] whereCondition:', whereCondition);
    
    const reservas = await this.reserva.findMany({
      where: whereCondition,
      include: {
        area: true,
        confirmacion: true,
        pagosReserva: true,
        pagosDanos: true // ← Agregamos esto para incluir pagos de daños
      }
    });

    console.log('✅ [Reserva Service] Reservas encontradas:', reservas.length);
    console.log('📋 [Reserva Service] IDs de reservas encontradas:', reservas.map(r => r.id));
    return reservas;
  }

  // 📅 NUEVO MÉTODO: Obtener TODAS las reservas para visualización del calendario
  async findAllForCalendar() {
    console.log('📅 [Reserva Service] findAllForCalendar - Obteniendo TODAS las reservas para calendario');
    
    const reservas = await this.reserva.findMany({
      // SIN filtro de usuario - todas las reservas
      include: {
        area: true,
        confirmacion: true,
        pagosReserva: true,
        pagosDanos: true // ← Agregamos esto
      }
    });

    console.log('📅 [Reserva Service] Total de reservas para calendario:', reservas.length);
    console.log('📅 [Reserva Service] IDs encontradas:', reservas.map(r => r.id));
    console.log('📅 [Reserva Service] Usuarios en reservas:', reservas.map(r => r.usuarioNombre || r.usuarioId));
    
    return reservas;
  }

  findOne(id: number) {
    return this.reserva.findUnique({
      where: { id },
      include: {
        area: true,
        confirmacion: true,
        pagosReserva: true,
        pagosDanos: true // ← Agregamos esto
      }
    });
  }

  async findOneWithFactura(id: number, user: any) {
    console.log('🔍 [BUSCAR RESERVA] Buscando reserva ID:', id, 'para usuario:', user.id);
    
    const reserva = await this.reserva.findUnique({
      where: { id },
      include: {
        area: true,
        confirmacion: true,
        pagosReserva: {
          include: {
            factura: true
          }
        }
      }
    });

    console.log('🔍 [BUSCAR RESERVA] Reserva encontrada:', !!reserva);
    
    if (!reserva) {
      throw new Error('Reserva no encontrada');
    }

    // Verificar permisos: el usuario debe ser el dueño de la reserva o ser SUPER_USER
    console.log('🔍 [PERMISOS] Verificando acceso a reserva:', {
      reservaId: id,
      reservaUsuarioId: reserva.usuarioId,
      reservaUsuarioIdType: typeof reserva.usuarioId,
      userId: user.id,
      userIdType: typeof user.id,
      userRole: user.rol,
      stringUserId: String(user.id),
      sonIguales: reserva.usuarioId === String(user.id)
    });
    
    if (reserva.usuarioId !== String(user.id) && user.rol !== 'SUPER_USER') {
      throw new Error('No tienes permisos para acceder a esta reserva');
    }

    // Buscar si existe una factura asociada a los pagos de esta reserva
    let factura: any = null;
    for (const pago of reserva.pagosReserva) {
      if (pago.factura) {
        factura = pago.factura;
        break;
      }
    }

    return {
      ...reserva,
      factura
    };
  }

  async update(id: number, updateReservaDto: UpdateReservaDto) {
    // Obtener la reserva actual para comparar estados
    const reservaActual = await this.reserva.findUnique({
      where: { id },
      include: {
        area: true
      }
    });

    if (!reservaActual) {
      throw new Error(`Reserva con ID ${id} no encontrada`);
    }

    // Actualizar la reserva
    const reservaActualizada = await this.reserva.update({
      where: { id },
      data: updateReservaDto,
      include: {
        area: true
      }
    });

    // 📧 ENVIAR EMAIL CUANDO SE CONFIRMA LA RESERVA
    if (
      updateReservaDto.estado === EstadoReserva.CONFIRMED && 
      reservaActual.estado !== EstadoReserva.CONFIRMED &&
      reservaActualizada.usuarioEmail
    ) {
      try {
        this.logger.log(`📧 Reserva ${id} confirmada, enviando email de confirmación...`);
        
        await this.emailService.enviarConfirmacionReserva({
          emailDestino: reservaActualizada.usuarioEmail,
          nombreUsuario: reservaActualizada.usuarioNombre || 'Cliente',
          numeroReserva: reservaActualizada.id.toString(),
          nombreArea: reservaActualizada.area?.nombre || `Área ${reservaActualizada.areaId}`,
          fechaReserva: reservaActualizada.inicio.toLocaleDateString('es-ES'),
          horaInicio: reservaActualizada.inicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          horaFin: reservaActualizada.fin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          precio: reservaActualizada.costo
        });
        
        this.logger.log(`✅ Email de confirmación enviado para reserva ${id} a ${reservaActualizada.usuarioEmail}`);
      } catch (error) {
        this.logger.error(`❌ Error enviando email de confirmación para reserva ${id}:`, error);
        // No fallar la actualización por error de email
      }
    }

    return reservaActualizada;
  }

  remove(id: number) {
    return this.reserva.delete({
      where: { id }
    });
  }

  async removeWithCascade(id: number) {
    console.log(`🗑️ [ReservaService] Iniciando eliminación en cascada para reserva ${id}`);
    
    return await this.$transaction(async (tx) => {
      // 1. Eliminar facturas asociadas (a través de pagosReserva)
      const pagosConFacturas = await tx.pagoReserva.findMany({
        where: { reservaId: id },
        include: { factura: true }
      });
      
      for (const pago of pagosConFacturas) {
        if (pago.factura) {
          console.log(`🗑️ [ReservaService] Eliminando factura ${pago.factura.id} del pago ${pago.id}`);
          await tx.factura.delete({
            where: { id: pago.factura.id }
          });
        }
      }
      
      // 2. Eliminar pagos de reserva
      const deletedPagos = await tx.pagoReserva.deleteMany({
        where: { reservaId: id }
      });
      console.log(`🗑️ [ReservaService] Eliminados ${deletedPagos.count} pagos`);
      
      // 3. Eliminar pagos de daños
      const deletedPagosDanos = await tx.pagoDanos.deleteMany({
        where: { reservaId: id }
      });
      console.log(`🗑️ [ReservaService] Eliminados ${deletedPagosDanos.count} pagos de daños`);
      
      // 4. Eliminar confirmación
      const deletedConfirmacion = await tx.confirmacion.deleteMany({
        where: { reservaId: id }
      });
      console.log(`🗑️ [ReservaService] Eliminadas ${deletedConfirmacion.count} confirmaciones`);
      
      // 5. Finalmente, eliminar la reserva
      const deletedReserva = await tx.reserva.delete({
        where: { id }
      });
      console.log(`✅ [ReservaService] Reserva ${id} eliminada exitosamente`);
      
      return deletedReserva;
    });
  }

  // Método para obtener reservas con datos completos para reportes
  async findAllForReports(fechaInicio?: string, fechaFin?: string) {
    const whereCondition: any = {};

    // Filtrar por fechas si se proporcionan
    if (fechaInicio && fechaFin) {
      whereCondition.inicio = {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin + 'T23:59:59.999Z')
      };
    }

    return this.reserva.findMany({
      where: whereCondition,
      include: {
        area: true,
        pagosReserva: true,
        confirmacion: true
      }
    });
  }

  // 📦 MÉTODO ACTUALIZADO: Gestionar entrega de reserva con pagos por daños
  async gestionarEntrega(
    id: number, 
    entregaData: {
      estadoEntrega: 'PENDIENTE' | 'ENTREGADO' | 'NO_APLICA';
      costoEntrega?: number;
      pagoEntrega?: boolean;
      observacionesEntrega?: string;
      // Nuevos campos para daños
      montoDanos?: number;
      descripcionDanos?: string;
    },
    user: any
  ) {
    this.logger.log(`📦 [Entrega Service] Gestionando entrega para reserva ${id} por usuario ${user.nombre}`);
    
    // Verificar que la reserva existe
    const reserva = await this.reserva.findUnique({
      where: { id },
      include: { 
        area: true,
        pagosDanos: true // Incluir pagos de daños existentes
      }
    });

    if (!reserva) {
      throw new Error('Reserva no encontrada');
    }

    // Solo permitir a admins gestionar entrega
    if (!['SUPER_USER', 'USER_ADMIN'].includes(user.rol)) {
      throw new Error('No tienes permisos para gestionar entregas');
    }

    // Determinar el estado de entrega correcto
    // Si hay daños (monto > 0), queda PENDIENTE hasta que se pague
    // Si no hay daños (monto = 0), cambia a ENTREGADO inmediatamente
    const estadoEntregaFinal = (entregaData.montoDanos && entregaData.montoDanos > 0) 
      ? 'PENDIENTE' 
      : 'ENTREGADO';

    this.logger.log(`📦 [Entrega Service] Estado de entrega determinado: ${estadoEntregaFinal} (Monto daños: ${entregaData.montoDanos || 0})`);

    // Actualizar la reserva con datos de entrega
    const reservaActualizada = await this.reserva.update({
      where: { id },
      data: {
        estadoEntrega: estadoEntregaFinal as any,
        costoEntrega: entregaData.costoEntrega,
        pagoEntrega: entregaData.pagoEntrega || false,
        observacionesEntrega: entregaData.observacionesEntrega,
        usuarioEntrega: user.nombre,
        fechaEntrega: estadoEntregaFinal === 'ENTREGADO' ? new Date() : null,
      },
      include: {
        area: true,
        confirmacion: true,
        pagosReserva: true,
        pagosDanos: true
      }
    });

    // SIEMPRE crear registro de pago por daños (monto 0 = sin daños, monto > 0 = con daños)
    let pagoDanosId: number | null = null;
    if (entregaData.montoDanos !== undefined && entregaData.descripcionDanos) {
      this.logger.log(`💰 [Entrega Service] Creando registro de pago por daños: $${entregaData.montoDanos}`);
      
      // Determinar estado y fecha según el monto
      const estadoPago = entregaData.montoDanos === 0 ? 'PAGADO' : 'PENDIENTE';
      const fechaPago = entregaData.montoDanos === 0 ? new Date() : null;
      
      const pagoDanos = await this.pagoDanos.create({
        data: {
          reservaId: id,
          montoDanos: entregaData.montoDanos,
          descripcionDanos: entregaData.descripcionDanos,
          usuarioRegistra: user.nombre,
          estadoPago: estadoPago as any,
          fechaPago: fechaPago,
        }
      });

      pagoDanosId = pagoDanos.id;
      this.logger.log(`💰 [Entrega Service] Registro de pago por daños creado con ID: ${pagoDanos.id}, Estado: ${estadoPago}`);
    }

    this.logger.log(`📦 [Entrega Service] Entrega gestionada exitosamente para reserva ${id}`);
    
    return {
      reserva: reservaActualizada,
      pagoDanosId: pagoDanosId
    };
  }
}