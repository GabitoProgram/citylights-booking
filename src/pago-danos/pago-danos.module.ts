import { Module, forwardRef } from '@nestjs/common';
import { PagoDanosController } from './pago-danos.controller';
import { PagoDanosService } from './pago-danos.service';
import { AuthModule } from '../auth/auth.module';
import { StripeModule } from '../stripe/stripe.module';

@Module({
  imports: [
    AuthModule, 
    forwardRef(() => StripeModule)
  ],
  controllers: [PagoDanosController],
  providers: [PagoDanosService],
  exports: [PagoDanosService], // Para usar en otros módulos
})
export class PagoDanosModule {}