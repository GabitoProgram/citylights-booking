import { Module } from '@nestjs/common';
import { PagoDanosController } from './pago-danos.controller';
import { PagoDanosService } from './pago-danos.service';

@Module({
  controllers: [PagoDanosController],
  providers: [PagoDanosService],
  exports: [PagoDanosService], // Para usar en otros módulos
})
export class PagoDanosModule {}