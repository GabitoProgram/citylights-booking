import { Module, forwardRef } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { PagoReservaModule } from '../pago-reserva/pago-reserva.module';
import { PagoDanosModule } from '../pago-danos/pago-danos.module';
import { ReservaModule } from '../reserva/reserva.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    PagoReservaModule,
    forwardRef(() => PagoDanosModule),
    forwardRef(() => ReservaModule),
    AuditoriaModule
  ],
  controllers: [StripeController],
  providers: [StripeService],
  exports: [StripeService]
})
export class StripeModule {}