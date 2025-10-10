import { Injectable, Logger } from '@nestjs/common';
import sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    // Configurar SendGrid con la API key desde variables de entorno
    const apiKey = process.env.SENDGRID_API_KEY;
    
    if (!apiKey) {
      this.logger.error('❌ SENDGRID_API_KEY no encontrada en variables de entorno');
      throw new Error('SENDGRID_API_KEY es requerida');
    }
    
    sgMail.setApiKey(apiKey);
    this.logger.log('✅ SendGrid configurado correctamente');
  }

  /**
   * Enviar email de confirmación de reserva
   */
  async enviarConfirmacionReserva(datos: {
    emailDestino: string;
    nombreUsuario: string;
    numeroReserva: string;
    nombreArea: string;
    fechaReserva: string;
    horaInicio: string;
    horaFin: string;
    precio?: number;
  }) {
    try {
      this.logger.log(`📧 Enviando confirmación de reserva a: ${datos.emailDestino}`);

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirmación de Reserva - CitiLights</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .header { 
              background-color: #2563eb; 
              color: white; 
              padding: 20px; 
              text-align: center; 
              border-radius: 8px 8px 0 0; 
            }
            .content { 
              background-color: #f9fafb; 
              padding: 30px; 
              border-radius: 0 0 8px 8px; 
            }
            .info-box { 
              background-color: white; 
              padding: 20px; 
              border-radius: 8px; 
              margin: 20px 0; 
              border-left: 4px solid #2563eb; 
            }
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              font-size: 12px; 
              color: #6b7280; 
            }
            .highlight { 
              color: #2563eb; 
              font-weight: bold; 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏢 CitiLights</h1>
            <h2>Confirmación de Reserva</h2>
          </div>
          
          <div class="content">
            <p>Estimado/a <strong>${datos.nombreUsuario}</strong>,</p>
            
            <p>¡Excelente noticia! Tu reserva ha sido <span class="highlight">confirmada exitosamente</span>.</p>
            
            <div class="info-box">
              <h3>📋 Detalles de tu Reserva</h3>
              <p><strong>Número de Reserva:</strong> <span class="highlight">${datos.numeroReserva}</span></p>
              <p><strong>Área Reservada:</strong> ${datos.nombreArea}</p>
              <p><strong>Fecha:</strong> ${datos.fechaReserva}</p>
              <p><strong>Horario:</strong> ${datos.horaInicio} - ${datos.horaFin}</p>
              ${datos.precio ? `<p><strong>Precio:</strong> $${datos.precio.toFixed(2)}</p>` : ''}
            </div>
            
            <div class="info-box">
              <h3>📌 Información Importante</h3>
              <ul>
                <li>Por favor, llega <strong>15 minutos antes</strong> de tu horario reservado</li>
                <li>Presenta este email como comprobante de tu reserva</li>
                <li>Si necesitas cancelar, hazlo con al menos 2 horas de anticipación</li>
                <li>Mantén el área limpia y en orden después de su uso</li>
              </ul>
            </div>
            
            <p>Si tienes alguna pregunta o necesitas hacer cambios en tu reserva, no dudes en contactarnos.</p>
            
            <p>¡Gracias por elegir CitiLights!</p>
          </div>
          
          <div class="footer">
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
            <p>CitiLights - Sistema de Gestión de Áreas Comunes</p>
            <p>Generado el ${new Date().toLocaleString('es-ES')}</p>
          </div>
        </body>
        </html>
      `;

      const msg = {
        to: datos.emailDestino,
        from: 'citylights@noreply.com', // Email verificado en SendGrid
        subject: `✅ Reserva Confirmada - ${datos.nombreArea} | CitiLights`,
        html: htmlContent,
        text: `
          Confirmación de Reserva - CitiLights
          
          Estimado/a ${datos.nombreUsuario},
          
          Tu reserva ha sido confirmada exitosamente.
          
          Detalles de la Reserva:
          - Número: ${datos.numeroReserva}
          - Área: ${datos.nombreArea}
          - Fecha: ${datos.fechaReserva}
          - Horario: ${datos.horaInicio} - ${datos.horaFin}
          ${datos.precio ? `- Precio: $${datos.precio.toFixed(2)}` : ''}
          
          ¡Gracias por elegir CitiLights!
        `
      };

      await sgMail.send(msg);
      this.logger.log(`✅ Email de confirmación enviado exitosamente a ${datos.emailDestino}`);
      
      return {
        success: true,
        message: 'Email de confirmación enviado exitosamente'
      };

    } catch (error) {
      this.logger.error(`❌ Error enviando email de confirmación: ${error.message}`);
      this.logger.error(`❌ Detalles del error:`, error.response?.body || error);
      
      // No fallar la reserva por error en email
      return {
        success: false,
        message: 'Error enviando email de confirmación',
        error: error.message
      };
    }
  }

  /**
   * Enviar email de recordatorio de reserva
   */
  async enviarRecordatorioReserva(datos: {
    emailDestino: string;
    nombreUsuario: string;
    nombreArea: string;
    fechaReserva: string;
    horaInicio: string;
  }) {
    try {
      this.logger.log(`📧 Enviando recordatorio de reserva a: ${datos.emailDestino}`);

      const msg = {
        to: datos.emailDestino,
        from: 'citylights@noreply.com',
        subject: `🔔 Recordatorio: Tu reserva en ${datos.nombreArea} es mañana`,
        html: `
          <h2>🔔 Recordatorio de Reserva - CitiLights</h2>
          <p>Hola <strong>${datos.nombreUsuario}</strong>,</p>
          <p>Te recordamos que tienes una reserva programada para mañana:</p>
          <ul>
            <li><strong>Área:</strong> ${datos.nombreArea}</li>
            <li><strong>Fecha:</strong> ${datos.fechaReserva}</li>
            <li><strong>Hora:</strong> ${datos.horaInicio}</li>
          </ul>
          <p>¡No olvides llegar 15 minutos antes!</p>
          <p>Saludos,<br>Equipo CitiLights</p>
        `
      };

      await sgMail.send(msg);
      this.logger.log(`✅ Recordatorio enviado exitosamente a ${datos.emailDestino}`);
      
      return { success: true };

    } catch (error) {
      this.logger.error(`❌ Error enviando recordatorio: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}