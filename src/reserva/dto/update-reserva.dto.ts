import { PartialType } from '@nestjs/mapped-types';
import { CreateReservaDto } from './create-reserva.dto';
import { EstadoEntrega } from 'generated/prisma';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateReservaDto extends PartialType(CreateReservaDto) {
  id: number;
  
  @IsOptional()
  @IsEnum(EstadoEntrega)
  estadoEntrega?: EstadoEntrega;
}