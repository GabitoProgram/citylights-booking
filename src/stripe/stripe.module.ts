import { Module } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { PagoReservaModule } from '../pago-reserva/pago-reserva.module';
import { PagoDanosModule } from '../pago-danos/pago-danos.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    PagoReservaModule,
    PagoDanosModule,
    AuditoriaModule
  ],
  controllers: [StripeController],
  providers: [StripeService],
  exports: [StripeService]
})
export class StripeModule {}